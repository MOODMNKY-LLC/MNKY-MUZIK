import { getSiteOrigin } from '@/lib/metadata'
import { createClient } from '@/lib/supabase/server'
import { saveSpotifyTokens } from '@/libs/spotifyTokens'
import { NextResponse } from 'next/server'

/**
 * OAuth callback route. Supabase redirects here with ?code=...&state=...&next=/
 * We run exchangeCodeForSession on this FIRST request (same request that has the
 * flow-state cookies), which fixes flow_state_not_found that occurred when we
 * did a client redirect to /auth/oauth and exchanged on the second request.
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
          // Non-fatal
        }
      }
      return NextResponse.redirect(`${base}${next}`)
    }
    if (error) {
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
