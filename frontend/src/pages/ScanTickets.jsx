import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, QrCode } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import API_BASE from '../config/api';

export default function ScanTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanStatus, setScanStatus] = useState(null); // null, { type: 'success' | 'error', message: string }

  useEffect(() => {
    fetch(`${API_BASE}/api/events`)
      .then(res => res.json())
      .then(data => {
        const ownEvents = data.filter(e => e.organizerId === user.id);
        const displayEvents = ownEvents.length > 0 ? ownEvents : data; 
        setEvents(displayEvents);
        
        if (displayEvents.length > 0) {
          setSelectedEventId(displayEvents[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [user.id]);

  const handleScan = (result) => {
    if (!result || result.length === 0) return;
    try {
      const parsedData = JSON.parse(result[0].rawValue);
      const { userId, eventId } = parsedData;

      if (!userId || !eventId) {
        setScanStatus({ type: 'error', message: 'Invalid QR Code format. Missing userId or eventId.' });
        return;
      }

      if (eventId !== selectedEventId) {
        setScanStatus({ type: 'error', message: 'Ticket is for a different event!' });
        return;
      }

      // Found a matching ticket, process check-in
      fetch(`${API_BASE}/api/events/${eventId}/attendance/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'present' })
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to update attendance');
        setScanStatus({ type: 'success', message: `Successfully checked in user ${userId.substring(0,6)}...` });
        // Clear message after 3 seconds
        setTimeout(() => setScanStatus(null), 3000);
      })
      .catch(err => {
        console.error(err);
        setScanStatus({ type: 'error', message: 'Network error or unable to check-in.' });
      });

    } catch (e) {
      setScanStatus({ type: 'error', message: 'Invalid QR Code structure. Could not parse.' });
    }
  };

  if (loading) return <div className="p-20 text-center text-lg font-bold text-muted animate-pulse">Loading events...</div>;

  return (
    <div className="py-10 animate-fade-in relative z-10 max-w-4xl w-full mx-auto">
      <button 
        onClick={() => navigate('/dashboard')}
        className="mb-6 flex flex-row items-center gap-2 text-muted hover:text-text transition-colors font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="mb-10 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <QrCode className="w-8 h-8 text-primary" />
          Scan Tickets
        </h1>
        <p className="text-muted">Use your device camera to check-in attendees.</p>
      </div>

      <div className="glass-card mb-6 p-6 flex flex-col gap-4">
        <label className="text-sm font-bold text-muted uppercase tracking-wider">Select Event</label>
        <select 
          value={selectedEventId} 
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full bg-surface border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-secondary/50 text-text font-bold outline-none"
        >
          {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-6 border-l-4 border-primary">
          <h3 className="text-xl font-bold mb-4">Scanner View</h3>
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black aspect-square relative flex flex-col justify-center">
            <Scanner onScan={handleScan} allowMultiple={true} />
            <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none">
              <span className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold text-white/80">Position QR code within frame</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="glass-card p-6 h-full flex flex-col">
            <h3 className="text-xl font-bold mb-4">Scan Result</h3>
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/5 rounded-xl min-h-[250px]">
              {!scanStatus ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-surface mb-4 flex items-center justify-center">
                    <QrCode className="w-8 h-8 text-muted" />
                  </div>
                  <p className="text-muted font-medium">Awaiting scan...</p>
                </>
              ) : scanStatus.type === 'success' ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-500/20 mb-4 flex items-center justify-center animate-pulse">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <h4 className="text-xl font-bold text-green-400 mb-2">Success</h4>
                  <p className="text-muted font-medium">{scanStatus.message}</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/20 mb-4 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-400" />
                  </div>
                  <h4 className="text-xl font-bold text-red-400 mb-2">Error</h4>
                  <p className="text-muted font-medium">{scanStatus.message}</p>
                  <button 
                    onClick={() => setScanStatus(null)}
                    className="mt-6 px-4 py-2 bg-surface hover:bg-white/5 rounded-lg font-bold text-sm transition-colors border border-white/10"
                  >
                    Clear Error
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
