import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar as CalendarIcon, Ticket, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import API_BASE from '../config/api';

export default function StudentDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = () => {
      fetch(`${API_BASE}/api/users/${user.id}/registrations`)
        .then(res => res.json())
        .then(resData => { setData(resData); setLoading(false); })
        .catch(() => setLoading(false));
    };
    
    fetchData();
    const intervalId = setInterval(fetchData, 3000);
    return () => clearInterval(intervalId);
  }, [user]);

  const handleCancelRegistration = async (eventId) => {
    if (window.confirm("Are you sure you want to cancel your registration?")) {
      // Immediately remove from UI for instant feedback
      setData(prev => prev.filter(e => e.id !== eventId));
      setSelectedTicket(null);
      
      try {
        await fetch(`${API_BASE}/api/events/${eventId}/register/${user.id}`, { method: 'DELETE' });
        // Re-fetch from backend to confirm the registration list is now accurate
        const res = await fetch(`${API_BASE}/api/users/${user.id}/registrations`);
        const fresh = await res.json();
        setData(fresh);
      } catch (err) {
        console.error("Failed to cancel", err);
        // On error, re-fetch to restore correct state
        const res = await fetch(`${API_BASE}/api/users/${user.id}/registrations`);
        const fresh = await res.json();
        setData(fresh);
      }
    }
  };

  return (
    <div className="py-10 relative z-10 max-w-6xl w-full mx-auto animate-fade-in">
      <div className="mb-10 border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-muted">Manage your upcoming events and tickets</p>
        </div>
        <div className="text-left md:text-right flex flex-col items-start md:items-end">
          <div className="text-xs uppercase text-muted font-bold tracking-wider mb-1.5">Active Profile</div>
          <div className="px-4 py-2 bg-surface border border-white/5 shadow-inner rounded-xl font-bold text-sm flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            {user.name}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Ticket className="w-6 h-6 text-primary" />
        Your Tickets
      </h2>

      {loading ? (
        <div className="py-10 text-center text-muted animate-pulse font-medium text-lg">Loading your tickets...</div>
      ) : data.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-12 text-center border-dashed border-white/10 border-2">
          <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-6">
            <Ticket className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No upcoming events</h3>
          <p className="text-muted mb-8 max-w-md mx-auto">You haven't registered for any events yet. Head over to the calendar to discover what's happening on campus.</p>
          <Link to="/events" className="inline-flex px-8 py-3 bg-primary rounded-xl text-white font-bold btn-reactive">
            Browse Calendar
          </Link>
        </motion.div>
      ) : (
        <motion.div 
          initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {data.map(event => (
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }}
              key={event.id} 
              onClick={() => setSelectedTicket(event)}
              className="glass-card flex p-6 gap-6 relative overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary/10 rounded-full blur-[64px] pointer-events-none group-hover:bg-secondary/20 transition-all" />
              
              {event.attendees?.find(a => a.userId === user.id)?.status === 'present' ? (
                <div className="bg-surface/80 p-3 rounded-xl border-4 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)] flex-shrink-0 relative z-10 flex flex-col items-center justify-center text-center hidden sm:flex w-[152px] h-[152px]">
                  <CheckCircle className="w-10 h-10 text-green-400 mb-2" />
                  <span className="font-extrabold text-sm tracking-widest text-green-400 uppercase leading-tight">Entry<br/>Allowed</span>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-xl border-4 border-surface shadow-2xl flex-shrink-0 relative z-10 transition-transform group-hover:scale-105 hidden sm:block w-[152px] h-[152px] flex items-center justify-center">
                  <QRCodeSVG 
                    value={JSON.stringify({ userId: user.id, eventId: event.id })} 
                    size={120} 
                    fgColor="#0f172a" 
                  />
                </div>
              )}

              <div className="flex flex-col justify-center flex-1">
                <h3 className="text-xl font-bold mb-3 line-clamp-1">{event.title}</h3>
                
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm text-text/80 font-medium">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text/80 font-medium">
                    <MapPin className="w-4 h-4 text-secondary" />
                    {event.location || event.venue || 'Online'}
                  </div>
                </div>

                <div className={`mt-5 pt-4 border-t border-white/10 flex justify-between items-center text-xs uppercase font-bold tracking-widest ${event.attendees?.find(a => a.userId === user.id)?.status === 'present' ? 'text-green-400' : 'text-muted'}`}>
                  <span>{event.attendees?.find(a => a.userId === user.id)?.status === 'present' ? 'Checked In' : 'Admit One'}</span>
                  <span className="bg-surface px-2 py-1 rounded">ID: {event.id}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
      {selectedTicket && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            className="glass-card max-w-sm w-full p-8 relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 text-muted hover:text-white transition-colors">
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold mb-2 text-center mr-4">{selectedTicket.title}</h3>
            <p className="text-muted text-sm text-center mb-8">
              {new Date(selectedTicket.date).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
            </p>
            
            {selectedTicket.attendees?.find(a => a.userId === user.id)?.status === 'present' ? (
              <div className="bg-surface/80 p-6 rounded-2xl border-4 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)] flex flex-col items-center justify-center text-center w-full aspect-square">
                <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                <span className="font-extrabold text-xl tracking-widest text-green-400 uppercase leading-tight">Entry<br/>Allowed</span>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-2xl w-full aspect-square flex items-center justify-center">
                <QRCodeSVG 
                  value={JSON.stringify({ userId: user.id, eventId: selectedTicket.id })} 
                  size={200} 
                  fgColor="#0f172a" 
                />
              </div>
            )}
            
            <div className="mt-8 text-center w-full">
              <p className="text-xs text-muted uppercase tracking-widest font-bold mb-1">Ticket ID</p>
              <p className="font-mono text-sm bg-surface px-4 py-2 rounded-lg border border-white/5 break-all">{selectedTicket.id}</p>
            </div>
            
            <button 
              onClick={() => handleCancelRegistration(selectedTicket.id)}
              className="mt-6 w-full py-3 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all btn-reactive"
            >
              Cancel Registration
            </button>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
