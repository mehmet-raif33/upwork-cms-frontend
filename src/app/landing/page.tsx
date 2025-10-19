"use client"
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '../redux/store';
import { selectIsLoggedIn } from '../redux/sliceses/authSlices';
import { motion } from 'framer-motion';
import Image from 'next/image';

const LandingPage = () => {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const router = useRouter();

  // Redirect logged-in users to home page (only on landing page)
  useEffect(() => {
    if (isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  // Show loading for logged-in users
  if (isLoggedIn) {
    return (
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme === 'dark' ? 'from-slate-900 via-blue-900 to-slate-900' : 'from-blue-50 via-white to-blue-50'}`}>
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className={`inline-flex items-center justify-center rounded-lg shadow-lg mb-4 p-4 ${
              theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
            }`}>
              <Image
                src="/logo2025 (2).png"
                alt="Autapex Logo"
                width={220}
                height={110}
                className="object-contain"
              />
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`text-5xl md:text-6xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
          >
            Autapex
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={`text-xl md:text-2xl mb-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}
          >
            Business Management System
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className={`text-lg mb-12 max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}
          >
            With Autapex, record your vehicle transactions, calculate revenue, and 
            easily manage all your business&apos;s financial data.
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
          >
            <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/80 border border-gray-200'} shadow-lg`}>
              <div className="text-3xl mb-4">🚗</div>
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Vehicle Transactions
              </h3>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Record, track your vehicle transactions and get detailed reports.
              </p>
            </div>

            <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/80 border border-gray-200'} shadow-lg`}>
              <div className="text-3xl mb-4">💰</div>
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Revenue Calculation
              </h3>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Categorize your income and expense transactions, calculate revenue.
              </p>
            </div>

            <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50 border border-slate-700' : 'bg-white/80 border border-gray-200'} shadow-lg`}>
              <div className="text-3xl mb-4">📊</div>
              <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Business Reports
              </h3>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Track your business performance and get detailed financial reports.
              </p>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth')}
              className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-lg ${
                theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              Login
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage; 