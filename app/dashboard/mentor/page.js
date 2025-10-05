'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { 
  SearchIcon, UserIcon, CheckCircleIcon,
  XCircleIcon, MessageIcon, EditIcon, LogOutIcon, SaveIcon
} from '../../components/icons';

export default function MentorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
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

      const [userRes, studentsRes, connectionsRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch('/api/users?role=STUDENT'),
        fetch(`/api/connections?userId=${userId}`)
      ]);

      if (!userRes.ok) {
        throw new Error('Failed to load user data');
      }

      const userData = await userRes.json();
      const studentsData = await studentsRes.json();
      const connectionsData = await connectionsRes.json();

      console.log('User data:', userData);
      console.log('Students data:', studentsData);
      console.log('Connections data:', connectionsData);

      setUser(userData.user);
      setStudents(studentsData.users || []);
      setConnections(connectionsData.connections || []);
      setEditFormData({
        name: userData.user?.name || '',
        bio: userData.user?.bio || ''
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionAction = async (connectionId, status) => {
    try {
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        await loadDashboardData();
        alert(`Connection ${status.toLowerCase()}!`);
      } else {
        alert('Failed to update connection');
      }
    } catch (error) {
      console.error('Error updating connection:', error);
      alert('Failed to update connection. Please try again.');
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

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.skillsLearning?.some(skill => 
      skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const pendingRequests = connections.filter(c => c.status === 'PENDING');
  const activeConnections = connections.filter(c => c.status === 'ACCEPTED');

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
        <div className={styles.profile}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0)?.toUpperCase() || 'M'}
          </div>
          <h2>{user?.name}</h2>
          <p className={styles.role}>Mentor</p>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{activeConnections.length}</span>
            <span className={styles.statLabel}>Active Students</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{pendingRequests.length}</span>
            <span className={styles.statLabel}>Pending Requests</span>
          </div>
        </div>

        <div className={styles.skills}>
          <div className={styles.skillsHeader}>
            <h3>My Expertise</h3>
          </div>
          <div className={styles.skillsList}>
            {user?.skillsKnown && user.skillsKnown.length > 0 ? (
              user.skillsKnown.map(skill => (
                <span key={skill.id} className={styles.skillTag}>
                  {skill.name}
                </span>
              ))
            ) : (
              <p className={styles.noSkills}>No skills added yet</p>
            )}
          </div>
        </div>

        <nav className={styles.nav}>
          <button 
            className={`${styles.navBtn} ${activeTab === 'discover' ? styles.active : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <SearchIcon size={20} />
            Discover Students
          </button>
          <button 
            className={`${styles.navBtn} ${activeTab === 'requests' ? styles.active : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <MessageIcon size={20} />
            Requests ({pendingRequests.length})
          </button>
          <button 
            className={`${styles.navBtn} ${activeTab === 'students' ? styles.active : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <UserIcon size={20} />
            My Students ({activeConnections.length})
          </button>
          <button 
            className={`${styles.navBtn} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <UserIcon size={20} />
            Profile Settings
          </button>
        </nav>

        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOutIcon size={20} />
          Logout
        </button>
      </aside>

      <main className={styles.main}>
        {activeTab === 'discover' && (
          <>
            <div className={styles.header}>
              <div>
                <h1>Discover Students</h1>
                <p>Find students who want to learn from your expertise</p>
              </div>
            </div>

            <div className={styles.filters}>
              <div className={styles.searchBar}>
                <SearchIcon size={20} />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.grid}>
              {filteredStudents.length === 0 ? (
                <div className={styles.empty}>
                  <UserIcon size={48} />
                  <p>No students found</p>
                </div>
              ) : (
                filteredStudents.map(student => (
                  <div key={student.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div className={styles.avatar}>
                        {student.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div className={styles.cardInfo}>
                        <h3>{student.name}</h3>
                        <p>{student.email}</p>
                      </div>
                    </div>
                    {student.bio && <p className={styles.bio}>{student.bio}</p>}
                    {student.skillsLearning && student.skillsLearning.length > 0 && (
                      <div className={styles.cardSkills}>
                        <span className={styles.label}>Wants to learn:</span>
                        <div className={styles.skillsList}>
                          {student.skillsLearning.map(skill => (
                            <span key={skill.id} className={styles.skillTag}>
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'requests' && (
          <>
            <div className={styles.header}>
              <div>
                <h1>Connection Requests</h1>
                <p>Students who want to learn from you</p>
              </div>
            </div>

            <div className={styles.requestsList}>
              {pendingRequests.length === 0 ? (
                <div className={styles.empty}>
                  <MessageIcon size={48} />
                  <p>No pending requests</p>
                </div>
              ) : (
                pendingRequests.map(connection => (
                  <div key={connection.id} className={styles.requestCard}>
                    <div className={styles.requestHeader}>
                      <div className={styles.avatar}>
                        {connection.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div className={styles.requestInfo}>
                        <h3>{connection.student?.name}</h3>
                        <p>{connection.student?.email}</p>
                        <span className={styles.timestamp}>
                          Requested on {new Date(connection.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    {connection.message && (
                      <p className={styles.message}>"{connection.message}"</p>
                    )}
                    {connection.student?.skillsLearning && connection.student.skillsLearning.length > 0 && (
                      <div className={styles.cardSkills}>
                        <span className={styles.label}>Wants to learn:</span>
                        <div className={styles.skillsList}>
                          {connection.student.skillsLearning.map(skill => (
                            <span key={skill.id} className={styles.skillTag}>
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className={styles.requestActions}>
                      <button 
                        className={styles.acceptBtn}
                        onClick={() => handleConnectionAction(connection.id, 'ACCEPTED')}
                      >
                        <CheckCircleIcon size={18} />
                        Accept
                      </button>
                      <button 
                        className={styles.rejectBtn}
                        onClick={() => handleConnectionAction(connection.id, 'REJECTED')}
                      >
                        <XCircleIcon size={18} />
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'students' && (
          <>
            <div className={styles.header}>
              <div>
                <h1>My Students</h1>
                <p>Students you're currently mentoring</p>
              </div>
            </div>

            <div className={styles.grid}>
              {activeConnections.length === 0 ? (
                <div className={styles.empty}>
                  <UserIcon size={48} />
                  <p>No active students yet</p>
                </div>
              ) : (
                activeConnections.map(connection => (
                  <div key={connection.id} className={styles.card}>
                    <div className={styles.cardHeader}>
                      <div className={styles.avatar}>
                        {connection.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div className={styles.cardInfo}>
                        <h3>{connection.student?.name}</h3>
                        <p>{connection.student?.email}</p>
                      </div>
                    </div>
                    {connection.student?.bio && (
                      <p className={styles.bio}>{connection.student.bio}</p>
                    )}
                    {connection.student?.skillsLearning && connection.student.skillsLearning.length > 0 && (
                      <div className={styles.cardSkills}>
                        <span className={styles.label}>Learning:</span>
                        <div className={styles.skillsList}>
                          {connection.student.skillsLearning.map(skill => (
                            <span key={skill.id} className={styles.skillTag}>
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className={styles.connectionInfo}>
                      <span className={styles.timestamp}>
                        Connected since {new Date(connection.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'profile' && (
          <>
            <div className={styles.header}>
              <div>
                <h1>Profile Settings</h1>
              </div>
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

            <div className={styles.profileSection}>
              {!editMode ? (
                <div className={styles.profileDisplay}>
                  <div className={styles.profileAvatar}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'M'}
                  </div>
                  <h2>{user?.name}</h2>
                  <p className={styles.email}>{user?.email}</p>
                  <p className={styles.bio}>{user?.bio || 'No bio added yet'}</p>
                </div>
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
                      placeholder="Tell students about your expertise..."
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}