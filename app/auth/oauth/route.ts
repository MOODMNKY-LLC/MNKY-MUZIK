import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { saveSpotifyTokens } from '@/libs/spotifyTokens'

/**
 * OAuth callback: exchanges the auth code for a session (PKCE).
 * The code verifier must be available in the same browser (client stores it when
 * signInWithOAuth runs). Server createClient() reads cookies so the session
 * (including provider_token for Spotify) is set on the response.
 * Persists Spotify tokens to user_spotify_tokens so API routes work after Supabase session refresh.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const errorCode = searchParams.get('error_code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/'
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data?.session) {
      const s = data.session as { provider_token?: string; provider_refresh_token?: string }
      if (s?.provider_token && s?.provider_refresh_token && data.session.user?.id) {
        try {
          await saveSpotifyTokens(
            data.session.user.id,
            s.provider_token,
            s.provider_refresh_token
          )
        } catch {
          // Non-fatal; session still has tokens for immediate use
        }
      }
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Forward OAuth error params to the error page so the user sees the real message
  const errorSearch = new URLSearchParams()
  if (errorParam) errorSearch.set('error', errorParam)
  if (errorCode) errorSearch.set('error_code', errorCode)
  if (errorDescription) errorSearch.set('error_description', errorDescription)
  const query = errorSearch.toString()
  return NextResponse.redirect(`${origin}/auth/error${query ? `?${query}` : ''}`)
}
