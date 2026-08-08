# Commission Shop

Fast, offline-friendly crop, cash, ledger, and commission management for an agricultural commission shop.

## Setup

1. Copy `.env.example` to `.env` and add the Supabase Project URL and Publishable key.
2. In Supabase SQL Editor, run these files in order:
   - `supabase-reset.sql` — only for the empty project containing the old test tables
   - `supabase-schema.sql`
   - `supabase-finance-update.sql`
   - `supabase-crop-update.sql`
   - `supabase-complete-workflows.sql`
3. Enable Supabase Authentication email sign-in, create the first owner user, and disable public email sign-ups. Add future staff from Supabase Authentication → Users so only shop-approved people can access records.
4. Run `npm.cmd run dev`.

## What it manages

- Farmers, buyers, lenders, labourers, and employees
- Crops in maund, kilograms, or bags
- Own harvest and crop purchased from farmers
- Cash received, paid, advances, borrowings, and repayments
- Crop sales for cash or credit
- Labour, salary, market fees, transport, rent, and other expenses
- Party balances, cash in hand, stock, and trial-balance reporting

## Offline use

The application shell works offline. Cash actions are safely placed in a local queue when the network is unavailable and submitted when the device reconnects. Keep the browser’s site data intact until pending records have synced.

## Vercel

Import the repository into Vercel. It detects Vite automatically. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel Project Settings → Environment Variables for Production and Preview, then redeploy. Never add a database password, secret key, or `service_role` key to Vercel frontend variables.
