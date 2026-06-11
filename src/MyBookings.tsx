import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { format, parseISO } from 'date-fns';

export default function MyBookings({ session }: { session: any }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'confirmed')
        .order('start_time', { ascending: true });
        
      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    setCancelling(id);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('user_id', session.user.id);
        
      if (error) throw error;
      
      // Update local state
      setBookings(bookings.filter(b => b.id !== id));
      alert('Booking cancelled successfully.');
    } catch (error: any) {
      alert('Error cancelling booking: ' + error.message);
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return <div className="loading">Loading your bookings...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2>My Bookings</h2>
        <p style={{ color: '#888' }}>Manage your upcoming appointments.</p>
      </div>
      
      {bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#888' }}>You don't have any upcoming bookings.</p>
        </div>
      ) : (
        <div>
          {bookings.map(booking => {
            const date = parseISO(booking.start_time);
            return (
              <div key={booking.id} className="my-booking-item">
                <div className="booking-info">
                  <h3>{booking.service_name}</h3>
                  <p>{format(date, 'EEEE, MMMM d, yyyy')}</p>
                  <p style={{ color: '#fff', fontWeight: 500 }}>{format(date, 'h:mm a')}</p>
                </div>
                <div>
                  <button 
                    className="danger"
                    onClick={() => handleCancel(booking.id)}
                    disabled={cancelling === booking.id}
                  >
                    {cancelling === booking.id ? 'Cancelling...' : 'Cancel'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
