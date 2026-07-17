import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize connection
  useEffect(() => {
    // In production, connect to relative root. In development, point to the node port
    const socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5001' : '/';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Join room when user is loaded
  useEffect(() => {
    if (socket && user) {
      socket.emit('join-room', user.id);
      
      // Fetch initial notifications
      fetchNotifications();

      // Listen for achievements or reminders
      socket.on('new-notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Display beautiful toast message
        if (notification.type === 'achievement') {
          toast.success(
            <div className="flex flex-col">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">🏆 Achievement Unlocked!</span>
              <span className="text-sm font-semibold">{notification.title}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</span>
            </div>,
            { duration: 6000 }
          );
          
          // Trigger confetti if achievement!
          import('canvas-confetti').then((confetti) => {
            confetti.default({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 }
            });
          });

        } else {
          toast(
            <div className="flex flex-col">
              <span className="font-bold text-purple-600 dark:text-purple-400">🔔 Journal Reminder</span>
              <span className="text-sm">{notification.message}</span>
            </div>,
            { icon: '📝', duration: 5000 }
          );
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new-notification');
      }
    };
  }, [socket, user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const axios = (await import('axios')).default;
      const res = await axios.get('/api/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.notifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      const axios = (await import('axios')).default;
      const res = await axios.put('/api/notifications/read');
      if (res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Failed to mark notifications read:', error);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markAllAsRead, refreshNotifications: fetchNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};
