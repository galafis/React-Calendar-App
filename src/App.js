/**
 * React Calendar Application
 * Full-featured calendar with event management, multiple views, and drag support.
 * @author Gabriel Demetrios Lafis
 */

import React, { useState, useCallback, useMemo } from 'react';

// --- Date Utility Functions ---

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

// --- Event Form Component ---

function EventForm({ date, event, onSave, onCancel, onDelete }) {
    const [title, setTitle] = useState(event ? event.title : '');
    const [description, setDescription] = useState(event ? event.description : '');
    const [startTime, setStartTime] = useState(event ? event.startTime : '09:00');
    const [endTime, setEndTime] = useState(event ? event.endTime : '10:00');
    const [color, setColor] = useState(event ? event.color : '#4CAF50');
    const [recurring, setRecurring] = useState(event ? event.recurring : 'none');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSave({
            id: event ? event.id : `evt_${Date.now()}`,
            title: title.trim(),
            description,
            date: formatDate(date),
            startTime,
            endTime,
            color,
            recurring,
            createdAt: event ? event.createdAt : new Date().toISOString()
        });
    };

    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];

    return (
        <div style={styles.modal}>
            <div style={styles.modalContent}>
                <h3 style={styles.modalTitle}>{event ? 'Edit Event' : 'New Event'}</h3>
                <form onSubmit={handleSubmit}>
                    <input style={styles.input} type="text" placeholder="Event title" value={title}
                        onChange={(e) => setTitle(e.target.value)} required />
                    <textarea style={{ ...styles.input, height: '60px', resize: 'vertical' }}
                        placeholder="Description (optional)" value={description}
                        onChange={(e) => setDescription(e.target.value)} />
                    <div style={styles.timeRow}>
                        <input style={styles.timeInput} type="time" value={startTime}
                            onChange={(e) => setStartTime(e.target.value)} />
                        <span style={{ margin: '0 8px' }}>to</span>
                        <input style={styles.timeInput} type="time" value={endTime}
                            onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                    <div style={styles.colorRow}>
                        {colors.map((c) => (
                            <div key={c} onClick={() => setColor(c)}
                                style={{ ...styles.colorDot, backgroundColor: c,
                                    border: color === c ? '3px solid #333' : '2px solid transparent' }} />
                        ))}
                    </div>
                    <select style={styles.input} value={recurring}
                        onChange={(e) => setRecurring(e.target.value)}>
                        <option value="none">No repeat</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                    <div style={styles.buttonRow}>
                        <button type="submit" style={styles.btnPrimary}>Save</button>
                        <button type="button" onClick={onCancel} style={styles.btnSecondary}>Cancel</button>
                        {event && <button type="button" onClick={() => onDelete(event.id)}
                            style={styles.btnDanger}>Delete</button>}
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Day Cell Component ---

function DayCell({ day, month, year, events, isToday, isCurrentMonth, onDayClick, onEventClick }) {
    const dayEvents = events.filter(evt => evt.date === formatDate(new Date(year, month, day)));

    return (
        <div onClick={() => onDayClick(day)}
            style={{ ...styles.dayCell,
                backgroundColor: isToday ? '#e3f2fd' : isCurrentMonth ? '#fff' : '#f5f5f5',
                opacity: isCurrentMonth ? 1 : 0.5 }}>
            <div style={{ ...styles.dayNumber, fontWeight: isToday ? 'bold' : 'normal',
                color: isToday ? '#1976D2' : '#333' }}>{day}</div>
            {dayEvents.slice(0, 3).map((evt) => (
                <div key={evt.id} onClick={(e) => { e.stopPropagation(); onEventClick(evt); }}
                    style={{ ...styles.eventTag, backgroundColor: evt.color || '#4CAF50' }}>
                    {evt.startTime} {evt.title}
                </div>
            ))}
            {dayEvents.length > 3 && (
                <div style={styles.moreEvents}>+{dayEvents.length - 3} more</div>
            )}
        </div>
    );
}

// --- Week View Component ---

function WeekView({ currentDate, events, onEventClick }) {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        return d;
    });

    return (
        <div style={styles.weekView}>
            <div style={styles.weekHeader}>
                <div style={{ width: '60px' }}></div>
                {days.map((d, i) => (
                    <div key={i} style={styles.weekDayHeader}>
                        {DAYS_OF_WEEK[d.getDay()]} {d.getDate()}
                    </div>
                ))}
            </div>
            <div style={styles.weekBody}>
                {hours.map((hour) => (
                    <div key={hour} style={styles.weekRow}>
                        <div style={styles.hourLabel}>{String(hour).padStart(2, '0')}:00</div>
                        {days.map((d, i) => {
                            const dateStr = formatDate(d);
                            const hourEvents = events.filter(e =>
                                e.date === dateStr && parseInt(e.startTime) === hour);
                            return (
                                <div key={i} style={styles.weekCell}>
                                    {hourEvents.map(evt => (
                                        <div key={evt.id} onClick={() => onEventClick(evt)}
                                            style={{ ...styles.weekEvent, backgroundColor: evt.color }}>
                                            {evt.title}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Main App Component ---

function App() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [view, setView] = useState('month');
    const [searchTerm, setSearchTerm] = useState('');

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const navigate = useCallback((direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (view === 'month') newDate.setMonth(newDate.getMonth() + direction);
            else newDate.setDate(newDate.getDate() + direction * 7);
            return newDate;
        });
    }, [view]);

    const goToToday = () => setCurrentDate(new Date());

    const handleDayClick = (day) => {
        setSelectedDate(new Date(year, month, day));
        setSelectedEvent(null);
        setShowForm(true);
    };

    const handleEventClick = (event) => {
        const [y, m, d] = event.date.split('-').map(Number);
        setSelectedDate(new Date(y, m - 1, d));
        setSelectedEvent(event);
        setShowForm(true);
    };

    const handleSave = (event) => {
        setEvents(prev => {
            const existing = prev.findIndex(e => e.id === event.id);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = event;
                return updated;
            }
            return [...prev, event];
        });
        setShowForm(false);
    };

    const handleDelete = (eventId) => {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        setShowForm(false);
    };

    const filteredEvents = useMemo(() => {
        if (!searchTerm) return events;
        const term = searchTerm.toLowerCase();
        return events.filter(e => e.title.toLowerCase().includes(term) ||
            (e.description && e.description.toLowerCase().includes(term)));
    }, [events, searchTerm]);

    // Build calendar grid
    const calendarGrid = useMemo(() => {
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const prevMonthDays = getDaysInMonth(year, month - 1);
        const grid = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            grid.push({ day: prevMonthDays - i, isCurrentMonth: false, month: month - 1 });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            grid.push({ day: i, isCurrentMonth: true, month });
        }
        const remaining = 42 - grid.length;
        for (let i = 1; i <= remaining; i++) {
            grid.push({ day: i, isCurrentMonth: false, month: month + 1 });
        }
        return grid;
    }, [year, month]);

    const today = new Date();

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Calendar</h1>
                <div style={styles.toolbar}>
                    <div style={styles.navGroup}>
                        <button onClick={() => navigate(-1)} style={styles.navBtn}>&lt;</button>
                        <button onClick={goToToday} style={styles.todayBtn}>Today</button>
                        <button onClick={() => navigate(1)} style={styles.navBtn}>&gt;</button>
                        <h2 style={styles.monthTitle}>{MONTHS[month]} {year}</h2>
                    </div>
                    <div style={styles.viewGroup}>
                        <input style={styles.searchInput} type="text" placeholder="Search events..."
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <button onClick={() => setView('month')}
                            style={view === 'month' ? styles.viewBtnActive : styles.viewBtn}>Month</button>
                        <button onClick={() => setView('week')}
                            style={view === 'week' ? styles.viewBtnActive : styles.viewBtn}>Week</button>
                    </div>
                </div>
            </header>

            {view === 'month' ? (
                <div>
                    <div style={styles.dayHeaders}>
                        {DAYS_OF_WEEK.map(d => (
                            <div key={d} style={styles.dayHeader}>{d}</div>
                        ))}
                    </div>
                    <div style={styles.calendarGrid}>
                        {calendarGrid.map((cell, idx) => (
                            <DayCell key={idx} day={cell.day} month={cell.month} year={year}
                                events={filteredEvents}
                                isToday={cell.isCurrentMonth && isSameDay(new Date(year, month, cell.day), today)}
                                isCurrentMonth={cell.isCurrentMonth}
                                onDayClick={handleDayClick} onEventClick={handleEventClick} />
                        ))}
                    </div>
                </div>
            ) : (
                <WeekView currentDate={currentDate} events={filteredEvents} onEventClick={handleEventClick} />
            )}

            {showForm && (
                <EventForm date={selectedDate} event={selectedEvent}
                    onSave={handleSave} onCancel={() => setShowForm(false)} onDelete={handleDelete} />
            )}

            <footer style={styles.footer}>
                <span>{events.length} event{events.length !== 1 ? 's' : ''} total</span>
            </footer>
        </div>
    );
}

// --- Styles ---

const styles = {
    container: { fontFamily: "'Segoe UI', Roboto, sans-serif", maxWidth: '1100px', margin: '0 auto', padding: '20px' },
    header: { marginBottom: '20px' },
    title: { fontSize: '28px', margin: '0 0 16px 0', color: '#1a1a2e' },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
    navGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
    viewGroup: { display: 'flex', alignItems: 'center', gap: '8px' },
    navBtn: { padding: '8px 14px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '16px' },
    todayBtn: { padding: '8px 16px', border: '1px solid #1976D2', borderRadius: '6px', backgroundColor: '#e3f2fd', color: '#1976D2', cursor: 'pointer', fontWeight: '500' },
    monthTitle: { fontSize: '22px', margin: '0 12px', color: '#333' },
    viewBtn: { padding: '8px 16px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer' },
    viewBtnActive: { padding: '8px 16px', border: '1px solid #1976D2', borderRadius: '6px', backgroundColor: '#1976D2', color: '#fff', cursor: 'pointer' },
    searchInput: { padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', width: '200px' },
    dayHeaders: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', marginBottom: '1px' },
    dayHeader: { padding: '10px', textAlign: 'center', fontWeight: '600', color: '#666', backgroundColor: '#f8f9fa' },
    calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', border: '1px solid #e0e0e0' },
    dayCell: { minHeight: '100px', padding: '6px', cursor: 'pointer', borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0' },
    dayNumber: { fontSize: '14px', marginBottom: '4px' },
    eventTag: { fontSize: '11px', padding: '2px 6px', borderRadius: '3px', color: '#fff', marginBottom: '2px', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    moreEvents: { fontSize: '11px', color: '#666', padding: '2px 6px' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
    modalTitle: { margin: '0 0 16px 0', fontSize: '20px', color: '#333' },
    input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' },
    timeRow: { display: 'flex', alignItems: 'center', marginBottom: '12px' },
    timeInput: { padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' },
    colorRow: { display: 'flex', gap: '8px', marginBottom: '12px' },
    colorDot: { width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer' },
    buttonRow: { display: 'flex', gap: '8px', marginTop: '8px' },
    btnPrimary: { padding: '10px 20px', backgroundColor: '#1976D2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
    btnSecondary: { padding: '10px 20px', backgroundColor: '#f5f5f5', color: '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' },
    btnDanger: { padding: '10px 20px', backgroundColor: '#e53935', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    weekView: { border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' },
    weekHeader: { display: 'flex', backgroundColor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' },
    weekDayHeader: { flex: 1, padding: '10px', textAlign: 'center', fontWeight: '600', fontSize: '13px', color: '#666' },
    weekBody: { maxHeight: '600px', overflowY: 'auto' },
    weekRow: { display: 'flex', borderBottom: '1px solid #f0f0f0', minHeight: '40px' },
    hourLabel: { width: '60px', padding: '4px 8px', fontSize: '12px', color: '#999', textAlign: 'right', borderRight: '1px solid #e0e0e0', flexShrink: 0 },
    weekCell: { flex: 1, borderRight: '1px solid #f0f0f0', padding: '2px', minHeight: '40px' },
    weekEvent: { fontSize: '11px', padding: '2px 6px', borderRadius: '3px', color: '#fff', marginBottom: '1px', cursor: 'pointer' },
    footer: { marginTop: '16px', padding: '12px', textAlign: 'center', color: '#999', fontSize: '13px' }
};

export default App;
