'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { 
  Logo, SearchIcon, UsersIcon, BookIcon, 
  SettingsIcon, LogOutIcon, BellIcon, EditIcon, SaveIcon
} from '../../components/icons';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    bio: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/login');
      return;
    }
    await loadDashboardData();
  };

  const loadDashboardData = async () => {
    const userId = localStorage.getItem('userId');
    
    try {
      setLoading(true);
      
      const [userRes, mentorsRes, connectionsRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch('/api/users?role=MENTOR'),
        fetch(`/api/connections?userId=${userId}`)
      ]);

      if (!userRes.ok) {
        throw new Error('Failed to load user data');
      }

      const userData = await userRes.json();
      const mentorsData = await mentorsRes.json();
      const connectionsData = await connectionsRes.json();

      console.log('User data:', userData);
      console.log('Mentors data:', mentorsData);
      console.log('Connections data:', connectionsData);

      setUser(userData.user);
      setMentors(mentorsData.users || []);
      setConnections(connectionsData.connections || []);
      setEditFormData({
        name: userData.user?.name || '',
        bio: userData.user?.bio || ''
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      alert('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestConnection = async (mentorId) => {
    const userId = localStorage.getItem('userId');
    
    // Check if connection already exists
    const existingConnection = connections.find(
      conn => conn.mentorId === mentorId && conn.studentId === parseInt(userId)
    );
    
    if (existingConnection) {
      alert('You have already sent a request to this mentor!');
      return;
    }

    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId,
          studentId: parseInt(userId),
          message: 'I would like to learn from you!'
        })
      });

      if (response.ok) {
        await loadDashboardData();
        alert('Connection request sent successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Failed to send request:', error);
      alert('Failed to send connection request. Please try again.');
    }
  };

  const handleUpdateProfile = async () => {
    if (!editFormData.name.trim()) {
      alert('Name cannot be empty');
      return;
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFormData.name.trim(),
          bio: editFormData.bio.trim()
        })
      });

      if (response.ok) {
        setEditMode(false);
        await loadDashboardData();
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    router.push('/');
  };

  const filteredMentors = mentors.filter(mentor => 
    mentor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.skillsKnown?.some(skill => 
      skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Logo size={160} />
        </div>
        
        <nav className={styles.sidebarNav}>
          <button 
            className={`${styles.navItem} ${activeTab === 'browse' ? styles.active : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            <SearchIcon size={20} />
            Browse Mentors
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'connections' ? styles.active : ''}`}
            onClick={() => setActiveTab('connections')}
          >
            <UsersIcon size={20} />
            My Connections
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <SettingsIcon size={20} />
            Profile Settings
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOutIcon size={20} />
            Logout
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <h1>Welcome back, {user?.name || 'Student'}!</h1>
            <p>Ready to continue your learning journey?</p>
          </div>
          <div className={styles.topBarRight}>
            <button className={styles.notificationBtn}>
              <BellIcon size={24} />
              {connections.filter(c => c.status === 'ACCEPTED').length > 0 && (
                <span className={styles.badge}>
                  {connections.filter(c => c.status === 'ACCEPTED').length}
                </span>
              )}
            </button>
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase() || 'S'}
            </div>
          </div>
        </header>

        <div className={styles.contentArea}>
          {activeTab === 'browse' && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Browse Mentors</h2>
                <input 
                  type="text" 
                  placeholder="Search by skill or name..." 
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className={styles.mentorsGrid}>
                {filteredMentors.length === 0 ? (
                  <div className={styles.emptyState}>
                    <UsersIcon size={64} />
                    <p>No mentors found</p>
                  </div>
                ) : (
                  filteredMentors.map(mentor => {
                    const hasRequested = connections.some(
                      conn => conn.mentorId === mentor.id
                    );
                    const connection = connections.find(
                      conn => conn.mentorId === mentor.id
                    );

                    return (
                      <div key={mentor.id} className={styles.mentorCard}>
                        <div className={styles.mentorAvatar}>
                          {mentor.name.charAt(0).toUpperCase()}
                        </div>
                        <h3>{mentor.name}</h3>
                        <p className={styles.mentorBio}>
                          {mentor.bio || 'Experienced mentor ready to help you learn'}
                        </p>
                        
                        {mentor.skillsKnown && mentor.skillsKnown.length > 0 && (
                          <div className={styles.skillsList}>
                            {mentor.skillsKnown.map(skill => (
                              <span key={skill.id} className={styles.skillBadge}>
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {!hasRequested ? (
                          <button 
                            className={styles.primaryBtn}
                            onClick={() => requestConnection(mentor.id)}
                          >
                            Request Mentorship
                          </button>
                        ) : (
                          <button 
                            className={styles.primaryBtn}
                            disabled
                            style={{ 
                              opacity: 0.6, 
                              cursor: 'not-allowed',
                              background: connection?.status === 'ACCEPTED' 
                                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                : connection?.status === 'REJECTED'
                                ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'
                                : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                            }}
                          >
                            {connection?.status === 'ACCEPTED' && 'Connected'}
                            {connection?.status === 'PENDING' && 'Request Pending'}
                            {connection?.status === 'REJECTED' && 'Request Declined'}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {activeTab === 'connections' && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>My Connections</h2>
              
              <div className={styles.connectionsGrid}>
                {connections.length === 0 ? (
                  <div className={styles.emptyState}>
                    <UsersIcon size={64} />
                    <p>No connections yet. Start browsing mentors!</p>
                  </div>
                ) : (
                  connections.map(conn => (
                    <div key={conn.id} className={styles.connectionCard}>
                      <div className={styles.connectionHeader}>
                        <div className={styles.mentorAvatar}>
                          {conn.mentor?.name?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div>
                          <h3>{conn.mentor?.name || 'Unknown'}</h3>
                          <span className={`${styles.statusBadge} ${styles[conn.status.toLowerCase()]}`}>
                            {conn.status}
                          </span>
                        </div>
                      </div>
                      {conn.message && <p className={styles.message}>{conn.message}</p>}
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {activeTab === 'profile' && (
            <section className={styles.section}>
              <div className={styles.profileHeader}>
                <h2>Profile Settings</h2>
                {!editMode ? (
                  <button 
                    className={styles.secondaryBtn}
                    onClick={() => setEditMode(true)}
                  >
                    <EditIcon size={18} />
                    Edit Profile
                  </button>
                ) : (
                  <div className={styles.editActions}>
                    <button 
                      className={styles.cancelBtn}
                      onClick={() => {
                        setEditMode(false);
                        setEditFormData({
                          name: user?.name || '',
                          bio: user?.bio || ''
                        });
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className={styles.saveBtn}
                      onClick={handleUpdateProfile}
                    >
                      <SaveIcon size={18} />
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.profileCard}>
                {!editMode ? (
                  <>
                    <div className={styles.profileInfo}>
                      <div className={styles.profileAvatar}>
                        {user?.name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <h3>{user?.name}</h3>
                      <p className={styles.email}>{user?.email}</p>
                      <p className={styles.bio}>{user?.bio || 'No bio added yet'}</p>
                    </div>
                    
                    <div className={styles.profileSkills}>
                      <h4>Learning Skills</h4>
                      <div className={styles.skillsList}>
                        {user?.skillsLearning?.length > 0 ? (
                          user.skillsLearning.map(skill => (
                            <span key={skill.id} className={styles.skillBadge}>
                              {skill.name}
                            </span>
                          ))
                        ) : (
                          <p className={styles.noSkills}>No skills selected yet</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.editForm}>
                    <div className={styles.formGroup}>
                      <label>Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Bio</label>
                      <textarea
                        value={editFormData.bio}
                        onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})}
                        className={styles.textarea}
                        rows={4}
                        placeholder="Tell mentors about yourself..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}