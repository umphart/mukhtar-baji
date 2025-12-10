import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const WalletContext = createContext({});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }) => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletBalance();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('wallet_balance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_balance',
          filter: 'id=eq.00000000-0000-0000-0000-000000000000'
        },
        () => {
          fetchWalletBalance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper function to create/ensure wallet balance record exists
  const ensureWalletBalanceExists = async () => {
    try {
      // Try to get existing balance
      const { data, error } = await supabase
        .from('wallet_balance')
        .select('balance')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .maybeSingle(); // Use maybeSingle to avoid error if no rows

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking wallet balance:', error);
        return false;
      }

      // If no data exists, create it
      if (!data) {
        console.log('Creating initial wallet balance...');
        const { error: insertError } = await supabase
          .from('wallet_balance')
          .insert([{
            id: '00000000-0000-0000-0000-000000000000',
            balance: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          console.error('Error creating wallet balance:', insertError);
          return false;
        }
        console.log('Initial wallet balance created');
      }

      return true;
    } catch (error) {
      console.error('Error in ensureWalletBalanceExists:', error);
      return false;
    }
  };

  const fetchWalletBalance = async () => {
    try {
      // First ensure wallet balance record exists
      await ensureWalletBalanceExists();

      // Now fetch the balance
      const { data, error } = await supabase
        .from('wallet_balance')
        .select('balance')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .maybeSingle(); // Use maybeSingle instead of single

      if (error) {
        console.error('Error fetching wallet balance:', error);
        setWalletBalance(0);
      } else {
        setWalletBalance(data?.balance || 0);
      }
    } catch (error) {
      console.error('Error in fetchWalletBalance:', error);
      setWalletBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const topUpWallet = async (amount) => {
    try {
      console.log('Starting top-up with amount:', amount);
      
      // Ensure wallet exists first
      await ensureWalletBalanceExists();

      // Get current balance before transaction
      const { data: beforeData } = await supabase
        .from('wallet_balance')
        .select('balance')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();
      
      const currentBalance = beforeData?.balance || 0;
      console.log('Balance before top-up:', currentBalance);

      // Try using RPC function first
      let newBalance;
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('update_wallet_balance', {
          p_amount: amount,
          p_operation: 'add'
        });

        if (rpcError) throw rpcError;
        
        newBalance = rpcData;
        console.log('RPC returned new balance:', newBalance);
      } catch (rpcError) {
        console.log('RPC failed, using direct update:', rpcError);
        
        // Direct update as fallback
        newBalance = currentBalance + amount;
        const { error: updateError } = await supabase
          .from('wallet_balance')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', '00000000-0000-0000-0000-000000000000');
          
        if (updateError) throw updateError;
      }

      // Get updated balance to verify
      const { data: afterData } = await supabase
        .from('wallet_balance')
        .select('balance')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();
      
      console.log('Balance after top-up:', afterData?.balance || 0);

      // Record transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert([{
          type: 'topup',
          amount: amount,
          status: 'completed'
        }]);

      if (txError) {
        console.error('Transaction insert error:', txError);
        // Don't throw - transaction recording is secondary
      }

      // Log activity
      try {
        await supabase.rpc('log_daily_activity', {
          p_activity_type: 'wallet_topup',
          p_amount: amount,
          p_description: `Wallet topped up with ₦${amount.toLocaleString()}`
        });
      } catch (activityError) {
        console.warn('Activity log failed:', activityError);
      }

      // Immediately update local state
      setWalletBalance(prev => {
        const updatedBalance = prev + amount;
        console.log('Updating local state from', prev, 'to', updatedBalance);
        return updatedBalance;
      });

      // Also refresh from database
      await fetchWalletBalance();
      
      console.log('Top-up completed successfully');
      return true;
    } catch (error) {
      console.error('Error topping up wallet:', error);
      throw error;
    }
  };

  const deductFromWallet = async (amount, description, customerId = null) => {
    try {
      // Ensure wallet exists first
      await ensureWalletBalanceExists();

      // Get current balance
      const { data: currentData } = await supabase
        .from('wallet_balance')
        .select('balance')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();
      
      const currentBalance = currentData?.balance || 0;
      
      // Check if sufficient balance
      if (currentBalance < amount) {
        throw new Error(`Insufficient wallet balance. Available: ₦${currentBalance.toLocaleString()}`);
      }

      // Immediately update local state
      setWalletBalance(currentBalance - amount);

      // Try RPC first
      try {
        const { error: rpcError } = await supabase.rpc('update_wallet_balance', {
          p_amount: amount,
          p_operation: 'subtract'
        });

        if (rpcError) throw rpcError;
      } catch (rpcError) {
        console.log('RPC failed, using direct update:', rpcError);
        
        // Direct update as fallback
        const newBalance = currentBalance - amount;
        const { error: updateError } = await supabase
          .from('wallet_balance')
          .update({ 
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', '00000000-0000-0000-0000-000000000000');
          
        if (updateError) throw updateError;
      }

      // Record transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert([{
          type: 'customer_deposit',
          customer_id: customerId,
          amount: amount,
          status: 'completed'
        }]);

      if (txError) {
        console.error('Transaction insert error:', txError);
        // Don't throw - transaction recording is secondary
      }

      // Log activity
      try {
        await supabase.rpc('log_daily_activity', {
          p_activity_type: 'customer_deposit',
          p_amount: amount,
          p_description: `Customer deposit: ${description || 'No description'}`
        });
      } catch (activityError) {
        console.warn('Activity log failed:', activityError);
      }

      // Refresh from database
      await fetchWalletBalance();
      return true;
    } catch (error) {
      console.error('Error deducting from wallet:', error);
      // Refresh state to ensure consistency
      await fetchWalletBalance();
      throw error;
    }
  };

  const getDailyActivities = async (date = new Date()) => {
    try {
      const { data, error } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('created_at::date', date.toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching daily activities:', error);
      return [];
    }
  };

  const getTransactionHistory = async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          customers(name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };

  const value = {
    walletBalance,
    loading,
    topUpWallet,
    deductFromWallet,
    getDailyActivities,
    getTransactionHistory,
    refreshBalance: fetchWalletBalance,
    ensureWalletBalanceExists
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};