import { Calendar, Users, MessageSquare, QrCode, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import API_BASE from '../config/api';

export default function LandingPage() {
  const { user } = useAuth();
  const [orgEvents, setOrgEvents] = useState([]);
  
  useEffect(() => {
    if (user && user.role === 'organizer') {
      fetch(`${API_BASE}/api/events`)
        .then(res => res.json())
        .then(data => {
          const matched = data.filter(e => e.organizerId === user.id);
          setOrgEvents(matched);
        });
    }
  }, [user]);

  if (user && user.role === 'organizer') {
    return (
      <div className="animate-fade-in py-12 sm:py-20 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 pointer-events-none" />
        <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl sm:text-6xl font-extrabold mb-4 tracking-tight">Organization <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Home</span></motion.h1>
        <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-xl text-muted max-w-2xl mb-12">Welcome back, <span className="font-bold text-white">{user.name}</span>. You can quickly oversee your hosted events directly from the home page, or dive into your comprehensive dashboard system for detailed controls.</motion.p>
        
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-wrap gap-4 mb-16">
          <Link to="/dashboard" className="px-8 py-3.5 bg-primary rounded-xl text-white font-bold shadow-primary/20 flex items-center btn-reactive">Open Full Dashboard</Link>
          <Link to="/host-event" className="px-8 py-3.5 bg-surface border border-white/10 rounded-xl text-text font-bold btn-reactive hover:bg-surface/80">Host a New Event</Link>
        </motion.div>

        <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl font-bold mb-6 flex items-center gap-3"><Calendar className="w-6 h-6 text-primary"/> Hosted Events Overview</motion.h2>
        
        {orgEvents.length === 0 ? (
          <div className="glass-card p-10 text-center text-muted border-dashed border-white/20">No events hosted yet. Access your dashboard to launch your first event!</div>
        ) : (
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
          >
            {orgEvents.map(event => (
              <motion.div 
                key={event.id}
                variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } } }}
                className="glass-card p-6 flex flex-col group border-l-4 border-surface hover:border-primary transition-all text-left"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold mb-2 truncate">{event.title}</h3>
                </div>
                <p className="text-sm text-muted mb-4 flex-1 line-clamp-2">{event.description}</p>
                <div className="flex gap-4 text-sm font-medium mb-4">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-primary" /> {new Date(event.date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-secondary" /> {event.location || event.venue || 'Online'}</span>
                </div>
                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-sm font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full">{event.registered} / {event.capacity} RSVPs</span>
                  <Link to={`/edit-event/${event.id}`} className="text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors py-2 px-3 hover:bg-primary/10 rounded-lg active:scale-95">Manage &rarr;</Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  const features = [
    { icon: <Calendar className="w-6 h-6 text-primary" />, title: 'Unified Calendar', desc: 'Discover and track college events seamlessly in one place.', link: '/events?view=calendar' },
    { icon: <Users className="w-6 h-6 text-secondary" />, title: 'One-Click Registration', desc: 'Sign up for events instantly and secure your spot or join waitlists.', link: '/events' },
    { icon: <MessageSquare className="w-6 h-6 text-primary" />, title: 'Integrated Messaging', desc: 'Communicate directly with organizers and other participants.', link: '/messages' },
    { icon: <QrCode className="w-6 h-6 text-secondary" />, title: 'Smart Attendance', desc: 'Fast, secure check-ins using QR codes.', link: '/dashboard' },
  ];

  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-[128px] -z-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center max-w-4xl w-full mb-16"
      >
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 mt-8">
          The heartbeat of your <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">College Events</span>
        </h1>
        <p className="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          CampusPulse brings students and organizers together. Discover, register, and engage with campus activities like never before.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
          <Link to="/events" className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white font-medium rounded-xl btn-reactive shadow-primary/25">
            Explore Events
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto px-8 py-3.5 bg-surface border border-white/10 text-text font-medium rounded-xl btn-reactive">
            Your Tickets
          </Link>
        </div>
      </motion.div>

      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 relative z-10 w-full max-w-5xl mx-auto"
      >
        {features.map((f, i) => {
          const content = (
            <div className={`h-full glass-card p-8 flex flex-col gap-4 group ${f.link ? 'cursor-pointer hover:border-primary/50 active:scale-[0.98] transition-transform duration-200' : 'cursor-default'}`}>
              <div className="w-14 h-14 rounded-2xl bg-background/50 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                {f.icon}
              </div>
              <h3 className="text-2xl font-semibold group-hover:text-primary transition-colors">{f.title}</h3>
              <p className="text-muted leading-relaxed text-base">{f.desc}</p>
            </div>
          );
          
          return (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
              }}
            >
              {f.link ? <Link to={f.link} className="block h-full">{content}</Link> : content}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
