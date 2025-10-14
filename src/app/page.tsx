"use client"
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from './redux/store';
import { selectIsLoggedIn, selectUser } from './redux/sliceses/authSlices';
import { motion } from 'framer-motion';
import { getVehiclesApi, getPersonnelApi, getTransactionsApi, getActivitiesApi, getTotalRevenueApi } from './api';
import { api } from '../lib/api-client';

// API base URL'ini al - APP_ENV'e göre sunucu seçimi
const getApiBaseUrl = () => {
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV || 'development';
  const baseUrl = appEnv === 'production'
    ? process.env.NEXT_PUBLIC_RAILWAY_SERVER || 'https://upwork-cms-backend-production.up.railway.app'
    : process.env.NEXT_PUBLIC_RAILWAY_LOCAL || 'http://localhost:5000';
  
  // /api prefix'i ekle
  return `${baseUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();

interface Stats {
  total_vehicles: number;
  total_personnel: number;
  total_transactions: number;
  total_amount: number;
  total_customers: number;
}

interface Activity {
  id: string;
  action: string;
  user_name?: string;
  created_at?: string;
  meta?: Record<string, unknown>;
}

export default function Home() {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // İstatistikleri ve aktiviteleri yükle
        await Promise.all([fetchStats(), fetchActivities()]);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setStatsLoading(true);
      setStatsError(null);

      const [vehiclesResponse, personnelResponse, transactionsResponse, totalRevenueResponse, customersResponse] = await Promise.all([
        getVehiclesApi(token),
        getPersonnelApi(token),
        getTransactionsApi(token),
        getTotalRevenueApi(token),
        api.getCustomers(token)
      ]);

      const vehicles = vehiclesResponse.data?.length || 0;
      const personnel = personnelResponse.data?.length || 0;
      const transactions = transactionsResponse.transactions || [];
      const totalAmount = totalRevenueResponse?.totalRevenue || 0;
      const customers = customersResponse?.pagination?.total || 0;

      setStats({
        total_vehicles: vehicles,
        total_personnel: personnel,
        total_transactions: transactions.length,
        total_amount: totalAmount,
        total_customers: customers
      });
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message || 'Could not load statistics' : 'Could not load statistics';
      setStatsError(errorMessage);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setActivitiesLoading(true);
      setActivitiesError(null);

      const activitiesResponse = await getActivitiesApi(token);
      const activitiesData = Array.isArray(activitiesResponse) ? activitiesResponse : [];
      
      setActivities(activitiesData.slice(0, 5)); // Son 5 aktiviteyi göster
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message || 'Could not load activities' : 'Could not load activities';
      setActivitiesError(errorMessage);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Show loading when loading
  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show loading for non-logged in users
  if (!isLoggedIn) {
    return (
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`flex-1 bg-gradient-to-br min-h-screen p-6 ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className={`text-4xl font-bold mb-3 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
          Welcome, {user?.name || 'User'}!
        </h1>
        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {statsLoading ? (
                      <div className="col-span-5 text-center text-gray-400">Loading...</div>
        ) : statsError ? (
          <div className="col-span-5 text-center text-red-500">{statsError}</div>
        ) : (
          <>
            <div className={`rounded-lg shadow-sm border p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}> 
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Vehicles</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{stats?.total_vehicles ?? '-'}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-blue-500 text-white">🚗</div>
              </div>
            </div>
            <div className={`rounded-lg shadow-sm border p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}> 
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Active Personnel</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{stats?.total_personnel ?? '-'}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-green-500 text-white">👥</div>
              </div>
            </div>
            <div className={`rounded-lg shadow-sm border p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}> 
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Transactions</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{stats?.total_transactions ?? '-'}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-purple-500 text-white">📊</div>
              </div>
            </div>
            <div className={`rounded-lg shadow-sm border p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}> 
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Revenue</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{stats?.total_amount ? `₺${Number(stats.total_amount).toLocaleString('en-US')}` : '-'}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-yellow-500 text-white">💰</div>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/customers')}
              className={`rounded-lg shadow-sm border p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
            > 
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Customers</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{stats?.total_customers ?? '-'}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-cyan-500 text-white">👥</div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className={`rounded-xl shadow-lg border p-6 mb-6 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-gray-200'}`}
      >
        <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
          🚀 Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* New Transaction */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/add-transaction')}
            className={`p-4 rounded-lg text-center transition-all duration-200 ${
              theme === 'dark' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="text-sm font-semibold">New Transaction</div>
          </motion.button>

          {/* Add Vehicle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/vehicles')}
            className={`p-4 rounded-lg text-center transition-all duration-200 ${
              theme === 'dark' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <div className="text-2xl mb-2">🚗</div>
            <div className="text-sm font-semibold">Add Vehicle</div>
          </motion.button>

          {/* Add Personnel */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/personnel')}
            className={`p-4 rounded-lg text-center transition-all duration-200 ${
              theme === 'dark' 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm font-semibold">Add Personnel</div>
          </motion.button>

          {/* Transactions */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/transactions')}
            className={`p-4 rounded-lg text-center transition-all duration-200 ${
              theme === 'dark' 
                ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm font-semibold">Transactions</div>
          </motion.button>

          {/* Revenue Report */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/revenue')}
            className={`p-4 rounded-lg text-center transition-all duration-200 ${
              theme === 'dark' 
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
            }`}
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm font-semibold">Revenue Report</div>
          </motion.button>

          {/* Category Management */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/transaction-categories')}
            className={`p-4 rounded-lg text-center transition-all duration-200 ${
              theme === 'dark' 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
            }`}
          >
            <div className="text-2xl mb-2">🏷️</div>
            <div className="text-sm font-semibold">Categories</div>
          </motion.button>

          {/* Customer Management */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/customers')}
            className={`p-4 rounded-lg text-center transition-all duration-200 ${
              theme === 'dark' 
                ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                : 'bg-cyan-500 hover:bg-cyan-600 text-white'
            }`}
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm font-semibold">Customers</div>
          </motion.button>
        </div>
      </motion.div>

      {/* Recent Activities and Welcome Message - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`rounded-xl shadow-lg border p-6 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
              📋 Recent Activities
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/auth/adminPage')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                theme === 'dark' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              View All
            </motion.button>
          </div>

          {activitiesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading activities...</p>
            </div>
          ) : activitiesError ? (
            <div className="text-center py-8">
              <p className={`text-red-500 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{activitiesError}</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📝</div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No activities yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${
                    theme === 'dark' 
                      ? 'bg-slate-700/50 border-blue-500' 
                      : 'bg-gray-50 border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                        {activity.action}
                      </p>
                      {activity.user_name && (
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          👤 {activity.user_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {activity.created_at && (
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(activity.created_at).toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={`rounded-xl shadow-lg border p-8 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-gray-200'}`}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
              Welcome to Vehicle Fleet Management System!
            </h2>
            <p className={`text-lg mb-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Easily manage your vehicles, personnel, and transactions. 
              Access any section from the left menu.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="text-2xl mb-2">🚗</div>
                <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Vehicle Management</h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Add, edit, and track vehicles
                </p>
              </div>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="text-2xl mb-2">👥</div>
                <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Personnel Management</h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Manage personnel information
                </p>
              </div>
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <div className="text-2xl mb-2">📊</div>
                <h3 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Transaction Tracking</h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                  Track income and expense transactions
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}