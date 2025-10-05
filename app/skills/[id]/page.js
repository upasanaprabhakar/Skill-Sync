'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { Logo, ArrowLeftIcon, UsersIcon, BookIcon, CheckCircleIcon } from '../../components/icons';

export default function SkillDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [skill, setSkill] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    setUserId(id);
    loadSkillDetail();
  }, [params.id]);

  const loadSkillDetail = async () => {
    try {
      // Load skill details
      const skillRes = await fetch('/api/skills');
      const skillData = await skillRes.json();
      const currentSkill = skillData.skills?.find(s => s.id === parseInt(params.id));
      setSkill(currentSkill);

      // Load mentors who teach this skill
      const mentorRes = await fetch('/api/users?role=MENTOR');
      const mentorData = await mentorRes.json();
      const mentorsWithSkill = mentorData.users?.filter(mentor =>
        mentor.skillsKnown?.some(s => s.id === parseInt(params.id))
      ) || [];
      setMentors(mentorsWithSkill);
    } catch (error) {
      console.error('Failed to load skill details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMentorship = async (mentorId) => {
    if (!userId) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId,
          studentId: parseInt(userId),
          message: `I would like to learn ${skill.name} from you!`
        })
      });

      if (response.ok) {
        alert('Mentorship request sent successfully!');
      } else {
        alert('Failed to send request. Please try again.');
      }
    } catch (error) {
      console.error('Failed to send request:', error);
      alert('An error occurred. Please try again.');
    }
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
        <p>Loading skill details...</p>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className={styles.errorContainer}>
        <h2>Skill not found</h2>
        <button onClick={() => router.push('/skills')} className={styles.backBtn}>
          Back to Skills
        </button>
      </div>
    );
  }

  return (
    <div className={styles.skillDetailPage}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/">
            <Logo width={180} height={50} />
          </Link>
          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href="/skills">Browse Skills</Link>
            <Link href="/dashboard">Dashboard</Link>
          </nav>
          {userId ? (
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button className={styles.loginBtn} onClick={() => router.push('/login')}>
              Login
            </button>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <button onClick={() => router.push('/skills')} className={styles.backButton}>
          <ArrowLeftIcon size={20} />
          Back to Skills
        </button>

        <section className={styles.skillHeader}>
          <div className={styles.skillIcon}>
            <BookIcon size={48} />
          </div>
          <div className={styles.skillInfo}>
            <span className={styles.categoryBadge}>{skill.category}</span>
            <h1>{skill.name}</h1>
            <p className={styles.description}>
              {skill.description || 'Master this skill with guidance from experienced mentors'}
            </p>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <UsersIcon size={20} />
                <span>{mentors.length} mentors available</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.mentorsSection}>
          <h2>Available Mentors</h2>
          <p className={styles.sectionSubtitle}>
            Connect with experienced mentors who can teach you {skill.name}
          </p>

          {mentors.length === 0 ? (
            <div className={styles.emptyState}>
              <UsersIcon size={64} />
              <h3>No mentors available yet</h3>
              <p>Check back later for mentors teaching this skill</p>
            </div>
          ) : (
            <div className={styles.mentorsGrid}>
              {mentors.map(mentor => (
                <div key={mentor.id} className={styles.mentorCard}>
                  <div className={styles.mentorAvatar}>
                    {mentor.name.charAt(0).toUpperCase()}
                  </div>
                  <h3>{mentor.name}</h3>
                  <p className={styles.mentorBio}>
                    {mentor.bio || 'Experienced mentor ready to help you learn'}
                  </p>

                  {mentor.skillsKnown && mentor.skillsKnown.length > 1 && (
                    <div className={styles.mentorSkills}>
                      <span className={styles.skillsLabel}>Also teaches:</span>
                      <div className={styles.skillsList}>
                        {mentor.skillsKnown
                          .filter(s => s.id !== skill.id)
                          .slice(0, 3)
                          .map(s => (
                            <span key={s.id} className={styles.skillBadge}>
                              {s.name}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}

                  <button
                    className={styles.requestBtn}
                    onClick={() => handleRequestMentorship(mentor.id)}
                  >
                    <CheckCircleIcon size={18} />
                    Request Mentorship
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className={styles.footer}>
        <p>© 2025 SkillSync. All rights reserved.</p>
      </footer>
    </div>
  );
}