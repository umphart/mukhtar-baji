import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import MainLayout from '../components/MainLayout';
import {
  UserCircleIcon,
  KeyIcon,
  MoonIcon,
  SunIcon,
  BellIcon,
  ShieldCheckIcon,
  TrashIcon,
  CircleStackIcon, // Changed from DatabaseIcon
  CloudArrowDownIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Settings = () => {
  const { user, changePassword, updateProfile, signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Profile update state
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    lowBalanceAlert: true,
    dailyReports: true,
  });

  // Data management state
  const [exportLoading, setExportLoading] = useState(false);
  const [clearDataConfirm, setClearDataConfirm] = useState(false);

  // Initialize profile data from user
  useEffect(() => {
    if (user?.user_metadata) {
      setProfileData({
        full_name: user.user_metadata.full_name || '',
        phone: user.user_metadata.phone || '',
      });
    }
  }, [user]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      // Validation
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (passwordData.newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters');
      }

      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      await updateProfile(profileData);
      setProfileSuccess('Profile updated successfully!');
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleNotificationToggle = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const exportAllData = async () => {
    setExportLoading(true);
    try {
      // Here you would implement actual data export
      // For now, just simulate
      setTimeout(() => {
        alert('Data export started. You will receive an email with your data.');
        setExportLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Export error:', error);
      setExportLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!clearDataConfirm) {
      setClearDataConfirm(true);
      return;
    }

    try {
      // Warning: This is destructive
      if (window.confirm('⚠️ WARNING: This will delete ALL your data including customers, transactions, and wallet history. This action cannot be undone. Are you absolutely sure?')) {
        // Implement data clearing logic here
        console.log('Clearing all data...');
        alert('Data clearing initiated. This may take a moment.');
        setClearDataConfirm(false);
      }
    } catch (error) {
      console.error('Clear data error:', error);
    }
  };

  const settingsSections = [
    {
      id: 'account',
      title: 'Account Settings',
      icon: UserCircleIcon,
      description: 'Manage your account information',
    },
    {
      id: 'security',
      title: 'Security',
      icon: ShieldCheckIcon,
      description: 'Password and security settings',
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: darkMode ? MoonIcon : SunIcon,
      description: 'Customize the look and feel',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: BellIcon,
      description: 'Configure notification preferences',
    },
{
  id: 'data',
  title: 'Data Management',
  icon: CircleStackIcon, // ✅ This is the correct icon
  description: 'Export or clear your data',
},
    {
      id: 'system',
      title: 'System',
      icon: Cog6ToothIcon,
      description: 'System preferences and info',
    },
  ];

  const [activeSection, setActiveSection] = useState('account');

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Profile Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update your personal information
              </p>
            </div>

            {profileSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <p className="text-green-800 dark:text-green-300">{profileSuccess}</p>
                </div>
              </div>
            )}

            {profileError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center">
                  <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                  <p className="text-red-800 dark:text-red-300">{profileError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  placeholder="+234 800 000 0000"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="btn-primary px-6 py-2"
                >
                  {profileLoading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Change Password</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update your password to keep your account secure
              </p>
            </div>

            {passwordSuccess && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                  <p className="text-green-800 dark:text-green-300">{passwordSuccess}</p>
                </div>
              </div>
            )}

            {passwordError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <div className="flex items-center">
                  <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                  <p className="text-red-800 dark:text-red-300">{passwordError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  required
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Must be at least 6 characters long
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-primary px-6 py-2"
                >
                  {passwordLoading ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>

            {/* Security Tips */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                <ShieldCheckIcon className="h-5 w-5 inline mr-2" />
                Security Tips
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Use a strong, unique password</li>
                <li>• Never share your password with anyone</li>
                <li>• Change your password regularly</li>
                <li>• Log out from shared devices</li>
              </ul>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Appearance Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Customize how the app looks and feels
              </p>
            </div>

            {/* Dark Mode Toggle */}
            <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Switch between light and dark themes
                  </p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    darkMode ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Theme Preview */}
            <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Theme Preview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    !darkMode 
                      ? 'border-primary-500 bg-primary-50 dark:bg-gray-800' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  onClick={() => toggleDarkMode(false)}
                >
                  <div className="flex items-center mb-2">
                    <SunIcon className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="font-medium">Light Theme</span>
                  </div>
                  <div className="h-20 bg-white rounded border border-gray-300 p-2">
                    <div className="h-2 bg-gray-200 rounded mb-1 w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded mb-1 w-1/2"></div>
                    <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>

                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    darkMode 
                      ? 'border-primary-500 bg-primary-900/20' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  onClick={() => toggleDarkMode(true)}
                >
                  <div className="flex items-center mb-2">
                    <MoonIcon className="h-5 w-5 text-indigo-400 mr-2" />
                    <span className="font-medium">Dark Theme</span>
                  </div>
                  <div className="h-20 bg-gray-800 rounded border border-gray-700 p-2">
                    <div className="h-2 bg-gray-700 rounded mb-1 w-3/4"></div>
                    <div className="h-2 bg-gray-700 rounded mb-1 w-1/2"></div>
                    <div className="h-2 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notification Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose what notifications you want to receive
              </p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive in-app notifications' },
                { key: 'lowBalanceAlert', label: 'Low Balance Alerts', description: 'Get notified when wallet balance is low' },
                { key: 'dailyReports', label: 'Daily Reports', description: 'Receive daily summary reports' },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{setting.label}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => handleNotificationToggle(setting.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                      notificationSettings[setting.key] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      notificationSettings[setting.key] ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button className="btn-primary px-6 py-2">
                Save Notification Settings
              </button>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Data Management</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Export your data or clear all data from the system
              </p>
            </div>

            {/* Export Data */}
            <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
              <div className="flex items-start">
                <CloudArrowDownIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Export All Data</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3">
                    Download a copy of all your data including customers, transactions, and reports
                  </p>
                  <button
                    onClick={exportAllData}
                    disabled={exportLoading}
                    className="btn-secondary flex items-center"
                  >
                    <CloudArrowDownIcon className="h-5 w-5 mr-2" />
                    {exportLoading ? 'Preparing Export...' : 'Export All Data'}
                  </button>
                </div>
              </div>
            </div>

            {/* Clear Data */}
            <div className="p-4 border border-red-200 rounded-lg dark:border-red-800 bg-red-50 dark:bg-red-900/10">
              <div className="flex items-start">
                <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-800 dark:text-red-300">Clear All Data</h4>
                  <p className="text-sm text-red-700 dark:text-red-400 mt-1 mb-3">
                    {clearDataConfirm 
                      ? '⚠️ This action is irreversible! All your customers, transactions, and wallet history will be permanently deleted.'
                      : 'Permanently delete all your data from the system. This action cannot be undone.'
                    }
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleClearData}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        clearDataConfirm
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'border border-red-600 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {clearDataConfirm ? 'Confirm Delete All Data' : 'Clear All Data'}
                    </button>
                    {clearDataConfirm && (
                      <button
                        onClick={() => setClearDataConfirm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">System Settings</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                System information and preferences
              </p>
            </div>

            {/* System Info */}
            <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">System Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">App Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                  <span className="font-medium">December 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Database</span>
                  <span className="font-medium">Supabase</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">User ID</span>
                  <span className="font-medium text-xs truncate max-w-[200px]">{user?.id}</span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Preferences</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Auto-save Reports</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Show Tutorial</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-gray-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Currency Format</span>
                  <span className="font-medium">₦ Nigerian Naira</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Date Format</span>
                  <span className="font-medium">DD/MM/YYYY</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Refresh Application
              </button>
              
              <button
                onClick={signOut}
                className="w-full px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Configure your application preferences</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar Navigation */}
          <div className="lg:w-1/4 border-r border-gray-200 dark:border-gray-700">
            <nav className="p-4 space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 ${
                      isActive 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium">{section.title}</div>
                      <div className="text-xs mt-1 opacity-75">{section.description}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="lg:w-3/4">
            <div className="p-6">
              {renderSectionContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;