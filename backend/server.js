const express = require('express');
const cors = require('cors');

const app = express();

// CORS: allow the Vercel frontend domain and localhost for dev
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL  // Set this to your Vercel URL on Render
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    // In production, also allow any vercel.app subdomain
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

const fs = require('fs');
const DB_FILE = './db.json';

global.db = fs.existsSync(DB_FILE) 
  ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  : { users: [], events: [], registrations: {} };

global.saveDb = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(global.db, null, 2));
};

// Health check endpoint (Render uses this to verify the service is up)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/events', require('./routes/events'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
