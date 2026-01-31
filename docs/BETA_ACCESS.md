# Beta access

Beta access lets users play music without a Stripe subscription. It is granted by entering a **beta code** (PIN) in the Subscribe modal.

## How it works

1. **Set the PIN**: In your environment (e.g. `.env` or `.env.local`), set `BETA_ACCESS_PIN` to a secret string. Share this string out-of-band with users you want to grant beta access (e.g. friends, testers).
2. **User flow**: User opens the Subscribe modal (“Only for premium users”), scrolls to “Have a beta code?”, enters the code, and clicks “Apply”.
3. **Verification**: The app sends `POST /api/beta/verify` with `{ pin: "..." }`. The server compares the PIN to `BETA_ACCESS_PIN` using constant-time comparison. If valid, it updates `public.users` for the current user: `role = 'beta'`, `beta_until = now + 90 days`.
4. **Effect**: `canPlay` is true for users with `role === 'beta'` and `beta_until` in the future (or `role === 'admin'`), so they can play without subscribing.

## Notes

- There is **no in-app admin UI** to view or change the beta PIN. The PIN is configured only via environment variables.
- Beta access expires after 90 days unless extended (by re-running verification with the same PIN or by updating the backend to extend `beta_until`).
- See [PRD.md](../PRD.md#beta-access) for product context.
