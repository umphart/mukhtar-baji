// src/pages/EmailConfirm.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './EmailConfirm.css'; // Create this CSS file

export default function EmailConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || type !== 'signup') {
        setMessage('Invalid confirmation link');
        setSuccess(false);
        setLoading(false);
        return;
      }

      try {
        // Verify the email with Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup',
        });

        if (error) {
          throw error;
        }

        if (data?.user) {
          setMessage('Email confirmed successfully! You can now log in.');
          setSuccess(true);
          
          // Automatically sign in the user after confirmation
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (!sessionError && sessionData.session) {
            // User is now logged in, redirect to dashboard
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          } else {
            // User needs to log in manually
            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Email confirmation error:', error);
        setMessage(error.message || 'Failed to confirm email. Please try again.');
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <div className="email-confirm-container">
      <div className="email-confirm-card">
        {loading ? (
          <>
            <div className="spinner"></div>
            <h3>Confirming your email...</h3>
          </>
        ) : (
          <>
            <div className={`message ${success ? 'success' : 'error'}`}>
              <h3>{success ? 'Success!' : 'Error'}</h3>
              <p>{message}</p>
            </div>
            
            {success ? (
              <div className="actions">
                <p>Redirecting you shortly...</p>
                <button 
                  className="btn-primary" 
                  onClick={() => navigate('/login')}
                >
                  Go to Login Now
                </button>
              </div>
            ) : (
              <div className="actions">
                <button 
                  className="btn-primary" 
                  onClick={() => navigate('/signup')}
                >
                  Try Sign Up Again
                </button>
                <button 
                  className="btn-link" 
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}