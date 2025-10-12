"use client"
import './globals.css'
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { selectUser, selectLoading } from './redux/sliceses/authSlices';
import { RootState } from './redux/store';
import { motion } from 'framer-motion';
import { getActivitiesApi, getVehiclesCountApi, getPersonnelCountApi, getTransactionsStatsApi } from './api';


export default function Home() {
  const user = useSelector(selectUser);
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const isLoading = useSelector(selectLoading);
  const theme = useSelector((state: RootState) => state.theme.theme);
  const router = useRouter();
  const [activities, setActivities] = useState<Array<{ id: string; action: string; user_name?: string; created_at?: string }>>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [vehiclesCount, setVehiclesCount] = useState<number | null>(null);
  const [personnelCount, setPersonnelCount] = useState<number | null>(null);
  const [transactionsStats, setTransactionsStats] = useState<{ total_transactions?: number; total_amount?: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setActivitiesLoading(true);
      setActivitiesError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Oturum bulunamadı');
        const data = await getActivitiesApi(token);
        setActivities(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (err: unknown) {
        const errorMessage = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message || 'Etkinlikler alınamadı' : 'Etkinlikler alınamadı';
        setActivitiesError(errorMessage);
      } finally {
        setActivitiesLoading(false);
      }
    };
    fetchActivities();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Oturum bulunamadı');
        
        const [vehicles, personnel, transactions] = await Promise.all([
          getVehiclesCountApi(token),
          getPersonnelCountApi(token),
          getTransactionsStatsApi(token)
        ]);
        
        setVehiclesCount(vehicles);
        setPersonnelCount(personnel);
        setTransactionsStats(transactions);
      } catch (err: unknown) {
        const errorMessage = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message || 'İstatistikler alınamadı' : 'İstatistikler alınamadı';
        setStatsError(errorMessage);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Loading durumunda loading göster
  if (isLoading) {
    return (
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Giriş yapmamış kullanıcılar için loading göster
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
          Hoş Geldiniz, {user?.name || 'Kullanıcı'}!
        </h1>
        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          {new Date().toLocaleDateString('tr-TR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsLoading ? (
          <div className="col-span-4 text-center text-gray-400">Yükleniyor...</div>
        ) : statsError ? (
          <div className="col-span-4 text-center text-red-500">{statsError}</div>
        ) : (
          <>
            <div className={`rounded-lg shadow-sm border p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}> 
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Toplam Araç</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{vehiclesCount ?? '-'}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-blue-500 text-white">🚗</div>
              </div>
            </div>
            <div className={`rounded-lg shadow-sm border p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}> 
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Aktif Personel</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{personnelCount ?? '-'}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-green-500 text-white">👥</div>
              </div>
            </div>
            <div className={`rounded-lg shadow-sm border p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}> 
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Toplam İşlem</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{transactionsStats?.total_transactions ?? '-'}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-purple-500 text-white">📊</div>
              </div>
            </div>
            <div className={`rounded-lg shadow-sm border p-4 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}> 
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Toplam Gelir</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{transactionsStats?.total_amount ? `₺${Number(transactionsStats.total_amount).toLocaleString('tr-TR')}` : '-'}</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-yellow-500 text-white">💰</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="mb-6"
      >
        <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Hızlı İşlemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/add-transaction')}
            className={`rounded-lg shadow-sm border p-6 cursor-pointer transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-2xl text-white mx-auto mb-3">➕</div>
              <h3 className={`font-semibold text-lg mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Yeni İşlem</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Yeni bir işlem ekle</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/vehicles')}
            className={`rounded-lg shadow-sm border p-6 cursor-pointer transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-2xl text-white mx-auto mb-3">🚗</div>
              <h3 className={`font-semibold text-lg mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Araçlar</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Araç listesini görüntüle</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/transactions')}
            className={`rounded-lg shadow-sm border p-6 cursor-pointer transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-2xl text-white mx-auto mb-3">📊</div>
              <h3 className={`font-semibold text-lg mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>İşlemler</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tüm işlemleri görüntüle</p>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/personnel')}
            className={`rounded-lg shadow-sm border p-6 cursor-pointer transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-500 flex items-center justify-center text-2xl text-white mx-auto mb-3">👥</div>
              <h3 className={`font-semibold text-lg mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Personel</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Personel listesini görüntüle</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className={`rounded-xl shadow-lg border p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Son Aktiviteler</h2>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500'} text-white`}>
              📋
            </div>
          </div>
          {activitiesLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Aktiviteler yükleniyor...</p>
            </div>
          )}
          {activitiesError && (
            <div className="text-center py-8">
              <div className="text-red-500 text-4xl mb-2">⚠️</div>
              <p className="text-sm text-red-500">{activitiesError}</p>
            </div>
          )}
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={activity.id || index} className={`flex items-center space-x-4 p-4 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'bg-slate-700/50 hover:bg-slate-700 hover:shadow-md' : 'bg-gray-50 hover:bg-gray-100 hover:shadow-sm'}`}> 
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  activity.action?.toLowerCase().includes('araç') ? 'bg-blue-500' :
                  activity.action?.toLowerCase().includes('kullanıcı') ? 'bg-green-500' :
                  activity.action?.toLowerCase().includes('kategori') ? 'bg-purple-500' :
                  activity.action?.toLowerCase().includes('işlem') ? 'bg-yellow-500' :
                  activity.action?.toLowerCase().includes('personel') ? 'bg-indigo-500' :
                  activity.action?.toLowerCase().includes('şifre') ? 'bg-red-500' :
                  activity.action?.toLowerCase().includes('güncellendi') ? 'bg-orange-500' :
                  activity.action?.toLowerCase().includes('silindi') ? 'bg-red-600' :
                  'bg-gray-500'
                } text-white`}>
                  {activity.action?.toLowerCase().includes('araç') && '🚗'}
                  {activity.action?.toLowerCase().includes('kullanıcı') && '👤'}
                  {activity.action?.toLowerCase().includes('kategori') && '🏷️'}
                  {activity.action?.toLowerCase().includes('işlem') && '💸'}
                  {activity.action?.toLowerCase().includes('personel') && '👥'}
                  {activity.action?.toLowerCase().includes('şifre') && '🔐'}
                  {activity.action?.toLowerCase().includes('güncellendi') && '✏️'}
                  {activity.action?.toLowerCase().includes('silindi') && '🗑️'}
                  {activity.action?.toLowerCase().includes('eklendi') && '➕'}
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{activity.action}</p>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {activity.user_name ? `${activity.user_name} • ` : ''}
                    {activity.created_at ? new Date(activity.created_at).toLocaleString('tr-TR') : ''}
                  </p>
                </div>
              </div>
            ))}
            {!activitiesLoading && !activitiesError && activities.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📋</div>
                <p className="text-sm text-gray-400">Henüz aktivite bulunmuyor.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Welcome Message */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className={`rounded-xl shadow-lg border p-6 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Hoş Geldiniz!</h2>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${theme === 'dark' ? 'bg-emerald-600' : 'bg-emerald-500'} text-white`}>
              👋
            </div>
          </div>
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-emerald-50'}`}>
              <h3 className={`font-semibold text-lg mb-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>
                🎉 Ulaş Araç Takip Sistemi
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Araç takibi, işlem yönetimi ve personel yönetimi için kapsamlı çözümünüz.
              </p>
            </div>
            
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-blue-50'}`}>
              <h3 className={`font-semibold text-lg mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                🚀 Hızlı Başlangıç
              </h3>
              <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                <li>• Yeni araç ekleyin</li>
                <li>• İşlem kaydı oluşturun</li>
                <li>• Personel yönetimi yapın</li>
                <li>• Raporları görüntüleyin</li>
              </ul>
            </div>

            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-purple-50'}`}>
              <h3 className={`font-semibold text-lg mb-2 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-700'}`}>
                📊 İstatistikler
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Sistem genelinde araç, personel ve işlem istatistiklerinizi takip edin.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


//sadasd
