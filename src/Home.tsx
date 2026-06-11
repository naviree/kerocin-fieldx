import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { addDays, format, startOfToday, setHours, setMinutes, isBefore } from 'date-fns';

export default function Home({ session }: { session: any }) {
  const [slots, setSlots] = useState<Date[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  const [nlpPrompt, setNlpPrompt] = useState('');
  const [nlpLoading, setNlpLoading] = useState(false);

  useEffect(() => {
    generateSlots();
    fetchBookedSlots();

    // Stretch 11: Live slot updates via Supabase Realtime
    const subscription = supabase
      .channel('availability_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'public_availability_changes' }, (payload) => {
        const { start_time, status } = payload.new;
        if (status === 'confirmed') {
          setBookedSlots(prev => [...prev, new Date(start_time).toISOString()]);
        } else if (status === 'cancelled') {
          setBookedSlots(prev => prev.filter(time => time !== new Date(start_time).toISOString()));
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const generateSlots = () => {
    const today = startOfToday();
    const newSlots: Date[] = [];
    
    // Generate slots for today and next 2 days
    for (let day = 0; day < 3; day++) {
      const currentDate = addDays(today, day);
      
      // Business hours: 9 AM to 5 PM
      for (let hour = 9; hour < 17; hour++) {
        const slot = setHours(setMinutes(currentDate, 0), hour);
        // Only show future slots
        if (isBefore(new Date(), slot)) {
          newSlots.push(slot);
        }
      }
    }
    
    setSlots(newSlots);
  };

  const fetchBookedSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('public_booked_slots')
        .select('start_time');
        
      if (error) throw error;
      
      if (data) {
        setBookedSlots(data.map(item => new Date(item.start_time).toISOString()));
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slot: Date) => {
    const slotStr = slot.toISOString();
    setBookingLoading(slotStr);
    
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: session.user.id,
            start_time: slotStr,
            service_name: 'Consultation',
          }
        ]);
        
      if (error) {
        if (error.code === '23505') {
          alert('This slot was just booked by someone else! Please choose another.');
        } else {
          throw error;
        }
      } else {
        alert('Booking confirmed!');
        // Ideally trigger the Claude confirmation here via a Netlify function!
        triggerClaudeConfirmation(session.user.email, slotStr);
      }
      
      fetchBookedSlots(); // Refresh
    } catch (error: any) {
      alert('Error booking slot: ' + error.message);
    } finally {
      setBookingLoading(null);
    }
  };

  const triggerClaudeConfirmation = async (email: string, time: string) => {
    try {
      await fetch('/.netlify/functions/confirm-booking', {
        method: 'POST',
        body: JSON.stringify({ email, time, service: 'Consultation' }),
      });
    } catch (e) {
      console.error('Failed to send confirmation', e);
    }
  };

  const handleNlpBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpPrompt) return;
    
    setNlpLoading(true);
    try {
      const response = await fetch('/.netlify/functions/gemini-booking', {
        method: 'POST',
        body: JSON.stringify({ 
          prompt: nlpPrompt,
          clientDate: new Date().toLocaleString()
        }),
      });
      
      const result = await response.json();
      
      if (result.error) {
        alert('AI says: ' + result.error);
        return;
      }

      if (result.start_time) {
        const slotDate = new Date(result.start_time);
        if (confirm(`Do you want to book: ${format(slotDate, 'EEEE, MMMM d at h:mm a')}?`)) {
          await handleBookSlot(slotDate);
        }
      }
    } catch (err: any) {
      alert('Error parsing request: ' + err.message);
    } finally {
      setNlpLoading(false);
      setNlpPrompt('');
    }
  };

  if (loading) return <div className="loading">Loading slots...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2>Book a Consultation</h2>
        <p style={{ color: '#888' }}>Select an available time slot below, or just type what you want!</p>
      </div>

      {/* Stretch 12: Natural Language Booking */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>✨ AI Quick Book</h3>
        <form onSubmit={handleNlpBooking} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="e.g. 'book me a haircut next Tuesday at 2pm'" 
            value={nlpPrompt}
            onChange={(e) => setNlpPrompt(e.target.value)}
            disabled={nlpLoading}
          />
          <button type="submit" disabled={nlpLoading || !nlpPrompt}>
            {nlpLoading ? 'Thinking...' : 'Book'}
          </button>
        </form>
      </div>
      
      {/* Group slots by day */}
      {[0, 1, 2].map(dayOffset => {
        const date = addDays(startOfToday(), dayOffset);
        const daySlots = slots.filter(s => s.getDate() === date.getDate());
        
        if (daySlots.length === 0) return null;
        
        return (
          <div key={dayOffset} className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
              {format(date, 'EEEE, MMMM d')}
            </h3>
            
            <div className="slots-grid">
              {daySlots.map(slot => {
                const slotStr = slot.toISOString();
                const isBooked = bookedSlots.includes(slotStr);
                const isLoading = bookingLoading === slotStr;
                
                return (
                  <div 
                    key={slotStr} 
                    className={`slot-item ${isBooked ? 'booked' : ''}`}
                    onClick={() => !isBooked && !isLoading && handleBookSlot(slot)}
                  >
                    <div className="slot-time">{format(slot, 'h:mm a')}</div>
                    <div className={`slot-status ${!isBooked ? 'available' : 'unavailable'}`}>
                      {isLoading ? 'Booking...' : isBooked ? 'Unavailable' : 'Available'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
