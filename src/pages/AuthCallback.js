// src/pages/AuthCallback.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the OAuth callback
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Redirect to dashboard or home page
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  return <div>Loading...</div>;
}