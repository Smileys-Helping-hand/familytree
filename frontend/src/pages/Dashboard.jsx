import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { activityAPI, familyAPI } from '../services/api';
import { Plus, Users, Image, Calendar, TrendingUp, Heart, Sparkles, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import ActivityFeed from '../components/ActivityFeed';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: familiesData, isLoading } = useQuery({
    queryKey: ['families'],
    queryFn: familyAPI.getAll,
  });

  const families = familiesData?.data?.families || [];

  const { data: activityData } = useQuery({
    queryKey: ['activity'],
    queryFn: () => activityAPI.getRecent({ limit: 10 }),
    enabled: !isLoading,
  });

  const recentActivities = (activityData?.data?.activities || []).map((activity) => ({
    _id: activity.id,
    type: activity.type,
    user: activity.user,
    action: activity.action,
    description: activity.description,
    timestamp: activity.createdAt,
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        className="flex justify-between items-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <motion.p 
            className="text-gray-600 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Welcome back! Here's your family overview.
          </motion.p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/create-family" className="btn btn-primary flex items-center">
            <Plus size={20} className="mr-2" />
            Create Family
          </Link>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid md:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          className="card relative overflow-hidden group"
          variants={itemVariants}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-600">Total Families</p>
              <motion.p 
                className="text-2xl font-bold text-gray-900 mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {families.length}
              </motion.p>
            </div>
            <motion.div 
              className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Users className="text-primary-600" size={24} />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="card relative overflow-hidden group"
          variants={itemVariants}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-600">Total Members</p>
              <motion.p 
                className="text-2xl font-bold text-gray-900 mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                {families.reduce((sum, f) => sum + (f.stats?.totalMembers || 0), 0)}
              </motion.p>
            </div>
            <motion.div 
              className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <TrendingUp className="text-green-600" size={24} />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="card relative overflow-hidden group"
          variants={itemVariants}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-600">Memories</p>
              <motion.p 
                className="text-2xl font-bold text-gray-900 mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
              >
                {families.reduce((sum, f) => sum + (f.stats?.totalMemories || 0), 0)}
              </motion.p>
            </div>
            <motion.div 
              className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Image className="text-purple-600" size={24} />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          className="card relative overflow-hidden group"
          variants={itemVariants}
          whileHover={{ y: -5, scale: 1.02 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-600">Events</p>
              <motion.p 
                className="text-2xl font-bold text-gray-900 mt-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                {families.reduce((sum, f) => sum + (f.stats?.totalEvents || 0), 0)}
              </motion.p>
            </div>
            <motion.div 
              className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Calendar className="text-orange-600" size={24} />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Families List - Takes 2 columns */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Families</h2>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Heart className="text-red-500" size={24} />
              </motion.div>
            </div>
            {families.length === 0 ? (
              <motion.div 
                className="card text-center py-12"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No families yet</h3>
                <p className="text-gray-600 mb-6">Create your first family tree to get started!</p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link to="/create-family" className="btn btn-primary inline-flex items-center">
                    <Plus size={20} className="mr-2" />
                    Create Your First Family
                  </Link>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div 
                className="grid md:grid-cols-2 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {families.map((family, index) => (
                  <motion.div
                    key={family.id}
                    variants={itemVariants}
                    whileHover={{ y: -8, scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Link
                      to={`/family/${family.id}/tree`}
                      className="card hover:shadow-2xl transition-all block group relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1 }}
                      />
                      {family.coverPhoto && (
                        <div className="relative overflow-hidden rounded-lg mb-4">
                          <img
                            src={family.coverPhoto}
                            alt={family.name}
                            className="w-full h-40 object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute top-2 right-2">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className="text-white drop-shadow-lg" size={20} />
                            </motion.div>
                          </div>
                        </div>
                      )}
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {family.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {family.description || 'No description'}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {family.stats?.totalMembers || 0} members
                        </span>
                        <span className="capitalize px-2 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                          {family.memberships?.find(m => m.userId === user?.id)?.role || 'viewer'}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Activity Feed - Takes 1 column */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Activity className="text-primary-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
            </div>
            <ActivityFeed activities={recentActivities} limit={5} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
