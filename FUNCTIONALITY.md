# ABCS functionality guide

This is the practical guide to what the live app does, what users should enter, and what records update automatically.

## 1. User journey

```mermaid
flowchart LR
  A[Create/sign in account] --> B[Own private shop created]
  B --> C[Add people and crops]
  C --> D[Receive crop / sell crop]
  D --> E[Record cash, expenses, income]
  E --> F[Check dashboard and reports]
  F --> G[Use Settings/Help when needed]
```

## 2. Login and account features

| Feature | What it does | Notes |
|---|---|---|
| Sign in | Opens the user’s own shop. | Email/password required. |
| Create private shop | Creates an Auth account, profile, Cash in Hand account, and standard accounting accounts. | Email confirmation should remain enabled for production. |
| Persistent session | Returning to the same URL on the same browser opens the user’s shop directly. | Logout/clearing browser data/private mode ends this convenience. |
| Forgot password | Available on sign-in page and in Settings. Emails a reset link. | Requires working Supabase email/SMTP. |
| Reset password | Opens through secure email link and saves a new 8+ character password. | User is returned to the app. |
| Change email | Sends confirmation to the current/new address after current-password verification. | Requires working email delivery. |
| Change password | Checks current password, then stores a new 8+ character password. | Use a strong private password. |
| Sign out everywhere | Ends the account session on all devices. | Records remain safe. |

## 3. Dashboard

The Dashboard is a quick health view:

- **Cash in hand** — total cash account balance.
- **We have to take** — total receivables from all parties.
- **We have to give** — total payables to all parties.
- A short “what to do next”/Help prompt guides new users.

Amounts are calculated from saved transactions; they are not manually typed dashboard totals.

## 4. People

Use **People** for anyone the shop deals with:

- farmer
- buyer
- supplier
- lender
- labourer
- employee
- market committee
- other (write a custom role)

One party may have multiple roles in the database. Example: Ali can sell rice to the shop, buy wheat from the shop, and receive/pay cash.

### Available actions

- Add person/shop name, phone, role, and optional note.
- Choose **Other** to type a role not shown in the list.
- Use the three-dot entry menu to edit or delete a person/shop.
- Dropdowns in transaction forms include an **Other — add person/shop** option to create a missing party without leaving the work.

> Deleting a party with linked accounting records may be refused by the database. This is intentional, because a historic sale/payment must keep its party reference.

## 5. Crops

Use **Crops** to create the crop master list before recording receipts or sales.

For each crop enter:

| Field | Meaning |
|---|---|
| Crop name | Any crop/product name: rice, wheat, maize, hay, etc. |
| Main unit | Maund, kilogram, or bag. |
| Bag weight | Required if bags will be used; e.g. 40 kg per bag. |
| Moisture/humidity | Optional usual moisture percentage for reference. Stored in crop notes in the current schema. |
| Low-stock warning | Optional stock quantity in kg for reference. |

A new crop starts at **0 stock**. Stock is increased only by Crop received and decreased by Sell crop.

### Crop actions

- Add crop.
- Edit crop through the three-dot entry menu.
- Delete crop only if no receipts/sales/movements still reference it.
- The Crop received page currently selects existing crops; create the crop first if it is missing.

## 6. Crop received

Use **Crop received** when crop enters stock.

### Sources

- **Purchased from farmer** — choose/add the farmer, crop, unit, quantity, rate, payment made now, cash account, and note.
- **Own harvest** — choose crop, unit, quantity, rate (valuation), optional cash paid, and note. A party is not required.

### Automatic effects

| Effect | Purchased from farmer | Own harvest |
|---|---|---|
| Stock | Increases | Increases |
| Cash | Decreases by “cash paid now” | Decreases only if payment was entered |
| Party balance | Unpaid amount becomes “we have to give” | No supplier balance |
| Accounting | Inventory and payable/cash journal records | Inventory/cash journal records |

Units are converted to kg for stock calculation:

- Maund = 40 kg
- Kg = 1 kg
- Bag = crop’s configured bag weight

## 7. Sell crop

Use **Sell crop** when stock is sold to a buyer.

Enter buyer, crop, unit, quantity, rate, cash received now, cash account, and optional note.

### Automatic effects

- Checks that enough stock exists before saving.
- Reduces stock in kilograms.
- Increases cash by the amount received now.
- Any remaining amount becomes **we have to take** from the buyer.
- Creates sales, inventory/COGS, party-ledger, cash, and journal records.

Example: Sell crop for Rs 50,000 and receive Rs 20,000 now. Cash increases by Rs 20,000 and the buyer’s balance is Rs 30,000 to take.

## 8. Cash book

The Cash page records money that enters/leaves a cash account and automatically updates a party balance where applicable.

| Action | Cash effect | Party effect |
|---|---|---|
| Money received | Cash in | Decreases what the person owes the shop |
| Money paid | Cash out | Decreases what the shop owes the person |
| Give advance | Cash out | Increases money to take from person |
| Take loan | Cash in | Increases loan payable |
| Return loan | Cash out | Decreases loan payable |
| Other money received | Cash in | No party balance unless separately recorded |
| Other money paid | Cash out | No party balance unless separately recorded |

For **Other** actions, the user must write the reason. Example: “sale of empty bags” or “tractor repair advance.”

## 9. Expenses, labour and fees

Use **Expenses** for labour, salary, market fees, transport, loading, utilities, rent, or Other.

Enter total expense and cash paid now:

- The paid amount reduces cash now.
- The unpaid amount becomes a payable to the selected person/shop, if one was selected.
- The correct expense account is used: labour, salary, market fee, or general operating expense.
- Selecting Other reveals a text field for a custom expense name.

Examples:

- Labourer paid Rs 2,000 fully: labour expense increases and cash decreases Rs 2,000.
- Market transport bill Rs 5,000, paid Rs 2,000: cash decreases Rs 2,000 and Rs 3,000 remains payable.

## 10. Income

Use **Income** for commission, service charge, or Other income that is separate from a crop sale.

- Cash received now increases the selected cash account.
- Unreceived income becomes a receivable from the selected party, if any.
- Other income asks for a custom name.

## 11. Reports

The current Reports page shows:

- Cash in hand total.
- Total money to take.
- Total money to give.
- Per-person/shop amounts to take and give.

The database also has a `v_trial_balance` view, but a complete trial-balance screen/export is **not yet in the live UI**.

## 12. Settings and Help

### Settings

- Direct Settings gear in the header and Settings in navigation/menu.
- Profile name update.
- Change email.
- Change password.
- Password-reset email from the current signed-in account.
- Sign out everywhere.

### Help

The Help page gives short, simple examples for advances, sales on credit, crop purchases, and choosing Other. It is designed so users with little accounting experience can understand the main actions.

## 13. Edit/delete policy

| Record type | Current support | Reason |
|---|---|---|
| People | Edit/delete from three-dot menu | Master data can be corrected when unreferenced. |
| Crops | Edit/delete from three-dot menu | Master data can be corrected when unreferenced. |
| Cash/sale/receipt/expense/income transactions | No direct edit/delete screen yet | Editing a posted record must reverse/rebuild cash, inventory, ledger, and journal entries safely. |

### Required future accounting correction feature

Before allowing transaction edits/deletes, build a **reverse and replace** workflow:

1. Show the original record and all generated linked records.
2. Require a reason for correction.
3. Create reversal inventory/cash/ledger/journal entries rather than silently changing history.
4. Save a replacement transaction linked to the original.
5. Preserve a visible audit trail.

## 14. Offline and PWA behaviour

- The app can be installed from the browser as a PWA.
- Application files load offline after they have been cached.
- Cash, crop receipt, crop sale, expense, and income saves can queue offline and sync when the browser reconnects.
- The user sees “Saved offline. It will sync automatically.”
- Keep the app/browser site data until all offline saves have synchronized.

### Current limits

- Only the accounting forms listed above queue offline.
- People and crop master-data changes need internet.
- The app does not yet show a visible queue count, last-sync time, or “retry failed sync” screen.
- Do not enter the same transaction repeatedly while offline; the queue preserves every submission.

## 15. Security and operational checklist

- Every user must have a distinct email/password account. Never share one login between shops.
- Do not add normal users to the Supabase organization; that grants dashboard access, not app access.
- Keep Supabase email confirmation enabled after SMTP is configured.
- Configure custom SMTP before inviting many non-team users; Supabase’s built-in email sender is for testing only.
- Configure Supabase Auth rate limits and CAPTCHA/Turnstile before broad public signup.
- Keep the Supabase `service_role` key and SMTP/API passwords out of Vercel/browser variables.
- Keep RLS enabled and test with two accounts: account A must never see account B data.

See `ARCHITECTURE.md`, `DATABASE.md`, and `PRODUCTION_SECURITY_CHECKLIST.md` for development and deployment details.
