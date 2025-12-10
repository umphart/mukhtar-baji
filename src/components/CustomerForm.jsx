import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useWallet } from '../contexts/WalletContext';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const CustomerForm = ({ customer, onClose, onSuccess }) => {
  const { walletBalance, deductFromWallet } = useWallet();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [insufficientBalance, setInsufficientBalance] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        amount: customer.amount === 0 ? '' : customer.amount.toString(),
      });
    }
  }, [customer]);

  // Check balance when amount changes
  useEffect(() => {
    const amountNum = parseFloat(formData.amount) || 0;
    if (amountNum > walletBalance) {
      setInsufficientBalance(true);
    } else {
      setInsufficientBalance(false);
    }
  }, [formData.amount, walletBalance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!formData.name.trim()) {
        throw new Error('Customer name is required');
      }

      const amountNum = parseFloat(formData.amount) || 0;
      
      if (amountNum < 0) {
        throw new Error('Amount cannot be negative');
      }

      if (!customer && amountNum > walletBalance) {
        throw new Error(`Insufficient wallet balance. Available: ₦${walletBalance.toLocaleString()}`);
      }

      console.log('Creating customer with amount:', amountNum);
      console.log('Current wallet balance:', walletBalance);

      if (customer) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update({
            name: formData.name,
            amount: amountNum,
          })
          .eq('id', customer.id);

        if (error) throw error;
        
        setSuccessMessage(`Customer "${formData.name}" updated successfully with deposit of ₦${formatCurrency(amountNum)}`);
      } else {
        // Create new customer
        const { data, error } = await supabase
          .from('customers')
          .insert([{
            name: formData.name,
            amount: amountNum,
          }])
          .select()
          .single();

        if (error) throw error;

        console.log('Customer created successfully:', data);

        // Deduct amount from wallet
        if (amountNum > 0) {
          console.log('Deducting from wallet:', amountNum);
          try {
            await deductFromWallet(
              amountNum,
              `Customer deposit: ${formData.name}`,
              data.id
            );
            console.log('Wallet deduction successful');
          } catch (deductError) {
            console.error('Wallet deduction failed:', deductError);
            // Delete the customer if wallet deduction fails
            await supabase
              .from('customers')
              .delete()
              .eq('id', data.id);
            throw new Error(`Failed to deduct from wallet: ${deductError.message}`);
          }
        }

        // Log daily activity
        try {
          await supabase.rpc('log_daily_activity', {
            p_activity_type: 'customer_added',
            p_description: `Added customer: ${formData.name} with deposit of ₦${amountNum}`,
            p_amount: amountNum,
            p_reference_id: data.id
          });
        } catch (activityError) {
          console.error('Failed to log activity:', activityError);
          // Don't throw - this is a non-critical error
        }
        
        setSuccessMessage(`Customer "${formData.name}" added successfully! ₦${formatCurrency(amountNum)} deducted from wallet.`);
      }

      console.log('Customer operation completed successfully');
      
      // Show success message
      setSuccess(true);
      
      // Reset form after successful submission
      if (!customer) {
        setFormData({
          name: '',
          amount: '',
        });
      }
      
      // Close form after 2 seconds and trigger onSuccess callback
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error in customer form:', err);
      setError(err.message);
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

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData({ ...formData, amount: value });
    }
  };

  const amountNum = parseFloat(formData.amount) || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {customer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Wallet Balance Info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-800">Available Balance:</span>
              <span className="text-lg font-bold text-blue-900">
                {formatCurrency(walletBalance)}
              </span>
            </div>
          </div>

          {/* Success Alert */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg animate-fade-in">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="font-medium">Success!</span>
              </div>
              <p className="mt-1 text-sm">{successMessage}</p>
              <p className="mt-2 text-xs text-green-600">
                Closing automatically in 2 seconds...
              </p>
            </div>
          )}

          {/* Error Alert */}
          {error && !success && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {insufficientBalance && !customer && !success && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
              <p className="font-medium">⚠️ Insufficient Balance</p>
              <p className="text-sm mt-1">
                You need ₦{formatCurrency(amountNum - walletBalance)} more to add this customer.
              </p>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter customer name"
                  autoFocus
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deposit Amount (₦) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">₦</span>
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    className={`pl-10 pr-4 py-3 w-full border ${
                      insufficientBalance ? 'border-yellow-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none`}
                    placeholder="0.00"
                    required
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This amount will be deducted from your wallet balance
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer Name:</span>
                    <span className="font-medium">{formData.name || '--'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deposit Amount:</span>
                    <span className="font-medium">
                      {formData.amount ? formatCurrency(amountNum) : '₦0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">New Wallet Balance:</span>
                    <span className={`font-bold ${
                      !customer && amountNum > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {formatCurrency(walletBalance - (customer ? 0 : amountNum))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || insufficientBalance || !formData.amount}
                  className={`px-4 py-2 rounded-lg transition duration-200 ${
                    loading || insufficientBalance || !formData.amount
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                      : 'btn-primary'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : customer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          ) : (
            // Success state - show only success message
            <div className="text-center py-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Operation Successful!</h3>
              <p className="text-gray-600 mb-4">{successMessage}</p>
              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;