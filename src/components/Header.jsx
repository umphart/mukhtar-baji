import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import ToggleDarkMode from './ToggleDarkMode';
import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ChevronDownIcon,
  PlusCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import WalletTopUp from './WalletTopUp';

const Header = () => {
  const { user, signOut } = useAuth();
  const { walletBalance, refreshBalance } = useWallet(); // Get refreshBalance
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Customers', href: '/customers', icon: UserGroupIcon },
    { name: 'Transactions', href: '/transactions', icon: CurrencyDollarIcon },
    { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200" style={{ 
  backgroundColor: '#6a88dbff', 
  color: 'white' 
}}>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex lg:items-center lg:space-x-8">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'text-primary-700 bg-primary-50'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  {item.name}
                </NavLink>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Wallet Balance (Desktop) */}
              <div className="hidden md:flex items-center space-x-2 bg-primary-50 px-3 py-2 rounded-lg">
                <div className="text-right">

                  <p className="font-bold text-primary-900">
                    {formatCurrency(walletBalance)}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setShowTopUp(true)}
                    className="p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                    title="Add money to wallet"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Search (Desktop) */}
              <div className="hidden lg:block relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="search"
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Search..."
                />
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <UserCircleIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <ChevronDownIcon className="h-5 w-5 text-gray-500 hidden md:block" />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <button
                      onClick={() => navigate('/settings')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Wallet Balance */}
        <div className="lg:hidden bg-primary-50 px-4 py-2 border-t border-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary-700">Wallet Balance</p>
              <p className="font-bold text-primary-900">
                {formatCurrency(walletBalance)}
              </p>
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => refreshBalance && refreshBalance()}
                className="p-1.5 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition"
                title="Refresh balance"
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowTopUp(true)}
                className="p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                title="Add money to wallet"
              >
                <PlusCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-3 text-base font-medium rounded-md ${
                      isActive
                        ? 'text-primary-700 bg-primary-50'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <item.icon className="h-6 w-6 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </div>
            
            {/* Mobile Search */}
            <div className="px-4 py-3 border-t border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="search"
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  placeholder="Search..."
                />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Wallet Top Up Modal */}
      {showTopUp && (
        <WalletTopUp
          onClose={() => setShowTopUp(false)}
          onSuccess={() => setShowTopUp(false)}
        />
      )}
    </>
  );
};

export default Header;