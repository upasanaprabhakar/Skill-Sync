// app/dashboard/mentor/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './page.module.css';
import ChatWindow from '../../components/ChatWindow';
import LearningSpace from '../../components/LearningSpace';
import { useSocket } from '../../context/SocketContext';
import { 
  SearchIcon, UserIcon, CheckCircleIcon,
  XCircleIcon, MessageIcon, EditIcon, LogOutIcon, SaveIcon, FileIcon, XIcon
} from '../../components/icons';

export default function MentorDashboard() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    bio: ''
  });
  const [activeChatConnection, setActiveChatConnection] = useState(null);
  const [activeLearningConnection, setActiveLearningConnection] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (socket && user) {
      console.log('🔌 Setting up WebSocket listeners for mentor:', user.id);
      
      const handleMessageNotification = (data) => {
        console.log('📬 New message notification:', data);
        
        if (!activeChatConnection || activeChatConnection.id !== data.connectionId) {
          setUnreadCounts(prev => ({
            ...prev,
            [data.connectionId]: (prev[data.connectionId] || 0) + 1
          }));
        }
        
        loadConnections();
      };

      const handleConnectionUpdate = (data) => {
        console.log('🔄 Connection update:', data);
        loadConnections();
      };

      socket.on('message-notification', handleMessageNotification);
      socket.on('connection-update', handleConnectionUpdate);

      return () => {
        console.log('🔌 Cleaning up WebSocket listeners');
        socket.off('message-notification', handleMessageNotification);
        socket.off('connection-update', handleConnectionUpdate);
      };
    }
  }, [socket, user, activeChatConnection]);

  const checkAuth = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('Please login to continue');
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

      // Verify user is actually a mentor
      if (userData.user && userData.user.role !== 'MENTOR') {
        console.error('User is not a mentor, redirecting...');
        toast.error('Access denied. Please login with correct credentials.');
        router.push('/login');
        return;
      }

      setUser(userData.user);
      setStudents(studentsData.users || []);
      setConnections(connectionsData.connections || []);
      setEditFormData({
        name: userData.user?.name || '',
        bio: userData.user?.bio || ''
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    const userId = localStorage.getItem('userId');
    try {
      const response = await fetch(`/api/connections?userId=${userId}`);
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const handleConnectionAction = async (connectionId, status) => {
    const actionPromise = fetch(`/api/connections/${connectionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update connection');
      }
      await loadDashboardData();
    });

    toast.promise(actionPromise, {
      loading: `${status === 'ACCEPTED' ? 'Accepting' : 'Declining'} request...`,
      success: `Connection ${status.toLowerCase()} successfully!`,
      error: (err) => err.message || 'Failed to update connection',
    });
  };

  const handleUpdateProfile = async () => {
    if (!editFormData.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    const updatePromise = fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editFormData.name.trim(),
        bio: editFormData.bio.trim()
      })
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      setEditMode(false);
      await loadDashboardData();
    });

    toast.promise(updatePromise, {
      loading: 'Updating profile...',
      success: 'Profile updated successfully!',
      error: (err) => err.message || 'Failed to update profile',
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    toast.success('Logged out successfully');
    router.push('/');
  };

  const handleOpenChat = (connection) => {
    setActiveChatConnection(connection);
    setActiveLearningConnection(null);
    setUnreadCounts(prev => ({
      ...prev,
      [connection.id]: 0
    }));
  };

  const handleOpenLearningSpace = (connection) => {
    setActiveLearningConnection(connection);
    setActiveChatConnection(null);
  };

  const handleCloseChat = () => {
    setActiveChatConnection(null);
  };

  const handleCloseLearningSpace = () => {
    setActiveLearningConnection(null);
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
          {isConnected && (
            <p className={styles.connectionStatus}>
              <span className={styles.statusDot}></span>
              Online
            </p>
          )}
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
                  <p className={styles.emptySubtext}>Check back later for new connection requests</p>
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
                  <p className={styles.emptySubtext}>Accept connection requests to start mentoring</p>
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
                    <div className={styles.cardActions}>
                      <button 
                        className={styles.chatBtn}
                        onClick={() => handleOpenChat(connection)}
                      >
                        <MessageIcon size={18} />
                        Chat
                        {unreadCounts[connection.id] > 0 && (
                          <span className={styles.unreadBadge}>
                            {unreadCounts[connection.id]}
                          </span>
                        )}
                      </button>
                      <button 
                        className={styles.notesBtn}
                        onClick={() => handleOpenLearningSpace(connection)}
                      >
                        <FileIcon size={18} />
                        Notes
                      </button>
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
                  <p className={styles.bio}>{user?.bio || 'No bio added yet. Click "Edit Profile" to add one.'}</p>
                  <div className={styles.profileSkills}>
                    <h3>My Expertise:</h3>
                    <div className={styles.skillsList}>
                      {user?.skillsKnown && user.skillsKnown.length > 0 ? (
                        user.skillsKnown.map(skill => (
                          <span key={skill.id} className={styles.skillTag}>
                            {skill.name}
                          </span>
                        ))
                      ) : (
                        <p className={styles.noSkills}>No skills added yet. Visit your profile setup to add skills.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.editForm}>
                  <div className={styles.formGroup}>
                    <label>Name *</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className={styles.input}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Bio</label>
                    <textarea
                      value={editFormData.bio}
                      onChange={(e) => setEditFormData({...editFormData, bio: e.target.value})}
                      className={styles.textarea}
                      rows={4}
                      placeholder="Tell students about your expertise and teaching style..."
                      maxLength={500}
                    />
                    <span className={styles.helperText}>
                      {editFormData.bio.length}/500 characters
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {activeChatConnection && (
        <div className={styles.chatOverlay}>
          <ChatWindow
            connection={activeChatConnection}
            currentUserId={user.id}
            onClose={handleCloseChat}
          />
        </div>
      )}

      {activeLearningConnection && (
        <div className={styles.chatOverlay}>
          <div className={styles.learningSpaceContainer}>
            <div className={styles.learningSpaceHeader}>
              <button className={styles.closeBtn} onClick={handleCloseLearningSpace}>
                <XIcon size={24} />
              </button>
            </div>
            <LearningSpace
              connection={activeLearningConnection}
              currentUserId={user.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}