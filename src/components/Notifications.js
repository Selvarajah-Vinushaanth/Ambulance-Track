import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Bell, X, Check, AlertTriangle, Info, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const NotificationButton = styled.button`
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background: #f3f4f6;
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  background: #dc2626;
  color: white;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
`;

const NotificationPanel = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  width: 400px;
  max-height: 500px;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 0.5rem;
`;

const NotificationHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: between;
  align-items: center;
`;

const NotificationTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const ClearAllButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;

  &:hover {
    color: #374151;
  }
`;

const NotificationList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const NotificationItem = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s;
  ${props => !props.read && 'background: #f8fafc; border-left: 4px solid #3b82f6;'}

  &:hover {
    background: #f9fafb;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

const NotificationIcon = styled.div`
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  
  ${props => {
    switch (props.type) {
      case 'booking':
        return 'background: #3b82f6;';
      case 'emergency':
        return 'background: #dc2626;';
      case 'payment':
        return 'background: #10b981;';
      case 'system':
        return 'background: #6b7280;';
      default:
        return 'background: #6b7280;';
    }
  }}
`;

const NotificationText = styled.div`
  flex: 1;
`;

const NotificationTitle2 = styled.h4`
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
`;

const NotificationMessage = styled.p`
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
`;

const NotificationTime = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: #6b7280;
`;

const Container = styled.div`
  position: relative;
  display: inline-block;
`;

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      for (const notification of unreadNotifications) {
        await markAsRead(notification._id);
      }
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'booking':
        return <Calendar size={16} />;
      case 'emergency':
        return <AlertTriangle size={16} />;
      case 'payment':
        return <DollarSign size={16} />;
      case 'system':
        return <Info size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Container>
      <NotificationButton onClick={() => setShowPanel(!showPanel)}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <NotificationBadge>
            {unreadCount > 99 ? '99+' : unreadCount}
          </NotificationBadge>
        )}
      </NotificationButton>

      {showPanel && (
        <NotificationPanel>
          <NotificationHeader>
            <NotificationTitle>Notifications</NotificationTitle>
            {unreadCount > 0 && (
              <ClearAllButton onClick={clearAllNotifications}>
                Mark all as read
              </ClearAllButton>
            )}
          </NotificationHeader>

          <NotificationList>
            {notifications.length === 0 ? (
              <EmptyState>
                <Bell size={48} color="#d1d5db" />
                <p>No notifications yet</p>
              </EmptyState>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  read={notification.read}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <NotificationContent>
                    <NotificationIcon type={notification.type}>
                      {getIcon(notification.type)}
                    </NotificationIcon>
                    <NotificationText>
                      <NotificationTitle2>{notification.title}</NotificationTitle2>
                      <NotificationMessage>{notification.message}</NotificationMessage>
                      <NotificationTime>
                        {format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
                      </NotificationTime>
                    </NotificationText>
                  </NotificationContent>
                </NotificationItem>
              ))
            )}
          </NotificationList>
        </NotificationPanel>
      )}
    </Container>
  );
};

export default Notifications;
