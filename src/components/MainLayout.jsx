import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { WalletProvider } from '../contexts/WalletContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import Header from './Header';

const MainLayout = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Header />
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </main>
            
            {/* Optional Footer */}
            <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-4 transition-colors duration-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  © {new Date().getFullYear()} Mukhtar Metal. All rights reserved.
                </p>
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Kano, Nigeria | +234 803 602 0619
                </p>
              </div>
            </footer>
          </div>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default MainLayout;