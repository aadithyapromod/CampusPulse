const express = require('express');
const router = express.Router();

router.get('/:eventId', (req, res) => {
  const { eventId } = req.params;
  const msgs = global.db.messages ? global.db.messages.filter(m => m.eventId === eventId) : [];
  res.json(msgs);
});

router.post('/:eventId', (req, res) => {
  const { eventId } = req.params;
  if (!global.db.messages) global.db.messages = [];
  const newMsg = {
    id: 'm' + Date.now(),
    eventId,
    text: req.body.text,
    senderId: req.body.senderId || 'user',
    senderName: req.body.senderName || 'Anonymous',
    senderRole: req.body.senderRole || 'student',
    isAnnouncement: req.body.isAnnouncement || false,
    timestamp: new Date().toISOString()
  };
  global.db.messages.push(newMsg);
  if (global.saveDb) global.saveDb();
  res.status(201).json(newMsg);
});

router.post('/summary', (req, res) => {
  const { eventIds } = req.body;
  if (!eventIds || !Array.isArray(eventIds)) return res.json({});
  
  const summary = {};
  const msgs = global.db.messages || [];
  
  eventIds.forEach(id => {
    summary[id] = { latestTimestamp: null, total: 0 };
  });

  msgs.forEach(m => {
    if (summary[m.eventId]) {
      summary[m.eventId].total++;
      if (!summary[m.eventId].latestTimestamp || new Date(m.timestamp) > new Date(summary[m.eventId].latestTimestamp)) {
        summary[m.eventId].latestTimestamp = m.timestamp;
      }
    }
  });

  res.json(summary);
});

module.exports = router;
