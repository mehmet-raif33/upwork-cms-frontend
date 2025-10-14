"use client"
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  type = 'danger',
  icon = '⚠️'
}) => {
  const theme = useSelector((state: RootState) => state.theme.theme);

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: theme === 'dark' ? 'bg-red-900/20' : 'bg-red-100',
          iconColor: 'text-red-600',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          borderColor: theme === 'dark' ? 'border-red-700' : 'border-red-200'
        };
      case 'warning':
        return {
          iconBg: theme === 'dark' ? 'bg-yellow-900/20' : 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
          borderColor: theme === 'dark' ? 'border-yellow-700' : 'border-yellow-200'
        };
      case 'info':
        return {
          iconBg: theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-100',
          iconColor: 'text-blue-600',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
          borderColor: theme === 'dark' ? 'border-blue-700' : 'border-blue-200'
        };
      default:
        return {
          iconBg: theme === 'dark' ? 'bg-red-900/20' : 'bg-red-100',
          iconColor: 'text-red-600',
          buttonBg: 'bg-red-600 hover:bg-red-700',
          borderColor: theme === 'dark' ? 'border-red-700' : 'border-red-200'
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black/50' : 'bg-black/30'} backdrop-blur-sm`} />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
            className={`relative w-full max-w-md rounded-2xl shadow-2xl border backdrop-blur-sm ${
              theme === 'dark' 
                ? 'bg-slate-800/95 border-slate-700' 
                : 'bg-white/95 border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${styles.borderColor}`}>
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${styles.iconBg}`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    theme === 'dark' 
                      ? 'hover:bg-slate-700 text-gray-400 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className={`p-6 border-t ${styles.borderColor} flex space-x-3`}>
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-all duration-200 ${styles.buttonBg}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal; 