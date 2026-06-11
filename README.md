# Booking App

A simple booking app for a small business allowing customers to book time slots securely. Built for the candidate brief.

## How to run it

1. **Prerequisites**: Node.js, an active Supabase project, and a Claude API Key.
2. **Setup Supabase**:
   - Run the SQL script located in `supabase/schema.sql` in your Supabase SQL Editor. This sets up the database, RLS policies, and view for available slots.
3. **Environment variables**:
   - Copy `.env.example` to `.env` and fill in your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - For Netlify deployment, make sure to add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `CLAUDE_API_KEY` to your Netlify site's Environment Variables.
4. **Install & Run Locally**:
   ```bash
   npm install
   # We use Netlify CLI for local dev to enable edge functions
   npx netlify-cli dev
   ```
5. **Test Credentials**:
   - Since Supabase Auth is enabled, you can sign up normally with any email. Supabase might require email confirmation unless you turn off "Confirm email" in Supabase Auth settings. 

## Architecture & Tradeoffs

- **Frontend**: Vite + React + TypeScript + React Router. Chosen for its speed and simplicity. 
- **Styling**: Vanilla CSS. Opted for no heavy UI frameworks to keep the bundle small and maintain fine-grained control over a premium dark-mode look.
- **Backend/DB**: Supabase (PostgreSQL). We leverage Row Level Security (RLS) heavily so the frontend can securely talk directly to the database without a middle tier.
- **Serverless**: Netlify Functions. Used solely to run the Claude API securely on the server side (`/.netlify/functions/confirm-booking`), preventing the API key from leaking to the client.

**Tradeoffs**:
- Computed availability vs static slots: Instead of generating `slots` in the database, the frontend dynamically calculates business hours and subtracts `public_booked_slots`. This means no cron job is needed to populate slots, making the app much simpler to maintain.

## Double-booking Prevention

Double booking is prevented at the **database level** via a partial unique index:
```sql
CREATE UNIQUE INDEX bookings_start_time_unique 
ON bookings (start_time) 
WHERE status = 'confirmed';
```
Even if two users try to book the exact same slot at the exact same millisecond, the PostgreSQL database will enforce this constraint and reject one of the transactions. No application-level race conditions are possible.

## Next Steps / Skipped Items

- **Realtime updates**: Skipped using Supabase Realtime for live slot updates to ensure core features were rock solid in the time constraint.
- **Admin View**: Did not build the admin dashboard for managing all bookings.
- **Reminders**: A scheduled function (e.g. Supabase pg_cron or Netlify Scheduled Functions) sending 24-hour reminders was skipped.
- **Natural language booking**: Did not integrate Claude tool use for "book me a haircut next Tuesday".
- **Email delivery**: The Claude confirmation function just logs the generated email text instead of integrating with Resend/SendGrid.
