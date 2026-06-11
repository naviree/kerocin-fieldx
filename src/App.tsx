import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Auth from './Auth';
import Home from './Home';
import MyBookings from './MyBookings';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="container">
        <header className="header">
          <Link to="/" className="title">BookingApp</Link>
          {session && (
            <nav className="nav-links">
              <Link to="/">Book</Link>
              <Link to="/my-bookings">My Bookings</Link>
              <button 
                className="secondary" 
                onClick={() => supabase.auth.signOut()}
                style={{ marginLeft: '1rem', padding: '6px 12px', fontSize: '0.9rem' }}
              >
                Sign Out
              </button>
            </nav>
          )}
        </header>

        <main>
          <Routes>
            <Route 
              path="/" 
              element={session ? <Home session={session} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/my-bookings" 
              element={session ? <MyBookings session={session} /> : <Navigate to="/auth" />} 
            />
            <Route 
              path="/auth" 
              element={!session ? <Auth /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
