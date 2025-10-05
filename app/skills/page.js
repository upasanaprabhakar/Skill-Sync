'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { Logo, SearchIcon, FilterIcon, UsersIcon, BookIcon, TrendingUpIcon, ArrowRightIcon } from '../components/icons';

export default function SkillsPage() {
  const router = useRouter();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mentorCounts, setMentorCounts] = useState({});

  const categories = [
    'all',
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Design',
    'Business',
    'Marketing'
  ];

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const response = await fetch('/api/skills');
      const data = await response.json();
      setSkills(data.skills || []);
      
      // Count mentors for each skill
      const counts = {};
      for (const skill of data.skills || []) {
        const mentorRes = await fetch(`/api/users?role=MENTOR`);
        const mentorData = await mentorRes.json();
        const mentorsWithSkill = mentorData.users?.filter(mentor => 
          mentor.skillsKnown?.some(s => s.id === skill.id)
        ).length || 0;
        counts[skill.id] = mentorsWithSkill;
      }
      setMentorCounts(counts);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFindMentors = (skillId) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/login');
      return;
    }
    router.push(`/skills/${skillId}`);
  };

  return (
    <div className={styles.skillsPage}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/">
            <Logo width={180} height={50} />
          </Link>
          <nav className={styles.nav}>
            <Link href="/">Home</Link>
            <Link href="/skills" className={styles.active}>Browse Skills</Link>
            <Link href="/dashboard">Dashboard</Link>
          </nav>
          <button className={styles.loginBtn} onClick={() => router.push('/login')}>
            Login
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1>Explore Skills & Find Expert Mentors</h1>
          <p>Browse through our comprehensive collection of skills and connect with mentors who can guide your learning journey</p>
        </section>

        <section className={styles.filterSection}>
          <div className={styles.searchContainer}>
            <SearchIcon size={20} />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.categoryFilter}>
            <FilterIcon size={20} />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.categorySelect}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className={styles.statsBar}>
          <div className={styles.statItem}>
            <BookIcon size={24} />
            <div>
              <span className={styles.statNumber}>{skills.length}</span>
              <span className={styles.statLabel}>Skills Available</span>
            </div>
          </div>
          <div className={styles.statItem}>
            <UsersIcon size={24} />
            <div>
              <span className={styles.statNumber}>{Object.values(mentorCounts).reduce((a, b) => a + b, 0)}</span>
              <span className={styles.statLabel}>Total Mentors</span>
            </div>
          </div>
          <div className={styles.statItem}>
            <TrendingUpIcon size={24} />
            <div>
              <span className={styles.statNumber}>{filteredSkills.length}</span>
              <span className={styles.statLabel}>Matching Results</span>
            </div>
          </div>
        </section>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading skills...</p>
          </div>
        ) : (
          <section className={styles.skillsGrid}>
            {filteredSkills.length === 0 ? (
              <div className={styles.emptyState}>
                <BookIcon size={64} />
                <h3>No skills found</h3>
                <p>Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              filteredSkills.map(skill => (
                <div key={skill.id} className={styles.skillCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.skillIcon}>
                      <BookIcon size={32} />
                    </div>
                    <span className={styles.categoryBadge}>{skill.category}</span>
                  </div>
                  
                  <h3>{skill.name}</h3>
                  <p className={styles.description}>
                    {skill.description || 'Learn this valuable skill from experienced mentors'}
                  </p>
                  
                  <div className={styles.cardStats}>
                    <div className={styles.stat}>
                      <UsersIcon size={18} />
                      <span>{mentorCounts[skill.id] || 0} mentors</span>
                    </div>
                  </div>
                  
                  <button 
                    className={styles.findMentorsBtn}
                    onClick={() => handleFindMentors(skill.id)}
                  >
                    Find Mentors
                    <ArrowRightIcon size={18} />
                  </button>
                </div>
              ))
            )}
          </section>
        )}
      </main>

      <footer className={styles.footer}>
        <p>© 2025 SkillSync. All rights reserved.</p>
      </footer>
    </div>
  );
}