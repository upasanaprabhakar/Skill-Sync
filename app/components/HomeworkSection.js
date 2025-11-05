'use client';

import { useState } from 'react';
import { CheckCircleIcon, FileIcon, DownloadIcon } from '../components/icons';
import styles from './HomeworkSection.module.css';
import toast from 'react-hot-toast';

export default function HomeworkSection({ notes, currentUserId, isMentor, onStatusChange }) {
  const [updatingId, setUpdatingId] = useState(null);

  // Filter only homework notes
  const homeworkNotes = notes.filter(note => note.tags.includes('HOMEWORK'));

  // For students: separate into pending and completed
  // For mentors: show all homework together
  const pendingHomework = isMentor ? homeworkNotes : homeworkNotes.filter(note => !note.isCompleted);
  const completedHomework = isMentor ? [] : homeworkNotes.filter(note => note.isCompleted);

  const handleToggleComplete = async (noteId, currentStatus) => {
    setUpdatingId(noteId);
    
    try {
      const response = await fetch(`/api/notes/${noteId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isCompleted: !currentStatus,
          userId: currentUserId 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to update homework status');
      }
      
      // Call parent callback to refresh notes
      if (onStatusChange) {
        onStatusChange();
      }

      toast.success(
        !currentStatus ? 'Homework marked as complete!' : 'Homework marked as pending'
      );
    } catch (error) {
      console.error('❌ Error toggling homework:', error);
      toast.error(error.message || 'Failed to update homework status');
    } finally {
      setUpdatingId(null);
    }
  };

  if (homeworkNotes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <FileIcon size={48} />
        <p>{isMentor ? 'No homework assigned yet' : 'No homework assigned yet'}</p>
      </div>
    );
  }

  return (
    <div className={styles.homeworkSection}>
      {/* Pending Homework (or All for Mentors) */}
      {pendingHomework.length > 0 && (
        <div className={styles.homeworkGroup}>
          <div className={styles.groupHeader}>
            <h3>{isMentor ? ' All Homework' : ' Pending Homework'}</h3>
            <span className={styles.badge}>{pendingHomework.length}</span>
          </div>
          
          <div className={styles.homeworkList}>
            {pendingHomework.map(note => (
              <HomeworkCard
                key={note.id}
                note={note}
                onToggle={handleToggleComplete}
                isUpdating={updatingId === note.id}
                isMentor={isMentor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Homework - Only for Students */}
      {!isMentor && completedHomework.length > 0 && (
        <div className={styles.homeworkGroup}>
          <div className={styles.groupHeader}>
            <h3> Completed Homework</h3>
            <span className={styles.badge}>{completedHomework.length}</span>
          </div>
          
          <div className={styles.homeworkList}>
            {completedHomework.map(note => (
              <HomeworkCard
                key={note.id}
                note={note}
                onToggle={handleToggleComplete}
                isUpdating={updatingId === note.id}
                isMentor={isMentor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HomeworkCard({ note, onToggle, isUpdating, isMentor }) {
  // Only add completed class for students
  const cardClasses = isMentor 
    ? styles.homeworkCard 
    : `${styles.homeworkCard} ${note.isCompleted ? styles.completed : ''}`;

  return (
    <div className={cardClasses}>
      <div className={styles.cardHeader}>
        {!isMentor && (
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id={`homework-${note.id}`}
              checked={note.isCompleted}
              onChange={() => onToggle(note.id, note.isCompleted)}
              disabled={isUpdating}
              className={styles.checkbox}
            />
            <label htmlFor={`homework-${note.id}`} className={styles.checkmark}>
              {note.isCompleted && <CheckCircleIcon size={20} />}
            </label>
          </div>
        )}
        
        <div className={styles.cardContent}>
          <h4 className={styles.title}>{note.title}</h4>
          <p className={styles.description}>{note.content}</p>
          
          {note.fileUrl && (
            <a
              href={note.fileUrl}
              download={note.fileName}
              className={styles.fileAttachment}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <FileIcon size={18} />
              <span>{note.fileName}</span>
              <DownloadIcon size={16} />
            </a>
          )}
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.assignedBy}>
          {isMentor ? 'Assigned to students' : `Assigned by ${note.creator?.name || 'Mentor'}`}
        </span>
        <span className={styles.date}>
          {new Date(note.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      </div>

      {/* Completion badge - ONLY for students */}
      {!isMentor && note.isCompleted && note.completedAt && (
        <div className={styles.completedBadge}>
          <CheckCircleIcon size={16} />
          <span>
            Completed on {new Date(note.completedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </span>
        </div>
      )}
    </div>
  );
}