// app/components/SessionCalendar.js
'use client';

import { useState, useEffect } from 'react';
import styles from './SessionCalendar.module.css';
import SessionCard from './SessionCard';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from './icons';

export default function SessionCalendar({ sessions, currentUserId, onCancel, onConfirm, onJoin }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', 'list'
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendar, setCalendar] = useState([]);

  // Generate calendar for current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Add padding days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
        isToday: new Date(year, month, i).toDateString() === new Date().toDateString()
      });
    }
    
    // Add padding days from next month
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    setCalendar(days);
  }, [currentDate]);

  // Get sessions for a specific date
  const getSessionsForDate = (date) => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate.toDateString() === date.toDateString();
    });
  };

  // Get sessions for current view
  const getFilteredSessions = () => {
    if (view === 'list') {
      return sessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }

    if (view === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      return sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= startOfWeek && sessionDate < endOfWeek;
      }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }

    return sessions;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <CalendarIcon size={28} />
            Calendar
          </h2>
          <p className={styles.subtitle}>View and manage your sessions</p>
        </div>

        {/* View Toggle */}
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${view === 'month' ? styles.active : ''}`}
            onClick={() => setView('month')}
          >
            Month
          </button>
          <button
            className={`${styles.viewBtn} ${view === 'week' ? styles.active : ''}`}
            onClick={() => setView('week')}
          >
            Week
          </button>
          <button
            className={`${styles.viewBtn} ${view === 'list' ? styles.active : ''}`}
            onClick={() => setView('list')}
          >
            List
          </button>
        </div>
      </div>

      {view === 'month' && (
        <div className={styles.calendarView}>
          {/* Month Navigation */}
          <div className={styles.monthNav}>
            <button className={styles.navBtn} onClick={handlePrevMonth}>
              <ChevronLeftIcon size={20} />
            </button>
            <h3 className={styles.monthTitle}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button className={styles.navBtn} onClick={handleNextMonth}>
              <ChevronRightIcon size={20} />
            </button>
          </div>

          {/* Day Headers */}
          <div className={styles.dayHeaders}>
            {shortDayNames.map(day => (
              <div key={day} className={styles.dayHeader}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className={styles.calendarGrid}>
            {calendar.map((day, index) => {
              const daySessions = getSessionsForDate(day.date);
              return (
                <div
                  key={index}
                  className={`
                    ${styles.calendarDay}
                    ${!day.isCurrentMonth ? styles.otherMonth : ''}
                    ${day.isToday ? styles.today : ''}
                    ${daySessions.length > 0 ? styles.hasSession : ''}
                  `}
                  onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                >
                  <div className={styles.dayNumber}>
                    {day.date.getDate()}
                  </div>
                  {daySessions.length > 0 && (
                    <div className={styles.sessionIndicators}>
                      {daySessions.slice(0, 3).map((session, i) => (
                        <div
                          key={i}
                          className={`${styles.sessionDot} ${styles[`status${session.status}`]}`}
                          title={session.title}
                        />
                      ))}
                      {daySessions.length > 3 && (
                        <span className={styles.moreIndicator}>+{daySessions.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className={styles.weekView}>
          <div className={styles.weekNav}>
            <button className={styles.navBtn} onClick={handlePrevMonth}>
              <ChevronLeftIcon size={20} />
            </button>
            <h3 className={styles.weekTitle}>
              Week of {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <button className={styles.navBtn} onClick={handleNextMonth}>
              <ChevronRightIcon size={20} />
            </button>
          </div>

          {getFilteredSessions().length === 0 ? (
            <div className={styles.emptyState}>
              <p> No sessions scheduled for this week</p>
            </div>
          ) : (
            <div className={styles.sessionsList}>
              {getFilteredSessions().map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  currentUserId={currentUserId}
                  onCancel={onCancel}
                  onConfirm={onConfirm}
                  onJoin={onJoin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'list' && (
        <div className={styles.listView}>
          {sessions.length === 0 ? (
            <div className={styles.emptyState}>
              <CalendarIcon size={48} />
              <p>No sessions scheduled yet</p>
              <span>Book your first session to get started!</span>
            </div>
          ) : (
            <div className={styles.sessionsList}>
              {getFilteredSessions().map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  currentUserId={currentUserId}
                  onCancel={onCancel}
                  onConfirm={onConfirm}
                  onJoin={onJoin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Date Modal */}
      {selectedDate && (
        <div className={styles.dateModal} onClick={() => setSelectedDate(null)}>
          <div className={styles.dateModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dateModalHeader}>
              <h3>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <button className={styles.closeBtn} onClick={() => setSelectedDate(null)}>
                ×
              </button>
            </div>
            <div className={styles.dateModalBody}>
              {getSessionsForDate(selectedDate).length === 0 ? (
                <p className={styles.noSessions}>No sessions scheduled for this day</p>
              ) : (
                <div className={styles.sessionsList}>
                  {getSessionsForDate(selectedDate).map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      currentUserId={currentUserId}
                      onCancel={onCancel}
                      onConfirm={onConfirm}
                      onJoin={onJoin}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}