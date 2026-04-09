const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store (v3 — swap for DB in production)
let notes     = [];
let reminders = [];

// ── Notes API ──────────────────────────────────────────────────────────
app.get('/api/notes', (req, res) => res.json(notes));

app.post('/api/notes', (req, res) => {
  const { title, body, subject } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const note = { id: Date.now(), title, body: body || '', subject: subject || 'General', createdAt: new Date().toISOString() };
  notes.unshift(note);
  res.status(201).json(note);
});

app.delete('/api/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Note not found' });
  notes.splice(idx, 1);
  res.json({ message: 'Note deleted' });
});

// ── Reminders API ──────────────────────────────────────────────────────
app.get('/api/reminders', (req, res) => res.json(reminders));

// Add — Set reminder
app.post('/api/reminders', (req, res) => {
  const { title, time } = req.body;
  if (!title || !time) return res.status(400).json({ error: 'Title and time are required' });
  const reminder = { id: Date.now(), title, time, fired: false, createdAt: new Date().toISOString() };
  reminders.unshift(reminder);
  scheduleNotify(reminder);
  res.status(201).json(reminder);
});

// Notify — Show alert (marks as fired)
app.patch('/api/reminders/:id/notify', (req, res) => {
  const id  = Number(req.params.id);
  const rem = reminders.find(r => r.id === id);
  if (!rem) return res.status(404).json({ error: 'Reminder not found' });
  rem.fired = true;
  res.json({ message: `Reminder "${rem.title}" notified`, reminder: rem });
});

// Delete — Remove reminder
app.delete('/api/reminders/:id', (req, res) => {
  const id  = Number(req.params.id);
  const idx = reminders.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Reminder not found' });
  clearTimeout(timers[id]);
  delete timers[id];
  reminders.splice(idx, 1);
  res.json({ message: 'Reminder deleted' });
});

// ── Scheduler ──────────────────────────────────────────────────────────
const timers = {};

function scheduleNotify(reminder) {
  const delay = new Date(reminder.time).getTime() - Date.now();
  if (delay <= 0 || reminder.fired) return;
  timers[reminder.id] = setTimeout(() => {
    const rem = reminders.find(r => r.id === reminder.id);
    if (rem) { rem.fired = true; console.log(`[NOTIFY] Reminder fired: "${rem.title}"`); }
  }, delay);
}

// Fallback — serve index.html for any unknown route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`LMS Notes App v3 running on http://localhost:${PORT}`));
