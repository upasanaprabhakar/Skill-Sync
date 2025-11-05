// app/components/SessionCard.js
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CalendarIcon, ClockIcon, VideoIcon, UserIcon, XIcon } from '@/app/components/icons';
import styles from './SessionCard.module.css';

export default function SessionCard({ session, currentUserId, onCancel, onConfirm, onJoin }) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showMeetingLinkModal, setShowMeetingLinkModal] = useState(false);
  const [meetingLink, setMeetingLink] = useState(session.meetingLink || '');
  const [savingLink, setSavingLink] = useState(false);
  const [, setTick] = useState(0);
  const [autoCompleteChecked, setAutoCompleteChecked] = useState(false);
  
  const isMentor = session.connection.mentorId === currentUserId;
  const otherUser = isMentor ? session.connection.student : session.connection.mentor;
  
  // Auto-refresh component every minute to update time-based logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1); // Force re-render
    }, 60000); // Every 1 minute
    
    return () => clearInterval(interval);
  }, []);

  // Auto-complete check: Run once when session ends
  useEffect(() => {
    const checkAndComplete = async () => {
      const now = new Date();
      const endTime = new Date(session.endTime);
      
      // Check if session has ended and status is still PENDING or CONFIRMED
      const shouldAutoComplete = endTime < now && 
                                 (session.status === 'PENDING' || session.status === 'CONFIRMED') &&
                                 !autoCompleteChecked;
      
      if (shouldAutoComplete) {
        setAutoCompleteChecked(true);
        
        try {
          const response = await fetch(`/api/sessions/${session.id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          if (response.ok) {
            console.log(`✅ Auto-completed session ${session.id}`);
            // Reload to show updated status
            setTimeout(() => window.location.reload(), 1000);
          }
        } catch (error) {
          console.error('Error auto-completing session:', error);
        }
      }
    };

    // Check on mount and every minute
    checkAndComplete();
    const interval = setInterval(checkAndComplete, 60000);
    
    return () => clearInterval(interval);
  }, [session.id, session.endTime, session.status, autoCompleteChecked]);
  
  const startTime = new Date(session.startTime);
  const endTime = new Date(session.endTime);
  const now = new Date();
  
  const canJoin = session.status === 'CONFIRMED' && 
                  session.meetingLink &&
                  now >= new Date(startTime.getTime() - 15 * 60 * 1000) && // 15 mins before
                  now <= endTime; // Can join until end time
  
  const isPending = session.status === 'PENDING';
  const isUpcoming = startTime > now && session.status === 'CONFIRMED';
  const isPast = endTime < now;
  const isHappening = now >= startTime && now <= endTime && session.status === 'CONFIRMED';

  const getStatusBadge = () => {
    const badges = {
      PENDING: { text: 'Pending', class: styles.statusPending },
      CONFIRMED: { text: isHappening ? 'Happening Now' : 'Confirmed', class: isHappening ? styles.statusHappening : styles.statusConfirmed },
      CANCELLED: { text: 'Cancelled', class: styles.statusCancelled },
      COMPLETED: { text: 'Completed', class: styles.statusCompleted },
      MISSED: { text: 'Missed', class: styles.statusMissed }
    };
    
    const badge = badges[session.status] || badges.PENDING;
    return <span className={`${styles.statusBadge} ${badge.class}`}>{badge.text}</span>;
  };

  const handleCancel = () => {
    onCancel(session.id);
    setShowCancelModal(false);
  };

  const handleJoinMeeting = async () => {
    // Track that user joined
    try {
      const response = await fetch(`/api/sessions/${session.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId })
      });

      if (response.ok) {
        console.log('✅ Join tracked successfully');
      }
    } catch (error) {
      console.error('Error tracking join:', error);
    }
    
    // Open meeting link
    onJoin(session.meetingLink);
  };

  const handleSaveMeetingLink = async () => {
    if (!meetingLink.trim()) {
      toast.error('Please enter a meeting link');
      return;
    }

    // Basic URL validation
    try {
      new URL(meetingLink);
    } catch {
      toast.error('Please enter a valid URL (must start with http:// or https://)');
      return;
    }

    setSavingLink(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingLink: meetingLink.trim() })
      });

      if (!response.ok) {
        throw new Error('Failed to save meeting link');
      }

      // Update local session data
      session.meetingLink = meetingLink.trim();
      setShowMeetingLinkModal(false);
      toast.success('Meeting link saved successfully!');
      
      // Force refresh
      window.location.reload();
    } catch (error) {
      console.error('Error saving meeting link:', error);
      toast.error('Failed to save meeting link. Please try again.');
    } finally {
      setSavingLink(false);
    }
  };

  const handleManualComplete = async () => {
    const confirmPromise = fetch(`/api/sessions/${session.id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to mark as completed');
      }
      // Reload to show updated status
      window.location.reload();
    });

    toast.promise(confirmPromise, {
      loading: 'Updating session status...',
      success: 'Session status updated!',
      error: (err) => err.message || 'Failed to update status',
    });
  };

  const getTimeRemaining = () => {
    const diff = startTime - now;
    const minutes = Math.round(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `Starts in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Starts in ${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Starts in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'Starting soon';
  };

  return (
    <>
      <div className={`${styles.sessionCard} ${isPast && session.status !== 'COMPLETED' ? styles.pastSession : ''} ${isHappening ? styles.happeningNow : ''}`}>
        <div className={styles.cardHeader}>
          <div className={styles.sessionInfo}>
            <h3 className={styles.sessionTitle}>{session.title}</h3>
            {getStatusBadge()}
          </div>
          <div className={styles.sessionTime}>
            <div className={styles.timeItem}>
              <CalendarIcon size={16} />
              <span>{startTime.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}</span>
            </div>
            <div className={styles.timeItem}>
              <ClockIcon size={16} />
              <span>
                {startTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
                {' - '}
                {endTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            </div>
          </div>
        </div>

        {session.description && (
          <p className={styles.description}>{session.description}</p>
        )}

        <div className={styles.participant}>
          <UserIcon size={18} />
          <span>with <strong>{otherUser.name}</strong></span>
        </div>

        {session.meetingLink && (
          <div className={styles.meetingLink}>
            <VideoIcon size={18} />
            <a 
              href={session.meetingLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.link}
            >
              Meeting Link
            </a>
          </div>
        )}

        {/* Show time remaining for upcoming confirmed sessions */}
        {isUpcoming && session.status === 'CONFIRMED' && (
          <div className={styles.timeRemaining}>
             {getTimeRemaining()}
          </div>
        )}

        {/* Show warning if session is happening but no meeting link */}
        {isHappening && !session.meetingLink && isMentor && (
          <div className={styles.warningBox}>
            <p> Add meeting link to allow student to join</p>
            <button 
              className={styles.addLinkBtn}
              onClick={() => setShowMeetingLinkModal(true)}
            >
              Add Meeting Link
            </button>
          </div>
        )}

        {/* Show add meeting link button for confirmed sessions without link */}
        {session.status === 'CONFIRMED' && !session.meetingLink && isMentor && !isHappening && (
          <div className={styles.linkInfoBox}>
            <p>No meeting link added yet</p>
            <button 
              className={styles.addLinkBtn}
              onClick={() => setShowMeetingLinkModal(true)}
            >
              Add Meeting Link
            </button>
          </div>
        )}

        <div className={styles.actions}>
          {canJoin && (
            <button 
              className={styles.joinBtn}
              onClick={handleJoinMeeting}
            >
              <VideoIcon size={18} />
              {isHappening ? 'Join Now' : 'Join Meeting'}
            </button>
          )}

          {isPending && isMentor && (
            <>
              <button 
                className={styles.confirmBtn}
                onClick={() => onConfirm(session.id)}
              >
                Confirm
              </button>
              <button 
                className={styles.cancelBtn}
                onClick={() => setShowCancelModal(true)}
              >
                Decline
              </button>
            </>
          )}

          {(isPending || isUpcoming) && !isPast && session.status !== 'CANCELLED' && (
            <button 
              className={styles.cancelBtn}
              onClick={() => setShowCancelModal(true)}
            >
              Cancel Session
            </button>
          )}

          {/* Show meeting link missing warning for happening sessions */}
          {isHappening && !session.meetingLink && !isMentor && (
            <div className={styles.infoBox}>
              ℹ️ Waiting for mentor to add meeting link
            </div>
          )}
        </div>

        {/* Manual complete button for ended sessions - OUTSIDE actions div for visibility */}
        {isPast && (session.status === 'PENDING' || session.status === 'CONFIRMED') && (
          <div className={styles.updateStatusSection}>
            <p className={styles.updateStatusText}>
               This session has ended but status needs to be updated
            </p>
            <button 
              className={styles.updateStatusBtn}
              onClick={handleManualComplete}
            >
              Update Status Now
            </button>
          </div>
        )}
      </div>

      {showCancelModal && (
        <div className={styles.modal} onClick={() => setShowCancelModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Cancel Session?</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowCancelModal(false)}
              >
                <XIcon size={20} />
              </button>
            </div>
            <p>Are you sure you want to cancel "{session.title}"? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button 
                className={styles.modalCancelBtn}
                onClick={() => setShowCancelModal(false)}
              >
                Keep Session
              </button>
              <button 
                className={styles.modalConfirmBtn}
                onClick={handleCancel}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Link Modal */}
      {showMeetingLinkModal && (
        <div className={styles.modal} onClick={() => setShowMeetingLinkModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Meeting Link</h3>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowMeetingLinkModal(false)}
              >
                <XIcon size={20} />
              </button>
            </div>
            <p>Enter the Zoom, Google Meet, or other video call link for this session:</p>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://zoom.us/j/123456789 or https://meet.google.com/..."
              className={styles.linkInput}
            />
            <div className={styles.modalActions}>
              <button 
                className={styles.modalCancelBtn}
                onClick={() => setShowMeetingLinkModal(false)}
                disabled={savingLink}
              >
                Cancel
              </button>
              <button 
                className={styles.modalConfirmBtn}
                onClick={handleSaveMeetingLink}
                disabled={savingLink}
              >
                {savingLink ? 'Saving...' : 'Save Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}