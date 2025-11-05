'use client';

import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './ProgressCharts.module.css';

const COLORS = ['#667eea', '#11998e', '#f5576c', '#4facfe', '#fee140'];

export default function ProgressCharts({ weeklyHours, monthlyTasks, sessionDistribution, skillProgress }) {
  return (
    <div className={styles.container}>
      {/* Weekly Learning Hours */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}> Learning Hours Trend</h3>
        <p className={styles.chartSubtitle}>Weekly progress over the last 8 weeks</p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyHours}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="week" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="hours" 
              stroke="#667eea" 
              strokeWidth={3}
              dot={{ fill: '#667eea', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Tasks Completed */}
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Tasks Completed</h3>
        <p className={styles.chartSubtitle}>Monthly homework completion</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyTasks}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="month" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ 
                background: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}
            />
            <Bar 
              dataKey="tasks" 
              fill="#11998e"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Session Distribution Pie Chart */}
      {sessionDistribution && sessionDistribution.length > 0 && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}> Session Status</h3>
          <p className={styles.chartSubtitle}>Distribution of all sessions</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sessionDistribution}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ status, count }) => `${status}: ${count}`}
              >
                {sessionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Skill-wise Progress */}
      {skillProgress && skillProgress.length > 0 && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Skill Progress</h3>
          <p className={styles.chartSubtitle}>Task completion by skill</p>
          <div className={styles.skillProgressContainer}>
            {skillProgress.map((skill, index) => (
              <div key={index} className={styles.skillItem}>
                <div className={styles.skillHeader}>
                  <span className={styles.skillName}>{skill.skill}</span>
                  <span className={styles.skillStats}>
                    {skill.completed}/{skill.total} tasks ({skill.percentage}%)
                  </span>
                </div>
                <div className={styles.progressBarContainer}>
                  <div 
                    className={styles.progressBarFill}
                    style={{ 
                      width: `${skill.percentage}%`,
                      background: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}