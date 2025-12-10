import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { 
  XMarkIcon, 
  PlusCircleIcon, 
  CheckCircleIcon,
  BanknotesIcon 
} from '@heroicons/react/24/outline';

const WalletTopUp = ({ onClose, onSuccess }) => {
  const { topUpWallet, walletBalance } = useWallet();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation - only basic validation
    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('Starting wallet top-up with amount:', amountNum);
      
      await topUpWallet(amountNum);
      
      // Show success message
      setSuccessMessage(`Successfully added ₦${formatCurrency(amountNum)} to your wallet!`);
      setSuccess(true);
      
      // Reset form
      setAmount('');
      
      // Close modal after 3 seconds and trigger onSuccess
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 3000);
      
    } catch (err) {
      console.error('Top-up error:', err);
      setError(err.message || 'Failed to top up wallet. Please try again.');
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

  // Format for display without currency symbol
  const formatNumber = (num) => {
    return num.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {success ? 'Top-up Successful!' : 'Add Money to Wallet'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Current balance: <span className="font-bold">{formatCurrency(walletBalance)}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Success Alert */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Transaction Successful!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>{successMessage}</p>
                    <p className="mt-1">
                      New balance: <span className="font-bold">{formatCurrency(walletBalance)}</span>
                    </p>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs text-green-600">
                      This window will close automatically in 3 seconds...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && !success && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-5 w-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Amount
                </label>
                
                {/* Custom Amount Input */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-medium">₦</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setAmount(value);
                      }
                    }}
                    className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-lg"
                    placeholder="0.00"
                    required
                    autoFocus
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Enter any amount you wish to add
                </p>
              </div>

              {/* Balance Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <BanknotesIcon className="h-4 w-4 mr-2 text-blue-500" />
                  Balance Summary
                </h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600">Current Balance:</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(walletBalance)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-600">Top-up Amount:</span>
                    <span className="font-semibold text-blue-600">
                      {amount ? `+${formatCurrency(parseFloat(amount))}` : '₦0.00'}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">New Balance:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(walletBalance + (parseFloat(amount) || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !amount || parseFloat(amount) <= 0}
                  className={`px-5 py-2.5 rounded-lg transition duration-200 font-medium flex items-center ${
                    loading || !amount || parseFloat(amount) <= 0
                      ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                      : 'btn-primary hover:shadow-lg'
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <PlusCircleIcon className="h-5 w-5 mr-2" />
                      Add Money
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Success View
            <div className="text-center py-4">
              <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Top-up Complete!</h3>
              
              <div className="mb-6">
                <p className="text-gray-600">{successMessage}</p>
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">New Balance:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(walletBalance)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                >
                  Close Window
                </button>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setAmount('');
                  }}
                  className="w-full px-4 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition font-medium"
                >
                  Add More Money
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                This window will close automatically in a few seconds...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletTopUp;