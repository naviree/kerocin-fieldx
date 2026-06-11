# Simple Booking App

A lightweight appointment booking application built with **React, TypeScript, Vite, Supabase, and Netlify Functions**.

The goal of this project was to build a reliable booking experience while keeping the architecture simple and maintainable.

## Running Locally

### 1. Set Up Supabase

Create a Supabase project and run the contents of `supabase/schema.sql` in the SQL Editor.

This creates:

- `bookings` table
- Row Level Security (RLS) policies
- Availability view used by the frontend

### 2. Configure Environment Variables

Rename `.env.example` to `.env` and add:

```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Start the Application

```bash
npm install
npx netlify-cli dev
```

Netlify CLI is used so the frontend and serverless functions run together during local development.

### 4. Create a Test Account

Authentication is handled through Supabase Auth.

You can register with any test email. If email verification is enabled in your Supabase project, disable **Confirm Email** under Auth settings for easier testing.

---

## Tech Stack

- React
- TypeScript
- Vite
- Supabase (Database + Authentication)
- Netlify Functions
- Vanilla CSS

---

## Architecture Notes

### Database-Driven Security

The application relies on Supabase Row Level Security rather than frontend restrictions. This ensures users can only access their own booking data even when communicating directly with the database.

### Dynamic Availability

Instead of maintaining a dedicated `slots` table, available appointment times are generated dynamically based on business hours.

The frontend checks availability against a database view that exposes confirmed booking times. This approach eliminates the need to pre-generate and maintain future appointment records while keeping the data model simple.

### Preventing Double Bookings

Double-booking protection is enforced at the database layer:

```sql
CREATE UNIQUE INDEX bookings_start_time_unique
ON bookings (start_time)
WHERE status = 'confirmed';
```

This prevents race conditions by ensuring PostgreSQL remains the source of truth. If multiple users attempt to book the same slot simultaneously, only one transaction succeeds.

---

## AI Confirmation Messages

A Netlify serverless function (`confirm-booking.ts`) is responsible for generating booking confirmation messages using the Claude API.

For demonstration purposes, the API request is currently mocked so the project can be run without an Anthropic API key. The production integration and prompt logic remain in the codebase.

---

## Future Improvements

Given additional time, I would focus on:

- **Supabase Realtime** for instant availability updates across clients
- **Email delivery integration** using Resend or SendGrid
- **Admin dashboard** for managing bookings and schedules
- **Automated testing** for critical booking flows

---

## Key Design Goals

- Keep the architecture simple
- Enforce security at the database layer
- Prevent booking conflicts reliably
- Avoid unnecessary backend complexity
- Deliver a polished user experience with minimal dependencies
