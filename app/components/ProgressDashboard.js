'use client';

import { useState, useEffect } from 'react';
import StatsCard from './StatsCard';
import ProgressCharts from './ProgressCharts';
import TasksList from './TasksList';
import { ClockIcon, CheckCircleIcon, XCircleIcon, FileIcon, TargetIcon } from '../components/icons';
import styles from './ProgressDashboard.module.css';

export default function ProgressDashboard({ studentId }) {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProgressData();
  }, [period, studentId]);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, chartsRes, tasksRes] = await Promise.all([
        fetch(`/api/progress/stats?studentId=${studentId || ''}&period=${period}`),
        fetch(`/api/progress/charts?studentId=${studentId || ''}`),
        fetchTasks()
      ]);

      if (!statsRes.ok || !chartsRes.ok) {
        throw new Error('Failed to fetch progress data');
      }

      const [statsData, chartsData, tasksData] = await Promise.all([
        statsRes.json(),
        chartsRes.json(),
        tasksRes
      ]);

      setStats(statsData);
      setCharts(chartsData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    // Fetch homework tasks from notes
    const response = await fetch(`/api/notes?studentId=${studentId || ''}&tag=HOMEWORK`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  };

  const handleToggleComplete = (taskId, newStatus) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, isCompleted: newStatus, completedAt: newStatus ? new Date() : null }
          : task
      )
    );
    
    // Refresh stats to update counts
    fetchProgressData();
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <span className={styles.errorIcon}>⚠️</span>
        <h3>Unable to load progress</h3>
        <p>{error}</p>
        <button className={styles.retryBtn} onClick={fetchProgressData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header with period selector */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.mainTitle}>My Progress</h1>
          <p className={styles.subtitle}>Track your learning journey and achievements</p>
        </div>
        <div className={styles.periodSelector}>
          <button
            className={`${styles.periodBtn} ${period === 'all' ? styles.active : ''}`}
            onClick={() => setPeriod('all')}
          >
            All Time
          </button>
          <button
            className={`${styles.periodBtn} ${period === 'month' ? styles.active : ''}`}
            onClick={() => setPeriod('month')}
          >
            This Month
          </button>
          <button
            className={`${styles.periodBtn} ${period === 'week' ? styles.active : ''}`}
            onClick={() => setPeriod('week')}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {stats && (
        <div className={styles.statsGrid}>
          <StatsCard
            title="Total Learning Hours"
            value={stats.totalHours}
            subtitle="Hours of learning"
            icon={<ClockIcon size={32} />}
            color="blue"
          />
          <StatsCard
            title="Sessions Attended"
            value={stats.sessionsAttended}
            subtitle="Completed sessions"
            icon={<CheckCircleIcon size={32} />}
            color="green"
          />
          <StatsCard
            title="Sessions Missed"
            value={stats.sessionsMissed}
            subtitle="Missed sessions"
            icon={<XCircleIcon size={32} />}
            color="orange"
          />
          <StatsCard
            title="Tasks Completed"
            value={stats.tasksCompleted}
            subtitle={`${stats.tasksPending} pending`}
            icon={<FileIcon size={32} />}
            color="purple"
          />
          <StatsCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            subtitle="Task completion"
            icon={<TargetIcon size={32} />}
            color="yellow"
          />
        </div>
      )}

      {/* Charts Section */}
      {charts && (
        <ProgressCharts
          weeklyHours={charts.weeklyHours}
          monthlyTasks={charts.monthlyTasks}
          sessionDistribution={charts.sessionDistribution}
          skillProgress={charts.skillProgress}
        />
      )}

      {/* Tasks List */}
      {tasks.length > 0 && (
        <TasksList
          tasks={tasks}
          onToggleComplete={handleToggleComplete}
        />
      )}
    </div>
  );
}