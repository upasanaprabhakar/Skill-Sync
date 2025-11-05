import styles from './StatsCard.module.css';

export default function StatsCard({ title, value, subtitle, icon, color = 'blue' }) {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.iconContainer}>
        {icon}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.value}>{value}</p>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
    </div>
  );
}