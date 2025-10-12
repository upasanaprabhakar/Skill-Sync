'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './page.module.css';
import ChatWindow from '../../components/ChatWindow';
import LearningSpace from '../../components/LearningSpace';
import { useSocket } from '../../context/SocketContext';
import { 
  Logo, SearchIcon, UsersIcon, XIcon,
  SettingsIcon, LogOutIcon, EditIcon, SaveIcon, MessageIcon, FileIcon
} from '../../components/icons';

export default function StudentDashboard() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', bio: '' });
  const [activeChatConnection, setActiveChatConnection] = useState(null);
  const [activeLearningConnection, setActiveLearningConnection] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (socket && user) {
      socket.on('message-notification', (data) => {
        console.log('📬 New message notification:', data);
        
        if (!activeChatConnection || activeChatConnection.id !== data.connectionId) {
          setUnreadCounts(prev => ({
            ...prev,
            [data.connectionId]: (prev[data.connectionId] || 0) + 1
          }));
        }
        
        loadConnections();
      });

      return () => {
        socket.off('message-notification');
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

      // Verify user is actually a student
      if (userData.user && userData.user.role !== 'STUDENT') {
        console.error('User is not a student, redirecting...');
        toast.error('Access denied. Please login with correct credentials.');
        router.push('/login');
        return;
      }

      setUser(userData.user);
      setMentors(mentorsData.users || []);
      setConnections(connectionsData.connections || []);
      setEditFormData({ 
        name: userData.user?.name || '', 
        bio: userData.user?.bio || '' 
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    const userId = localStorage.getItem('userId');
    try {
      const response = await fetch(`/api/connections?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setConnections(data.connections || []);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const requestConnection = async (mentorId) => {
    const userId = localStorage.getItem('userId');
    
    // Check if connection already exists
    const existingConnection = connections.find(
      conn => conn.mentorId === mentorId
    );
    
    if (existingConnection) {
      if (existingConnection.status === 'PENDING') {
        toast.error('You already have a pending request with this mentor');
      } else if (existingConnection.status === 'ACCEPTED') {
        toast.error('You are already connected with this mentor');
      } else {
        toast.error('You have already requested this mentor');
      }
      return;
    }

    const requestPromise = fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        mentorId, 
        studentId: parseInt(userId), 
        message: 'Hi! I would like to learn from you.' 
      })
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send request');
      }
      await loadDashboardData();
    });

    toast.promise(requestPromise, {
      loading: 'Sending connection request...',
      success: 'Connection request sent successfully!',
      error: (err) => err.message || 'Failed to send request',
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

  const handleCloseChat = () => setActiveChatConnection(null);

  const handleCloseLearningSpace = () => setActiveLearningConnection(null);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    toast.success('Logged out successfully');
    router.push('/');
  };

  const filteredMentors = mentors.filter(mentor => 
    mentor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.skillsKnown?.some(skill => 
      skill.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  
  const MentorConnectButton = ({ mentor }) => {
    const connection = connections.find(conn => conn.mentorId === mentor.id);
    
    if (!connection) {
      return (
        <button 
          className={styles.primaryBtn} 
          onClick={() => requestConnection(mentor.id)}
        >
          Request Mentorship
        </button>
      );
    }
    
    let text = 'Pending';
    let buttonClass = styles.pendingBtn;
    
    if (connection.status === 'ACCEPTED') {
      text = 'Connected ✓';
      buttonClass = styles.acceptedBtn;
    } else if (connection.status === 'REJECTED') {
      text = 'Declined';
      buttonClass = styles.rejectedBtn;
    }
    
    return (
      <button 
        className={`${styles.primaryBtn} ${buttonClass}`} 
        disabled
      >
        {text}
      </button>
    );
  };

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
          <Logo width={140} height={49} />
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
            {connections.filter(c => c.status === 'ACCEPTED').length > 0 && (
              <span className={styles.badge}>
                {connections.filter(c => c.status === 'ACCEPTED').length}
              </span>
            )}
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
            <h1>Welcome, {user?.name || 'Student'}!</h1>
            <p>
              <span className={isConnected ? styles.statusOnline : styles.statusOffline}>
                {isConnected ? '● Online' : '○ Offline'}
              </span>
            </p>
          </div>
          <div className={styles.topBarRight}>
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
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
                  placeholder="Search by name, bio, or skill..." 
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
                    {searchTerm && (
                      <button 
                        className={styles.clearBtn}
                        onClick={() => setSearchTerm('')}
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                ) : (
                  filteredMentors.map(mentor => (
                    <div key={mentor.id} className={styles.mentorCard}>
                      <div className={styles.mentorAvatar}>
                        {mentor.name?.charAt(0)?.toUpperCase() || 'M'}
                      </div>
                      <h3>{mentor.name}</h3>
                      <p className={styles.mentorBio}>
                        {mentor.bio || 'Experienced mentor ready to help you learn.'}
                      </p>
                      {mentor.skillsKnown?.length > 0 && (
                        <div className={styles.skillsList}>
                          {mentor.skillsKnown.slice(0, 3).map(skill => (
                            <span key={skill.id} className={styles.skillBadge}>
                              {skill.name}
                            </span>
                          ))}
                          {mentor.skillsKnown.length > 3 && (
                            <span className={styles.skillBadge}>
                              +{mentor.skillsKnown.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      <MentorConnectButton mentor={mentor} />
                    </div>
                  ))
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
                    <p>No connections yet</p>
                    <button 
                      className={styles.primaryBtn}
                      onClick={() => setActiveTab('browse')}
                    >
                      Browse Mentors
                    </button>
                  </div>
                ) : (
                  connections.map(conn => (
                    <div key={conn.id} className={styles.connectionCard}>
                      <div className={styles.connectionHeader}>
                        <div className={styles.mentorAvatar}>
                          {conn.mentor?.name?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                        <div>
                          <h3>{conn.mentor?.name}</h3>
                          <span className={`${styles.statusBadge} ${styles[conn.status.toLowerCase()]}`}>
                            {conn.status}
                          </span>
                        </div>
                      </div>
                      
                      {conn.mentor?.skillsKnown && conn.mentor.skillsKnown.length > 0 && (
                        <div className={styles.mentorSkills}>
                          <span className={styles.label}>Expertise:</span>
                          <div className={styles.skillsList}>
                            {conn.mentor.skillsKnown.slice(0, 3).map(skill => (
                              <span key={skill.id} className={styles.skillBadge}>
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {conn.status === 'ACCEPTED' && (
                        <div className={styles.connectionActions}>
                          <button 
                            className={styles.chatBtn} 
                            onClick={() => handleOpenChat(conn)}
                          >
                            <MessageIcon size={18} /> 
                            Chat
                            {unreadCounts[conn.id] > 0 && (
                              <span className={styles.unreadBadge}>
                                {unreadCounts[conn.id]}
                              </span>
                            )}
                          </button>
                          <button 
                            className={styles.notesBtn}
                            onClick={() => handleOpenLearningSpace(conn)}
                          >
                            <FileIcon size={18} />
                            Notes
                          </button>
                        </div>
                      )}
                      
                      {conn.status === 'PENDING' && (
                        <p className={styles.pendingMessage}>
                          ⏳ Waiting for mentor to accept your request
                        </p>
                      )}

                      {conn.status === 'REJECTED' && (
                        <p className={styles.rejectedMessage}>
                          ✖ This request was declined
                        </p>
                      )}

                      <div className={styles.connectionFooter}>
                        <span className={styles.timestamp}>
                          Requested on {new Date(conn.createdAt).toLocaleDateString('en-US', {
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
                        {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <h3>{user?.name}</h3>
                      <p className={styles.email}>{user?.email}</p>
                      <p className={styles.bio}>
                        {user?.bio || 'No bio added yet. Click "Edit Profile" to add one.'}
                      </p>
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
                          <p className={styles.noSkills}>
                            No skills selected. Visit your profile setup to add skills.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={styles.profileStats}>
                      <div className={styles.statBox}>
                        <span className={styles.statNumber}>
                          {connections.filter(c => c.status === 'ACCEPTED').length}
                        </span>
                        <span className={styles.statLabel}>Active Mentors</span>
                      </div>
                      <div className={styles.statBox}>
                        <span className={styles.statNumber}>
                          {connections.filter(c => c.status === 'PENDING').length}
                        </span>
                        <span className={styles.statLabel}>Pending Requests</span>
                      </div>
                    </div>
                  </>
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
                        placeholder="Tell mentors about yourself, your learning goals, and what you're looking for..."
                      />
                      <span className={styles.helperText}>
                        {editFormData.bio.length}/500 characters
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
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
        <div className={styles.learningOverlay}>
          <div className={styles.learningSpaceWrapper}>
            <button className={styles.closeOverlayBtn} onClick={handleCloseLearningSpace}>
              <XIcon size={24} />
              Close
            </button>
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