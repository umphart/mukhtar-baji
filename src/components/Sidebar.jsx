import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Customers', href: '/customers', icon: UserGroupIcon },
    { name: 'Transactions', href: '/transactions', icon: CurrencyDollarIcon },
    { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow border-r border-gray-200 pt-5 bg-white overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-6">
          <BuildingStorefrontIcon className="h-8 w-8 text-primary-600" />
          <span className="ml-3 text-xl font-bold text-gray-900">Mukhtar Metal</span>
        </div>
        
        <div className="mt-8 flex-1 flex flex-col">
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    window.location.pathname === item.href
                      ? 'text-primary-600'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-sm font-medium text-primary-900">Daily Balance</p>
            <p className="text-2xl font-bold text-primary-700 mt-1">₹45,250.00</p>
            <p className="text-xs text-primary-600 mt-1">Updated just now</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;