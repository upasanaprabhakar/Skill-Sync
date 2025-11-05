'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './page.module.css';
import ChatWindow from '../../components/ChatWindow';
import LearningSpace from '../../components/LearningSpace';
import SessionCalendar from '../../components/SessionCalendar';
import ProgressDashboard from '../../components/ProgressDashboard';
import { useSocket } from '../../context/SocketContext';
import { 
  SearchIcon, UserIcon, CheckCircleIcon, XCircleIcon, MessageIcon, 
  EditIcon, LogOutIcon, SaveIcon, FileIcon, XIcon, BookIcon, 
  PlusIcon, LayersIcon, StarIcon, CalendarIcon, TrendingUpIcon
} from '../../components/icons';

export default function MentorDashboard() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [connections, setConnections] = useState([]);
  const [skillGroups, setSkillGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', bio: '' });
  const [activeChatConnection, setActiveChatConnection] = useState(null);
  const [activeSkillGroup, setActiveSkillGroup] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [groupFormData, setGroupFormData] = useState({ skillId: '', name: '', description: '' });
  const [mentorStats, setMentorStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [selectedStudentForProgress, setSelectedStudentForProgress] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (socket && user) {
      const handleMessageNotification = (data) => {
        if (!activeChatConnection || activeChatConnection.id !== data.connectionId) {
          setUnreadCounts(prev => ({
            ...prev,
            [data.connectionId]: (prev[data.connectionId] || 0) + 1
          }));
        }
        loadConnections();
      };

      const handleConnectionUpdate = (data) => {
        loadConnections();
        loadSkillGroups();
      };

      const handleNewSessionRequest = (data) => {
        toast.success(`New session request from ${data.session.connection.student.name}`);
        loadSessions();
      };

      const handleSessionCancelled = (data) => {
        toast.info('A session has been cancelled');
        loadSessions();
      };

      const handleSessionUpdated = (data) => {
        loadSessions();
      };

      const handleSessionReminder = (data) => {
        toast.info(data.message || 'You have an upcoming session');
      };

      socket.on('message-notification', handleMessageNotification);
      socket.on('connection-update', handleConnectionUpdate);
      socket.on('new-session-request', handleNewSessionRequest);
      socket.on('session-cancelled', handleSessionCancelled);
      socket.on('session-updated', handleSessionUpdated);
      socket.on('session-reminder', handleSessionReminder);

      return () => {
        socket.off('message-notification', handleMessageNotification);
        socket.off('connection-update', handleConnectionUpdate);
        socket.off('new-session-request', handleNewSessionRequest);
        socket.off('session-cancelled', handleSessionCancelled);
        socket.off('session-updated', handleSessionUpdated);
        socket.off('session-reminder', handleSessionReminder);
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

      if (userData.user && userData.user.role !== 'MENTOR') {
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

      if (connectionsData.connections) {
        const reviews = connectionsData.connections
          .filter(conn => conn.review)
          .map(conn => conn.review);
        
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
        
        setMentorStats({
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: reviews.length
        });
      }

      await loadSkillGroups();
      await loadSessions();
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
      
      if (data.connections) {
        const reviews = data.connections
          .filter(conn => conn.review)
          .map(conn => conn.review);
        
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
        
        setMentorStats({
          averageRating: Math.round(avgRating * 10) / 10,
          totalReviews: reviews.length
        });
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadSkillGroups = async () => {
    const userId = localStorage.getItem('userId');
    try {
      const response = await fetch(`/api/skill-groups?mentorId=${userId}`);
      const data = await response.json();
      setSkillGroups(data.groups || []);
    } catch (error) {
      console.error('Error loading skill groups:', error);
    }
  };

  const loadSessions = async () => {
    const userId = localStorage.getItem('userId');
    try {
      const response = await fetch(`/api/sessions?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
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

  const handleConfirmSession = async (sessionId) => {
    const confirmPromise = fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMED' })
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to confirm session');
      }
      await loadSessions();
    });

    toast.promise(confirmPromise, {
      loading: 'Confirming session...',
      success: 'Session confirmed successfully!',
      error: (err) => err.message || 'Failed to confirm session',
    });
  };

  const handleCancelSession = async (sessionId) => {
    const cancelPromise = fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' })
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to cancel session');
      }
      await loadSessions();
    });

    toast.promise(cancelPromise, {
      loading: 'Cancelling session...',
      success: 'Session cancelled successfully',
      error: (err) => err.message || 'Failed to cancel session',
    });
  };

  const handleJoinSession = (meetingLink) => {
    if (meetingLink) {
      window.open(meetingLink, '_blank');
    } else {
      toast.error('No meeting link available');
    }
  };

  const handleCreateSkillGroup = async (e) => {
    e.preventDefault();
    
    if (!groupFormData.skillId || !groupFormData.name.trim()) {
      toast.error('Please select a skill and enter a group name');
      return;
    }

    const createPromise = fetch('/api/skill-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mentorId: user.id,
        skillId: parseInt(groupFormData.skillId),
        name: groupFormData.name.trim(),
        description: groupFormData.description.trim()
      })
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create skill group');
      }
      await loadSkillGroups();
      setShowCreateGroupModal(false);
      setGroupFormData({ skillId: '', name: '', description: '' });
    });

    toast.promise(createPromise, {
      loading: 'Creating skill group...',
      success: 'Skill group created! Students learning this skill will be automatically added.',
      error: (err) => err.message || 'Failed to create skill group',
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
    setActiveSkillGroup(null);
    setSelectedStudentForProgress(null);
    setUnreadCounts(prev => ({
      ...prev,
      [connection.id]: 0
    }));
  };

  const handleOpenLearningSpace = async (groupId) => {
    try {
      const response = await fetch(`/api/skill-groups/${groupId}`);
      if (!response.ok) throw new Error('Failed to load skill group');
      
      const data = await response.json();
      setActiveSkillGroup(data.group);
      setActiveChatConnection(null);
      setSelectedStudentForProgress(null);
    } catch (error) {
      console.error('Error loading skill group:', error);
      toast.error('Failed to load learning space');
    }
  };

  const handleViewStudentProgress = (student) => {
  console.log('📊 Opening progress for student:', student);
  setActiveTab('progress'); 
  setSelectedStudentForProgress(student);
  setActiveChatConnection(null);
  setActiveSkillGroup(null);
};
  const handleCloseChat = () => {
    setActiveChatConnection(null);
  };

  const handleCloseLearningSpace = () => {
    setActiveSkillGroup(null);
  };

  const handleCloseStudentProgress = () => {
    setSelectedStudentForProgress(null);
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

  const StarRating = ({ rating, readonly = true }) => {
    return (
      <div className={styles.starRating}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${styles.star} ${star <= rating ? styles.filled : ''}`}
          >
            <StarIcon size={16} />
          </span>
        ))}
      </div>
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
            className={`${styles.navBtn} ${activeTab === 'progress' ? styles.active : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <TrendingUpIcon size={20} />
            Student Progress
          </button>
          <button 
            className={`${styles.navBtn} ${activeTab === 'sessions' ? styles.active : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <CalendarIcon size={20} />
            My Sessions
          </button>
          <button 
            className={`${styles.navBtn} ${activeTab === 'groups' ? styles.active : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            <BookIcon size={20} />
            Skill Groups ({skillGroups.length})
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
            className={`${styles.navBtn} ${activeTab === 'reviews' ? styles.active : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <StarIcon size={20} />
            Reviews ({mentorStats.totalReviews})
          </button>
          <button 
            className={`${styles.navBtn} ${activeTab === 'discover' ? styles.active : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <SearchIcon size={20} />
            Discover Students
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
        {activeTab === 'progress' && (
          <>
            <div className={styles.header}>
              <div>
                <h1>Student Progress</h1>
                <p>Track your students' learning journey and achievements</p>
              </div>
            </div>

            {selectedStudentForProgress ? (
              <div className={styles.progressView}>
                <button 
                  className={styles.backBtn}
                  onClick={handleCloseStudentProgress}
                >
                  ← Back to Students List
                </button>
                <ProgressDashboard 
                  studentId={selectedStudentForProgress.id} 
                  studentName={selectedStudentForProgress.name}
                />
              </div>
            ) : (
              <div className={styles.grid}>
                {activeConnections.length === 0 ? (
                  <div className={styles.empty}>
                    <TrendingUpIcon size={48} />
                    <p>No students to track yet</p>
                    <p className={styles.emptySubtext}>Accept connection requests to start tracking student progress</p>
                  </div>
                ) : (
                  activeConnections.map(connection => (
                    <div key={connection.id} className={styles.studentProgressCard}>
                      <div className={styles.cardHeader}>
                        <div className={styles.avatar}>
                          {connection.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div className={styles.cardInfo}>
                          <h3>{connection.student?.name}</h3>
                          <p>{connection.student?.email}</p>
                        </div>
                      </div>
                      
                      {connection.student?.skillsLearning && connection.student.skillsLearning.length > 0 && (
                        <div className={styles.cardSkills}>
                          <span className={styles.label}>Learning:</span>
                          <div className={styles.skillsList}>
                            {connection.student.skillsLearning.slice(0, 3).map(skill => (
                              <span key={skill.id} className={styles.skillTag}>
                                {skill.name}
                              </span>
                            ))}
                            {connection.student.skillsLearning.length > 3 && (
                              <span className={styles.skillTag}>
                                +{connection.student.skillsLearning.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className={styles.progressStats}>
                        <div className={styles.statItem}>
                          <CalendarIcon size={16} />
                          <span>Connected since {new Date(connection.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric'
                          })}</span>
                        </div>
                      </div>
                      
                      <button 
                        className={styles.viewProgressBtn}
                        onClick={() => handleViewStudentProgress(connection.student)}
                      >
                        <TrendingUpIcon size={18} />
                        View Progress
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'sessions' && (
          <>
            <div className={styles.header}>
              <div>
                <h1>My Sessions</h1>
                <p>Manage your mentorship sessions</p>
              </div>
            </div>

            <SessionCalendar
              sessions={sessions}
              currentUserId={user.id}
              onCancel={handleCancelSession}
              onConfirm={handleConfirmSession}
              onJoin={handleJoinSession}
            />
          </>
        )}

        {activeTab === 'groups' && (
          <>
            <div className={styles.header}>
              <div>
                <h1>My Skill Groups</h1>
                <p>Manage learning materials shared with students</p>
              </div>
              <button 
                className={styles.primaryBtn}
                onClick={() => setShowCreateGroupModal(true)}
              >
                <PlusIcon size={20} />
                Create Skill Group
              </button>
            </div>

            <div className={styles.grid}>
              {skillGroups.length === 0 ? (
                <div className={styles.empty}>
                  <LayersIcon size={48} />
                  <p>No skill groups yet</p>
                  <p className={styles.emptySubtext}>Create skill groups to share learning materials with multiple students at once</p>
                  <button 
                    className={styles.primaryBtn}
                    onClick={() => setShowCreateGroupModal(true)}
                  >
                    Create Your First Group
                  </button>
                </div>
              ) : (
                skillGroups.map(group => (
                  <div key={group.id} className={styles.skillGroupCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.skillGroupIcon}>
                        <BookIcon size={24} />
                      </div>
                      <div className={styles.cardInfo}>
                        <h3>{group.name}</h3>
                        <p className={styles.skillBadge}>{group.skill.name}</p>
                      </div>
                    </div>
                    {group.description && (
                      <p className={styles.groupDescription}>{group.description}</p>
                    )}
                    <div className={styles.groupStats}>
                      <div className={styles.statBadge}>
                        <UserIcon size={16} />
                        <span>{group._count.connections} Students</span>
                      </div>
                      <div className={styles.statBadge}>
                        <FileIcon size={16} />
                        <span>{group._count.notes} Notes</span>
                      </div>
                    </div>
                    <button 
                      className={styles.manageBtn}
                      onClick={() => handleOpenLearningSpace(group.id)}
                    >
                      <FileIcon size={18} />
                      Manage Notes
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

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
                    )}{connection.student?.skillsLearning && connection.student.skillsLearning.length > 0 && (
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
                    {connection.review && (
                      <div className={styles.reviewIndicator}>
                        <StarIcon size={16} />
                        <span>Reviewed ({connection.review.rating}/5)</span>
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
                        className={styles.progressBtn}
                        onClick={() => handleViewStudentProgress(connection.student)}
                      >
                        <TrendingUpIcon size={18} />
                        View Progress
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'reviews' && (
          <>
            <div className={styles.header}>
              <div>
                <h1>My Reviews</h1>
                <p>Feedback from your students</p>
              </div>
            </div>

            {mentorStats.totalReviews > 0 && (
              <div className={styles.ratingOverview}>
                <div className={styles.overviewCard}>
                  <h3>Overall Rating</h3>
                  <div className={styles.bigRating}>
                    <span className={styles.ratingNumber}>{mentorStats.averageRating.toFixed(1)}</span>
                    <span className={styles.ratingMax}>/ 5.0</span>
                  </div>
                  <StarRating rating={mentorStats.averageRating} />
                  <p className={styles.reviewCount}>
                    Based on {mentorStats.totalReviews} {mentorStats.totalReviews === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </div>
            )}

            <div className={styles.reviewsList}>
              {connections.filter(conn => conn.review).length === 0 ? (
                <div className={styles.empty}>
                  <StarIcon size={48} />
                  <p>No reviews yet</p>
                  <p className={styles.emptySubtext}>Reviews from students will appear here</p>
                </div>
              ) : (
                connections
                  .filter(conn => conn.review)
                  .sort((a, b) => new Date(b.review.createdAt) - new Date(a.review.createdAt))
                  .map(connection => (
                    <div key={connection.id} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <div className={styles.avatar}>
                          {connection.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                        </div>
                        <div className={styles.reviewInfo}>
                          <h3>{connection.student?.name}</h3>
                          <StarRating rating={connection.review.rating} />
                          <span className={styles.reviewDate}>
                            {new Date(connection.review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      {connection.review.comment && (
                        <p className={styles.reviewComment}>"{connection.review.comment}"</p>
                      )}
                      {connection.skillGroup && (
                        <div className={styles.reviewContext}>
                          <span className={styles.contextLabel}>Learning:</span>
                          <span className={styles.skillTag}>{connection.skillGroup.skill.name}</span>
                        </div>
                      )}
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
                  
                  {mentorStats.totalReviews > 0 && (
                    <div className={styles.profileRating}>
                      <StarRating rating={mentorStats.averageRating} />
                      <p className={styles.ratingText}>
                        {mentorStats.averageRating.toFixed(1)} / 5.0 ({mentorStats.totalReviews} reviews)
                      </p>
                    </div>
                  )}
                  
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

      {/* Create Skill Group Modal */}
      {showCreateGroupModal && (
        <div className={styles.modal} onClick={() => setShowCreateGroupModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create Skill Group</h3>
              <button className={styles.closeBtn} onClick={() => setShowCreateGroupModal(false)}>
                <XIcon size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateSkillGroup}>
              <div className={styles.formGroup}>
                <label>Select Skill *</label>
                <select
                  value={groupFormData.skillId}
                  onChange={(e) => setGroupFormData({...groupFormData, skillId: e.target.value})}
                  className={styles.select}
                  required
                >
                  <option value="">Choose a skill...</option>
                  {user?.skillsKnown?.map(skill => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Group Name *</label>
                <input
                  type="text"
                  value={groupFormData.name}
                  onChange={(e) => setGroupFormData({...groupFormData, name: e.target.value})}
                  className={styles.input}
                  placeholder="e.g., React JS Fundamentals"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={groupFormData.description}
                  onChange={(e) => setGroupFormData({...groupFormData, description: e.target.value})}
                  className={styles.textarea}
                  rows={3}
                  placeholder="Describe what this group will cover..."
                />
              </div>
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={() => setShowCreateGroupModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  <PlusIcon size={18} />
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeChatConnection && (
        <div className={styles.chatOverlay}>
          <ChatWindow
            connection={activeChatConnection}
            currentUserId={user.id}
            onClose={handleCloseChat}
          />
        </div>
      )}

      {activeSkillGroup && (
        <div className={styles.chatOverlay}>
          <div className={styles.learningSpaceContainer}>
            <div className={styles.learningSpaceHeader}>
              <button className={styles.closeBtn} onClick={handleCloseLearningSpace}>
                <XIcon size={24} />
              </button>
            </div>
            <LearningSpace
              skillGroup={activeSkillGroup}
              currentUserId={user.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}