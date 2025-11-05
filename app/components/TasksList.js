'use client';

import { useState } from 'react';
import styles from './TasksList.module.css';

export default function TasksList({ tasks, onToggleComplete }) {
  const [filter, setFilter] = useState('all'); // all, pending, completed

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.isCompleted;
    if (filter === 'completed') return task.isCompleted;
    return true;
  });

  const handleToggle = async (taskId, currentStatus) => {
    try {
      const response = await fetch(`/api/notes/${taskId}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !currentStatus })
      });

      if (response.ok) {
        onToggleComplete(taskId, !currentStatus);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>✅ Your Tasks</h3>
        <div className={styles.filters}>
          <button 
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({tasks.length})
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({tasks.filter(t => !t.isCompleted).length})
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'completed' ? styles.active : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({tasks.filter(t => t.isCompleted).length})
          </button>
        </div>
      </div>

      <div className={styles.tasksList}>
        {filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📝</span>
            <p>No tasks found</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`${styles.taskItem} ${task.isCompleted ? styles.completed : ''}`}
            >
              <div className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={task.isCompleted}
                  onChange={() => handleToggle(task.id, task.isCompleted)}
                  id={`task-${task.id}`}
                />
                <label htmlFor={`task-${task.id}`} className={styles.checkmark}></label>
              </div>
              
              <div className={styles.taskContent}>
                <h4 className={styles.taskTitle}>{task.title}</h4>
                {task.content && (
                  <p className={styles.taskDescription}>{task.content}</p>
                )}
                <div className={styles.taskMeta}>
                  <span className={styles.skill}>{task.skillName}</span>
                  <span className={styles.date}>
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {task.isCompleted && task.completedAt && (
                <div className={styles.completedBadge}>
                  <span>✓</span>
                  <span className={styles.completedDate}>
                    {new Date(task.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}