import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Hash, MessageSquare, Megaphone, Clock, User, Shield, ArrowLeft } from 'lucide-react';
import API_BASE from '../config/api';

export default function ChatPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageSummary, setMessageSummary] = useState({});
  const [inputText, setInputText] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch permitted events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (user.role === 'organizer') {
          const res = await fetch(`${API_BASE}/api/events`);
          const data = await res.json();
          const ownEvents = data.filter(e => e.organizerId === user.id);
          setEvents(ownEvents);
        } else {
          const res = await fetch(`${API_BASE}/api/users/${user.id}/registrations`);
          const data = await res.json();
          setEvents(data);
        }
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user]);

  // Poll summary for all events
  useEffect(() => {
    if (events.length === 0) return;
    const fetchSummary = async () => {
      try {
        const eventIds = events.map(e => e.id);
        const res = await fetch('${API_BASE}/api/messages/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventIds })
        });
        const data = await res.json();
        setMessageSummary(data);
      } catch (err) { }
    };
    fetchSummary();
    const interval = setInterval(fetchSummary, 2000);
    return () => clearInterval(interval);
  }, [events]);

  // Poll active event messages
  useEffect(() => {
    if (!activeEvent) return;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/messages/${activeEvent.id}`);
        const data = await res.json();
        setMessages(data);
        if (data.length > 0) {
          localStorage.setItem(`lastRead_${user.id}_${activeEvent.id}`, data[data.length-1].timestamp);
        } else {
          localStorage.setItem(`lastRead_${user.id}_${activeEvent.id}`, new Date().toISOString());
        }
      } catch (err) {
        console.error("Failed fetching messages", err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 1500);
    return () => clearInterval(interval);
  }, [activeEvent]);

  if (!user) return <div className="p-20 text-center text-red-500 font-bold">Unauthorized.</div>;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeEvent) return;

    const payload = {
      text: inputText,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      isAnnouncement: isAnnouncement
    };

    setInputText('');
    setIsAnnouncement(false);

    try {
      await fetch(`${API_BASE}/api/messages/${activeEvent.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const res = await fetch(`${API_BASE}/api/messages/${activeEvent.id}`);
      const data = await res.json();
      setMessages(data);
      if (data.length > 0) {
        localStorage.setItem(`lastRead_${user.id}_${activeEvent.id}`, data[data.length-1].timestamp);
      }
    } catch (err) {
      console.error("Failed to send", err);
    }
  };

  const latestAnnouncement = messages.filter(m => m.isAnnouncement).pop();

  return (
    <div className="flex w-full h-[calc(100vh-100px)] overflow-hidden mt-4">
      <AnimatePresence mode="wait">
      {!activeEvent ? (
        /* ROOMS LIST - Themed like LandingPage features */
        <motion.div key="rooms" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col h-full w-full overflow-y-auto custom-scrollbar">
          <div className="max-w-5xl mx-auto w-full py-12 px-6">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-10">
              <h2 className="text-4xl sm:text-5xl font-extrabold flex items-center gap-4 tracking-tight text-white mb-4">
                <MessageSquare className="w-10 h-10 text-primary" /> Event Channels
              </h2>
              <p className="text-xl text-muted leading-relaxed">
                Jump into real-time discussions for your events. Connect securely with other participants and organizers.
              </p>
            </motion.div>
            
            {loading ? (
              <p className="text-muted text-lg py-5 font-medium">Loading servers...</p>
            ) : events.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-10 text-center border-dashed border-white/20">
                <p className="text-muted text-lg leading-relaxed font-medium">No events accessed yet. Register or host an event to unlock chats.</p>
              </motion.div>
            ) : (
              <motion.div 
                initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
              >
                {events.map(ev => {
                  const lastRead = localStorage.getItem(`lastRead_${user.id}_${ev.id}`);
                  const summary = messageSummary[ev.id];
                  const hasUnread = summary && summary.latestTimestamp && (!lastRead || new Date(summary.latestTimestamp) > new Date(lastRead));

                  return (
                  <motion.button 
                    variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } }}
                    key={ev.id}
                    onClick={() => {
                      setActiveEvent(ev);
                      if (summary && summary.latestTimestamp) {
                        localStorage.setItem(`lastRead_${user.id}_${ev.id}`, summary.latestTimestamp);
                      }
                    }}
                    className="glass-card p-8 flex flex-col gap-4 group hover:-translate-y-1 active:scale-[0.98] transition-all cursor-pointer hover:border-primary/50 text-left h-full relative"
                  >
                    {hasUnread && (
                      <div className="absolute top-6 right-6 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </div>
                    )}
                    <div className="w-14 h-14 rounded-2xl bg-background/50 border border-white/5 flex items-center justify-center group-hover:scale-110 shadow-inner shrink-0 text-primary transition-all relative">
                      <Hash className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold group-hover:text-primary transition-colors truncate">{ev.title}</h3>
                      <p className={`text-sm mt-2 line-clamp-2 leading-relaxed transition-colors ${hasUnread ? 'text-primary font-bold' : 'text-muted font-medium'}`}>
                        {hasUnread ? 'New messages arrived!' : 'Enter the dedicated communication space.'}
                      </p>
                    </div>
                  </motion.button>
                )})}
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : (
        /* CHAT WINDOW - Themed cleanly */
        <motion.div key="chat" initial={{ opacity: 0, scale: 0.98, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col relative w-full h-full glass-card overflow-hidden">
          {/* Chat Top Bar */}
          <div className="px-8 py-5 border-b border-white/5 bg-surface/30 backdrop-blur-xl flex items-center justify-between shrink-0">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => setActiveEvent(null)}
                className="w-10 h-10 rounded-2xl bg-background/50 border border-white/5 flex items-center justify-center hover:border-primary/50 text-muted hover:text-primary shadow-inner btn-reactive shadow-none active:shadow-none"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-2xl bg-background/50 border border-white/5 flex items-center justify-center shadow-inner hidden sm:flex">
                 <Hash className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold truncate text-white">{activeEvent.title}</h3>
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted border border-white/10 px-4 py-2 rounded-xl bg-background/50 whitespace-nowrap hidden md:block">
              {user.role} View
            </div>
          </div>

          {/* Pinned Announcement */}
          {latestAnnouncement && (
            <div className="mx-6 mt-6 glass-card p-5 flex gap-4 shrink-0 border-l-2 border-l-primary hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-background/50 border border-white/5 flex items-center justify-center shadow-inner shrink-0">
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="text-xs font-bold uppercase tracking-wider text-primary mb-1">Live Announcement from {latestAnnouncement.senderName}</div>
                <p className="text-sm font-medium text-text/90 leading-relaxed">{latestAnnouncement.text}</p>
              </div>
            </div>
          )}

          {/* Message Feed */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted text-base pb-10 font-medium">No messages yet. Break the ice!</div>
            ) : (
              messages.map((msg, i) => {
                const isOrg = msg.senderRole === 'organizer';
                const isMe = msg.senderId === user.id;

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-end gap-3 mb-2">
                      {!isMe && (
                        <div className={`text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm bg-background/50 border border-white/5 text-muted uppercase tracking-wider`}>
                          {isOrg ? <Shield className="w-3.5 h-3.5 text-secondary"/> : <User className="w-3.5 h-3.5 opacity-50 text-text" />}
                          <span className={isOrg ? "text-secondary" : "text-text/70"}>{msg.senderName}</span>
                          {isOrg ? <span className="text-secondary/50">(Org)</span> : ""}
                        </div>
                      )}
                      <div className="text-xs text-muted/50 flex items-center gap-1 font-mono uppercase tracking-tight">
                        <Clock className="w-3 h-3"/>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    
                    <div className={`px-6 py-4 max-w-[85%] sm:max-w-[75%] rounded-2xl break-words text-lg leading-relaxed shadow-lg ${
                      msg.isAnnouncement 
                        ? 'glass-card border-primary/30 text-white'
                        : isMe 
                          ? 'bg-surface/80 border border-white/10 text-white rounded-tr-sm backdrop-blur-md' 
                          : isOrg 
                            ? 'glass-card border-secondary/20 text-white rounded-tl-sm'
                            : 'glass-card text-text border-white/5 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <div className="p-6 bg-surface/30 backdrop-blur-lg border-t border-white/5 shrink-0">
            <form onSubmit={handleSendMessage} className="flex flex-col gap-3 max-w-4xl mx-auto">
              <div className="flex gap-4 items-center relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message #${activeEvent.title.replace(/\s+/g, '-').toLowerCase()}...`}
                  className="flex-1 glass-card focus:border-primary/50 rounded-2xl py-5 px-6 focus:outline-none text-text placeholder:text-muted/50 transition-all font-medium text-lg border border-white/5 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:bg-primary cursor-pointer btn-reactive disabled:hover:scale-100 disabled:active:scale-100 shrink-0"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
              
              {user.role === 'organizer' && (
                <div className="flex items-center gap-3 pl-2 select-none w-fit">
                  <input 
                    type="checkbox" 
                    id="announcementCheck" 
                    checked={isAnnouncement}
                    onChange={(e) => setIsAnnouncement(e.target.checked)}
                    className="w-5 h-5 rounded hover:border-primary/50 accent-primary border-white/20 bg-background/50 cursor-pointer transition-colors"
                  />
                  <label htmlFor="announcementCheck" className="text-sm font-semibold text-muted cursor-pointer flex items-center gap-2 hover:text-text transition-colors">
                    <Megaphone className="w-4 h-4" /> Broadcast as Pinned Announcement
                  </label>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
