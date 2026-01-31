import { getSiteOrigin } from '@/lib/metadata'
import { supabaseAdmin } from '@/libs/supabaseAdmin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import type { Database } from '@/types_db'

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'placeholder-key'

/**
 * OAuth callback route. Supabase redirects here with ?code=...&state=...&next=/
 *
 * Required order (await is critical):
 * 1. await exchangeCodeForSession(code) — session (including provider_token) is received
 *    and Supabase calls setAll() to write session cookies onto redirectRes.
 * 2. Read provider_token / provider_refresh_token from the returned session immediately.
 * 3. await token upsert to DB — persist tokens before sending the redirect.
 * 4. return redirectRes — client must not land on home before DB has the row, or
 *    /api/spotify/user/* will 401 (no tokens yet).
 *
 * We run the exchange on this FIRST request (same request that has the flow-state
 * cookies), which fixes flow_state_not_found that occurred when we did a client
 * redirect to /auth/oauth and exchanged on the second request.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestOrigin = new URL(request.url).origin
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) next = '/'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const base =
    getSiteOrigin() ??
    (forwardedHost ? `https://${forwardedHost}` : requestOrigin)

  // Validate required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  const isProd = process.env.NODE_ENV === 'production'

  if (!supabaseUrl || supabaseUrl === PLACEHOLDER_URL) {
    console.error('[auth/callback] NEXT_PUBLIC_SUPABASE_URL is missing or placeholder')
    return NextResponse.redirect(
      `${base}/auth/error?error=${encodeURIComponent('Server configuration error: Supabase URL not set')}`
    )
  }

  if (!supabaseKey || supabaseKey === PLACEHOLDER_KEY) {
    console.error('[auth/callback] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or placeholder')
    return NextResponse.redirect(
      `${base}/auth/error?error=${encodeURIComponent('Server configuration error: Supabase API key not set')}`
    )
  }

  if (isProd && (!serviceRoleKey || serviceRoleKey === 'placeholder-service-role-key')) {
    console.error(
      '[auth/callback] SUPABASE_SERVICE_ROLE_KEY is missing or placeholder in production. ' +
        'Spotify tokens cannot be saved; set it in your production env (e.g. Vercel) so "From Spotify" works.'
    )
    return NextResponse.redirect(
      `${base}/auth/error?error_code=service_role_key_missing&error=${encodeURIComponent(
        'Server configuration error: Service role key not set in production'
      )}`
    )
  }

  // Validate service role key format (should not be empty and should be a valid key)
  if (serviceRoleKey && serviceRoleKey.length < 20) {
    console.warn(
      '[auth/callback] SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short). ' +
        'Expected format: service_role key from Supabase Dashboard → Project Settings → API'
    )
  }

  if (code) {
    const cookieStore = await cookies()
    const redirectRes = NextResponse.redirect(`${base}${next}`)
    const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: unknown }[]) {
          const isSecure = base.startsWith('https')
          cookiesToSet.forEach(({ name, value, options }) => {
            // Preserve ALL options from Supabase (httpOnly, maxAge, expires, domain, etc.)
            // Only override secure flag if we're on HTTPS and Supabase didn't already set it
            const baseOptions =
              typeof options === 'object' && options !== null
                ? (options as Record<string, unknown>)
                : {}
            const opts = {
              ...baseOptions,
              // Ensure secure flag is set for HTTPS, but don't override if Supabase already set it
              ...(isSecure && !('secure' in baseOptions) && { secure: true }),
              // Ensure path is set if Supabase didn't provide one
              ...(!('path' in baseOptions) && { path: '/' as const }),
              // Ensure sameSite is set if Supabase didn't provide one (default to lax for OAuth)
              ...(!('sameSite' in baseOptions) && { sameSite: 'lax' as const }),
            }
            redirectRes.cookies.set(name, value, opts as Parameters<typeof redirectRes.cookies.set>[2])
          })
        },
      },
    })
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data?.session) {
      const s = data.session as { provider_token?: string; provider_refresh_token?: string }
      // Capture tokens immediately after exchange so we never persist before they're received.
      const accessToken = s?.provider_token
      const refreshToken = s?.provider_refresh_token
      const userId = data.session.user?.id

      if (!accessToken || !refreshToken) {
        console.warn(
          '[auth/callback] Session has no provider_token/provider_refresh_token. ' +
            'Supabase may not be returning Spotify tokens; check Supabase Dashboard → Auth → Providers → Spotify is enabled and returning tokens. ' +
            `User ID: ${userId || 'unknown'}`
        )
        // Still return success redirect - session is valid, just missing provider tokens
        // This might happen if Spotify provider is not properly configured in Supabase
        return redirectRes
      }

      if (accessToken && refreshToken && userId) {
        // Double-check service role key is available (already validated above, but check again for safety)
        if (!serviceRoleKey || serviceRoleKey === 'placeholder-service-role-key') {
          if (isProd) {
            // This should have been caught above, but log it anyway
            console.error(
              '[auth/callback] SUPABASE_SERVICE_ROLE_KEY is missing in production. ' +
                'Spotify tokens cannot be saved; set it in your production env (e.g. Vercel) so "From Spotify" works.'
            )
            const errorSearch = new URLSearchParams()
            errorSearch.set('error_code', 'spotify_tokens_not_saved')
            errorSearch.set(
              'error',
              'Spotify was connected but this server could not save your session. "From Spotify" will stay empty until the server is configured.'
            )
            return NextResponse.redirect(`${base}/auth/error?${errorSearch.toString()}`)
          } else {
            // In development, warn but don't fail - tokens are still in session
            console.warn(
              '[auth/callback] SUPABASE_SERVICE_ROLE_KEY is missing in development. ' +
                'Spotify tokens will not be persisted to database but are available in session. ' +
                'Set SUPABASE_SERVICE_ROLE_KEY in .env.local for full functionality.'
            )
            return redirectRes
          }
        }

        // Persist tokens before sending redirect (client must not land on home before DB has row).
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString()
        try {
          const { error: upsertError } = await supabaseAdmin.from('user_spotify_tokens').upsert(
            {
              user_id: userId,
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: expiresAt,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )

          if (upsertError) {
            console.error(
              '[auth/callback] Failed to save Spotify tokens to database:',
              upsertError.message,
              `Code: ${(upsertError as { code?: string }).code ?? 'unknown'}`,
              `User ID: ${userId}`,
              '- Check: table user_spotify_tokens exists in this Supabase project; ' +
                'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are from the same project.'
            )
            // Don't fail the auth flow - tokens are still in session
            // But log the error so it can be debugged
            const errorSearch = new URLSearchParams()
            errorSearch.set('error_code', 'spotify_tokens_not_saved')
            errorSearch.set(
              'error',
              'Spotify was connected but saving your session to database failed. Your session is active but some features may not work. Check server logs for details.'
            )
            // Still return redirectRes so user can continue - session is valid
            // The error can be shown on the frontend if needed
            return redirectRes
          } else {
            console.info(
              `[auth/callback] Spotify tokens saved successfully for user ${userId}. ` +
                `Session cookies set on redirect response.`
            )
          }
        } catch (err) {
          // Catch any unexpected errors during token persistence
          console.error(
            '[auth/callback] Unexpected error saving Spotify tokens:',
            err instanceof Error ? err.message : String(err),
            `User ID: ${userId}`
          )
          // Don't fail auth - session is still valid
          return redirectRes
        }
      }
      return redirectRes
    }
    if (error) {
      // Log detailed error information for debugging
      console.error(
        '[auth/callback] exchangeCodeForSession failed:',
        error.message,
        `Code: ${'code' in error && typeof (error as { code?: string }).code === 'string' ? (error as { code: string }).code : 'unknown'}`,
        `Request origin: ${requestOrigin}`,
        `Base URL: ${base}`
      )
      const errorSearch = new URLSearchParams()
      errorSearch.set('error', error.message)
      if ('code' in error && typeof (error as { code?: string }).code === 'string') {
        errorSearch.set('error_code', (error as { code: string }).code)
      }
      return NextResponse.redirect(`${base}/auth/error?${errorSearch.toString()}`)
    }
  }

  // No code: return HTML that parses hash and redirects (for OAuth errors in fragment)
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Completing sign-in…</title></head><body><p>Completing sign-in…</p><script>
(function(){
  var hash = (window.location.hash || '').slice(1);
  var params = new URLSearchParams(hash);
  var err = params.get('error') || params.get('error_code');
  var desc = params.get('error_description');
  if (err || desc) {
    var q = new URLSearchParams();
    if (err) q.set('error', err);
    if (params.get('error_code')) q.set('error_code', params.get('error_code'));
    if (desc) q.set('error_description', desc);
    window.location.replace('/auth/error?' + q.toString());
    return;
  }
  window.location.replace('/auth/error?error=No+authorization+code+received');
})();
</script></body></html>`
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
