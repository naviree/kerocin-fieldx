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


