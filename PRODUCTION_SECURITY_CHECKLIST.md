# Production security checklist

The application already uses Supabase authentication and row-level security, so each signed-in user can only see their own shop data. Complete these dashboard settings before sharing the live link widely.

## Supabase

1. In **Authentication → Rate Limits**, set sensible limits for signup, password-reset, and email requests. This slows repeated attempts from one source.
2. In **Authentication → Bot Detection**, configure free Cloudflare Turnstile. This blocks automated account creation and password-reset abuse. Keep the Turnstile secret only in Supabase; never put it in the app or Vercel environment variables.
3. Keep **email confirmation** enabled, use a minimum password length of at least 8, and enable secure password changes.
4. Never expose the Supabase `service_role` key. Vercel should only contain `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
5. Keep row-level security enabled for every business table. The per-user shop migration installed in this project is required.

## Vercel

1. In **Security / Firewall**, enable the managed WAF and create an IP-based rate rule for the website. A cautious starting point is 60 requests per minute per IP, then adjust after real usage.
2. Protect preview deployments too, or keep them private.
3. The headers in `vercel.json` prevent clickjacking and limit unnecessary browser permissions.

## Important boundary

Vercel's IP rule protects requests to the Vercel website. It cannot stop somebody who calls the public Supabase URL directly from their own script. Supabase Auth rate limits and Bot Detection protect sign-in flows. If this app later needs strict limits for every cash, crop, or ledger request, move those write operations behind Supabase Edge Functions (or another server API) and enforce the limit there.
