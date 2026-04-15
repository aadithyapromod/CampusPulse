import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, MapPin, Users, ChevronRight, Check, LayoutGrid, CalendarDays, ChevronLeft, X, Clock, Tag } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE from '../config/api';

export default function EventCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialView = searchParams.get('view') === 'calendar' ? 'calendar' : 'grid';
  const [view, setView] = useState(initialView);
  
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 4));
  const { user } = useAuth();

  useEffect(() => {
    fetch(`${API_BASE}/api/events`)
      .then(res => res.json())
      .then(data => {
        setEvents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load events', err);
        setLoading(false);
      });
  }, []);

  // Load the user's existing registrations so the Register/Cancel buttons are correct on mount
  useEffect(() => {
    if (!user) return;
    fetch(`${API_BASE}/api/users/${user.id}/registrations`)
      .then(res => res.json())
      .then(data => {
        setRegisteredIds(new Set(data.map(e => e.id)));
      })
      .catch(() => {});
  }, [user]);

  // Helper: refresh all state from backend
  const refreshFromServer = async () => {
    try {
      const [eventsRes, regsRes] = await Promise.all([
        fetch(`${API_BASE}/api/events`),
        user ? fetch(`${API_BASE}/api/users/${user.id}/registrations`) : Promise.resolve(null)
      ]);
      const eventsData = await eventsRes.json();
      setEvents(eventsData);
      if (regsRes) {
        const regsData = await regsRes.json();
        setRegisteredIds(new Set(regsData.map(e => e.id)));
      }
    } catch (err) {
      console.error('Failed to refresh', err);
    }
  };

  const handleRegister = async (eventId) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, name: user.name, email: user.email })
      });
      const data = await res.json();
      if (data.status === 'registered' || data.status === 'waitlist') {
        // Optimistic update then confirm from server
        const newSet = new Set(registeredIds);
        newSet.add(eventId);
        setRegisteredIds(newSet);
      }
      // Always re-fetch to ensure full sync
      await refreshFromServer();
    } catch (err) {
      console.error('Registration failed', err);
    }
  };

  const handleCancelRegistration = async (eventId) => {
    if (!user) return;
    if (window.confirm("Are you sure you want to cancel your registration?")) {
      try {
        // Optimistic: update UI immediately
        const newSet = new Set(registeredIds);
        newSet.delete(eventId);
        setRegisteredIds(newSet);

        await fetch(`${API_BASE}/api/events/${eventId}/register/${user.id}`, { method: 'DELETE' });

        // Re-fetch everything from server to ensure full sync
        await refreshFromServer();

        // Close modal if the cancelled event was selected
        if (selectedEvent && selectedEvent.id === eventId) {
          setSelectedEvent(null);
        }
      } catch (err) {
        console.error("Failed to cancel", err);
        await refreshFromServer();
      }
    }
  };

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.category === filter);

  const MonthView = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 sm:p-6 mt-6 relative z-10 box-border w-full"
      >
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2.5 bg-surface hover:bg-surface/80 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95"><ChevronLeft className="w-5 h-5"/></button>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2.5 bg-surface hover:bg-surface/80 rounded-xl cursor-pointer transition-all hover:scale-105 active:scale-95"><ChevronRight className="w-5 h-5"/></button>
        </div>
        
        <div className="grid grid-cols-7 gap-[1px] bg-white/10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {weekDays.map(day => (
            <div key={day} className="bg-surface/90 py-4 text-center text-xs font-bold text-muted uppercase tracking-widest border-b border-white/5">
              {day}
            </div>
          ))}
          
          {days.map((day, idx) => {
            const dayEvents = filteredEvents.filter(e => isSameDay(new Date(e.date), day));
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isToday = isSameDay(day, new Date());
            
            return (
              <div key={day.toString()} className={`min-h-[140px] bg-surface/50 p-2 sm:p-3 transition-colors hover:bg-surface/80 group ${!isCurrentMonth ? 'opacity-40 bg-surface/30' : ''}`}>
                <div className={`flex justify-end mb-2`}>
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-text group-hover:bg-white/5'}`}>
                    {format(day, "d")}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[100px] pr-1 custom-scrollbar">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`text-xs px-2.5 py-1.5 rounded-md truncate cursor-pointer hover:opacity-100 opacity-90 transition-all font-medium border hover:scale-[1.02] active:scale-95 ${event.category === 'technology' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/35' : event.category === 'cultural' ? 'bg-pink-500/20 text-pink-300 border-pink-500/30 hover:bg-pink-500/35' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/35'}`}
                    >
                      {format(new Date(event.date), 'HH:mm')} - {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  if (loading) return <div className="py-20 text-center text-muted animate-pulse font-medium text-lg">Loading your calendar...</div>;

  return (
    <div className="py-10 animate-fade-in relative z-10 w-full max-w-7xl mx-auto box-border">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">Event Calendar</h1>
          <p className="text-muted text-lg">Discover the timeline of campus activities</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end z-20">
          <div className="flex gap-1.5 bg-surface/80 p-1.5 rounded-xl border border-white/5 shadow-inner">
            <button onClick={() => setView('grid')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${view === 'grid' ? 'bg-background text-text shadow-md' : 'text-muted hover:text-text hover:bg-white/5'}`}>
              <LayoutGrid className="w-4 h-4"/> Cards
            </button>
            <button onClick={() => setView('calendar')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${view === 'calendar' ? 'bg-background text-text shadow-md' : 'text-muted hover:text-text hover:bg-white/5'}`}>
              <CalendarDays className="w-4 h-4"/> Monthly
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'technology', 'cultural', 'business'].map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer btn-reactive ${filter === cat ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' : 'bg-surface border border-white/5 text-muted hover:text-text hover:bg-surface/80'}`}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'calendar' ? (
        <MonthView />
      ) : (
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredEvents.map(event => {
            const isRegistered = registeredIds.has(event.id);
            return (
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }}
              key={event.id} 
              className="glass-card p-6 flex flex-col justify-between group h-full relative overflow-hidden transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent -z-10 rounded-bl-full" />
              <div>
                <div className="flex justify-between items-start mb-5">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${event.category === 'technology' ? 'bg-indigo-500/20 text-indigo-300' : event.category === 'cultural' ? 'bg-pink-500/20 text-pink-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {event.category}
                  </span>
                  <span className="text-muted text-sm flex items-center gap-1.5 font-medium bg-black/20 px-2.5 py-1.5 rounded-md">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors leading-tight">{event.title}</h3>
                <p className="text-muted/80 text-sm line-clamp-2 mb-6">{event.description}</p>
              </div>
              
              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2.5 text-sm font-medium text-text/80">
                  <MapPin className="w-4 h-4 text-secondary/80" />
                  {event.location || event.venue || 'Online'}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-text/80 bg-surface/50 px-3 py-1.5 rounded-lg border border-white/5">
                    <Users className="w-4 h-4 text-primary/80" />
                    {event.registered} / {event.capacity}
                  </div>
                  <button 
                    onClick={() => !isRegistered && handleRegister(event.id)}
                    disabled={isRegistered}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer btn-reactive
                      ${isRegistered ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20'}
                    `}
                  >
                    {isRegistered ? <><Check className="w-4 h-4"/> Registered</> : 'Register'}
                  </button>
                </div>
              </div>
            </motion.div>
          )})}
        </motion.div>
      )}

      {/* Event Detail Modal */}
      <AnimatePresence>
      {selectedEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedEvent(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative glass-card w-full max-w-md p-7 shadow-2xl border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-muted" />
            </button>

            {/* Category badge */}
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 ${
              selectedEvent.category === 'technology' ? 'bg-indigo-500/20 text-indigo-300'
              : selectedEvent.category === 'cultural' ? 'bg-pink-500/20 text-pink-300'
              : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {selectedEvent.category}
            </span>

            <h2 className="text-2xl font-extrabold mb-3 leading-tight">{selectedEvent.title}</h2>
            <p className="text-muted/80 text-sm mb-6 leading-relaxed">{selectedEvent.description}</p>

            <div className="space-y-3 mb-7">
              <div className="flex items-center gap-3 text-sm text-text/80">
                <CalendarIcon className="w-4 h-4 text-primary/80 shrink-0" />
                <span>{new Date(selectedEvent.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text/80">
                <Clock className="w-4 h-4 text-secondary/80 shrink-0" />
                <span>{format(new Date(selectedEvent.date), 'hh:mm a')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text/80">
                <MapPin className="w-4 h-4 text-secondary/80 shrink-0" />
                <span>{selectedEvent.location || selectedEvent.venue || 'Online'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-text/80">
                <Users className="w-4 h-4 text-primary/80 shrink-0" />
                <span>{selectedEvent.registered} / {selectedEvent.capacity} registered</span>
              </div>
            </div>

            {/* Capacity bar */}
            <div className="mb-7">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                  style={{ width: `${Math.min(100, (selectedEvent.registered / selectedEvent.capacity) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-1.5">{selectedEvent.capacity - selectedEvent.registered} spots remaining</p>
            </div>

            {registeredIds.has(selectedEvent.id) ? (
              <div className="flex gap-4 w-full">
                <div className="flex-1 py-3 rounded-xl text-sm font-bold bg-secondary/10 text-secondary border border-secondary/20 flex items-center justify-center gap-2 cursor-default">
                  <Check className="w-4 h-4" /> Registered
                </div>
                <button
                  onClick={() => handleCancelRegistration(selectedEvent.id)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all btn-reactive"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleRegister(selectedEvent.id)}
                className="w-full py-3 rounded-xl text-sm font-bold btn-reactive flex items-center justify-center gap-2 cursor-pointer bg-primary hover:bg-primary/90 text-white shadow-primary/20"
              >
                Register for Event
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
