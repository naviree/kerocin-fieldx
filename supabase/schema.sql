-- Schema for Booking App

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    service_name TEXT NOT NULL DEFAULT 'Haircut',
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index to prevent double booking
CREATE UNIQUE INDEX bookings_start_time_unique 
ON bookings (start_time) 
WHERE status = 'confirmed';

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own bookings" 
ON bookings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings" 
ON bookings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" 
ON bookings FOR UPDATE 
USING (auth.uid() = user_id);

-- View to securely expose which slots are taken
CREATE VIEW public_booked_slots AS
SELECT start_time FROM bookings WHERE status = 'confirmed';

-- Grant access to the view
GRANT SELECT ON public_booked_slots TO authenticated;
GRANT SELECT ON public_booked_slots TO anon;
