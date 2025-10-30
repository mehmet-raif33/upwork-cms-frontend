'use client'
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from './redux/store';
import { selectIsLoggedIn } from './redux/sliceses/authSlices';
import NavbarCom from './components/NavbarCom';
import AuthInitializer from './components/AuthInitializer';
import ReduxProvider from './components/ReduxProvider';
import ThemeEffect from './components/ThemeEffect';
import Toast from './components/Toast';

// Toast context
interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const AppLayoutClient: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    isVisible: boolean;
    duration: number;
  }>({
    message: '',
    type: 'success',
    isVisible: false,
    duration: 4000
  });

  // Show toast function
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning', duration: number = 4000) => {
    setToast({
      message,
      type,
      isVisible: true,
      duration
    });
  };

  // Close toast function
  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  useEffect(() => {
    setMounted(true);
    setCurrentPath(window.location.pathname);
  }, []);

  // ✅ Auth kontrolü tamamen kaldırıldı - Sadece AuthInitializer yönlendirme yapacak

  // Check if current page is auth or landing page
  const isAuthOrLandingPage = currentPath === '/auth' || currentPath === '/landing';

  if (!mounted) {
    return (
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div className={`min-h-screen transition-all duration-300 ${
        theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'
      }`}>
        <ThemeEffect />
        <AuthInitializer />
        
        {/* Navbar - Show only if logged in and not on auth/landing pages */}
        {isLoggedIn && !isAuthOrLandingPage && <NavbarCom isOpen={isOpen} setIsOpen={setIsOpen} />}
        
        {/* Main Content */}
        <main className={`transition-all duration-300 ${
          isLoggedIn && !isAuthOrLandingPage 
            ? `pt-14 lg:pt-0 ${isOpen ? 'lg:ml-64' : 'lg:ml-18'}` // Add top padding for mobile navbar and dynamic left margin for desktop sidebar
            : ''
        } ${
          // Conditional bottom padding - remove on auth and landing pages for mobile
          isAuthOrLandingPage 
            ? 'pb-0' 
            : 'pb-18 lg:pb-0' // Bottom padding for mobile to account for bottom navigation (h-18 = 72px)
        }`}>
          {children}
        </main>

        {/* Toast Component */}
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={toast.isVisible}
          onClose={closeToast}
          duration={toast.duration}
        />
      </div>
    </ToastContext.Provider>
  );
};

// Wrapper component with Redux Provider
const AppLayoutWithProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ReduxProvider>
      <AppLayoutClient>{children}</AppLayoutClient>
    </ReduxProvider>
  );
};

export default AppLayoutWithProvider; 