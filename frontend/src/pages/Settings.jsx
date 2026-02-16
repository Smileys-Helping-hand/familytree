import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionAPI } from '../services/api';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Bell, Shield, CreditCard, Crown, Palette, Globe, Save, Trash2, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'subscription', label: 'Subscription', icon: Crown },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </motion.div>

      {/* Settings Tabs */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          className="lg:col-span-1"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          <div className="card p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeTab === tab.id
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </motion.button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          className="lg:col-span-3"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          key={activeTab}
        >
          {activeTab === 'profile' && <ProfileSettings user={user} />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'subscription' && <SubscriptionSettings />}
          {activeTab === 'preferences' && <PreferencesSettings />}
        </motion.div>
      </div>
    </div>
  );
}

// Profile Settings Component
function ProfileSettings({ user }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      toast.success('✨ Profile updated!');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
        <p className="text-gray-600 text-sm mt-1">Update your personal information</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-6 mb-8 pb-8 border-b">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-primary-600"
          >
            <Camera size={16} className="text-primary-600" />
          </motion.button>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
          <p className="text-gray-600 text-sm">{user?.email}</p>
          <button className="text-primary-600 text-sm mt-2 hover:underline">
            Change avatar
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="City, Country"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows="4"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="flex justify-between items-center pt-6 border-t">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-red-600 hover:text-red-700 flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete Account
          </motion.button>
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={updateProfileMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </div>
      </form>
    </div>
  );
}

// Security Settings Component
function SecuritySettings() {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data) => api.put('/auth/change-password', data),
    onSuccess: () => {
      toast.success('🔒 Password updated!');
      setPasswords({ current: '', new: '', confirm: '' });
    },
    onError: () => {
      toast.error('Failed to update password');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: passwords.current,
      newPassword: passwords.new,
    });
  };

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
        <p className="text-gray-600 text-sm mt-1">Manage your password and security preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Password
          </label>
          <input
            type="password"
            value={passwords.current}
            onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Password
          </label>
          <input
            type="password"
            value={passwords.new}
            onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            value={passwords.confirm}
            onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        <div className="pt-6 border-t">
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={updatePasswordMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <Lock size={18} />
            {updatePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
          </motion.button>
        </div>
      </form>

      {/* Two-Factor Authentication */}
      <div className="mt-8 pt-8 border-t">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication</h3>
        <p className="text-gray-600 mb-4">Add an extra layer of security to your account</p>
        <button className="btn btn-outline">Enable 2FA</button>
      </div>
    </div>
  );
}

// Notification Settings Component
function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    birthdayReminders: true,
    eventReminders: true,
    newMemories: true,
    familyInvites: true,
    weeklyDigest: false,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => api.put('/users/notifications', data),
    onSuccess: () => {
      toast.success('🔔 Notification settings updated!');
    },
  });

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveMutation.mutate(newSettings);
  };

  const notificationOptions = [
    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
    { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications' },
    { key: 'birthdayReminders', label: 'Birthday Reminders', description: 'Get reminded of family birthdays' },
    { key: 'eventReminders', label: 'Event Reminders', description: 'Get reminded of upcoming events' },
    { key: 'newMemories', label: 'New Memories', description: 'Notify when new memories are added' },
    { key: 'familyInvites', label: 'Family Invites', description: 'Notify when invited to families' },
    { key: 'weeklyDigest', label: 'Weekly Digest', description: 'Receive weekly summary emails' },
  ];

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
        <p className="text-gray-600 text-sm mt-1">Choose what notifications you want to receive</p>
      </div>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div key={option.key} className="flex items-start justify-between py-4 border-b last:border-b-0">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{option.label}</h3>
              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleToggle(option.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings[option.key] ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <motion.span
                layout
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings[option.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </motion.button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Subscription Settings Component
function SubscriptionSettings() {
  const { data: subscriptionData, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionAPI.getStatus,
  });

  const subscription = subscriptionData?.data?.subscription;

  const cancelMutation = useMutation({
    mutationFn: subscriptionAPI.cancel,
    onSuccess: () => {
      toast.success('Subscription cancelled');
    },
  });

  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Subscription</h2>
        <p className="text-gray-600 text-sm mt-1">Manage your subscription plan</p>
      </div>

      {subscription?.active ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Crown size={32} />
              <div>
                <h3 className="text-2xl font-bold capitalize">{subscription.tier} Plan</h3>
                <p className="text-primary-100">Active subscription</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-primary-100">Next billing</p>
                <p className="font-semibold">{new Date(subscription.nextBillingDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-primary-100">Amount</p>
                <p className="font-semibold">${subscription.price}/month</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Your Benefits</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Unlimited family members
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> 50GB storage
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Advanced tree visualization
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Priority support
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-6 border-t">
            <button className="btn btn-outline">Change Plan</button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel your subscription?')) {
                  cancelMutation.mutate();
                }
              }}
              className="text-red-600 hover:text-red-700"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Crown size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h3>
          <p className="text-gray-600 mb-6">Upgrade to unlock premium features</p>
          <a href="/pricing" className="btn btn-primary inline-flex items-center gap-2">
            <Crown size={20} />
            View Plans
          </a>
        </div>
      )}
    </div>
  );
}

// Preferences Settings Component
function PreferencesSettings() {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'America/New_York',
  });

  const saveMutation = useMutation({
    mutationFn: (data) => api.put('/users/preferences', data),
    onSuccess: () => {
      toast.success('⚙️ Preferences updated!');
    },
  });

  const handleChange = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
  };

  const handleSave = () => {
    saveMutation.mutate(preferences);
  };

  return (
    <div className="card">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
        <p className="text-gray-600 text-sm mt-1">Customize your experience</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            value={preferences.theme}
            onChange={(e) => handleChange('theme', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="auto">Auto (System)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Language
          </label>
          <select
            value={preferences.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Format
          </label>
          <select
            value={preferences.dateFormat}
            onChange={(e) => handleChange('dateFormat', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone
          </label>
          <select
            value={preferences.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
          </select>
        </div>

        <div className="pt-6 border-t">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {saveMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
