// ── State ──────────────────────────────────────────────────────────────
let notes     = JSON.parse(localStorage.getItem('lms_notes')     || '[]');
let reminders = JSON.parse(localStorage.getItem('lms_reminders') || '[]');
let timers    = {};

// ── Persist ────────────────────────────────────────────────────────────
const saveNotes     = () => localStorage.setItem('lms_notes',     JSON.stringify(notes));
const saveReminders = () => localStorage.setItem('lms_reminders', JSON.stringify(reminders));

// ── Toast ──────────────────────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── Nav ────────────────────────────────────────────────────────────────
function showSection(id, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
}

// ── Escape HTML ────────────────────────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ══════════════════════════════════════════════════════════════════════
//  NOTES
// ══════════════════════════════════════════════════════════════════════

function addNote() {
  const title   = document.getElementById('note-title').value.trim();
  const body    = document.getElementById('note-body').value.trim();
  const subject = document.getElementById('note-subject').value;

  if (!title) { showToast('⚠️ Please enter a note title.'); return; }

  notes.unshift({ id: Date.now(), title, body, subject, createdAt: new Date().toISOString() });
  saveNotes();
  renderNotes();

  document.getElementById('note-title').value = '';
  document.getElementById('note-body').value  = '';
  showToast('✅ Note added!');
}

function deleteNote(id) {
  notes = notes.filter(n => n.id !== id);
  saveNotes();
  renderNotes();
  showToast('🗑️ Note deleted.');
}

function renderNotes() {
  const list = document.getElementById('notes-list');
  if (!notes.length) {
    list.innerHTML = '<p class="empty">No notes yet. Add one above!</p>';
    return;
  }
  list.innerHTML = notes.map(n => `
    <div class="card note-card">
      <div class="card-body">
        <h4>${esc(n.title)}</h4>
        <p>${esc(n.body)}</p>
        <span class="badge badge-subject">${esc(n.subject)}</span>
        <p class="card-meta">${new Date(n.createdAt).toLocaleString()}</p>
      </div>
      <div class="card-actions">
        <button class="btn btn-danger btn-sm" onclick="deleteNote(${n.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// ══════════════════════════════════════════════════════════════════════
//  REMINDERS  —  Add · Notify (Show alert) · Delete
// ══════════════════════════════════════════════════════════════════════

function addReminder() {
  const title = document.getElementById('rem-title').value.trim();
  const time  = document.getElementById('rem-time').value;

  if (!title) { showToast('⚠️ Please enter a reminder title.'); return; }
  if (!time)  { showToast('⚠️ Please pick a date and time.');   return; }

  const fireAt = new Date(time).getTime();
  if (fireAt <= Date.now()) { showToast('⚠️ Pick a future date/time.'); return; }

  const reminder = { id: Date.now(), title, time, fired: false };
  reminders.unshift(reminder);
  saveReminders();
  scheduleNotify(reminder);
  renderReminders();

  document.getElementById('rem-title').value = '';
  document.getElementById('rem-time').value  = '';
  showToast('⏰ Reminder set!');
}

// Notify — show alert when time arrives
function scheduleNotify(reminder) {
  const delay = new Date(reminder.time).getTime() - Date.now();
  if (delay <= 0 || reminder.fired) return;

  timers[reminder.id] = setTimeout(() => {
    alert(`⏰ Reminder: ${reminder.title}`);
    notifyReminder(reminder.id);
  }, delay);
}

function notifyReminder(id) {
  const rem = reminders.find(r => r.id === id);
  if (!rem) return;
  rem.fired = true;
  saveReminders();
  renderReminders();
  showToast(`🔔 Reminder fired: ${rem.title}`);
}

function deleteReminder(id) {
  clearTimeout(timers[id]);
  delete timers[id];
  reminders = reminders.filter(r => r.id !== id);
  saveReminders();
  renderReminders();
  showToast('🗑️ Reminder removed.');
}

function renderReminders() {
  const list = document.getElementById('reminders-list');
  if (!reminders.length) {
    list.innerHTML = '<p class="empty">No reminders yet. Set one above!</p>';
    return;
  }
  list.innerHTML = reminders.map(r => `
    <div class="card reminder-card ${r.fired ? 'fired' : ''}">
      <div class="card-body">
        <h4>${esc(r.title)}</h4>
        <span class="badge badge-reminder">⏰ ${new Date(r.time).toLocaleString()}</span>
        ${r.fired ? '<span class="badge badge-fired">Notified</span>' : ''}
      </div>
      <div class="card-actions">
        ${!r.fired
          ? `<button class="btn btn-info btn-sm" onclick="notifyReminder(${r.id})">Notify</button>`
          : ''}
        <button class="btn btn-danger btn-sm" onclick="deleteReminder(${r.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

// ── Init ───────────────────────────────────────────────────────────────
(function init() {
  renderNotes();
  renderReminders();
  // Re-schedule any pending reminders from localStorage
  reminders.filter(r => !r.fired).forEach(scheduleNotify);
})();
