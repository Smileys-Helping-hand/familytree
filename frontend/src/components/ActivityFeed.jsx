import { motion } from 'framer-motion';
import { Users, Image, Calendar, UserPlus, Heart, MessageCircle, Upload, Edit } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function ActivityFeed({ activities = [], limit = 10 }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'member_added': return UserPlus;
      case 'memory_uploaded': return Upload;
      case 'event_created': return Calendar;
      case 'photo_liked': return Heart;
      case 'comment_added': return MessageCircle;
      case 'profile_updated': return Edit;
      default: return Users;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'member_added': return 'from-green-500 to-emerald-500';
      case 'memory_uploaded': return 'from-purple-500 to-pink-500';
      case 'event_created': return 'from-orange-500 to-red-500';
      case 'photo_liked': return 'from-red-500 to-pink-500';
      case 'comment_added': return 'from-blue-500 to-cyan-500';
      case 'profile_updated': return 'from-primary-500 to-blue-500';
      default: return 'from-gray-500 to-gray-700';
    }
  };

  const displayActivities = activities.slice(0, limit);

  if (activities.length === 0) {
    return (
      <div className="card text-center py-12">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
        </motion.div>
        <p className="text-gray-600">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((activity, index) => {
        const Icon = getActivityIcon(activity.type);
        const colorClass = getActivityColor(activity.type);

        return (
          <motion.div
            key={activity._id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ x: 4 }}
            className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer bg-white"
          >
            {/* Icon */}
            <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shadow-md`}>
              <Icon size={18} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-semibold">{activity.user?.name || 'Someone'}</span>
                {' '}{activity.action}
              </p>
              {activity.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {activity.description}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {activity.timestamp 
                  ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
                  : 'Just now'
                }
              </p>
            </div>

            {/* Preview Image */}
            {activity.thumbnail && (
              <div className="flex-shrink-0">
                <img
                  src={activity.thumbnail}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover"
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
