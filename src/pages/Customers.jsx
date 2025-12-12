import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  UserIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import CustomerForm from '../components/CustomerForm';
import { format, startOfDay, isToday, parseISO } from 'date-fns';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'all'
  const [stats, setStats] = useState({
    todayCount: 0,
    todayTotal: 0,
    allCount: 0,
    allTotal: 0,
    avgDeposit: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, [activeTab]);

  const fetchCustomers = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply date filter for today's tab
      if (activeTab === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        query = query.or(`created_at.gte.${today.toISOString()},updated_at.gte.${today.toISOString()}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setCustomers(data || []);
      
      // Calculate statistics
      calculateStats(data || []);
      
      // Calculate total deposits
      const total = (data || []).reduce((sum, customer) => sum + (customer.amount || 0), 0);
      setTotalDeposits(total);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (customerData) => {
    const today = startOfDay(new Date());
    
    // Filter today's customers
    const todayCustomers = customerData.filter(customer => {
      const createdToday = parseISO(customer.created_at) >= today;
      const updatedToday = customer.updated_at && parseISO(customer.updated_at) >= today;
      return createdToday || updatedToday;
    });

    const todayTotal = todayCustomers.reduce((sum, customer) => sum + (customer.amount || 0), 0);
    const allTotal = customerData.reduce((sum, customer) => sum + (customer.amount || 0), 0);
    const avgDeposit = customerData.length > 0 ? allTotal / customerData.length : 0;

    setStats({
      todayCount: todayCustomers.length,
      todayTotal,
      allCount: customerData.length,
      allTotal,
      avgDeposit
    });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"?`)) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (!error) {
        fetchCustomers();
      }
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
  };

  const formatRelativeTime = (dateString) => {
    const date = parseISO(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return format(date, 'MMM dd, yyyy');
    }
  };

  const exportToCSV = () => {
    const headers = ['Customer Name', 'Deposit Amount', 'Status', 'Created Date', 'Last Updated'];
    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map(customer => [
        `"${customer.name}"`,
        customer.amount,
        customer.status,
        format(new Date(customer.created_at), 'yyyy-MM-dd HH:mm:ss'),
        format(new Date(customer.updated_at), 'yyyy-MM-dd HH:mm:ss'),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${format(new Date(), 'yyyy-MM-dd')}_${activeTab}.csv`;
    a.click();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const isCustomerToday = (customer) => {
    const today = startOfDay(new Date());
    const createdToday = parseISO(customer.created_at) >= today;
    const updatedToday = customer.updated_at && parseISO(customer.updated_at) >= today;
    return createdToday || updatedToday;
  };

  return (
    <div className="space-y-6">
      {/* Header with Enhanced Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Track and manage customer deposits</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Customers Card */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Customers</p>
                <p className="text-xl font-bold">{stats.todayCount}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Total: {formatCurrency(stats.todayTotal)}
              </p>
            </div>
          </div>
          
          {/* Total Customers Card */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <UserIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">All Customers</p>
                <p className="text-xl font-bold">{stats.allCount}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Total: {formatCurrency(stats.allTotal)}
              </p>
            </div>
          </div>
          
          {/* Average Deposit Card */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Deposit</p>
                <p className="text-xl font-bold">{formatCurrency(stats.avgDeposit)}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Per customer
              </p>
            </div>
          </div>
          
          {/* Recent Activity Card */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                <ClockIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Deposits</p>
                <p className="text-xl font-bold">{formatCurrency(stats.todayTotal)}</p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {stats.todayCount} transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab('today');
                setSearchTerm('');
              }}
              className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors relative ${
                activeTab === 'today'
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CalendarDaysIcon className="h-5 w-5" />
                Today's Customers
                {activeTab === 'today' && (
                  <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2 py-1 rounded-full">
                    {stats.todayCount}
                  </span>
                )}
              </div>
              {activeTab === 'today' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
              )}
            </button>
            
            <button
              onClick={() => {
                setActiveTab('all');
                setSearchTerm('');
              }}
              className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors relative ${
                activeTab === 'all'
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserIcon className="h-5 w-5" />
                All Customers
                {activeTab === 'all' && (
                  <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full">
                    {stats.allCount}
                  </span>
                )}
              </div>
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={`Search ${activeTab === 'today' ? "today's" : 'all'} customers by name...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={exportToCSV}
                className="btn-secondary flex items-center"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Export {activeTab === 'today' ? "Today's" : 'All'} CSV
              </button>
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setShowForm(true);
                }}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Customer
              </button>
            </div>
          </div>
        </div>

        {/* Customers List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              Loading {activeTab === 'today' ? "today's" : 'all'} customers...
            </p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              {activeTab === 'today' ? (
                <CalendarDaysIcon className="h-12 w-12 mx-auto" />
              ) : (
                <UserIcon className="h-12 w-12 mx-auto" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm 
                ? 'No customers found'
                : activeTab === 'today' 
                  ? 'No customers added today'
                  : 'No customers yet'
              }
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {searchTerm 
                ? 'Try a different search term'
                : activeTab === 'today'
                  ? 'Customers added or updated today will appear here'
                  : 'Get started by adding your first customer'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 btn-primary inline-flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Customer
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deposit Amount
                  </th>
                  <th className="px6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'today' ? 'Last Activity' : 'Created Date'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'today' ? 'Time' : 'Last Updated'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => {
                  const isTodayCustomer = isCustomerToday(customer);
                  const lastActivityDate = customer.updated_at || customer.created_at;
                  
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center ${
                            isTodayCustomer ? 'bg-green-100' : 'bg-primary-100'
                          }`}>
                            <span className={`font-medium ${
                              isTodayCustomer ? 'text-green-600' : 'text-primary-600'
                            }`}>
                              {customer.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.name}
                              </div>
                              {isTodayCustomer && activeTab === 'all' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  <CalendarDaysIcon className="h-3 w-3" />
                                  Today
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {customer.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(customer.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(customer.status)}`}>
                            {customer.status.toUpperCase()}
                          </span>
                          {customer.amount > 0 && (
                            <span className="text-xs text-gray-500">
                              Active deposit
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {activeTab === 'today' 
                            ? formatRelativeTime(lastActivityDate)
                            : formatTime(customer.created_at)
                          }
                        </div>
                        {activeTab === 'today' && (
                          <div className="text-xs text-gray-500">
                            {customer.updated_at ? 'Updated' : 'Created'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {activeTab === 'today'
                            ? format(new Date(lastActivityDate), 'hh:mm a')
                            : formatTime(customer.updated_at)
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(customer)}
                            className="text-primary-600 hover:text-primary-900 p-1 hover:bg-primary-50 rounded transition-colors"
                            title="Edit customer"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Delete customer"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Footer */}
        {filteredCustomers.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  Showing {filteredCustomers.length} {activeTab === 'today' ? "today's" : ''} customers
                  {activeTab === 'all' && ` of ${customers.length} total`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {activeTab === 'today' ? "Today's Total" : 'Filtered Total'}
                </p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(filteredCustomers.reduce((sum, customer) => sum + (customer.amount || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingCustomer(null);
            fetchCustomers();
          }}
          isTodayTab={activeTab === 'today'}
        />
      )}
    </div>
  );
};

export default Customers;