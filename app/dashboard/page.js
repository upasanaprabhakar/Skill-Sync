'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { Logo, BookIcon, UsersIcon, BriefcaseIcon, TrendingUpIcon, AwardIcon, ClockIcon } from '../components/icons';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      
      if (data.user) {
        setUser(data.user);
        // Only redirect if user has completed profile with role AND skills
        if (data.user.role === 'MENTOR' && data.user.skillsKnown?.length > 0) {
          router.push('/dashboard/mentor');
        } else if (data.user.role === 'STUDENT' && data.user.skillsLearning?.length > 0) {
          router.push('/dashboard/student');
        }
        // If user has role but no skills, stay on this page to let them choose/update
      }
    } catch (error) {
      console.error('Error loading user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async (role) => {
    if (!user) return;

    // Redirect to profile page to complete setup with skills
    router.push(`/profile?role=${role}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    router.push('/');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboardPage}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/">
            <Logo width={180} height={50} />
          </Link>
          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href="/skills">Browse Skills</Link>
            <Link href="/dashboard" className={styles.active}>Dashboard</Link>
          </nav>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.welcomeSection}>
          <h1>Welcome to SkillSync, {user?.name}!</h1>
          <p className={styles.subtitle}>
            Let's get you started on your learning journey. Choose how you'd like to participate:
          </p>
        </div>

        <div className={styles.roleSelection}>
          <div 
            className={`${styles.roleCard} ${selectedRole === 'STUDENT' ? styles.selected : ''}`}
            onClick={() => setSelectedRole('STUDENT')}
          >
            <div className={styles.roleIcon}>
              <BookIcon size={48} />
            </div>
            <h2>Join as Student</h2>
            <p>Connect with expert mentors and learn new skills to advance your career</p>
            <ul className={styles.featureList}>
              <li>Browse experienced mentors</li>
              <li>Learn at your own pace</li>
              <li>Track your progress</li>
              <li>Get personalized guidance</li>
            </ul>
            {selectedRole === 'STUDENT' && (
              <button 
                className="btn btn-primary"
                onClick={() => handleRoleSelection('STUDENT')}
              >
                Continue as Student
              </button>
            )}
          </div>

          <div 
            className={`${styles.roleCard} ${selectedRole === 'MENTOR' ? styles.selected : ''}`}
            onClick={() => setSelectedRole('MENTOR')}
          >
            <div className={styles.roleIcon}>
              <BriefcaseIcon size={48} />
            </div>
            <h2>Join as Mentor</h2>
            <p>Share your expertise and help students achieve their learning goals</p>
            <ul className={styles.featureList}>
              <li>Share your knowledge</li>
              <li>Build your reputation</li>
              <li>Make an impact</li>
              <li>Flexible scheduling</li>
            </ul>
            {selectedRole === 'MENTOR' && (
              <button 
                className="btn btn-primary"
                onClick={() => handleRoleSelection('MENTOR')}
              >
                Continue as Mentor
              </button>
            )}
          </div>
        </div>

        <section className={styles.coursesSection}>
          <h2>Popular Learning Paths</h2>
          <p className={styles.sectionSubtitle}>Explore what you can learn on SkillSync</p>
          
          <div className={styles.coursesGrid}>
            <div className={styles.courseCard}>
              <div className={styles.courseIcon}>
                <TrendingUpIcon size={32} />
              </div>
              <h3>Web Development</h3>
              <p>Master frontend and backend development with React, Node.js, and more</p>
              <div className={styles.courseStats}>
                <span><UsersIcon size={16} /> 1,234 students</span>
                <span><ClockIcon size={16} /> 12 weeks</span>
              </div>
            </div>

            <div className={styles.courseCard}>
              <div className={styles.courseIcon}>
                <AwardIcon size={32} />
              </div>
              <h3>Data Science</h3>
              <p>Learn Python, machine learning, and data analysis techniques</p>
              <div className={styles.courseStats}>
                <span><UsersIcon size={16} /> 892 students</span>
                <span><ClockIcon size={16} /> 10 weeks</span>
              </div>
            </div>

            <div className={styles.courseCard}>
              <div className={styles.courseIcon}>
                <BookIcon size={32} />
              </div>
              <h3>Mobile Development</h3>
              <p>Build iOS and Android apps with React Native and Flutter</p>
              <div className={styles.courseStats}>
                <span><UsersIcon size={16} /> 756 students</span>
                <span><ClockIcon size={16} /> 8 weeks</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <h2>Not sure which path is right for you?</h2>
          <p>You can always switch between student and mentor roles later</p>
          <button 
            className="btn btn-secondary"
            onClick={() => router.push('/skills')}
          >
            Browse All Skills
          </button>
        </section>
      </main>
    </div>
  );
}