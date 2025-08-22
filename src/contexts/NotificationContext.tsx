import React, { createContext, useContext, useState, useEffect } from 'react';
import SocketManager from '../lib/socket';
import { audioManager } from '../utils/audio';

export type NotificationType = 'process' | 'order' | 'info' | 'warning';

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: NotificationType;
  workOrderId?: string;
  workOrderNumber?: string;
  clientName?: string;
  processName?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Socket.IO real-time notifications
  useEffect(() => {
    const socketManager = SocketManager.getInstance();
    const socket = socketManager.connect();

    // Listen for work order completions from device interface
    socketManager.onWorkOrderCompleted((data) => {
      const newNotification: Notification = {
        id: `${data.id}-${Date.now()}`,
        title: 'Nalog završen iz uređaja',
        message: `Radni nalog ${data.orderNumber || data.id} je uspješno završen iz uređaja ${data.deviceName || 'Device Interface'}.`,
        type: 'order',
        workOrderId: data.id,
        workOrderNumber: data.orderNumber || data.id,
        timestamp: new Date(),
        read: false
      };

      setNotifications(prev => {
        // Check if notification already exists
        const exists = prev.some(n => n.workOrderId === data.id && n.type === 'order');
        if (!exists) {
          // Play notification sound when new notification arrives
          audioManager.playNotificationSound();
          return [newNotification, ...prev];
        }
        return prev;
      });
    });

    return () => {
      socketManager.offWorkOrderCompleted();
      socketManager.disconnect();
    };
  }, []);



  const unreadCount = notifications.filter(notification => !notification.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Play notification sound
    audioManager.playNotificationSound();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== id)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
