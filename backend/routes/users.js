const express = require('express');
const router = express.Router();

router.post('/signup', (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = global.db.users.find(u => u.email === email);
  if (existing) return res.status(400).json({ error: 'User already exists' });
  
  const user = { id: 'u' + Date.now(), name, email, password, role: role || 'student' };
  global.db.users.push(user);
  if (global.saveDb) global.saveDb();
  res.status(201).json({ message: 'Signup successful', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  // For mock prototype purpose, if the DB is empty (server restarted), we can auto-create the user if they try to login, or just require signup.
  // Actually let's just do strict check:
  const user = global.db.users.find(u => u.email === email && u.password === password);
  if (user) {
    if (role && user.role !== role) {
      user.role = role; // Dynamically switch mock user role for testing purposes
      if (global.saveDb) global.saveDb();
    }
    res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } else {
    res.status(401).json({ error: 'Invalid credentials. Please make sure you signed up first.' });
  }
});

router.get('/:userId/registrations', (req, res) => {
  const { userId } = req.params;
  const registeredEventIds = global.db.registrations[userId] || [];
  const registeredEvents = global.db.events.filter(e => registeredEventIds.includes(e.id));
  res.json(registeredEvents);
});

module.exports = router;
