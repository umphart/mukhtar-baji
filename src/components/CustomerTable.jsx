import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useWallet } from '../contexts/WalletContext';
import { PencilIcon, TrashIcon, PlusIcon, CalendarDaysIcon, UsersIcon } from '@heroicons/react/24/outline';
import CustomerForm from './CustomerForm';

const CustomerTable = () => {
  const { walletBalance, refreshBalance } = useWallet();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCount: 0,
    allTimeTotal: 0,
    allTimeCount: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'all' && searchTerm) {
      debouncedSearch(searchTerm);
    }
  }, [searchTerm, activeTab]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeTab === 'today') {
        // Get today's customers (created or updated today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        query = query.or(`created_at.gte.${today.toISOString()},updated_at.gte.${today.toISOString()}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setCustomers(data || []);
      
      // Calculate statistics
      calculateStats(data);
      
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (customerData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayCustomers = customerData?.filter(customer => {
      const createdToday = new Date(customer.created_at) >= today;
      const updatedToday = customer.updated_at && new Date(customer.updated_at) >= today;
      return createdToday || updatedToday;
    }) || [];

    const todayTotal = todayCustomers.reduce((sum, customer) => sum + (customer.amount || 0), 0);
    const allTimeTotal = customerData?.reduce((sum, customer) => sum + (customer.amount || 0), 0) || 0;

    setStats({
      todayTotal,
      todayCount: todayCustomers.length,
      allTimeTotal,
      allTimeCount: customerData?.length || 0
    });
  };

  const debouncedSearch = React.useCallback(
    debounce(async (term) => {
      if (!term.trim()) {
        fetchCustomers();
        return;
      }

      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .or(`name.ilike.%${term}%,id.ilike.%${term}%`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCustomers(data || []);
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300),
    []
  );

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh customers list
      await fetchCustomers();
      await refreshBalance();
      
      alert(`Customer "${name}" deleted successfully`);
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('Failed to delete customer');
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
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
      return date.toLocaleDateString('en-NG', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  // Statistics Cards
  const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      {/* Header with Stats */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600">Manage customer deposits and records</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Customer
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Today's Customers"
            value={stats.todayCount}
            icon={CalendarDaysIcon}
            color="blue"
          />
          <StatCard
            title="Today's Total"
            value={formatCurrency(stats.todayTotal)}
            icon={CalendarDaysIcon}
            color="green"
          />
          <StatCard
            title="All Customers"
            value={stats.allTimeCount}
            icon={UsersIcon}
            color="purple"
          />
          <StatCard
            title="All Time Total"
            value={formatCurrency(stats.allTimeTotal)}
            icon={UsersIcon}
            color="orange"
          />
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => {
                setActiveTab('today');
                setSearchTerm('');
              }}
              className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors ${
                activeTab === 'today'
                  ? 'border-b-2 border-primary-600 text-primary-600'
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
            </button>
            
            <button
              onClick={() => {
                setActiveTab('all');
                setSearchTerm('');
              }}
              className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors ${
                activeTab === 'all'
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UsersIcon className="h-5 w-5" />
                All Customers
                {activeTab === 'all' && (
                  <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full">
                    {stats.allTimeCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Search Bar (only for All Customers tab) */}
        {activeTab === 'all' && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search customers by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600">Loading customers...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-2">{error}</div>
              <button
                onClick={fetchCustomers}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Retry
              </button>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <UsersIcon className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'today' ? 'No customers added today' : 'No customers found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'today' 
                  ? 'Customers added or updated today will appear here'
                  : searchTerm 
                    ? 'Try a different search term'
                    : 'Get started by adding your first customer'}
              </p>
              {!searchTerm && activeTab === 'today' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  Add Your First Customer Today
                </button>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deposit Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeTab === 'today' ? 'Added/Updated' : 'Created'}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        <div className="text-xs text-gray-500">ID: {customer.id.substring(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(customer.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(activeTab === 'today' ? (customer.updated_at || customer.created_at) : customer.created_at)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(customer.created_at).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        new Date(customer.created_at).toDateString() === new Date().toDateString()
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {new Date(customer.created_at).toDateString() === new Date().toDateString()
                          ? 'New Today'
                          : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingCustomer(customer);
                            setShowForm(true);
                          }}
                          className="text-primary-600 hover:text-primary-900 flex items-center gap-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id, customer.name)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 ml-4"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer with summary */}
        {customers.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">{customers.length}</span> customers
                {activeTab === 'today' ? ' added/updated today' : ''}
              </div>
              <div className="text-sm font-semibold text-gray-900">
                Total: {formatCurrency(
                  customers.reduce((sum, customer) => sum + (customer.amount || 0), 0)
                )}
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
  onSuccess={handleSuccess}
  isTodayTab={activeTab === 'today'} // Pass this prop
/>
      )}
    </div>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default CustomerTable;