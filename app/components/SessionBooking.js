// app/components/SessionBooking.js
'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import styles from './SessionBooking.module.css';
import TimeSlotPicker from './TimeSlotPicker';
import { XIcon, CalendarIcon, ClockIcon, LinkIcon, FileIcon } from './icons';

export default function SessionBooking({ connection, currentUserId, onClose, onSessionBooked }) {
  const [step, setStep] = useState(1); // 1: Date/Time, 2: Details, 3: Confirm
  const [formData, setFormData] = useState({
    selectedDate: null,
    selectedTime: null,
    duration: 60, // Default 1 hour
    title: '',
    description: '',
    meetingLink: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const isMentor = connection.mentorId === currentUserId;
  const otherUser = isMentor ? connection.student : connection.mentor;

  const durationOptions = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

  const handleTimeSlotSelect = (date, time) => {
    setFormData({
      ...formData,
      selectedDate: date,
      selectedTime: time
    });
    setStep(2);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.selectedDate || !formData.selectedTime) {
      toast.error('Please select a date and time');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a session title');
      return;
    }

    setSubmitting(true);

    try {
      // Combine date and time
      const [hours, minutes] = formData.selectedTime.split(':');
      const startTime = new Date(formData.selectedDate);
      startTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Calculate end time
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + formData.duration);

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: connection.id,
          userId: currentUserId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: formData.duration,
          meetingLink: formData.meetingLink.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book session');
      }

      toast.success('Session booked successfully!');
      if (onSessionBooked) onSessionBooked(data.session);
      onClose();
    } catch (error) {
      console.error('Error booking session:', error);
      toast.error(error.message || 'Failed to book session');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2>Book a Session</h2>
            <p className={styles.subtitle}>
              with {otherUser?.name}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <XIcon size={24} />
          </button>
        </div>

        {/* Progress Steps */}
        <div className={styles.steps}>
          <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <span>Date & Time</span>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <span>Details</span>
          </div>
          <div className={styles.stepLine}></div>
          <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>
            <div className={styles.stepNumber}>3</div>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {step === 1 && (
            <div className={styles.stepContent}>
              <h3>Select Date & Time</h3>
              <p className={styles.helperText}>Choose an available time slot</p>
              
              <TimeSlotPicker
                connection={connection}
                onTimeSlotSelect={handleTimeSlotSelect}
              />
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className={styles.stepContent}>
              <h3>Session Details</h3>
              
              {/* Selected Time Display */}
              <div className={styles.selectedTime}>
                <CalendarIcon size={20} />
                <div>
                  <strong>
                    {formData.selectedDate?.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </strong>
                  <p>{formData.selectedTime}</p>
                </div>
              </div>

              {/* Duration */}
              <div className={styles.formGroup}>
                <label>
                  <ClockIcon size={18} />
                  Duration *
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  className={styles.select}
                  required
                >
                  {durationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className={styles.formGroup}>
                <label>
                  <FileIcon size={18} />
                  Session Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., React Hooks Discussion"
                  className={styles.input}
                  required
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What would you like to cover in this session?"
                  className={styles.textarea}
                  rows={4}
                  maxLength={500}
                />
                <span className={styles.charCount}>
                  {formData.description.length}/500
                </span>
              </div>

              {/* Meeting Link (Only for Mentors) */}
              {isMentor && (
                <div className={styles.formGroup}>
                  <label>
                    <LinkIcon size={18} />
                    Meeting Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.meetingLink}
                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                    placeholder="https://zoom.us/j/... or Google Meet link"
                    className={styles.input}
                  />
                  <span className={styles.helperText}>
                    You can add the meeting link now or later after confirming
                  </span>
                </div>
              )}
              
              {!isMentor && (
                <div className={styles.infoNote}>
                  <span className={styles.infoIcon}>ℹ️</span>
                  <span>The mentor will provide the meeting link after confirming your session request</span>
                </div>
              )}

              {/* Actions */}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={handleBack}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={styles.nextBtn}
                  onClick={() => setStep(3)}
                >
                  Review
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className={styles.stepContent}>
              <h3>Confirm Session</h3>
              <p className={styles.helperText}>Please review your session details</p>

              <div className={styles.confirmCard}>
                <div className={styles.confirmRow}>
                  <span className={styles.confirmLabel}>With:</span>
                  <span className={styles.confirmValue}>{otherUser?.name}</span>
                </div>

                <div className={styles.confirmRow}>
                  <span className={styles.confirmLabel}>Date:</span>
                  <span className={styles.confirmValue}>
                    {formData.selectedDate?.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className={styles.confirmRow}>
                  <span className={styles.confirmLabel}>Time:</span>
                  <span className={styles.confirmValue}>
                    {formData.selectedTime}
                  </span>
                </div>

                <div className={styles.confirmRow}>
                  <span className={styles.confirmLabel}>Duration:</span>
                  <span className={styles.confirmValue}>
                    {durationOptions.find(d => d.value === formData.duration)?.label}
                  </span>
                </div>

                <div className={styles.confirmRow}>
                  <span className={styles.confirmLabel}>Title:</span>
                  <span className={styles.confirmValue}>{formData.title}</span>
                </div>

                {formData.description && (
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmLabel}>Description:</span>
                    <span className={styles.confirmValue}>{formData.description}</span>
                  </div>
                )}

                {formData.meetingLink && (
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmLabel}>Meeting Link:</span>
                    <span className={styles.confirmValue}>
                      <a href={formData.meetingLink} target="_blank" rel="noopener noreferrer">
                        {formData.meetingLink}
                      </a>
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.infoBox}>
                <p>
                   {isMentor 
                    ? "The student will be notified of this session request."
                    : "The mentor will need to confirm this session."}
                </p>
                <p>
                   Both of you will receive reminders 1 day, 1 hour, and 15 minutes before the session.
                </p>
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.backBtn}
                  onClick={handleBack}
                  disabled={submitting}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={styles.confirmBtn}
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}