import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, MapPin, Users, Image as ImageIcon, Settings, Globe, Shield, Tag, FileText, ArrowLeft, Loader2, Save, Mail, Phone } from 'lucide-react';
import API_BASE from '../config/api';

const SectionCard = ({ icon: Icon, title, children }) => (
  <div className="glass-card mb-8 overflow-hidden rounded-2xl border-t-4 border-primary">
    <div className="px-6 py-4 bg-surface/50 border-b border-white/5 flex items-center gap-3">
      <div className="p-2 bg-primary/20 rounded-lg"><Icon className="w-5 h-5 text-primary" /></div>
      <h3 className="text-xl font-bold">{title}</h3>
    </div>
    <div className="p-6 md:p-8 space-y-6">
      {children}
    </div>
  </div>
);

export default function HostEventPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: '', description: '', category: 'technology',
    date: '', timeStart: '', timeEnd: '', isMultiDay: false, endDate: '',
    venue: '', address: '', isOnline: false, meetingLink: '',
    capacity: '', deadline: '', allowWaitlist: false,
    visibility: 'public', requireApproval: false, tags: '', enableFeedback: true,
    contactEmail: '', contactPhone: ''
  });

  // Guard
  if (!user || user.role !== 'organizer') {
    return <div className="p-20 text-center font-bold text-xl text-red-400">Unauthorized. Organizers only.</div>;
  }

  useEffect(() => {
    if (isEditMode) {
      fetch(`${API_BASE}/api/events/${id}`)
        .then(res => res.json())
        .then(data => {
            if (data.error) { throw new Error(data.error); }
            setFormData(prev => ({ ...prev, ...data }));
        })
        .catch(err => {
            alert("Could not load event data: " + err.message);
            navigate('/dashboard');
        });
    }
  }, [id, isEditMode, navigate]);

  const handleValidation = () => {
    let errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.description.trim()) errs.description = 'Description is required';
    if (!formData.date) errs.date = 'Start date is required';
    if (!formData.timeStart) errs.timeStart = 'Start time is required';
    if (!formData.isOnline && !formData.venue.trim()) errs.venue = 'Venue name is required';
    if (formData.isOnline && !formData.meetingLink.trim()) errs.meetingLink = 'Meeting link is required';
    if (!formData.capacity) errs.capacity = 'Maximum participants required';

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return Object.keys(errs).length === 0;
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setIsSubmitting(true);
    const endpoint = isEditMode ? `${API_BASE}/api/events/${id}` : '${API_BASE}/api/events';
    const method = isEditMode ? 'PUT' : 'POST';

    fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, capacity: parseInt(formData.capacity), organizerId: user.id })
    })
      .then(res => res.json())
      .then(() => {
        setIsSubmitting(false);
        alert(isEditMode ? "Event Updated Successfully!" : "Event Created Successfully!");
        navigate('/dashboard');
      })
      .catch(() => {
        setIsSubmitting(false);
        alert('Failed to publish event. Please check backend connection.');
      });
  };

  const handleDraft = () => {
    alert("Draft saved to local storage! (Mock implementation)");
  };

  const handleWithdraw = () => {
    if (window.confirm("Are you sure you want to completely withdraw and delete this event? This action cannot be reversed!")) {
       fetch(`${API_BASE}/api/events/${id}`, { method: 'DELETE' })
         .then(() => {
             alert('Event successfully withdrawn.');
             navigate('/dashboard');
         });
    }
  };

  const handleInput = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };


  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in relative z-10 w-full mb-20">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-muted hover:text-text font-medium transition-colors mb-6">
        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
      </button>

      <div className="mb-10 border-b border-white/10 pb-6">
        <h1 className="text-4xl sm:text-5xl font-black mb-3 text-text">{isEditMode ? 'Edit Existing' : 'Host a New'} <span className="text-primary">Event</span></h1>
        <p className="text-lg text-muted">{isEditMode ? 'Modify your event details carefully.' : 'Design a beautiful, structured event listing and start accepting registrations instantly.'}</p>
      </div>

      <form onSubmit={handlePublish}>
        {/* BASIC DETAILS */}
        <SectionCard icon={FileText} title="Basic Details">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Event Title *</label>
            <input type="text" value={formData.title} onChange={e => handleInput('title', e.target.value)} placeholder="e.g. AI Innovation Summit 2026" className={`w-full bg-surface/50 border ${errors.title ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-primary/50'} rounded-xl py-3 px-4 focus:ring-2 outline-none text-text transition-all`} />
            {errors.title && <p className="text-red-400 text-xs mt-2 font-bold">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Detailed Description *</label>
            <textarea rows={5} value={formData.description} onChange={e => handleInput('description', e.target.value)} placeholder="What's this event about? What will participants learn?" className={`w-full bg-surface/50 border ${errors.description ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-primary/50'} rounded-xl py-3 px-4 focus:ring-2 outline-none text-text transition-all resize-none`} />
            {errors.description && <p className="text-red-400 text-xs mt-2 font-bold">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Event Category</label>
            <select value={formData.category} onChange={e => handleInput('category', e.target.value)} className="w-full bg-surface/50 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/50 outline-none text-text transition-all">
              <option value="technology">Technology & Compute</option>
              <option value="cultural">Cultural & Arts</option>
              <option value="business">Business & Networking</option>
              <option value="sports">Athletics & Sports</option>
              <option value="workshop">Academic Workshop</option>
            </select>
          </div>
        </SectionCard>

        {/* CONTACT DETAILS */}
        <SectionCard icon={Mail} title="Contact Details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Contact Email (Optional)</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-3.5 text-muted pointer-events-none" />
                <input type="email" value={formData.contactEmail || ''} onChange={e => handleInput('contactEmail', e.target.value)} placeholder="organizer@college.edu" className="w-full bg-surface/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none text-text" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Contact Phone (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-4 top-3.5 text-muted pointer-events-none" />
                <input type="tel" value={formData.contactPhone || ''} onChange={e => handleInput('contactPhone', e.target.value)} placeholder="+1 234 567 8900" className="w-full bg-surface/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none text-text" />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* SCHEDULE */}
        <SectionCard icon={Clock} title="Schedule & Timeline">
          <div className="flex items-center gap-3 mb-4 bg-surface p-4 rounded-xl border border-white/5">
            <input type="checkbox" id="multiday" checked={formData.isMultiDay} onChange={e => handleInput('isMultiDay', e.target.checked)} className="w-5 h-5 rounded accent-primary border-white/20 bg-surface" />
            <label htmlFor="multiday" className="font-bold text-sm cursor-pointer select-none">This event spans across multiple days</label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">{formData.isMultiDay ? 'Start Date *' : 'Event Date *'}</label>
              <input type="date" value={formData.date} onChange={e => handleInput('date', e.target.value)} className={`w-full bg-surface/50 border ${errors.date ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-primary/50'} rounded-xl py-3 px-4 focus:ring-2 outline-none text-text [color-scheme:dark]`} />
              {errors.date && <p className="text-red-400 text-xs mt-2 font-bold">{errors.date}</p>}
            </div>
            {formData.isMultiDay && (
              <div className="animate-fade-in">
                <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">End Date</label>
                <input type="date" value={formData.endDate} onChange={e => handleInput('endDate', e.target.value)} className="w-full bg-surface/50 border border-white/10 focus:ring-primary/50 rounded-xl py-3 px-4 focus:ring-2 outline-none text-text [color-scheme:dark]" />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Start Time *</label>
              <input type="time" value={formData.timeStart} onChange={e => handleInput('timeStart', e.target.value)} className={`w-full bg-surface/50 border ${errors.timeStart ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/10 focus:ring-primary/50'} rounded-xl py-3 px-4 focus:ring-2 outline-none text-text [color-scheme:dark]`} />
              {errors.timeStart && <p className="text-red-400 text-xs mt-2 font-bold">{errors.timeStart}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">End Time</label>
              <input type="time" value={formData.timeEnd} onChange={e => handleInput('timeEnd', e.target.value)} className="w-full bg-surface/50 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/50 outline-none text-text [color-scheme:dark]" />
            </div>
          </div>
        </SectionCard>

        {/* LOCATION */}
        <SectionCard icon={MapPin} title="Location Details">
          <div className="flex items-center gap-3 mb-6 bg-surface p-4 rounded-xl border border-white/5">
            <input type="checkbox" id="online" checked={formData.isOnline} onChange={e => handleInput('isOnline', e.target.checked)} className="w-5 h-5 rounded accent-primary bg-surface border-white/20" />
            <label htmlFor="online" className="font-bold text-sm cursor-pointer select-none flex items-center gap-2"><Globe className="w-4 h-4 text-secondary"/> Online Virtual Event</label>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {!formData.isOnline ? (
              <div className="animate-fade-in space-y-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Venue / Hall Name *</label>
                  <input type="text" value={formData.venue} onChange={e => handleInput('venue', e.target.value)} placeholder="e.g. Campus Library Auditorium" className={`w-full bg-surface/50 border ${errors.venue ? 'border-red-500/50' : 'border-white/10'} rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/50 outline-none text-text`} />
                  {errors.venue && <p className="text-red-400 text-xs mt-2 font-bold">{errors.venue}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Full Address (Optional)</label>
                  <input type="text" value={formData.address} onChange={e => handleInput('address', e.target.value)} placeholder="Building 4, Room 101" className="w-full bg-surface/50 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/50 outline-none text-text" />
                </div>
              </div>
            ) : (
              <div className="animate-fade-in space-y-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Video Meeting Link *</label>
                  <input type="url" value={formData.meetingLink} onChange={e => handleInput('meetingLink', e.target.value)} placeholder="https://zoom.us/j/123456" className={`w-full bg-surface/50 border ${errors.meetingLink ? 'border-red-500/50' : 'border-white/10'} rounded-xl py-3 px-4 focus:ring-2 focus:ring-secondary/50 outline-none text-text`} />
                  {errors.meetingLink && <p className="text-red-400 text-xs mt-2 font-bold">{errors.meetingLink}</p>}
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* PARTICIPATION */}
        <SectionCard icon={Users} title="Participation & Capacity">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Maximum Participants *</label>
              <input type="number" min="1" value={formData.capacity} onChange={e => handleInput('capacity', e.target.value)} placeholder="100" className={`w-full bg-surface/50 border ${errors.capacity ? 'border-red-500/50' : 'border-white/10'} rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/50 outline-none text-text`} />
              {errors.capacity && <p className="text-red-400 text-xs mt-2 font-bold">{errors.capacity}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Registration Deadline</label>
              <input type="datetime-local" value={formData.deadline} onChange={e => handleInput('deadline', e.target.value)} className="w-full bg-surface/50 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary/50 outline-none text-text [color-scheme:dark]" />
            </div>
          </div>
          <div className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-white/5">
            <input type="checkbox" id="waitlist" checked={formData.allowWaitlist} onChange={e => handleInput('allowWaitlist', e.target.checked)} className="w-5 h-5 rounded accent-primary border-white/20 bg-surface" />
            <label htmlFor="waitlist" className="font-bold text-sm cursor-pointer select-none">Enable Waitlist if capacity is reached</label>
          </div>
        </SectionCard>



        {/* ADVANCED SETTINGS */}
        <SectionCard icon={Settings} title="Advanced Settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Event Visibility</label>
                <div className="flex bg-surface rounded-xl p-1 border border-white/5">
                  <button type="button" onClick={() => handleInput('visibility', 'public')} className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${formData.visibility === 'public' ? 'bg-primary text-white shadow' : 'text-muted hover:text-text'}`}><Globe className="w-4 h-4 inline mr-1.5"/> Public</button>
                  <button type="button" onClick={() => handleInput('visibility', 'private')} className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${formData.visibility === 'private' ? 'bg-secondary text-white shadow' : 'text-muted hover:text-text'}`}><Shield className="w-4 h-4 inline mr-1.5"/> Private</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider text-muted mb-2">Relevant Tags</label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-4 top-3.5 text-muted pointer-events-none" />
                  <input type="text" value={formData.tags} onChange={e => handleInput('tags', e.target.value)} placeholder="e.g. coding, networking" className="w-full bg-surface/50 border border-white/10 rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-primary/50 outline-none text-text" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-surface p-4 rounded-xl border border-white/5">
                <div>
                  <div className="font-bold text-sm">Require Registration Approval</div>
                  <div className="text-xs text-muted">Manually vet users before tickets are issued</div>
                </div>
                <input type="checkbox" checked={formData.requireApproval} onChange={e => handleInput('requireApproval', e.target.checked)} className="w-5 h-5 rounded accent-primary border-white/20 bg-surface cursor-pointer" />
              </div>
              <div className="flex items-center justify-between bg-surface p-4 rounded-xl border border-white/5">
                <div>
                  <div className="font-bold text-sm">Post-Event Feedback</div>
                  <div className="text-xs text-muted">Automatically send survey after completion</div>
                </div>
                <input type="checkbox" checked={formData.enableFeedback} onChange={e => handleInput('enableFeedback', e.target.checked)} className="w-5 h-5 rounded accent-primary border-white/20 bg-surface cursor-pointer" />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
          <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-primary text-white font-bold rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-primary/90 hover:-translate-y-1 transition-all disabled:opacity-70 disabled:hover:-translate-y-0 disabled:cursor-not-allowed flex justify-center items-center gap-2">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />} 
            {isSubmitting ? (isEditMode ? 'Saving...' : 'Publishing...') : (isEditMode ? 'Save Changes' : 'Publish Event Live')}
          </button>
          {!isEditMode && (
            <button type="button" onClick={handleDraft} className="px-8 py-4 bg-surface text-text font-bold rounded-xl border border-white/10 hover:bg-surface/80 transition-all flex items-center justify-center gap-2 hover:-translate-y-1">
              <Save className="w-5 h-5" /> Save Local Draft
            </button>
          )}
          {isEditMode && (
            <button type="button" onClick={handleWithdraw} className="px-8 py-4 bg-red-500/10 text-red-400 font-bold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 hover:-translate-y-1">
              Withdraw Event
            </button>
          )}
          <button type="button" onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-background text-red-400 font-bold rounded-xl border border-red-500/20 hover:bg-red-500/10 transition-all flex items-center justify-center">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
