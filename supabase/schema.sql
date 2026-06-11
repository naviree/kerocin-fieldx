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

-- ADMIN POLICIES (Stretch Goal 13)
-- In a real app, you'd check a 'roles' table. Here we check for a specific email or bypass.
CREATE POLICY "Admins can view all bookings" 
ON bookings FOR SELECT 
USING ( (select auth.jwt()->>'email') = 'admin@example.com' );

CREATE POLICY "Admins can update all bookings" 
ON bookings FOR UPDATE 
USING ( (select auth.jwt()->>'email') = 'admin@example.com' );

-- View to securely expose which slots are taken
CREATE VIEW public_booked_slots AS
SELECT start_time FROM bookings WHERE status = 'confirmed';

-- Grant access to the view
GRANT SELECT ON public_booked_slots TO authenticated;
GRANT SELECT ON public_booked_slots TO anon;

-- Realtime Setup (Stretch Goal 11)
-- Create a public table to broadcast availability changes safely without leaking user data
CREATE TABLE public_availability_changes (
    id SERIAL PRIMARY KEY,
    start_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public_availability_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read availability changes" ON public_availability_changes FOR SELECT USING (true);

-- Create trigger to auto-log changes
CREATE OR REPLACE FUNCTION notify_availability_change() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public_availability_changes (start_time, status) 
    VALUES (NEW.start_time, NEW.status);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_booking_change
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION notify_availability_change();

-- Enable Supabase Realtime for the changes table
ALTER PUBLICATION supabase_realtime ADD TABLE public_availability_changes;
