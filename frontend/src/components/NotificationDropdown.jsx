import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { activityAPI } from '../services/api';

const TYPE_ICON = {
  member_added: '👤',
  member_updated: '✏️',
  member_removed: '🗑️',
  memory_uploaded: '📸',
  memory_added: '📸',
  event_created: '📅',
  event_updated: '📅',
  family_created: '🌳',
  family_updated: '🌳',
  invite_sent: '✉️',
  invite_accepted: '🤝',
  default: '🔔',
};

const activityToNotification = (activity) => ({
  id: activity.id,
  type: activity.type,
  title: activity.action
    ? activity.action.charAt(0).toUpperCase() + activity.action.slice(1)
    : activity.type,
  message: activity.description || '',
  timestamp: new Date(activity.createdAt),
  icon: TYPE_ICON[activity.type] || TYPE_ICON.default,
  userName: activity.user?.name || null,
});

const POLL_INTERVAL_MS = 60_000; // refresh every 60 s

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('notif_read') || '[]'));
    } catch {
      return new Set();
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const persistReadIds = (ids) => {
    localStorage.setItem('notif_read', JSON.stringify([...ids]));
  };

  const fetchActivities = async () => {
    try {
      setError(null);
      const res = await activityAPI.getRecent({ limit: 20 });
      setActivities(res.data?.activities || []);
    } catch (err) {
      if (err?.response?.status !== 401) {
        setError('Could not load notifications');
      }
    }
  };

  // Initial fetch + polling
  useEffect(() => {
    setLoading(true);
    fetchActivities().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchActivities, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Refresh when dropdown opens
  useEffect(() => {
    if (isOpen) fetchActivities();
  }, [isOpen]);

  const notifications = activities.map(activityToNotification);
  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markAsRead = (id) => {
    const next = new Set(readIds);
    next.add(id);
    setReadIds(next);
    persistReadIds(next);
  };

  const markAllAsRead = () => {
    const next = new Set(notifications.map(n => n.id));
    setReadIds(next);
    persistReadIds(next);
  };

  const dismiss = (id) => {
    // Only hides locally — activity data lives in the backend
    setActivities(prev => prev.filter(a => a.id !== id));
    const next = new Set(readIds);
    next.delete(id);
    setReadIds(next);
    persistReadIds(next);
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell size={22} className="text-gray-700" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary-500 to-purple-500 text-white">
                <div className="flex items-center gap-2">
                  <Bell size={20} />
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={fetchActivities}
                    className="p-1 hover:bg-white/20 rounded"
                    title="Refresh"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  </motion.button>
                  {unreadCount > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={markAllAsRead}
                      className="p-1 hover:bg-white/20 rounded"
                      title="Mark all as read"
                    >
                      <Check size={18} />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {loading && notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <RefreshCw size={32} className="mx-auto text-gray-300 mb-3 animate-spin" />
                    <p className="text-sm text-gray-500">Loading…</p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <Bell size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-600">No notifications</p>
                    <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification, index) => {
                      const isRead = readIds.has(notification.id);
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`p-4 hover:bg-gray-50 transition-colors group ${!isRead ? 'bg-primary-50/30' : ''}`}
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0 text-2xl">{notification.icon}</div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`text-sm font-medium ${!isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                  {notification.userName && (
                                    <span className="font-normal text-gray-500"> by {notification.userName}</span>
                                  )}
                                </h4>
                                {!isRead && (
                                  <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              {notification.message && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              {!isRead && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 hover:bg-gray-200 rounded text-gray-600"
                                  title="Mark as read"
                                >
                                  <Check size={16} />
                                </motion.button>
                              )}
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => dismiss(notification.id)}
                                className="p-1 hover:bg-red-100 rounded text-red-600"
                                title="Dismiss"
                              >
                                <Trash2 size={16} />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                  <span className="text-xs text-gray-400">Showing last 20 activities · refreshes every minute</span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
