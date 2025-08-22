import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, Clock, FileText, X, CheckCheck } from 'lucide-react';
import { useNotifications, Notification } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { hr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const NotificationIcon: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'process':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'order':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'info':
        return <FileText className="h-4 w-4 text-gray-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationBackground = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50';
    
    switch (type) {
      case 'process':
        return 'bg-blue-50';
      case 'order':
        return 'bg-green-50';
      case 'warning':
        return 'bg-yellow-50';
      default:
        return 'bg-gray-50';
    }
  };

  const getNotificationBorder = (type: string, read: boolean) => {
    if (read) return 'border-gray-200';
    
    switch (type) {
      case 'process':
        return 'border-blue-200';
      case 'order':
        return 'border-green-200';
      case 'warning':
        return 'border-yellow-200';
      default:
        return 'border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: hr });
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.workOrderNumber) {
      navigate(`/work-orders/${notification.workOrderNumber}`);
    }
    markAsRead(notification.id);
    setIsOpen(false); // Zatvori dropdown
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggleDropdown}
        className="relative p-1 text-gray-300 hover:text-white rounded-full hover:bg-gray-700 focus:outline-none"
        title="Obavijesti"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 bg-red-600 text-white text-xs font-medium rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Obavijesti</h3>
            <div className="flex space-x-2">
              <button
                onClick={markAllAsRead}
                className="p-1 text-xs text-blue-600 hover:text-blue-800"
                title="Označi sve kao pročitano"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm">Nema obavijesti</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`${getNotificationBackground(notification.type, notification.read)} ${getNotificationBorder(notification.type, notification.read)} border-l-4 p-3 flex cursor-pointer hover:bg-opacity-80 transition-colors`}
                    onClick={() => handleNotificationClick(notification)}
                    title={notification.workOrderNumber ? `Klikni za otvaranje naloga ${notification.workOrderNumber}` : 'Klikni za označavanje kao pročitano'}
                  >
                    <div className="flex-shrink-0 mt-0.5 mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.title}
                          {!notification.read && <span className="ml-1 inline-block w-2 h-2 bg-blue-600 rounded-full"></span>}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-gray-500 ml-1"
                          title="Ukloni obavijest"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      {(notification.workOrderNumber || notification.clientName || notification.processName) && (
                        <div className="mt-1 text-xs text-gray-500">
                          {notification.workOrderNumber && <span className="font-medium">Nalog: {notification.workOrderNumber}</span>}
                          {notification.clientName && <span className="ml-1">{notification.workOrderNumber ? '•' : 'Klijent:'} {notification.clientName}</span>}
                          {notification.processName && <span className="ml-1">{notification.workOrderNumber || notification.clientName ? '•' : 'Proces:'} {notification.processName}</span>}
                        </div>
                      )}
                      <p className="mt-1 text-xs text-gray-400">{formatTimestamp(notification.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={markAllAsRead}
                className="text-xs text-center w-full py-1.5 text-blue-600 hover:text-blue-800"
              >
                Označi sve kao pročitano
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;
