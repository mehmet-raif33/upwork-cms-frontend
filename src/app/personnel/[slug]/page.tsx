"use client"
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "../../redux/store";
import { selectIsLoggedIn, selectUser } from "../../redux/sliceses/authSlices";
import Link from "next/link";
import { motion } from 'framer-motion';
import { getPersonnelByIdApi, getPersonnelApi } from '../../api';

interface PersonnelPageProps {
  params: Promise<{ slug: string }>;
}

interface Personnel {
  id: string;
  full_name: string;
  username?: string;
  email: string;
  phone?: string;
  hire_date?: string;
  status: string;
  notes?: string;
  is_active: boolean;
  role?: string;
  created_at: string;
  updated_at?: string;
}

const PersonnelDetailPage: React.FC<PersonnelPageProps> = ({ params }) => {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);
  const router = useRouter();
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const { slug } = await params;
      return slug;
    };

    const loadData = async () => {
      try {
        const slug = await getParams();
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Token bulunamadı');
          return;
        }

        setLoading(true);
        
        // Önce tüm personeli çek ve slug'a göre bul
        const allPersonnelResponse = await getPersonnelApi(token);
        let allPersonnel = [];
        
        if (allPersonnelResponse.success && allPersonnelResponse.data) {
          allPersonnel = allPersonnelResponse.data;
        } else if (Array.isArray(allPersonnelResponse)) {
          allPersonnel = allPersonnelResponse;
        }

        // Slug'dan ID'yi çıkar (format: id-name)
        const idFromSlug = slug.split('-')[0];
        const foundPersonnel = allPersonnel.find((p: Personnel) => p.id === idFromSlug);
        
        if (foundPersonnel) {
          setPersonnel(foundPersonnel);
        } else {
          // ID ile bulamazsa, slug'dan çıkarılan ID'yi kullanarak API'den çek
          try {
            const response = await getPersonnelByIdApi(token, idFromSlug);
            console.log('Personnel Detail API Response:', response);
            
            if (response.success && response.data) {
              setPersonnel(response.data);
            } else if (response.id) {
              setPersonnel(response);
            } else {
              setError('Personel bulunamadı');
            }
          } catch {
            setError('Personel bulunamadı');
          }
        }
      } catch (error: unknown) {
        console.error('Error loading personnel:', error);
        setError('Personel bilgileri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      loadData();
    }
  }, [params, isLoggedIn]);

  // Giriş yapmamış kullanıcıları landing page'e yönlendir
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/landing');
    }
  }, [isLoggedIn, router]);

  // Admin olmayan kullanıcıları ana sayfaya yönlendir
  useEffect(() => {
    if (isLoggedIn && user?.role !== 'admin') {
      router.push('/');
    }
  }, [isLoggedIn, user, router]);

  // Giriş yapmamış kullanıcılar için loading göster
  if (!isLoggedIn) {
    return (
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Admin olmayan kullanıcılar için loading göster (yönlendirme sırasında)
  if (isLoggedIn && user?.role !== 'admin') {
    return (
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex-1 bg-gradient-to-br min-h-screen flex items-center justify-center ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
        <div className={`text-center ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}>
          <div className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4 ${theme === 'dark' ? 'border-blue-400' : 'border-blue-600'}`}></div>
          <p className="font-medium">Personel bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex-1 bg-gradient-to-br min-h-screen flex items-center justify-center ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
        <div className={`text-center ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Hata Oluştu</h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{error}</p>
          <Link href="/personnel" className={`mt-4 inline-block px-6 py-3 rounded-lg transition-colors ${theme === 'dark' ? 'bg-blue-800 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            Personellere Dön
          </Link>
        </div>
      </div>
    );
  }

  if (!personnel) {
    return (
      <div className={`flex-1 bg-gradient-to-br min-h-screen flex items-center justify-center ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
        <div className={`text-center ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
          <div className="text-6xl mb-4">👤</div>
          <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Personel Bulunamadı</h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Bu ID&apos;ye sahip personel sistemde bulunmamaktadır.</p>
          <Link href="/personnel" className={`mt-4 inline-block px-6 py-3 rounded-lg transition-colors ${theme === 'dark' ? 'bg-blue-800 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            Personellere Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 bg-gradient-to-br min-h-screen p-6 ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/personnel" 
                className={`flex items-center space-x-2 transition-colors ${theme === 'dark' ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}
              >
                <span>←</span>
                <span>Personellere Dön</span>
              </Link>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {personnel.full_name || 'İsimsiz Personel'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                personnel.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {personnel.status === 'active' ? 'Aktif' : 'Pasif'}
              </span>
              {personnel.role !== 'admin' && (
                <Link 
                  href={`/personnel/${personnel.id}-${personnel.full_name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'personel'}/edit`}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Düzenle
                </Link>
              )}
              {personnel.role === 'admin' && (
                <span className={`px-4 py-2 rounded-lg font-medium ${
                  theme === 'dark'
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}>
                  Düzenlenemez
                </span>
              )}
            </div>
          </div>

          {/* Personnel Basic Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`p-6 rounded-xl shadow-lg border ${
              theme === 'dark' 
                ? 'bg-slate-800/50 border-slate-700' 
                : 'bg-white/80 border-gray-200'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-6xl mb-4">👤</div>
                <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {personnel.full_name || 'İsimsiz'}
                </h2>
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  {personnel.role === 'admin' ? 'Yönetici' : 'Personel'}
                </p>
              </div>
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-50'}`}>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>E-posta</p>
                    <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {personnel.email || 'Belirtilmemiş'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-green-900/50' : 'bg-green-50'}`}>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Telefon</p>
                    <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {personnel.phone || 'Belirtilmemiş'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-50'}`}>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Kullanıcı Adı</p>
                    <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {personnel.username || 'Belirtilmemiş'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-yellow-900/50' : 'bg-yellow-50'}`}>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>İşe Başlama</p>
                    <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {personnel.hire_date ? new Date(personnel.hire_date).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={`p-6 rounded-xl shadow-lg border ${
            theme === 'dark' 
              ? 'bg-slate-800/50 border-slate-700' 
              : 'bg-white/80 border-gray-200'
          }`}
        >
          <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Detaylı Bilgiler
          </h3>
          <div className="space-y-4">
            <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Durum:</span>
              <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {personnel.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
            <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Rol:</span>
              <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {personnel.role === 'admin' ? 'Yönetici' : 'Personel'}
              </span>
            </div>
            <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Kayıt Tarihi:</span>
              <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {new Date(personnel.created_at).toLocaleDateString('tr-TR')}
              </span>
            </div>
            {personnel.notes && (
              <div className={`py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Notlar:</span>
                <p className={`mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {personnel.notes}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PersonnelDetailPage; 