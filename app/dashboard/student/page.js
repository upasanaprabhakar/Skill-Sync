// app/dashboard/student/page.js - WITH PROGRESS TRACKING
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import styles from './page.module.css';
import ChatWindow from '../../components/ChatWindow';
import LearningSpace from '../../components/LearningSpace';
import SessionCalendar from '../../components/SessionCalendar';
import SessionBooking from '../../components/SessionBooking';
import ProgressDashboard from '../../components/ProgressDashboard';
import { useSocket } from '../../context/SocketContext';
import { 
  Logo, SearchIcon, UsersIcon, XIcon, BookIcon,
  SettingsIcon, LogOutIcon, EditIcon, SaveIcon, MessageIcon, 
  FileIcon, BellIcon, StarIcon, CalendarIcon, PlusIcon, TrendingUpIcon
} from '../../components/icons';

export default function StudentDashboard() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [user, setUser] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [connections, setConnections] = useState([]);
  const [skillGroups, setSkillGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', bio: '' });
  const [activeChatConnection, setActiveChatConnection] = useState(null);
  const [activeSkillGroup, setActiveSkillGroup] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewConnection, setReviewConnection] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({ rating: 0, comment: '' });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedConnectionForBooking, setSelectedConnectionForBooking] = useState(null);

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
        
        addNotification({
          type: 'message',
          title: 'New Message',
          message: `You have a new message from ${data.senderName || 'your mentor'}`,
          timestamp: new Date(),
          connectionId: data.connectionId
        });
        
        loadConnections();
      };

      const handleConnectionUpdate = (data) => {
        if (data.status === 'ACCEPTED') {
          addNotification({
            type: 'connection',
            title: 'Connection Accepted',
            message: `${data.mentorName || 'A mentor'} accepted your connection request!`,
            timestamp: new Date()
          });
        } else if (data.status === 'REJECTED') {
          addNotification({
            type: 'connection',
            title: 'Connection Declined',
            message: `${data.mentorName || 'A mentor'} declined your connection request`,
            timestamp: new Date()
          });
        }
        
        loadConnections();
        loadSkillGroups();
      };

      const handleNoteAdded = (data) => {
        addNotification({
          type: 'note',
          title: 'New Learning Material',
          message: `New note "${data.noteTitle}" added to ${data.groupName}`,
          timestamp: new Date(),
          groupId: data.groupId
        });
        loadSkillGroups();
      };

      const handleSessionConfirmed = (data) => {
        addNotification({
          type: 'session',
          title: 'Session Confirmed',
          message: data.message || 'Your session has been confirmed',
          timestamp: new Date(),
          sessionId: data.sessionId
        });
        loadSessions();
      };

      const handleSessionCancelled = (data) => {
        addNotification({
          type: 'session',
          title: 'Session Cancelled',
          message: data.message || 'A session has been cancelled',
          timestamp: new Date(),
          sessionId: data.sessionId
        });
        loadSessions();
      };

      const handleSessionUpdated = (data) => {
        addNotification({
          type: 'session',
          title: 'Session Updated',
          message: data.message || 'A session has been updated',
          timestamp: new Date(),
          sessionId: data.sessionId
        });
        loadSessions();
      };

      const handleSessionReminder = (data) => {
        addNotification({
          type: 'session',
          title: 'Session Reminder',
          message: data.message || 'You have an upcoming session',
          timestamp: new Date(),
          sessionId: data.sessionId
        });
      };

      socket.on('message-notification', handleMessageNotification);
      socket.on('connection-update', handleConnectionUpdate);
      socket.on('note-added', handleNoteAdded);
      socket.on('session-confirmed', handleSessionConfirmed);
      socket.on('session-cancelled', handleSessionCancelled);
      socket.on('session-updated', handleSessionUpdated);
      socket.on('session-reminder', handleSessionReminder);

      return () => {
        socket.off('message-notification', handleMessageNotification);
        socket.off('connection-update', handleConnectionUpdate);
        socket.off('note-added', handleNoteAdded);
        socket.off('session-confirmed', handleSessionConfirmed);
        socket.off('session-cancelled', handleSessionCancelled);
        socket.off('session-updated', handleSessionUpdated);
        socket.off('session-reminder', handleSessionReminder);
      };
    }
  }, [socket, user, activeChatConnection]);

  const addNotification = (notification) => {
    setNotifications(prev => [{ ...notification, id: Date.now(), read: false }, ...prev]);
    setUnreadNotificationCount(prev => prev + 1);
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadNotificationCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadNotificationCount(0);
  };

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

      if (userData.user && userData.user.role !== 'STUDENT') {
        toast.error('Access denied. Please login with correct credentials.');
        router.push('/login');
        return;
      }

      setUser(userData.user);
      setMentors(mentorsData.users || []);
      
      const connectionsWithOwnReviews = connectionsData.connections.map(conn => ({
        ...conn,
        review: conn.review && conn.review.studentId === parseInt(userId) 
          ? conn.review 
          : null
      }));
      setConnections(connectionsWithOwnReviews || []);
      
      setEditFormData({ 
        name: userData.user?.name || '', 
        bio: userData.user?.bio || '' 
      });

      await loadSkillGroups();
      await loadSessions();
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
        const connectionsWithOwnReviews = data.connections.map(conn => ({
          ...conn,
          review: conn.review && conn.review.studentId === parseInt(userId) 
            ? conn.review 
            : null
        }));
        setConnections(connectionsWithOwnReviews || []);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadSkillGroups = async () => {
    const userId = localStorage.getItem('userId');
    try {
      const response = await fetch(`/api/skill-groups?studentId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSkillGroups(data.groups || []);
      }
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

  const requestConnection = async (mentorId) => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      toast.error('Please login again');
      router.push('/login');
      return;
    }
    
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

    const requestPromise = (async () => {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mentorId: parseInt(mentorId), 
          studentId: parseInt(userId), 
          message: 'Hi! I would like to learn from you.' 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to send request');
      }
      
      await loadDashboardData();
      return data;
    })();

    toast.promise(requestPromise, {
      loading: 'Sending connection request...',
      success: 'Connection request sent successfully!',
      error: (err) => err.message || 'Failed to send request',
    });
  };

  const handleOpenBookingModal = (connection) => {
    setSelectedConnectionForBooking(connection);
    setShowBookingModal(true);
  };

  const handleSessionBooked = (session) => {
    loadSessions();
    addNotification({
      type: 'session',
      title: 'Session Booked',
      message: `Session "${session.title}" has been booked`,
      timestamp: new Date(),
      sessionId: session.id
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

  const handleOpenReviewModal = (connection) => {
    setReviewConnection(connection);
    if (connection.review) {
      setReviewFormData({
        rating: connection.review.rating,
        comment: connection.review.comment || ''
      });
    } else {
      setReviewFormData({ rating: 0, comment: '' });
    }
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (reviewFormData.rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    const reviewPromise = fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectionId: reviewConnection.id,
        mentorId: reviewConnection.mentorId,
        studentId: user.id,
        rating: reviewFormData.rating,
        comment: reviewFormData.comment.trim()
      })
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit review');
      }
      const data = await res.json();
      
      setConnections(prevConnections => 
        prevConnections.map(conn => {
          if (conn.id === reviewConnection.id) {
            return { 
              ...conn, 
              review: {
                id: data.review.id,
                connectionId: data.review.connectionId,
                mentorId: data.review.mentorId,
                studentId: data.review.studentId,
                rating: data.review.rating,
                comment: data.review.comment,
                createdAt: data.review.createdAt
              }
            };
          }
          return conn;
        })
      );
      
      setShowReviewModal(false);
      setReviewConnection(null);
      setReviewFormData({ rating: 0, comment: '' });
      
      const mentorsRes = await fetch('/api/users?role=MENTOR');
      if (mentorsRes.ok) {
        const mentorsData = await mentorsRes.json();
        setMentors(mentorsData.users || []);
      }
    });

    toast.promise(reviewPromise, {
      loading: 'Submitting review...',
      success: 'Review submitted successfully!',
      error: (err) => err.message || 'Failed to submit review',
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
    setActiveSkillGroup(null);
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
    } catch (error) {
      console.error('Error loading skill group:', error);
      toast.error('Failed to load learning space');
    }
  };

  const handleCloseChat = () => setActiveChatConnection(null);
  const handleCloseLearningSpace = () => setActiveSkillGroup(null);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    toast.success('Logged out successfully');
    router.push('/');
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedSkillFilter('');
    setAvailabilityFilter('all');
    setSortBy('newest');
  };

  const allSkills = [...new Set(
    mentors.flatMap(m => m.skillsKnown?.map(s => s.name) || [])
  )].sort();

  const filteredMentors = mentors
    .filter(mentor => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        mentor.name?.toLowerCase().includes(searchLower) ||
        mentor.bio?.toLowerCase().includes(searchLower) ||
        mentor.skillsKnown?.some(skill => 
          skill.name.toLowerCase().includes(searchLower)
        );

      const matchesSkill = !selectedSkillFilter || 
        mentor.skillsKnown?.some(skill => skill.name === selectedSkillFilter);

      const existingConnection = connections.find(c => c.mentorId === mentor.id);
      const matchesAvailability = 
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && !existingConnection) ||
        (availabilityFilter === 'connected' && existingConnection?.status === 'ACCEPTED');

      return matchesSearch && matchesSkill && matchesAvailability;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'name') {
        return a.name?.localeCompare(b.name || '') || 0;
      } else if (sortBy === 'rating') {
        return (b.averageRating || 0) - (a.averageRating || 0);
      }
      return 0;
    });

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

  const StarRating = ({ rating, onRate, readonly = false }) => {
    const [hover, setHover] = useState(0);
    
    return (
      <div className={styles.starRating}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${styles.star} ${star <= (hover || rating) ? styles.filled : ''}`}
            onClick={() => !readonly && onRate && onRate(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            disabled={readonly}
          >
            <StarIcon size={readonly ? 16 : 24} />
          </button>
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
        <div className={styles.sidebarHeader}>
          <Logo width={140} height={49} />
        </div>
        
        <nav className={styles.sidebarNav}>
          <button 
            className={`${styles.navItem} ${activeTab === 'progress' ? styles.active : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            <TrendingUpIcon size={20} /> 
            My Progress
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'sessions' ? styles.active : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <CalendarIcon size={20} /> 
            My Sessions
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'groups' ? styles.active : ''}`}
            onClick={() => setActiveTab('groups')}
          >
            <BookIcon size={20} /> 
            Learning Groups
          </button>
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
            <h1>Welcome, {user?.name || 'Student'}!</h1>
            <p>
              <span className={isConnected ? styles.statusOnline : styles.statusOffline}>
                {isConnected ? '● Online' : '○ Offline'}
              </span>
            </p>
          </div>
          <div className={styles.topBarRight}>
            <div className={styles.notificationWrapper}>
              <button 
                className={styles.notificationBtn}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <BellIcon size={20} />
                {unreadNotificationCount > 0 && (
                  <span className={styles.notificationBadge}>
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notificationHeader}>
                    <h3>Notifications</h3>
                    {unreadNotificationCount > 0 && (
                      <button 
                        className={styles.markAllReadBtn}
                        onClick={markAllNotificationsAsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className={styles.notificationList}>
                    {notifications.length === 0 ? (
                      <div className={styles.emptyNotifications}>
                        <BellIcon size={32} />
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={`${styles.notificationItem} ${notification.read ? styles.read : ''}`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className={styles.notificationIcon}>
                            {notification.type === 'message' && <MessageIcon size={18} />}
                            {notification.type === 'connection' && <UsersIcon size={18} />}
                            {notification.type === 'note' && <FileIcon size={18} />}
                            {notification.type === 'session' && <CalendarIcon size={18} />}
                          </div>
                          <div className={styles.notificationContent}>
                            <h4>{notification.title}</h4>
                            <p>{notification.message}</p>
                            <span className={styles.notificationTime}>
                              {new Date(notification.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {!notification.read && <div className={styles.unreadDot}></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
          </div>
        </header>

        <div className={styles.contentArea}>
          {activeTab === 'progress' && (
            <section className={styles.section}>
              <ProgressDashboard studentId={user.id} />
            </section>
          )}

          {activeTab === 'sessions' && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>My Sessions</h2>
                  <p>Manage your mentorship sessions</p>
                </div>
              </div>

              <SessionCalendar
                sessions={sessions}
                currentUserId={user.id}
                onCancel={handleCancelSession}
                onJoin={handleJoinSession}
              />
            </section>
          )}

          {activeTab === 'groups' && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <div>
                  <h2>My Learning Groups</h2>
                  <p>Access shared learning materials from your mentors</p>
                </div>
              </div>
              
              <div className={styles.skillGroupsGrid}>
                {skillGroups.length === 0 ? (
                  <div className={styles.emptyState}>
                    <BookIcon size={64} />
                    <p>No learning groups yet</p>
                    <p className={styles.emptySubtext}>
                      Connect with mentors to access their skill groups and learning materials
                    </p>
                    <button 
                      className={styles.primaryBtn}
                      onClick={() => setActiveTab('browse')}
                    >
                      Browse Mentors
                    </button>
                  </div>
                ) : (
                  skillGroups.map(group => (
                    <div key={group.id} className={styles.skillGroupCard}>
                      <div className={styles.groupHeader}>
                        <div className={styles.groupIcon}>
                          <BookIcon size={28} />
                        </div>
                        <div className={styles.groupInfo}>
                          <h3>{group.name}</h3>
                          <p className={styles.skillBadge}>{group.skill.name}</p>
                        </div>
                      </div>
                      
                      {group.description && (
                        <p className={styles.groupDescription}>{group.description}</p>
                      )}
                      
                      <div className={styles.mentorInfo}>
                        <span className={styles.mentorLabel}>Mentor:</span>
                        <span className={styles.mentorName}>{group.mentor.name}</span>
                      </div>
                      
                      <div className={styles.groupStats}>
                        <div className={styles.statItem}>
                          <UsersIcon size={16} />
                          <span>{group._count.connections} Students</span>
                        </div>
                        <div className={styles.statItem}>
                          <FileIcon size={16} />
                          <span>{group._count.notes} Notes</span>
                        </div>
                      </div>
                      
                      <button 
                        className={styles.accessBtn}
                        onClick={() => handleOpenLearningSpace(group.id)}
                      >
                        <FileIcon size={18} />
                        View Notes
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {activeTab === 'browse' && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Browse Mentors</h2>
              </div>

              <div className={styles.filterSection}>
                <div className={styles.searchBar}>
                  <SearchIcon size={20} />
                  <input 
                    type="text" 
                    placeholder="Search by name, bio, or skill..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                  {searchTerm && (
                    <button 
                      className={styles.clearSearchBtn}
                      onClick={() => setSearchTerm('')}
                      title="Clear search"
                    >
                      <XIcon size={18} />
                    </button>
                  )}
                </div>

                <div className={styles.filterControls}>
                  <select 
                    className={styles.filterSelect}
                    value={selectedSkillFilter}
                    onChange={(e) => setSelectedSkillFilter(e.target.value)}
                  >
                    <option value="">All Skills</option>
                    {allSkills.map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>

                  <select 
                    className={styles.filterSelect}
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                  >
                    <option value="all">All Mentors</option>
                    <option value="available">Available</option>
                    <option value="connected">Connected</option>
                  </select>

                  <select 
                    className={styles.filterSelect}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="rating">Highest Rated</option>
                  </select>

                  {(searchTerm || selectedSkillFilter || availabilityFilter !== 'all' || sortBy !== 'newest') && (
                    <button 
                      className={styles.clearFiltersBtn}
                      onClick={clearAllFilters}
                    >
                      <XIcon size={16} />
                      Clear All
                    </button>
                  )}
                </div>

                <div className={styles.resultsCount}>
                  Showing {filteredMentors.length} of {mentors.length} mentors
                </div>
              </div>
              
              <div className={styles.mentorsGrid}>
                {filteredMentors.length === 0 ? (
                  <div className={styles.emptyState}>
                    <UsersIcon size={64} />
                    <p>No mentors found</p>
                    <p className={styles.emptySubtext}>
                      Try adjusting your filters or search term
                    </p>
                    {(searchTerm || selectedSkillFilter || availabilityFilter !== 'all') && (
                      <button 
                        className={styles.clearBtn}
                        onClick={clearAllFilters}
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  filteredMentors.map(mentor => (
                    <div key={mentor.id} className={styles.mentorCard}>
                      {mentor.isTopRated && (
                        <div className={styles.topRatedBadge}>⭐ Top Rated</div>
                      )}
                      <div className={styles.mentorAvatar}>
                        {mentor.name?.charAt(0)?.toUpperCase() || 'M'}
                      </div>
                      <h3>{mentor.name}</h3>
                      {mentor.averageRating > 0 && (
                        <div className={styles.mentorRating}>
                          <StarRating rating={mentor.averageRating} readonly />
                          <span className={styles.ratingText}>
                            {mentor.averageRating.toFixed(1)} ({mentor.totalReviews} {mentor.totalReviews === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      )}
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
                            className={styles.bookSessionBtn}
                            onClick={() => handleOpenBookingModal(conn)}
                          >
                            <CalendarIcon size={18} />
                            Book Session
                          </button>
                          <button 
                            className={styles.reviewBtn}
                            onClick={() => handleOpenReviewModal(conn)}
                          >
                            <StarIcon size={18} />
                            {conn.review ? 'Edit Review' : 'Leave Review'}
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
                          {skillGroups.length}
                        </span>
                        <span className={styles.statLabel}>Learning Groups</span>
                      </div>
                      <div className={styles.statBox}>
                        <span className={styles.statNumber}>
                          {sessions.filter(s => s.status === 'CONFIRMED' || s.status === 'COMPLETED').length}
                        </span>
                        <span className={styles.statLabel}>Sessions</span>
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
                        maxLength={500}
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

      {/* Review Modal */}
      {showReviewModal && (
        <div className={styles.modal} onClick={() => setShowReviewModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{reviewConnection?.review ? 'Edit Your Review' : 'Leave a Review'}</h3>
              <button 
                className={styles.closeBtn} 
                onClick={() => setShowReviewModal(false)}
              >
                <XIcon size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitReview}>
              <div className={styles.formGroup}>
                <label>Rating *</label>
                <StarRating 
                  rating={reviewFormData.rating}
                  onRate={(rating) => setReviewFormData({...reviewFormData, rating})}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Comment (Optional)</label>
                <textarea
                  value={reviewFormData.comment}
                  onChange={(e) => setReviewFormData({...reviewFormData, comment: e.target.value})}
                  className={styles.textarea}
                  rows={4}
                  placeholder="Share your experience with this mentor..."
                  maxLength={500}
                />
                <span className={styles.helperText}>
                  {reviewFormData.comment.length}/500 characters
                </span>
              </div>
              
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={() => setShowReviewModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  <StarIcon size={18} />
                  {reviewConnection?.review ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Booking Modal */}
      {showBookingModal && selectedConnectionForBooking && (
        <SessionBooking
          connection={selectedConnectionForBooking}
          currentUserId={user.id}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedConnectionForBooking(null);
          }}
          onSessionBooked={handleSessionBooked}
        />
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