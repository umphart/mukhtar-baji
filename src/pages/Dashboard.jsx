import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { useWallet } from '../contexts/WalletContext';
import { supabase } from '../lib/supabase';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CalendarIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const Dashboard = () => {
  const { walletBalance, getDailyActivities, getTransactionHistory } = useWallet();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalTransactions: 0,
    todayIncome: 0,
    todayExpense: 0,
  });
  const [dailyActivities, setDailyActivities] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      // Get total customers
      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Get total transactions count
      const { count: transactionCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      // Get today's income/expense
      const today = new Date().toISOString().split('T')[0];
      const { data: todayTransactions } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('date', today);

      let todayIncome = 0;
      let todayExpense = 0;

      todayTransactions?.forEach(transaction => {
        if (transaction.type === 'topup') {
          todayIncome += transaction.amount || 0;
        } else if (transaction.type === 'customer_payment') {
          todayExpense += transaction.amount || 0;
        }
      });

      setStats({
        totalCustomers: customerCount || 0,
        totalTransactions: transactionCount || 0,
        todayIncome,
        todayExpense,
      });

      // Get daily activities
      const activities = await getDailyActivities();
      setDailyActivities(activities);

      // Get recent transactions
      const transactions = await getTransactionHistory(5);
      setRecentTransactions(transactions);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), 'hh:mm a');
  };

  const StatCard = ({ title, value, icon: Icon, color, prefix = '₦' }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {loading ? (
              <span className="inline-block h-8 w-24 bg-gray-200 rounded animate-pulse"></span>
            ) : (
              typeof value === 'number' ? formatCurrency(value) : value
            )}
          </p>
        </div>
        <div className={`h-12 w-12 rounded-full ${color} flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const getIcon = (type) => {
      switch (type) {
        case 'wallet_topup':
          return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
        case 'customer_payment':
          return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
        case 'customer_added':
          return <UserPlusIcon className="h-5 w-5 text-blue-500" />;
        default:
          return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />;
      }
    };

    const getColor = (type) => {
      switch (type) {
        case 'wallet_topup':
          return 'bg-green-100 text-green-800';
        case 'customer_payment':
          return 'bg-red-100 text-red-800';
        case 'customer_added':
          return 'bg-blue-100 text-blue-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-0">
        <div className="flex-shrink-0 mt-1">
          {getIcon(activity.activity_type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{activity.description}</p>
          {activity.amount && (
            <p className="text-sm font-medium mt-1">
              Amount: <span className="text-gray-600">{formatCurrency(activity.amount)}</span>
            </p>
          )}
          <div className="flex items-center mt-1">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getColor(activity.activity_type)}`}>
              {activity.activity_type.replace('_', ' ')}
            </span>
            <span className="ml-2 text-xs text-gray-500">{formatTime(activity.created_at)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
  
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your daily overview.</p>
        </div>

        {/* Main Wallet Card */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-medium">Main Wallet Balance</h2>
              <p className="text-3xl font-bold mt-2">{formatCurrency(walletBalance)}</p>
              <p className="text-primary-100 mt-1">As of {format(new Date(), 'MMM dd, yyyy hh:mm a')}</p>
            </div>

          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Income"
            value={stats.todayIncome}
            icon={ArrowUpIcon}
            color="bg-green-500"
          />
          <StatCard
            title="Today's Expense"
            value={stats.todayExpense}
            icon={ArrowDownIcon}
            color="bg-red-500"
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={UserGroupIcon}
            color="bg-blue-500"
          />
          <StatCard
            title="Total Transactions"
            value={stats.totalTransactions}
            icon={CurrencyDollarIcon}
            color="bg-purple-500"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Today's Activities</h2>
                  <p className="text-gray-600 text-sm mt-1">All activities for today</p>
                </div>
                <CalendarIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              {dailyActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No activities recorded today</p>
                </div>
              ) : (
                dailyActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              )}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
              <p className="text-gray-600 text-sm mt-1">Latest 5 transactions</p>
            </div>
            <div className="p-6">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <div className="flex items-center">
                          {transaction.type === 'topup' ? (
                            <ArrowUpIcon className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <ArrowDownIcon className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <p className="font-medium text-gray-900 capitalize">{transaction.type.replace('_', ' ')}</p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {transaction.customers?.name || 'No customer'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(transaction.created_at), 'MMM dd, hh:mm a')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'topup' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'topup' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
   
   
  );
};

export default Dashboard;