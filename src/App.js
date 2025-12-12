import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AuthCallback from './pages/AuthCallback';
import EmailConfirm from './pages/EmailConfirm';
function App() {
  return (
    <Router>
      <AuthProvider>
        <WalletProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/customers" element={
              <ProtectedRoute>
                <MainLayout>
                  <Customers />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/transactions" element={
              <ProtectedRoute>
                <MainLayout>
                  <Transactions />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/auth/confirm" element={<EmailConfirm />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reports" element={
              <ProtectedRoute>
                <MainLayout>
                  <Reports />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <MainLayout>
                  <Settings />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </WalletProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;