const express = require('express');
const router = express.Router();

const initialEvents = [
  { id: 'e1', title: 'Tech Symposium 2026', category: 'technology', department: 'CS', date: '2026-05-10T10:00', location: 'Main Auditorium', description: 'Annual tech symposium featuring hackathons and seminars.', capacity: 200, registered: 0, waitlist: [], attendees: [], organizerId: 'org1' },
  { id: 'e2', title: 'Spring Cultural Fest', category: 'cultural', department: 'Arts', date: '2026-05-15T18:00', location: 'Open Grounds', description: 'Music, dance performances, and art exhibitions.', capacity: 1000, registered: 0, waitlist: [], attendees: [], organizerId: 'org1' },
  { id: 'e3', title: 'Startup Pitch 101', category: 'business', department: 'Business', date: '2026-05-20T14:00', location: 'Conference Hall A', description: 'Pitch your startup ideas to investors.', capacity: 50, registered: 0, waitlist: [], attendees: [], organizerId: 'org2' }
];

// Helper: sync the `registered` count to always match the actual attendees array length
function syncRegisteredCount(event) {
  if (!event.attendees) event.attendees = [];
  if (!event.waitlist) event.waitlist = [];
  event.registered = event.attendees.length;
}

// Helper: rebuild the registrations lookup from all events (source of truth = attendees arrays)
function rebuildRegistrations() {
  const regs = {};
  for (const event of global.db.events) {
    if (!event.attendees) continue;
    for (const a of event.attendees) {
      if (!regs[a.userId]) regs[a.userId] = [];
      if (!regs[a.userId].includes(event.id)) {
        regs[a.userId].push(event.id);
      }
    }
  }
  global.db.registrations = regs;
}

router.get('/', (req, res) => {
  if (global.db.events.length === 0) {
    global.db.events = [...initialEvents];
    if (global.saveDb) global.saveDb();
  }
  // Auto-repair: sync all registered counts on every GET to keep data consistent
  let dirty = false;
  for (const event of global.db.events) {
    const actual = (event.attendees || []).length;
    if (event.registered !== actual) {
      event.registered = actual;
      dirty = true;
    }
  }
  if (dirty) {
    rebuildRegistrations();
    if (global.saveDb) global.saveDb();
  }
  res.json(global.db.events);
});

router.post('/', (req, res) => {
  const newEvent = { id: 'e' + Date.now(), ...req.body, registered: 0, waitlist: [], attendees: [] };
  global.db.events.push(newEvent);
  if (global.saveDb) global.saveDb();
  res.status(201).json(newEvent);
});

router.get('/:id', (req, res) => {
  const event = global.db.events.find(e => e.id === req.params.id);
  if (event) {
    syncRegisteredCount(event);
    res.json(event);
  }
  else res.status(404).json({ error: 'Event not found' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const index = global.db.events.findIndex(e => e.id === id);
  if (index !== -1) {
    global.db.events[index] = { ...global.db.events[index], ...req.body };
    syncRegisteredCount(global.db.events[index]);
    if (global.saveDb) global.saveDb();
    res.json(global.db.events[index]);
  } else {
    res.status(404).json({ error: 'Event not found' });
  }
});

router.post('/:id/register', (req, res) => {
  const { id } = req.params;
  const { userId, name, email } = req.body;
  const event = global.db.events.find(e => e.id === id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (!event.attendees) event.attendees = [];
  if (!event.waitlist) event.waitlist = [];

  // Check if already registered
  if (event.attendees.find(a => a.userId === userId)) {
    return res.status(400).json({ error: 'Already registered' });
  }

  if (event.attendees.length < event.capacity) {
    // Register
    event.attendees.push({ userId, name, email, registeredAt: new Date().toISOString(), status: 'absent' });
    event.registered = event.attendees.length;

    // Update registrations lookup
    if (!global.db.registrations[userId]) global.db.registrations[userId] = [];
    if (!global.db.registrations[userId].includes(event.id)) {
      global.db.registrations[userId].push(event.id);
    }
    if (global.saveDb) global.saveDb();

    res.json({ status: 'registered', message: 'Registered successfully', event });
  } else {
    // Waitlist
    if (!event.waitlist.includes(userId)) {
      event.waitlist.push(userId);
    }
    if (global.saveDb) global.saveDb();
    res.json({ status: 'waitlist', message: 'Added to waitlist', event });
  }
});

router.delete('/:id/register/:userId', (req, res) => {
  const { id, userId } = req.params;
  const event = global.db.events.find(e => e.id === id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  if (!event.attendees) event.attendees = [];

  const attendeeIndex = event.attendees.findIndex(a => a.userId === userId);
  if (attendeeIndex > -1) {
    // Remove from attendees
    event.attendees.splice(attendeeIndex, 1);
    // Sync count from actual array length (never negative)
    event.registered = event.attendees.length;

    // Remove from registrations lookup
    if (global.db.registrations[userId]) {
      global.db.registrations[userId] = global.db.registrations[userId].filter(eId => eId !== id);
      // Clean up empty arrays
      if (global.db.registrations[userId].length === 0) {
        delete global.db.registrations[userId];
      }
    }
    if (global.saveDb) global.saveDb();
    return res.json({ message: 'Registration cancelled', event });
  }

  // Check waitlist too
  if (event.waitlist) {
    const waitlistIndex = event.waitlist.indexOf(userId);
    if (waitlistIndex > -1) {
      event.waitlist.splice(waitlistIndex, 1);
      if (global.saveDb) global.saveDb();
      return res.json({ message: 'Removed from waitlist', event });
    }
  }

  return res.status(404).json({ error: 'Registration not found' });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const event = global.db.events.find(e => e.id === id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  // Clean up registrations for all attendees of this event
  if (event.attendees) {
    for (const a of event.attendees) {
      if (global.db.registrations[a.userId]) {
        global.db.registrations[a.userId] = global.db.registrations[a.userId].filter(eId => eId !== id);
        if (global.db.registrations[a.userId].length === 0) {
          delete global.db.registrations[a.userId];
        }
      }
    }
  }

  global.db.events = global.db.events.filter(e => e.id !== id);
  if (global.saveDb) global.saveDb();
  res.json({ message: 'Event deleted successfully' });
});

router.put('/:eventId/attendance/:userId', (req, res) => {
  const { eventId, userId } = req.params;
  const { status } = req.body; // 'present' or 'absent'
  const event = global.db.events.find(e => e.id === eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  
  const attendee = event.attendees.find(a => a.userId === userId);
  if (!attendee) return res.status(404).json({ error: 'Attendee not found' });
  
  attendee.status = status;
  if (global.saveDb) global.saveDb();
  res.json({ message: 'Attendance updated', attendee });
});

module.exports = router;
