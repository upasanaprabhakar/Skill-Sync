'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { Logo, UserIcon, BriefcaseIcon, BookIcon } from '../components/icons';

export default function ProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    role: '',
    selectedSkills: []
  });
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [existingUser, setExistingUser] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/login');
      return;
    }
    setCurrentUserId(userId);
    fetchSkills();
    loadExistingUser(userId);
  }, []);

  const loadExistingUser = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setExistingUser(data.user);
          setFormData({
            name: data.user.name || '',
            bio: data.user.bio || '',
            role: data.user.role || '',
            selectedSkills: data.user.role === 'MENTOR' 
              ? data.user.skillsKnown?.map(s => s.id) || []
              : data.user.skillsLearning?.map(s => s.id) || []
          });
        }
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await fetch('/api/skills');
      const data = await response.json();
      setSkills(data.skills || []);
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({
      ...prev,
      role,
      selectedSkills: []
    }));
  };

  const toggleSkill = (skillId) => {
    setFormData(prev => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skillId)
        ? prev.selectedSkills.filter(id => id !== skillId)
        : [...prev.selectedSkills, skillId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }
    if (!formData.role) {
      setError('Please select your role');
      setLoading(false);
      return;
    }
    if (formData.selectedSkills.length === 0) {
      setError('Please select at least one skill');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/users/${currentUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio,
          role: formData.role,
          skillIds: formData.selectedSkills
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      if (formData.role === 'MENTOR') {
        router.push('/dashboard/mentor');
      } else {
        router.push('/dashboard/student');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.profilePage}>
      <header className={styles.header}>
        <div className="container">
          <Logo size={180} />
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className="container">
          <div className={styles.formContainer}>
            <div className={styles.progressBar}>
              <div className={styles.progressStep}>
                <div className={`${styles.stepCircle} ${styles.active}`}>1</div>
                <span>Basic Info</span>
              </div>
              <div className={styles.progressLine}></div>
              <div className={styles.progressStep}>
                <div className={`${styles.stepCircle} ${formData.role ? styles.active : ''}`}>2</div>
                <span>Choose Role</span>
              </div>
              <div className={styles.progressLine}></div>
              <div className={styles.progressStep}>
                <div className={`${styles.stepCircle} ${formData.selectedSkills.length > 0 ? styles.active : ''}`}>3</div>
                <span>Select Skills</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formSection}>
                <h2>{existingUser ? 'Update Your Profile' : 'Complete Your Profile'}</h2>
                <p className={styles.subtitle}>
                  {existingUser ? 'Update your information to keep your profile current' : 'Set up your profile to start connecting with the right people'}
                </p>
              </div>

              {error && (
                <div className={styles.errorMessage}>
                  {error}
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  className={styles.textarea}
                  rows={4}
                />
              </div>

              <div className={styles.formGroup}>
                <label>I want to join as *</label>
                <div className={styles.roleSelector}>
                  <button
                    type="button"
                    className={`${styles.roleCard} ${formData.role === 'STUDENT' ? styles.selected : ''}`}
                    onClick={() => handleRoleSelect('STUDENT')}
                  >
                    <div className={styles.roleIcon}>
                      <BookIcon size={32} />
                    </div>
                    <h3>Student</h3>
                    <p>I want to learn new skills</p>
                  </button>

                  <button
                    type="button"
                    className={`${styles.roleCard} ${formData.role === 'MENTOR' ? styles.selected : ''}`}
                    onClick={() => handleRoleSelect('MENTOR')}
                  >
                    <div className={styles.roleIcon}>
                      <BriefcaseIcon size={32} />
                    </div>
                    <h3>Mentor</h3>
                    <p>I want to teach and guide others</p>
                  </button>
                </div>
              </div>

              {formData.role && (
                <div className={styles.formGroup}>
                  <label>
                    {formData.role === 'MENTOR' 
                      ? 'Skills you can teach *' 
                      : 'Skills you want to learn *'}
                  </label>
                  <p className={styles.helperText}>
                    Select all that apply
                  </p>
                  <div className={styles.skillsGrid}>
                    {skills.map(skill => (
                      <button
                        key={skill.id}
                        type="button"
                        className={`${styles.skillTag} ${
                          formData.selectedSkills.includes(skill.id) ? styles.selected : ''
                        }`}
                        onClick={() => toggleSkill(skill.id)}
                      >
                        {skill.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', marginTop: '2rem' }}
              >
                {loading ? 'Saving...' : existingUser ? 'Update Profile' : 'Complete Profile'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}