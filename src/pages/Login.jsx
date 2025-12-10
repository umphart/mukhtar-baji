import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BuildingStorefrontIcon, 
  LockClosedIcon, 
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Check if user is already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
        // Sign up new user
        const data = await signUp(email, password, { full_name: fullName });
        
        if (data.user) {
          setLoginSuccess(true);
          // Immediately redirect if we have a session (user is confirmed)
          if (data.session) {
            setTimeout(() => navigate('/'), 1000);
          }
        }
      } else {
        // Sign in existing user
        const data = await signIn(email, password);
        
        if (data.user) {
          setLoginSuccess(true);
          // Immediately redirect on successful login
          setTimeout(() => navigate('/'), 1000);
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      
      // User-friendly error messages
      let errorMessage = err.message;
      
      if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (err.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email to confirm your account first.';
      } else if (err.message.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (err.message.includes('500')) {
        errorMessage = 'Server error. Please try again later or contact support.';
      }
      
      setError(errorMessage);
      setLoginSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = () => {
    setEmail('admin@mukhtarmetal.com');
    setPassword('Admin@123');
  };

  // Success Alert Component
  const SuccessAlert = () => (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="rounded-lg bg-green-50 p-4 shadow-lg ring-1 ring-green-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-green-800">
              {isSignUp ? 'Account created successfully!' : 'Login successful!'}
            </p>
            <p className="mt-1 text-sm text-green-700">
              Redirecting to dashboard...
            </p>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={() => setLoginSuccess(false)}
                className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50"
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Error Alert Component
  const ErrorAlert = () => (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className="rounded-lg bg-red-50 p-4 shadow-lg ring-1 ring-red-100">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-red-800">Authentication Error</p>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={() => setError('')}
                className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50"
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // If user exists (already logged in), don't show login form
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Success Alert */}
      {loginSuccess && <SuccessAlert />}
      
      {/* Error Alert */}
      {error && <ErrorAlert />}
      
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="flex justify-center">
            <BuildingStorefrontIcon className="h-12 w-12 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Mukhtar Metal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp ? 'Create Admin Account' : 'Transaction Management System'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required={isSignUp}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field mt-1"
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field mt-1"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field mt-1"
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
              />
              {isSignUp && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 6 characters
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSignUp ? (
                <>
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  {loading ? 'Creating Account...' : 'Create Account'}
                </>
              ) : (
                <>
                  <LockClosedIcon className="h-5 w-5 mr-2" />
                  {loading ? 'Signing in...' : 'Sign in'}
                </>
              )}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setLoginSuccess(false);
                setFullName('');
              }}
              className="text-primary-600 hover:text-primary-500 font-medium transition-colors duration-200"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>

          {/* For testing - quick login button */}
          {!isSignUp && process.env.NODE_ENV === 'development' && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleQuickLogin}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Use test credentials
              </button>
            </div>
          )}
        </form>

        {/* Default Credentials Hint */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            <strong>First time?</strong> Click "Need an account? Sign up" to create admin account
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;