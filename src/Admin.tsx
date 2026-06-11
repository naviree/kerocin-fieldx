import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { format, parseISO } from 'date-fns';

export default function Admin({ session }: { session: any }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('start_time', { ascending: true });
        
      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching all bookings:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking as Admin?')) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id);
        
      if (error) throw error;
      fetchBookings();
    } catch (error: any) {
      alert('Error cancelling: ' + error.message);
    }
  };

  if (loading) return <div className="loading">Loading admin dashboard...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2>Admin Dashboard</h2>
        <p style={{ color: '#888' }}>Manage all bookings across the platform.</p>
      </div>
      
      {bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#888' }}>No bookings found.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Date & Time</th>
              <th style={{ padding: '1rem' }}>Service</th>
              <th style={{ padding: '1rem' }}>User ID</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '1rem' }}>{format(parseISO(b.start_time), 'MMM d, yyyy h:mm a')}</td>
                <td style={{ padding: '1rem' }}>{b.service_name}</td>
                <td style={{ padding: '1rem', fontSize: '0.8rem', color: '#888' }}>{b.user_id.substring(0, 8)}...</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: b.status === 'confirmed' ? '#00d26a' : '#ff4a4a' }}>
                    {b.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {b.status === 'confirmed' && (
                    <button className="danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleCancel(b.id)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
