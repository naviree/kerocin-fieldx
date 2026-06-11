import { schedule } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // Typically use a service role key here for cron
const supabase = createClient(supabaseUrl, supabaseKey);

// Run every hour
export const handler = schedule('0 * * * *', async () => {
  try {
    // We want to find bookings that are exactly 24 hours from now
    // Since this runs hourly, we look for bookings between 24 and 25 hours from now
    const now = new Date();
    const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, start_time, service_name, user_id')
      .eq('status', 'confirmed')
      .gte('start_time', tomorrowStart.toISOString())
      .lt('start_time', tomorrowEnd.toISOString());

    if (error) {
      throw error;
    }

    if (bookings && bookings.length > 0) {
      console.log(`[Reminders] Found ${bookings.length} upcoming appointments.`);
      
      for (const booking of bookings) {
        // In a real app, we'd fetch the user's email from auth.users (requires service role key)
        // and send an email via Resend/SendGrid.
        console.log(`[Reminders] Sending 24hr reminder for ${booking.service_name} at ${booking.start_time} (User: ${booking.user_id})`);
      }
    } else {
      console.log('[Reminders] No appointments found for the 24hr window.');
    }

    return {
      statusCode: 200,
    };
  } catch (error: any) {
    console.error('[Reminders] Error:', error.message);
    return {
      statusCode: 500,
    };
  }
});
