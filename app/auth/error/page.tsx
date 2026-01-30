import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

type ErrorSearchParams = {
  error?: string
  error_code?: string
  error_description?: string
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ErrorSearchParams>
}) {
  const params = await searchParams
  const description = params?.error_description ?? params?.error
  const code = params?.error_code

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Sorry, something went wrong.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {description ? (
                <>
                  <p className="text-sm text-muted-foreground">{description}</p>
                  {code && (
                    <p className="text-xs text-muted-foreground">Code: {code}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">An unspecified error occurred.</p>
              )}
              <p className="text-sm text-muted-foreground">
                For GitHub sign-in with <strong>local Supabase</strong> (see{' '}
                <a href="https://supabase.com/docs/guides/local-development/managing-config" className="underline" target="_blank" rel="noopener noreferrer">Managing config</a>):
              </p>
              <ul className="list-inside list-disc text-sm text-muted-foreground space-y-1">
                <li>
                  Use an <strong>OAuth App</strong> (not a GitHub App) at{' '}
                  <a href="https://github.com/settings/developers" className="underline" target="_blank" rel="noopener noreferrer">github.com/settings/developers</a>.
                </li>
                <li>
                  Set <strong>Authorization callback URL</strong> to exactly{' '}
                  <code className="rounded bg-muted px-1">http://127.0.0.1:54321/auth/v1/callback</code>.
                </li>
                <li>
                  Put <code className="rounded bg-muted px-1">GITHUB_CLIENT_ID</code> and{' '}
                  <code className="rounded bg-muted px-1">GITHUB_SECRET</code> in a <code className="rounded bg-muted px-1">.env</code> file at <strong>project root</strong> (same level as <code className="rounded bg-muted px-1">supabase/</code>), then run <code className="rounded bg-muted px-1">supabase start</code>. If you use <code className="rounded bg-muted px-1">.env.local</code> only, run <code className="rounded bg-muted px-1">pnpm run supabase:start</code> instead.
                </li>
                <li>
                  Using <strong>hosted</strong> Supabase? Use the callback URL from Dashboard → Auth → Providers → GitHub.
                </li>
              </ul>
              <Link
                href="/auth/login"
                className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Back to login
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
