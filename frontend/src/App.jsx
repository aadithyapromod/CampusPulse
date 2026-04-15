import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import EventCalendar from './pages/EventCalendar';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import HostEventPage from './pages/HostEventPage';
import ScanTickets from './pages/ScanTickets';
import ChatPage from './pages/ChatPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogOut, MessageSquare } from 'lucide-react';
import API_BASE from './config/api';

function Navbar() {
  const { user, logout } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkUnread = async () => {
      try {
        let userEvents = [];
        if (user.role === 'organizer') {
          const res = await fetch(`${API_BASE}/api/events`);
          const data = await res.json();
          userEvents = data.filter(e => e.organizerId === user.id);
        } else {
          const res = await fetch(`${API_BASE}/api/users/${user.id}/registrations`);
          userEvents = await res.json();
        }

        if (userEvents.length === 0) return;

        const eventIds = userEvents.map(e => e.id);
        const summRes = await fetch('${API_BASE}/api/messages/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventIds })
        });
        const summaries = await summRes.json();

        let unread = false;
        for (const id of eventIds) {
          const lastRead = localStorage.getItem(`lastRead_${user.id}_${id}`);
          const summ = summaries[id];
          if (summ && summ.latestTimestamp && (!lastRead || new Date(summ.latestTimestamp) > new Date(lastRead))) {
            unread = true;
            break;
          }
        }
        setHasUnread(unread);
      } catch (err) {}
    };

    checkUnread();
    const interval = setInterval(checkUnread, 3000);
    return () => clearInterval(interval);
  }, [user]);
  
  return (
    <nav className="border-b border-white/10 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            CampusPulse
          </Link>
          <div className="flex gap-4 items-center">
            {(!user || user.role !== 'organizer') && (
              <Link to="/events" className="text-sm font-medium text-muted hover:text-text transition-colors">Events</Link>
            )}
            {user && (
              <Link to="/messages" className="text-sm font-medium text-muted hover:text-text transition-colors flex items-center gap-1.5 relative">
                <MessageSquare className="w-4 h-4"/> Messages
                {hasUnread && (
                  <span className="absolute -top-1 -right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
              </Link>
            )}
            {user ? (
              <div className="flex items-center gap-4 ml-2">
                <Link to="/" className="text-sm font-medium text-text hover:text-primary transition-colors">
                  {user.name} <span className="text-xs uppercase text-muted ml-1 bg-white/5 px-2 py-1 rounded">({user.role})</span>
                </Link>
                <button onClick={logout} className="p-2 text-muted hover:text-red-400 transition-colors" title="Logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/auth" className="text-sm font-medium px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/20">Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-background text-text selection:bg-primary/30">
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/events" element={<EventCalendar />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/host-event" element={<HostEventPage />} />
              <Route path="/edit-event/:id" element={<HostEventPage />} />
              <Route path="/scan-tickets" element={<ScanTickets />} />
              <Route path="/messages" element={<ChatPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
