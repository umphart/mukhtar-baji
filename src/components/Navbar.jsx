import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ChevronDownIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import WalletTopUp from './WalletTopUp';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { walletBalance } = useWallet();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);

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
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="search"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="Search transactions, customers..."
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Wallet Balance */}
            <div className="hidden md:flex items-center space-x-2 bg-primary-50 px-3 py-2 rounded-lg">
              <div className="text-right">
                <p className="text-xs text-primary-700">Wallet Balance</p>
                <p className="font-bold text-primary-900">
                  {formatCurrency(walletBalance)}
                </p>
              </div>
              <button
                onClick={() => setShowTopUp(true)}
                className="p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                title="Top up wallet"
              >
                <PlusCircleIcon className="h-5 w-5" />
              </button>
            </div>

            <button className="relative p-1 text-gray-600 hover:text-gray-900">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <UserCircleIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.email || user?.user_metadata?.full_name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <ChevronDownIcon className="h-5 w-5 text-gray-500" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
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
      </nav>

      {showTopUp && (
        <WalletTopUp
          onClose={() => setShowTopUp(false)}
          onSuccess={() => {
            setShowTopUp(false);
            // You can add a success toast here
          }}
        />
      )}
    </>
  );
};

export default Navbar;