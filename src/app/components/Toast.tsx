"use client"
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  isVisible, 
  onClose, 
  duration = 4000 
}) => {
  const theme = useSelector((state: RootState) => state.theme.theme);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getToastStyles = () => {
    // Mobile-first responsive design
    const baseStyles = "fixed z-50 p-4 rounded-lg shadow-lg border backdrop-blur-sm transition-all duration-200";
    
    // Mobile: bottom center, full width with margins
    // Desktop: top right, max width
    const responsiveStyles = `
      bottom-4 left-4 right-4 mx-auto max-w-sm
      md:top-4 md:right-4 md:left-auto md:bottom-auto md:mx-0
    `;
    
    switch (type) {
      case 'success':
        return `${baseStyles} ${responsiveStyles} ${
          theme === 'dark' 
            ? 'bg-green-900/95 border-green-700 text-green-100' 
            : 'bg-green-50 border-green-200 text-green-800'
        }`;
      case 'error':
        return `${baseStyles} ${responsiveStyles} ${
          theme === 'dark' 
            ? 'bg-red-900/95 border-red-700 text-red-100' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`;
      case 'warning':
        return `${baseStyles} ${responsiveStyles} ${
          theme === 'dark' 
            ? 'bg-yellow-900/95 border-yellow-700 text-yellow-100' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`;
      case 'info':
        return `${baseStyles} ${responsiveStyles} ${
          theme === 'dark' 
            ? 'bg-blue-900/95 border-blue-700 text-blue-100' 
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`;
      default:
        return `${baseStyles} ${responsiveStyles} ${
          theme === 'dark' 
            ? 'bg-gray-900/95 border-gray-700 text-gray-100' 
            : 'bg-gray-50 border-gray-200 text-gray-800'
        }`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-green-700' : 'bg-green-100'
          }`}>
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-red-700' : 'bg-red-100'
          }`}>
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-yellow-700' : 'bg-yellow-100'
          }`}>
            <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            theme === 'dark' ? 'bg-blue-700' : 'bg-blue-100'
          }`}>
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.3 
          }}
          className={getToastStyles()}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-5 break-words">
                {message}
              </p>
            </div>
            <div className="flex-shrink-0 ml-3">
              <button
                onClick={onClose}
                className={`inline-flex rounded-md p-2 transition-colors duration-200 hover:bg-opacity-20 touch-manipulation ${
                  theme === 'dark' 
                    ? 'hover:bg-white hover:bg-opacity-20' 
                    : 'hover:bg-black hover:bg-opacity-10'
                }`}
                aria-label="Kapat"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`h-1 mt-3 rounded-full ${
              type === 'success' ? 'bg-green-400' :
              type === 'error' ? 'bg-red-400' :
              type === 'warning' ? 'bg-yellow-400' :
              'bg-blue-400'
            }`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast; 