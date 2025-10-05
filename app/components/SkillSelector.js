'use client';

import { useState, useEffect } from 'react';
import styles from './SkillSelector.module.css';
import { CheckCircleIcon } from './icons';

export default function SkillSelector({ selectedSkills = [], onSkillsChange, type = 'learning' }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/skills');
      const data = await response.json();
      setSkills(data.skills || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(skills.map(s => s.category).filter(Boolean))];

  const filteredSkills = selectedCategory === 'all' 
    ? skills 
    : skills.filter(s => s.category === selectedCategory);

  const toggleSkill = (skillId) => {
    const newSelected = selectedSkills.includes(skillId)
      ? selectedSkills.filter(id => id !== skillId)
      : [...selectedSkills, skillId];
    onSkillsChange(newSelected);
  };

  if (loading) {
    return <div className={styles.loading}>Loading skills...</div>;
  }

  return (
    <div className={styles.skillSelector}>
      <div className={styles.header}>
        <h3>
          {type === 'known' ? 'Select Your Expertise' : 'Select Skills You Want to Learn'}
        </h3>
        <span className={styles.badge}>{selectedSkills.length} selected</span>
      </div>

      <div className={styles.categories}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.active : ''}`}
          >
            {cat === 'all' ? 'All Skills' : cat}
          </button>
        ))}
      </div>

      <div className={styles.skillsGrid}>
        {filteredSkills.map(skill => (
          <button
            key={skill.id}
            onClick={() => toggleSkill(skill.id)}
            className={`${styles.skillCard} ${selectedSkills.includes(skill.id) ? styles.selected : ''}`}
          >
            <div className={styles.skillInfo}>
              <h4>{skill.name}</h4>
              {skill.description && <p>{skill.description}</p>}
              {skill.category && <span className={styles.category}>{skill.category}</span>}
            </div>
            {selectedSkills.includes(skill.id) && (
              <div className={styles.checkmark}>
                <CheckCircleIcon size={24} />
              </div>
            )}
          </button>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className={styles.empty}>No skills found in this category</div>
      )}
    </div>
  );
}