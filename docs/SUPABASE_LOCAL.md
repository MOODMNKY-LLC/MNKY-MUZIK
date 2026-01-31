# Supabase local development

## Storage-api version warning

When you run `supabase start`, you may see:

```
WARNING: You are running different service versions locally than your linked project:
supabase/storage-api:v1.33.5 => v1.33.0
Run supabase link to update them.
```

To align local with your linked remote project, run:

```bash
supabase link
```

Then restart if needed. This keeps local and remote service versions in sync.

## Analytics on Windows

Supabase local can show analytics. On Windows, if you see:

```
WARNING: Analytics on Windows requires Docker daemon exposed on tcp://localhost:2375.
```

and you want to use analytics, expose the Docker daemon on `tcp://localhost:2375` (e.g. in Docker Desktop settings). See [Supabase: Running Supabase locally (Windows)](https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=windows#running-supabase-locally) for details. Analytics is optional for local development.
