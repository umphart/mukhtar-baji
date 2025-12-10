import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  PlusCircleIcon,
  MinusCircleIcon,
} from '@heroicons/react/24/outline';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  const fetchTransactions = async () => {
    setLoading(true);
    
    let query = supabase
      .from('transactions')
      .select(`
        *,
        customers(name)
      `)
      .order('created_at', { ascending: false });

    if (filterType !== 'all') {
      query = query.eq('type', filterType);
    }

    const { data, error } = await query;

    if (!error) {
      setTransactions(data || []);
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Map transaction types to display labels
  const getTransactionLabel = (type) => {
    switch (type) {
      case 'topup':
        return 'Money In (Top-up)';
      case 'customer_deposit':
        return 'Money Out (Customer Deposit)';
      case 'withdrawal':
        return 'Money Out (Withdrawal)';
      default:
        return type;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'topup':
        return 'bg-green-100 text-green-800';
      case 'customer_deposit':
      case 'withdrawal':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'topup':
        return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
      case 'customer_deposit':
      case 'withdrawal':
        return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAmountColor = (type) => {
    switch (type) {
      case 'topup':
        return 'text-green-600';
      case 'customer_deposit':
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAmountSign = (type) => {
    switch (type) {
      case 'topup':
        return '+';
      case 'customer_deposit':
      case 'withdrawal':
        return '-';
      default:
        return '';
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const moneyIn = transactions
      .filter(tx => tx.type === 'topup')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    const moneyOut = transactions
      .filter(tx => tx.type === 'customer_deposit' || tx.type === 'withdrawal')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    const netFlow = moneyIn - moneyOut;
    
    return {
      moneyIn,
      moneyOut,
      netFlow,
      totalTransactions: transactions.length,
    };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600">View all financial transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Money In (Top-ups)</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {formatCurrency(totals.moneyIn)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <PlusCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Money Out (Deposits)</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {formatCurrency(totals.moneyOut)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <MinusCircleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Flow</p>
              <p className={`text-2xl font-bold mt-2 ${
                totals.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {totals.netFlow >= 0 ? '+' : ''}{formatCurrency(totals.netFlow)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg border ${
                filterType === 'all'
                  ? 'bg-primary-100 border-primary-500 text-primary-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Transactions
            </button>
            <button
              onClick={() => setFilterType('topup')}
              className={`px-4 py-2 rounded-lg border ${
                filterType === 'topup'
                  ? 'bg-green-100 border-green-500 text-green-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Money In (Top-ups)
            </button>
            <button
              onClick={() => setFilterType('customer_deposit')}
              className={`px-4 py-2 rounded-lg border ${
                filterType === 'customer_deposit'
                  ? 'bg-red-100 border-red-500 text-red-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Money Out (Customer Deposits)
            </button>
            <button
              onClick={() => setFilterType('withdrawal')}
              className={`px-4 py-2 rounded-lg border ${
                filterType === 'withdrawal'
                  ? 'bg-orange-100 border-orange-500 text-orange-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Money Out (Withdrawals)
            </button>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">Total Transactions</p>
          <p className="text-xl font-bold text-gray-900">
            {transactions.length}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            <div className="flex items-center text-gray-500">
              <FunnelIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">
                {filterType === 'all' ? 'All' : 
                 filterType === 'topup' ? 'Money In (Top-ups)' :
                 filterType === 'customer_deposit' ? 'Money Out (Customer Deposits)' :
                 filterType === 'withdrawal' ? 'Money Out (Withdrawals)' : 
                 filterType} Transactions
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-600">No transactions found</p>
              <p className="text-sm text-gray-500">Try changing your filter</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTypeIcon(transaction.type)}
                        <span className="ml-2 font-medium">
                          {getTransactionLabel(transaction.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transaction.customers?.name || 'System'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {transaction.type === 'topup' 
                          ? 'Wallet top-up' 
                          : transaction.type === 'customer_deposit'
                          ? `Customer deposit: ${transaction.customers?.name || 'Unknown'}`
                          : transaction.type === 'withdrawal'
                          ? 'Withdrawal from wallet'
                          : 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`font-bold ${getAmountColor(transaction.type)}`}>
                        {getAmountSign(transaction.type)}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(transaction.created_at), 'MMM dd, yyyy hh:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status || 'completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Footer */}
        {transactions.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Money In (Top-ups)</p>
                  <p className="font-bold text-green-600">
                    {formatCurrency(totals.moneyIn)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Money Out (Deposits)</p>
                  <p className="font-bold text-red-600">
                    {formatCurrency(totals.moneyOut)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Net Flow</p>
                  <p className={`font-bold ${totals.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totals.netFlow >= 0 ? '+' : ''}{formatCurrency(totals.netFlow)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;