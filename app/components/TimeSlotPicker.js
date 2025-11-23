// app/components/TimeSlotPicker.js - SCALABLE PROPOSAL SYSTEM
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from './TimeSlotPicker.module.css';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon } from '@/app/components/icons';

export default function TimeSlotPicker({ connection, onTimeSlotSelect }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [calendar, setCalendar] = useState([]);

  // Generate calendar days for current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // Add padding days from previous month
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, disabled: true });
    }
    
    // Get today's date at midnight for proper comparison
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      
      days.push({
        date,
        disabled: date < today,
        isToday: date.getTime() === today.getTime()
      });
    }
    
    setCalendar(days);
  }, [currentDate]);

  // Generate flexible time slots (24/7 availability)
  const generateTimeSlots = () => {
    const slots = [];
    
    // Generate slots for entire day (00:00 - 23:30)
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Convert to 12-hour format for display
        let displayHour = hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        
        if (hour === 0) displayHour = 12;
        else if (hour > 12) displayHour = hour - 12;
        
        const time12 = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
        
        slots.push({
          value: time24,
          label: time12
        });
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDate(null);
    setSelectedTime('');
    setCustomTime('');
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDate(null);
    setSelectedTime('');
    setCustomTime('');
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedTime('');
    setCustomTime('');
  };

  const handleTimeSelect = (timeValue) => {
    setSelectedTime(timeValue);
    setCustomTime('');
  };

  const handleCustomTimeChange = (e) => {
    const time = e.target.value;
    setCustomTime(time);
    setSelectedTime(time);
  };

  const handleProposeTime = () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    const timeToUse = customTime || selectedTime;
    
    if (!timeToUse) {
      toast.error('Please select or enter a time');
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(timeToUse)) {
      toast.error('Invalid time format. Use HH:MM (e.g., 14:30)');
      return;
    }

    onTimeSlotSelect(selectedDate, timeToUse);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={styles.container}>
      {/* Calendar Section */}
      <div className={styles.calendarSection}>
        {/* Month Navigation */}
        <div className={styles.monthNav}>
          <button 
            className={styles.navBtn} 
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeftIcon size={20} />
          </button>
          <h3 className={styles.monthTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button 
            className={styles.navBtn} 
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRightIcon size={20} />
          </button>
        </div>

        {/* Day Headers */}
        <div className={styles.dayHeaders}>
          {dayNames.map(day => (
            <div key={day} className={styles.dayHeader}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className={styles.calendarGrid}>
          {calendar.map((day, index) => (
            <button
              key={index}
              className={`
                ${styles.dayCell} 
                ${!day.date ? styles.empty : ''} 
                ${day.disabled ? styles.disabled : ''}
                ${day.isToday ? styles.today : ''}
                ${selectedDate && day.date?.toDateString() === selectedDate.toDateString() ? styles.selected : ''}
              `}
              onClick={() => !day.disabled && handleDateSelect(day.date)}
              disabled={!day.date || day.disabled}
            >
              {day.date ? day.date.getDate() : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Time Selection Section */}
      <div className={styles.slotsSection}>
        <div className={styles.slotsHeader}>
          <ClockIcon size={20} />
          <h4>
            {selectedDate 
              ? `Propose Time - ${selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}`
              : 'Select a date'}
          </h4>
        </div>

        {!selectedDate ? (
          <div className={styles.emptyState}>
            <p>Select a date to propose a meeting time</p>
          </div>
        ) : (
          <>
            <div className={styles.timeSelectContainer}>
              {/* Popular Time Slots */}
              <div className={styles.popularSlots}>
                <p className={styles.sectionLabel}>Popular Times</p>
                <div className={styles.slotsGrid}>
                  {timeSlots.filter(slot => {
                    const hour = parseInt(slot.value.split(':')[0]);
                    return hour >= 9 && hour < 17; // Show 9 AM - 5 PM as suggestions
                  }).map((slot) => (
                    <button
                      key={slot.value}
                      className={`${styles.slotBtn} ${selectedTime === slot.value ? styles.slotSelected : ''}`}
                      onClick={() => handleTimeSelect(slot.value)}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Time Input */}
              <div className={styles.customTimeSection}>
                <p className={styles.sectionLabel}>Or enter a custom time (24-hour format)</p>
                <div className={styles.customTimeInput}>
                  <input
                    type="time"
                    value={customTime}
                    onChange={handleCustomTimeChange}
                    className={styles.timeInput}
                    placeholder="HH:MM"
                  />
                  {/* ✅ FIXED: Escaped apostrophe */}
                  <span className={styles.timeHint}>Any time works! Mentor will confirm.</span>
                </div>
              </div>

              {/* Propose Button */}
              <button 
                className={styles.proposeBtn}
                onClick={handleProposeTime}
                disabled={!selectedTime && !customTime}
              >
                Propose This Time
              </button>

              <p className={styles.proposalNote}>
                 <strong>Flexible scheduling:</strong> Propose any time that works for you. 
                Your mentor will review and confirm if they&apos;re available.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}