import React, { useState, useMemo } from 'react';
import '../styles/booking.css';

const TOPICS = [
  { icon: '⚡', label: 'AI & ML Discussions' },
  { icon: '🚀', label: 'Startup Ideas' },
  { icon: '🔬', label: 'Research Collaborations' },
  { icon: '💬', label: 'Career Conversations' },
];

const SLOTS = ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM'];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// Simulate available days (Mon–Fri, skip some for realism)
function isAvailable(year, month, day) {
  const d = new Date(year, month, day);
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  // pseudo-random busy days based on day number
  if (day % 7 === 3 || day % 11 === 0) return false;
  return true;
}

export default function BookingPanel() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [duration, setDuration] = useState(30);
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const firstDay = useMemo(() => getFirstDayOfMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const today = now.getDate();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  function prevMonth() {
    if (isCurrentMonth) return;
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null); setSelectedSlot(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null); setSelectedSlot(null);
  }

  function handleDayClick(day) {
    const isPast = isCurrentMonth && day < today;
    if (isPast || !isAvailable(viewYear, viewMonth, day)) return;
    setSelectedDay(day);
    setSelectedSlot(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedDay || !selectedSlot || !name || !email) return;
    const subject = encodeURIComponent(`Call Request — ${MONTH_NAMES[viewMonth]} ${selectedDay}, ${viewYear} at ${selectedSlot} (${duration} min)`);
    const body = encodeURIComponent(
      `Hi Atishay,\n\nI'd like to book a ${duration}-minute call.\n\nDate: ${MONTH_NAMES[viewMonth]} ${selectedDay}, ${viewYear}\nTime: ${selectedSlot} EST\n\nName: ${name}\nEmail: ${email}\n\nLooking forward to connecting!`
    );
    window.location.href = `mailto:katishay@gmail.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  const selectedDateLabel = selectedDay
    ? `${MONTH_NAMES[viewMonth]} ${selectedDay}, ${viewYear}`
    : null;

  return (
    <div className="bp-root">
      {/* Glow orb */}
      <div className="bp-glow" aria-hidden="true" />

      {/* Header */}
      <div className="bp-header">
        <div className="bp-header-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div>
          <div className="bp-header-title">Book a Call</div>
          <div className="bp-header-sub">Find a time that works best for you</div>
        </div>
        <div className="bp-duration-toggle">
          {[30, 60].map(d => (
            <button key={d} className={`bp-dur-btn${duration === d ? ' is-active' : ''}`} onClick={() => setDuration(d)}>
              {d}m
            </button>
          ))}
        </div>
      </div>

      {/* Topics */}
      <div className="bp-topics">
        {TOPICS.map(t => (
          <div key={t.label} className="bp-topic-chip">
            <span className="bp-topic-icon">{t.icon}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </div>

      <div className="bp-body">
        {/* Calendar */}
        <div className="bp-calendar">
          <div className="bp-cal-nav">
            <button className={`bp-cal-arrow${isCurrentMonth ? ' is-disabled' : ''}`} onClick={prevMonth} aria-label="Previous month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="bp-cal-month">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button className="bp-cal-arrow" onClick={nextMonth} aria-label="Next month">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div className="bp-cal-grid">
            {DAY_NAMES.map(d => <div key={d} className="bp-cal-weekday">{d}</div>)}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isPast = isCurrentMonth && day < today;
              const avail = isAvailable(viewYear, viewMonth, day);
              const isSelected = selectedDay === day;
              const isToday = isCurrentMonth && day === today;
              return (
                <button
                  key={day}
                  className={[
                    'bp-cal-day',
                    isPast ? 'is-past' : '',
                    !avail ? 'is-unavail' : '',
                    isSelected ? 'is-selected' : '',
                    isToday ? 'is-today' : '',
                    avail && !isPast ? 'is-open' : '',
                  ].join(' ')}
                  onClick={() => handleDayClick(day)}
                  disabled={isPast || !avail}
                  aria-label={`${MONTH_NAMES[viewMonth]} ${day}`}
                  aria-pressed={isSelected}
                >
                  {day}
                  {avail && !isPast && <span className="bp-cal-dot" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <div className="bp-cal-legend">
            <span className="bp-legend-dot bp-legend-dot--open" />Available
            <span className="bp-legend-dot bp-legend-dot--busy" />Unavailable
          </div>
        </div>

        {/* Slots + form */}
        <div className="bp-right">
          {!selectedDay ? (
            <div className="bp-slot-placeholder">
              <div className="bp-slot-placeholder-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>Select a date to see available times</div>
            </div>
          ) : !selectedSlot ? (
            <>
              <div className="bp-slot-date">{selectedDateLabel}</div>
              <div className="bp-slots">
                {SLOTS.map(slot => (
                  <button key={slot} className="bp-slot" onClick={() => setSelectedSlot(slot)}>
                    <span>{slot}</span>
                    <span className="bp-slot-dur">{duration} min</span>
                    <svg className="bp-slot-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </div>
            </>
          ) : submitted ? (
            <div className="bp-confirm">
              <div className="bp-confirm-check">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="bp-confirm-title">Request sent!</div>
              <div className="bp-confirm-sub">
                {selectedDateLabel} · {selectedSlot} EST<br />
                I'll confirm within 24 hours.
              </div>
              <button className="bp-confirm-reset" onClick={() => { setSelectedDay(null); setSelectedSlot(null); setSubmitted(false); setName(''); setEmail(''); }}>
                Book another time
              </button>
            </div>
          ) : (
            <form className="bp-form" onSubmit={handleSubmit}>
              <div className="bp-form-slot-summary">
                <span className="bp-form-slot-date">{selectedDateLabel}</span>
                <span className="bp-form-slot-time">{selectedSlot} EST · {duration} min</span>
                <button type="button" className="bp-form-slot-change" onClick={() => setSelectedSlot(null)}>Change</button>
              </div>
              <div className="bp-meet-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                Google Meet · link sent on confirmation
              </div>
              <input
                className="bp-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
              />
              <input
                className="bp-input"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <button className="bp-submit" type="submit" disabled={!name || !email}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                Confirm booking
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer meta */}
      <div className="bp-footer">
        <span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Response &lt; 24h
        </span>
        <span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          New York EST
        </span>
        <span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          Weekdays available
        </span>
      </div>
    </div>
  );
}
