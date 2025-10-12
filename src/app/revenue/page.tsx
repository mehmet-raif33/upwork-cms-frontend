"use client"
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "../redux/store";
import { selectIsLoggedIn, selectUser } from "../redux/sliceses/authSlices";
import { motion } from 'framer-motion';

// API base URL'ini al
let API_BASE_URL = '';
if (process.env.NODE_ENV === 'production') {
  API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_API1 || process.env.NEXT_PUBLIC_API_URL || 'https://ulasserver-production.up.railway.app';
} else {
  API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_API || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
}

// Fallback kontrolü
if (!API_BASE_URL || !API_BASE_URL.startsWith('http')) {
  API_BASE_URL = 'http://localhost:5000';
}

interface MonthlyRevenue {
  period: {
    year: number;
    month: number;
    monthName: string;
  };
  summary: {
    totalRevenue: number;
    transactionCount: number;
    averageTransaction: number;
  };
  breakdown: {
    byCategory: Array<{
      category: string;
      revenue: number;
      percentage: string;
    }>;
    byVehicle: Array<{
      vehicle: string;
      revenue: number;
      percentage: string;
    }>;
    byPersonnel: Array<{
      personnel: string;
      revenue: number;
      percentage: string;
    }>;
  };
  transactions: Array<{
    id: string;
    amount: number;
    description: string;
    transaction_date: string;
    category_name: string;
    vehicle_plate: string;
    personnel_name: string;
  }>;
}

interface YearlyRevenue {
  year: number;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    averageMonthlyRevenue: number;
    averageTransactionValue: number;
  };
  monthlyBreakdown: Array<{
    month: number;
    monthName: string;
    revenue: number;
    transactionCount: number;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    description: string;
    transaction_date: string;
    category_name: string;
    vehicle_plate: string;
    personnel_name: string;
  }>;
}

interface WeeklyRevenue {
  period: {
    startDate: string;
    endDate: string;
    periodType: 'daily' | 'weekly';
  };
  summary: {
    totalRevenue: number;
    transactionCount: number;
    averageTransaction: number;
  };
  dailyBreakdown: Array<{
    day: number;
    dayName: string;
    date: string;
    revenue: number;
    transactionCount: number;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    description: string;
    transaction_date: string;
    category_name: string;
    vehicle_plate: string;
    personnel_name: string;
  }>;
}

interface CategoryData {
  category_name: string;
  totalRevenue: number;
  totalTransactions: number;
  monthlyBreakdown?: Array<{
    month: number;
    monthName: string;
    revenue: number;
    transactionCount: number;
  }>;
}

interface MonthlyBreakdownData {
  month: number;
  monthName: string;
  revenue: number;
  transactionCount: number;
}

const RevenuePage: React.FC = () => {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly' | 'weekly' | 'daily'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Monthly revenue state
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue | null>(null);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedCategoriesForMonthly, setSelectedCategoriesForMonthly] = useState<number[]>([]);
  
  // Yearly revenue state
  const [yearlyData, setYearlyData] = useState<YearlyRevenue | null>(null);
  const [selectedYearForYearly, setSelectedYearForYearly] = useState(2024);
  const [selectedCategoriesForYearly, setSelectedCategoriesForYearly] = useState<number[]>([]);

  // Weekly revenue state
  const [weeklyData, setWeeklyData] = useState<WeeklyRevenue | null>(null);
  const [dailyData, setDailyData] = useState<WeeklyRevenue | null>(null);

  const [selectedStartDate, setSelectedStartDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedEndDate, setSelectedEndDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [selectedYearForWeekly, setSelectedYearForWeekly] = useState(new Date().getFullYear());
  const [weeklyOptions, setWeeklyOptions] = useState<Array<{value: string, label: string}>>([]);
  const [selectedDailyDate, setSelectedDailyDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  // Categories for filtering
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([]);
  const [selectedCategoriesForWeekly, setSelectedCategoriesForWeekly] = useState<number[]>([]);
  const [selectedCategoriesForDaily, setSelectedCategoriesForDaily] = useState<number[]>([]);

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

  const loadMonthlyRevenue = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token bulunamadı');
        return;
      }

      let apiUrl = `${API_BASE_URL}/activities/monthly-revenue?year=${selectedYear}&month=${selectedMonth}`;
      
      if (selectedCategoriesForMonthly.length > 0) {
        const categoryIds = selectedCategoriesForMonthly.join(',');
        apiUrl = `${API_BASE_URL}/activities/category-monthly-revenue?year=${selectedYear}&month=${selectedMonth}&categoryIds=${categoryIds}`;
      }
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          if (selectedCategoriesForMonthly.length > 0 && data.data.categories) {
            // Seçilen kategorilerin verilerini topla
            const totalRevenue = data.data.categories.reduce((sum: number, cat: CategoryData) => sum + cat.totalRevenue, 0);
            const totalTransactions = data.data.categories.reduce((sum: number, cat: CategoryData) => sum + cat.totalTransactions, 0);
            const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
            
            const monthlyDataFormatted: MonthlyRevenue = {
              period: data.data.period,
              summary: {
                totalRevenue: totalRevenue,
                transactionCount: totalTransactions,
                averageTransaction: averageTransaction
              },
              breakdown: {
                byCategory: data.data.categories.map((cat: CategoryData) => ({
                  category: cat.category_name,
                  revenue: cat.totalRevenue,
                  percentage: totalRevenue > 0 ? ((cat.totalRevenue / totalRevenue) * 100).toFixed(2) : '0.00'
                })),
                byVehicle: data.data.breakdown?.byVehicle || [],
                byPersonnel: data.data.breakdown?.byPersonnel || []
              },
              transactions: data.data.transactions || []
            };
            setMonthlyData(monthlyDataFormatted);
      } else {
            setMonthlyData(data.data);
          }
        } else {
          setError(data.message || 'Aylık ciro alınamadı');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Aylık ciro alınamadı');
      }
    } catch (error: unknown) {
      console.error('Error loading monthly revenue:', error);
      setError('Aylık ciro yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadYearlyRevenue = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token bulunamadı');
        return;
      }

      let apiUrl = `${API_BASE_URL}/activities/yearly-revenue?year=${selectedYearForYearly}`;
      
      if (selectedCategoriesForYearly.length > 0) {
        const categoryIds = selectedCategoriesForYearly.join(',');
        apiUrl = `${API_BASE_URL}/activities/category-yearly-revenue?year=${selectedYearForYearly}&categoryIds=${categoryIds}`;
      }
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          if (selectedCategoriesForYearly.length > 0 && data.data.categories) {
            // Seçilen kategorilerin verilerini topla
            const totalRevenue = data.data.categories.reduce((sum: number, cat: CategoryData) => sum + cat.totalRevenue, 0);
            const totalTransactions = data.data.categories.reduce((sum: number, cat: CategoryData) => sum + cat.totalTransactions, 0);
            const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
            
            // Aylık dağılımı birleştir
            const monthlyBreakdownMap = new Map<number, MonthlyBreakdownData>();
            data.data.categories.forEach((cat: CategoryData) => {
              cat.monthlyBreakdown?.forEach((month: MonthlyBreakdownData) => {
                const key = month.month;
                if (monthlyBreakdownMap.has(key)) {
                  const existing = monthlyBreakdownMap.get(key);
                  if (existing) {
                    existing.revenue += month.revenue;
                    existing.transactionCount += month.transactionCount;
                  }
                } else {
                  monthlyBreakdownMap.set(key, {
                    month: month.month,
                    monthName: month.monthName,
                    revenue: month.revenue,
                    transactionCount: month.transactionCount
                  });
                }
              });
            });
            
            const yearlyDataFormatted: YearlyRevenue = {
              year: data.data.year,
              summary: {
                totalRevenue: totalRevenue,
                totalTransactions: totalTransactions,
                averageMonthlyRevenue: totalRevenue / 12,
                averageTransactionValue: averageTransaction
              },
              monthlyBreakdown: Array.from(monthlyBreakdownMap.values()).sort((a, b) => a.month - b.month),
              transactions: data.data.transactions || []
            };
            setYearlyData(yearlyDataFormatted);
          } else {
            setYearlyData(data.data);
          }
        } else {
          setError(data.message || 'Yıllık ciro alınamadı');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Yıllık ciro alınamadı');
      }
    } catch (error: unknown) {
      console.error('Error loading yearly revenue:', error);
      setError('Yıllık ciro yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Token bulunamadı');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/transaction-categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      } else {
        console.error('Kategoriler yüklenirken hata:', response.status);
      }
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
    }
  };

  const generateWeeklyOptions = (year?: number) => {
    const options: Array<{value: string, label: string}> = [];
    const targetYear = year || selectedYearForWeekly;
    
    // Seçilen yılın başından sonuna kadar her hafta için seçenek oluştur
    const startOfYear = new Date(targetYear, 0, 1); // 1 Ocak
    const endOfYear = new Date(targetYear, 11, 31); // 31 Aralık
    
    let currentWeekStart = new Date(startOfYear);
    
    while (currentWeekStart <= endOfYear) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // 7 günlük hafta
      
      // Hafta bitiş tarihi yıl sonundan büyükse, yıl sonunu kullan
      if (weekEnd > endOfYear) {
        weekEnd.setTime(endOfYear.getTime());
      }
      
      const startDateStr = currentWeekStart.toISOString().split('T')[0];
      const endDateStr = weekEnd.toISOString().split('T')[0];
      const value = `${startDateStr}_${endDateStr}`;
      
      const startDateFormatted = currentWeekStart.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'short' 
      });
      const endDateFormatted = weekEnd.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'short' 
      });
      
      const label = `${startDateFormatted} - ${endDateFormatted}`;
      
      options.push({ value, label });
      
      // Sonraki haftaya geç
      currentWeekStart = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    
    setWeeklyOptions(options);
    
    // Varsayılan olarak bugünden önceki 7 günü seç
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 7);
    
    const defaultStartDate = lastWeekStart.toISOString().split('T')[0];
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultValue = `${defaultStartDate}_${defaultEndDate}`;
    
    setSelectedWeek(defaultValue);
    setSelectedStartDate(defaultStartDate);
    setSelectedEndDate(defaultEndDate);
  };

  const loadWeeklyRevenue = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token bulunamadı');
        return;
      }

      let apiUrl = `${API_BASE_URL}/activities/custom-revenue?startDate=${selectedStartDate}&endDate=${selectedEndDate}&periodType=weekly`;
      
      if (selectedCategoriesForWeekly.length > 0) {
        const categoryIds = selectedCategoriesForWeekly.join(',');
        apiUrl = `${API_BASE_URL}/activities/category-custom-revenue?startDate=${selectedStartDate}&endDate=${selectedEndDate}&periodType=weekly&categoryIds=${categoryIds}`;
      }
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          if (selectedCategoriesForWeekly.length > 0 && data.data.categories) {
            // Seçilen kategorilerin verilerini topla
            const totalRevenue = data.data.categories.reduce((sum: number, cat: CategoryData) => sum + cat.totalRevenue, 0);
            const totalTransactions = data.data.categories.reduce((sum: number, cat: CategoryData) => sum + cat.totalTransactions, 0);
            const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
            
            const weeklyDataFormatted: WeeklyRevenue = {
              period: data.data.period,
              summary: {
                totalRevenue: totalRevenue,
                transactionCount: totalTransactions,
                averageTransaction: averageTransaction
              },
              dailyBreakdown: data.data.dailyBreakdown || [],
              transactions: data.data.transactions || []
            };
            setWeeklyData(weeklyDataFormatted);
          } else {
            setWeeklyData(data.data);
          }
        } else {
          setError(data.message || 'Haftalık ciro alınamadı');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Haftalık ciro alınamadı');
      }
    } catch (error: unknown) {
      console.error('Error loading weekly revenue:', error);
      setError('Haftalık ciro yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyRevenue = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Token bulunamadı');
        return;
      }

      console.log('Frontend sending date:', selectedDailyDate);
      let apiUrl = `${API_BASE_URL}/activities/custom-revenue?startDate=${selectedDailyDate}&endDate=${selectedDailyDate}&periodType=daily`;
      
      if (selectedCategoriesForDaily.length > 0) {
        const categoryIds = selectedCategoriesForDaily.join(',');
        apiUrl = `${API_BASE_URL}/activities/category-custom-revenue?startDate=${selectedDailyDate}&endDate=${selectedDailyDate}&periodType=daily&categoryIds=${categoryIds}`;
      }
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          if (selectedCategoriesForDaily.length > 0 && data.data.categories) {
            // Seçilen kategorilerin verilerini topla
            const totalRevenue = data.data.categories.reduce((sum: number, cat: CategoryData) => sum + cat.totalRevenue, 0);
            const totalTransactions = data.data.categories.reduce((sum: number, cat: CategoryData) => sum + cat.totalTransactions, 0);
            const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
            
            const dailyDataFormatted: WeeklyRevenue = {
              period: data.data.period,
              summary: {
                totalRevenue: totalRevenue,
                transactionCount: totalTransactions,
                averageTransaction: averageTransaction
              },
              dailyBreakdown: data.data.dailyBreakdown || [],
              transactions: data.data.transactions || []
            };
            setDailyData(dailyDataFormatted);
      } else {
            setDailyData(data.data);
          }
        } else {
          setError(data.message || 'Günlük ciro alınamadı');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Günlük ciro alınamadı');
      }
    } catch (error: unknown) {
      console.error('Error loading daily revenue:', error);
      setError('Günlük ciro yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Ana data loading effect - sadece temel parametreler için
  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin') {
      if (activeTab === 'monthly') {
        loadMonthlyRevenue();
      } else if (activeTab === 'yearly') {
        loadYearlyRevenue();
      } else if (activeTab === 'weekly') {
        loadWeeklyRevenue();
      } else if (activeTab === 'daily') {
        loadDailyRevenue();
      }
    }
  }, [isLoggedIn, user, activeTab, selectedYear, selectedMonth, selectedYearForYearly, selectedStartDate, selectedEndDate, selectedWeek]);

  // Kategori filtreleri için ayrı effect'ler
  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin' && activeTab === 'monthly') {
      loadMonthlyRevenue();
    }
  }, [selectedCategoriesForMonthly]);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin' && activeTab === 'yearly') {
      loadYearlyRevenue();
    }
  }, [selectedCategoriesForYearly]);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin' && activeTab === 'weekly') {
      loadWeeklyRevenue();
    }
  }, [selectedCategoriesForWeekly]);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin' && activeTab === 'daily') {
      loadDailyRevenue();
    }
  }, [selectedCategoriesForDaily, selectedDailyDate]);

  // İlk yüklemede kategorileri yükle
  useEffect(() => {
    if (isLoggedIn && user?.role === 'admin') {
      loadCategories();
    }
  }, [isLoggedIn, user]);

  // Haftalık ciro sekmesi açıldığında hafta seçeneklerini oluştur ve veri yükle
  useEffect(() => {
    if (activeTab === 'weekly') {
      if (weeklyOptions.length === 0) {
        generateWeeklyOptions();
      } else if (selectedWeek && selectedStartDate && selectedEndDate) {
        loadWeeklyRevenue();
      }
    }
  }, [activeTab, selectedWeek, selectedStartDate, selectedEndDate, selectedYearForWeekly]);

  // Yıl değişikliğinde hafta seçeneklerini yeniden oluştur
  useEffect(() => {
    if (activeTab === 'weekly') {
      generateWeeklyOptions(selectedYearForWeekly);
    }
  }, [selectedYearForWeekly, activeTab]);

  // Günlük ciro sekmesi açıldığında otomatik veri yükle
  useEffect(() => {
    if (activeTab === 'daily' && selectedDailyDate) {
      loadDailyRevenue();
    }
  }, [activeTab, selectedDailyDate]);



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  return (
            <div className={`flex-1 bg-gradient-to-br min-h-screen p-6 ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-white to-gray-50'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Ciro Hesaplama
          </h1>
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            İşlem bazlı ciro analizi ve raporlama
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg mb-6 bg-red-100 border border-red-400 text-red-700`}
          >
            {error}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className={`flex space-x-1 p-1 rounded-lg ${
            theme === 'dark' ? 'bg-demirhan-dark-200' : 'bg-gray-100'
          }`}>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'monthly'
                  ? theme === 'dark' 
                      ? 'bg-slate-700 text-white shadow-sm' 
                      : 'bg-white text-red-600 shadow-sm'
                  : theme === 'dark' 
                      ? 'text-gray-200 hover:text-white hover:bg-slate-700' 
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Aylık Ciro
            </button>
            <button
              onClick={() => setActiveTab('yearly')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'yearly'
                  ? theme === 'dark' 
                      ? 'bg-slate-700 text-white shadow-sm' 
                      : 'bg-white text-red-600 shadow-sm'
                  : theme === 'dark' 
                      ? 'text-gray-200 hover:text-white hover:bg-slate-700' 
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yıllık Ciro
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'weekly'
                  ? theme === 'dark' 
                      ? 'bg-slate-700 text-white shadow-sm' 
                      : 'bg-white text-red-600 shadow-sm'
                  : theme === 'dark' 
                      ? 'text-gray-200 hover:text-white hover:bg-slate-700' 
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Haftalık Ciro
            </button>
            <button
              onClick={() => setActiveTab('daily')}
                              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === 'daily'
                    ? theme === 'dark' 
                      ? 'bg-slate-700 text-white shadow-sm' 
                      : 'bg-white text-red-600 shadow-sm'
                    : theme === 'dark' 
                      ? 'text-gray-200 hover:text-white hover:bg-slate-700' 
                      : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Günlük Ciro
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}>
            <div className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4 ${theme === 'dark' ? 'border-blue-400' : 'border-blue-600'}`}></div>
            <p className="font-medium">Ciro verileri yükleniyor...</p>
          </div>
        ) : (
          <>
            {/* Monthly Revenue */}
            {activeTab === 'monthly' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Filters */}
                <div className={`p-4 rounded-lg mb-6 border ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                } shadow-sm`}>
                  <div className="flex flex-col lg:flex-row gap-4 items-start">
                    <div className="flex flex-col gap-4 w-full lg:w-auto">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                          Yıl
                        </label>
                        <select
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                          className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-demirhan-500 w-full ${
                            theme === 'dark' 
                              ? 'bg-slate-700 border-slate-600 text-gray-200' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                          Ay
                        </label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                          className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-demirhan-500 w-full ${
                            theme === 'dark' 
                              ? 'bg-slate-700 border-slate-600 text-gray-200' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                            <option key={month} value={month}>
                              {new Date(2024, month - 1).toLocaleDateString('tr-TR', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 w-full lg:w-auto">
                      <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        Kategoriler
                      </label>
                      <div className={`p-3 border rounded-lg max-h-32 overflow-y-auto ${
                        theme === 'dark' 
                          ? 'bg-slate-700 border-slate-600' 
                          : 'bg-white border-gray-300'
                      }`}>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {categories.map(cat => (
                            <label key={cat.id} className="flex items-center p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedCategoriesForMonthly.includes(cat.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCategoriesForMonthly([...selectedCategoriesForMonthly, cat.id]);
                                  } else {
                                    setSelectedCategoriesForMonthly(selectedCategoriesForMonthly.filter(id => id !== cat.id));
                                  }
                                }}
                                className={`mr-1 rounded ${
                                  theme === 'dark' 
                                    ? 'bg-slate-700 border-slate-600 text-blue-400' 
                                    : 'bg-white border-gray-300 text-red-600'
                                }`}
                              />
                              <span className={`text-xs ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                {cat.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                {monthlyData ? (
                  <>
                    {/* Kategori Filtresi Bilgisi */}
                    {selectedCategoriesForMonthly.length > 0 && (
                      <div className={`mb-6 p-4 rounded-lg border ${
                        theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-red-700'}`}>
                            📊 Filtrelenmiş Kategoriler:
                          </span>
                          {selectedCategoriesForMonthly.map(catId => {
                            const category = categories.find(cat => cat.id === catId);
                            return category ? (
                              <span key={catId} className={`px-2 py-1 text-xs rounded-full ${
                                theme === 'dark' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-red-500 text-white'
                              }`}>
                                {category.name}
                              </span>
                            ) : null;
                          })}
                          <button
                            onClick={() => setSelectedCategoriesForMonthly([])}
                            className={`ml-auto px-2 py-1 text-xs rounded transition-colors ${
                              theme === 'dark' 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            Filtreyi Temizle
                          </button>
                        </div>
                      </div>
                    )}
                    
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Toplam Ciro
                          </p>
                          <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(monthlyData.summary.totalRevenue)}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-green-900/50' : 'bg-green-100'}`}>
                          <span className="text-2xl">💰</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            İşlem Sayısı
                          </p>
                          <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {formatNumber(monthlyData.summary.transactionCount)}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                          <span className="text-2xl">📊</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Ortalama İşlem
                          </p>
                          <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(monthlyData.summary.averageTransaction)}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                          <span className="text-2xl">📈</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                    {/* İşlem Listesi */}
                    {monthlyData.transactions && monthlyData.transactions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                    >
                        <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          İşlem Detayları ({monthlyData.transactions.length} işlem)
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className={`border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Tarih
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Açıklama
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Kategori
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Araç
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Personel
                                </th>
                                <th className={`text-right py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Tutar
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthlyData.transactions.map((transaction) => (
                                <tr key={transaction.id} className={`border-b ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {new Date(transaction.transaction_date).toLocaleDateString('tr-TR')}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.description}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.category_name}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.vehicle_plate || '-'}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.personnel_name || '-'}
                                  </td>
                                  <td className={`text-right py-3 px-4 font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                    {formatCurrency(transaction.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                      </div>
                    </motion.div>
                    )}
                  </>
                ) : (
                  <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      Veri Bulunamadı
                      </h3>
                    <p>Seçilen tarih aralığında işlem bulunmuyor.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Yearly Revenue */}
            {activeTab === 'yearly' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Filters */}
                <div className={`p-4 rounded-lg mb-6 border ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                } shadow-sm`}>
                  <div className="flex flex-col lg:flex-row gap-4 items-start">
                    <div className="w-full lg:w-auto">
                      <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        Yıl
                      </label>
                      <select
                        value={selectedYearForYearly}
                        onChange={(e) => setSelectedYearForYearly(parseInt(e.target.value))}
                        className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-demirhan-500 w-full ${
                          theme === 'dark' 
                            ? 'bg-slate-700 border-slate-600 text-gray-200' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-0 w-full lg:w-auto">
                      <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        Kategoriler
                      </label>
                      <div className={`p-3 border rounded-lg max-h-32 overflow-y-auto ${
                        theme === 'dark' 
                          ? 'bg-slate-700 border-slate-600' 
                          : 'bg-white border-gray-300'
                      }`}>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {categories.map(cat => (
                            <label key={cat.id} className="flex items-center p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedCategoriesForYearly.includes(cat.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCategoriesForYearly([...selectedCategoriesForYearly, cat.id]);
                                  } else {
                                    setSelectedCategoriesForYearly(selectedCategoriesForYearly.filter(id => id !== cat.id));
                                  }
                                }}
                                className={`mr-1 rounded ${
                                  theme === 'dark' 
                                    ? 'bg-slate-700 border-slate-600 text-blue-400' 
                                    : 'bg-white border-gray-300 text-red-600'
                                }`}
                              />
                              <span className={`text-xs ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                {cat.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                {yearlyData ? (
                  <>
                    {/* Kategori Filtresi Bilgisi */}
                    {selectedCategoriesForYearly.length > 0 && (
                      <div className={`mb-6 p-4 rounded-lg border ${
                        theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-red-700'}`}>
                            📊 Filtrelenmiş Kategoriler:
                          </span>
                          {selectedCategoriesForYearly.map(catId => {
                            const category = categories.find(cat => cat.id === catId);
                            return category ? (
                              <span key={catId} className={`px-2 py-1 text-xs rounded-full ${
                                theme === 'dark' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-red-500 text-white'
                              }`}>
                                {category.name}
                              </span>
                            ) : null;
                          })}
                          <button
                            onClick={() => setSelectedCategoriesForYearly([])}
                            className={`ml-auto px-2 py-1 text-xs rounded transition-colors ${
                              theme === 'dark' 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            Filtreyi Temizle
                          </button>
                        </div>
                      </div>
                    )}
                    
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Yıllık Ciro
                          </p>
                          <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(yearlyData.summary.totalRevenue)}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-green-900/50' : 'bg-green-100'}`}>
                          <span className="text-2xl">💰</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Toplam İşlem
                          </p>
                          <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {formatNumber(yearlyData.summary.totalTransactions)}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                          <span className="text-2xl">📊</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Aylık Ortalama
                          </p>
                          <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(yearlyData.summary.averageMonthlyRevenue)}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                          <span className="text-2xl">📈</span>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Ortalama İşlem
                          </p>
                          <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(yearlyData.summary.averageTransactionValue)}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
                          <span className="text-2xl">💎</span>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                {/* Monthly Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 }}
                    className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                  >
                    <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Aylık Ciro Dağılımı
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                              {yearlyData.monthlyBreakdown.map((month) => (
                                                  <div key={month.month} className="text-center">
                          <div className={`p-4 rounded-lg border ${
                            theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              {month.monthName}
                            </p>
                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(month.revenue)}
                            </p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {month.transactionCount} işlem
                            </p>
                          </div>
                        </div>
                      ))}
                      </div>
                    </motion.div>

                    {/* İşlem Listesi */}
                    {yearlyData.transactions && yearlyData.transactions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 }}
                        className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                      >
                        <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          İşlem Detayları ({yearlyData.transactions.length} işlem)
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className={`border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Tarih
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Açıklama
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Kategori
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Araç
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Personel
                                </th>
                                <th className={`text-right py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Tutar
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {yearlyData.transactions.map((transaction) => (
                                <tr key={transaction.id} className={`border-b ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {new Date(transaction.transaction_date).toLocaleDateString('tr-TR')}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.description}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.category_name}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.vehicle_plate || '-'}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.personnel_name || '-'}
                                  </td>
                                  <td className={`text-right py-3 px-4 font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                    {formatCurrency(transaction.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                    </div>
                  </motion.div>
                    )}
                  </>
                ) : (
                  <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      Veri Bulunamadı
                    </h3>
                    <p>Seçilen yılda işlem bulunmuyor.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Weekly Revenue */}
            {activeTab === 'weekly' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Filters */}
                <div className={`p-4 rounded-lg mb-6 border ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                } shadow-sm`}>
                    <div className="flex flex-col lg:flex-row gap-4 items-start">
                    <div className="flex flex-col gap-4 w-full lg:w-auto">
                        <div className="flex-1 min-w-0">
                            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                            Yıl Seçimi
                            </label>
                            <select
                            value={selectedYearForWeekly}
                            onChange={(e) => {
                              const newYear = parseInt(e.target.value);
                              setSelectedYearForWeekly(newYear);
                              generateWeeklyOptions(newYear);
                              setSelectedWeek(''); // Hafta seçimini sıfırla
                            }}
                            className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full ${
                                theme === 'dark' 
                                ? 'bg-slate-700 border-slate-600 text-gray-200' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            >
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                            </select>
                          </div>
                        <div className="flex-1 min-w-0">
                            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                            Hafta Seçimi
                            </label>
                            <select
                            value={selectedWeek}
                            onChange={(e) => {
                              const [startDate, endDate] = e.target.value.split('_');
                              setSelectedWeek(e.target.value);
                              setSelectedStartDate(startDate);
                              setSelectedEndDate(endDate);
                            }}
                            className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full ${
                                theme === 'dark' 
                                ? 'bg-slate-700 border-slate-600 text-gray-200' 
                                  : 'bg-white border-gray-300 text-gray-900'
                              }`}
                            >
                            <option value="">Hafta seçiniz</option>
                                                          {weeklyOptions.map((option) => (
                                                                <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                              ))}
                            </select>
                          </div>
                    </div>
                    <div className="flex-1 min-w-0 w-full lg:w-auto">
                          <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        Kategoriler
                          </label>
                      <div className={`p-3 border rounded-lg max-h-32 overflow-y-auto ${
                              theme === 'dark' 
                          ? 'bg-slate-700 border-slate-600' 
                          : 'bg-white border-gray-300'
                      }`}>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {categories.map(cat => (
                            <label key={cat.id} className="flex items-center p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedCategoriesForWeekly.includes(cat.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCategoriesForWeekly([...selectedCategoriesForWeekly, cat.id]);
                                  } else {
                                    setSelectedCategoriesForWeekly(selectedCategoriesForWeekly.filter(id => id !== cat.id));
                                  }
                                }}
                                className={`mr-1 rounded ${
                                  theme === 'dark' 
                                    ? 'bg-slate-700 border-slate-600 text-blue-400' 
                                    : 'bg-white border-gray-300 text-red-600'
                                }`}
                              />
                              <span className={`text-xs ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                {cat.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                {weeklyData ? (
                  <>
                    {/* Kategori Filtresi Bilgisi */}
                    {selectedCategoriesForWeekly.length > 0 && (
                      <div className={`mb-6 p-4 rounded-lg border ${
                        theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-red-700'}`}>
                            📊 Filtrelenmiş Kategoriler:
                          </span>
                          {selectedCategoriesForWeekly.map(catId => {
                            const category = categories.find(cat => cat.id === catId);
                            return category ? (
                              <span key={catId} className={`px-2 py-1 text-xs rounded-full ${
                              theme === 'dark' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-red-500 text-white'
                              }`}>
                                {category.name}
                              </span>
                            ) : null;
                          })}
                          <button
                            onClick={() => setSelectedCategoriesForWeekly([])}
                            className={`ml-auto px-2 py-1 text-xs rounded transition-colors ${
                              theme === 'dark' 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            Filtreyi Temizle
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Haftalık Ciro
                            </p>
                            <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(weeklyData.summary.totalRevenue)}
                            </p>
                          </div>
                          <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-green-900/50' : 'bg-green-100'}`}>
                            <span className="text-2xl">💰</span>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              İşlem Sayısı
                            </p>
                            <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {formatNumber(weeklyData.summary.transactionCount)}
                            </p>
                          </div>
                          <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                            <span className="text-2xl">📊</span>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Ortalama İşlem
                            </p>
                            <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(weeklyData.summary.averageTransaction)}
                            </p>
                          </div>
                          <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                            <span className="text-2xl">📈</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Daily Breakdown */}
                    {weeklyData.dailyBreakdown && weeklyData.dailyBreakdown.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                        className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                      >
                        <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Günlük Ciro Dağılımı
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                                                      {weeklyData.dailyBreakdown.map((day) => (
                            <div key={day.day} className="text-center">
                              <div className={`p-4 rounded-lg border ${
                                theme === 'dark' ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                              }`}>
                                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {day.dayName}
                                </p>
                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {new Date(day.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </p>
                                <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {formatCurrency(day.revenue)}
                                </p>
                                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {day.transactionCount} işlem
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* İşlem Listesi */}
                    {weeklyData.transactions && weeklyData.transactions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                        className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                      >
                        <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          İşlem Detayları ({weeklyData.transactions.length} işlem)
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className={`border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Tarih
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Açıklama
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Kategori
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Araç
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Personel
                                </th>
                                <th className={`text-right py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Tutar
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {weeklyData.transactions.map((transaction) => (
                                <tr key={transaction.id} className={`border-b ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {new Date(transaction.transaction_date).toLocaleDateString('tr-TR')}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.description}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.category_name}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.vehicle_plate || '-'}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.personnel_name || '-'}
                                  </td>
                                  <td className={`text-right py-3 px-4 font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                    {formatCurrency(transaction.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      Veri Bulunamadı
                    </h3>
                    <p>Seçilen hafta için veri bulunmuyor.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Daily Revenue */}
            {activeTab === 'daily' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Filters */}
                <div className={`p-4 rounded-lg mb-6 border ${
                  theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                } shadow-sm`}>
                  <div className="flex flex-col lg:flex-row gap-4 items-start">
                        <div className="w-full lg:w-auto">
                          <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        Tarih Seçimi
                          </label>
                          <input
                            type="date"
                        value={selectedDailyDate}
                        onChange={(e) => setSelectedDailyDate(e.target.value)}
                        className={`px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 w-full ${
                              theme === 'dark' 
                            ? 'bg-slate-700 border-slate-600 text-gray-200' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        </div>
                    <div className="flex-1 min-w-0 w-full lg:w-auto">
                        <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                        Kategoriler
                        </label>
                      <div className={`p-3 border rounded-lg max-h-32 overflow-y-auto ${
                            theme === 'dark' 
                          ? 'bg-slate-700 border-slate-600' 
                          : 'bg-white border-gray-300'
                      }`}>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                          {categories.map(cat => (
                            <label key={cat.id} className="flex items-center p-1 rounded hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedCategoriesForDaily.includes(cat.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCategoriesForDaily([...selectedCategoriesForDaily, cat.id]);
                                  } else {
                                    setSelectedCategoriesForDaily(selectedCategoriesForDaily.filter(id => id !== cat.id));
                                  }
                                }}
                                className={`mr-1 rounded ${
                                  theme === 'dark' 
                                    ? 'bg-slate-700 border-slate-600 text-blue-400' 
                                    : 'bg-white border-gray-300 text-red-600'
                                }`}
                              />
                              <span className={`text-xs ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                                {cat.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                {dailyData ? (
                  <>
                    {/* Kategori Filtresi Bilgisi */}
                    {selectedCategoriesForDaily.length > 0 && (
                      <div className={`mb-6 p-4 rounded-lg border ${
                        theme === 'dark' ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-red-700'}`}>
                            📊 Filtrelenmiş Kategoriler:
                          </span>
                          {selectedCategoriesForDaily.map(catId => {
                            const category = categories.find(cat => cat.id === catId);
                            return category ? (
                              <span key={catId} className={`px-2 py-1 text-xs rounded-full ${
                                theme === 'dark' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-red-500 text-white'
                              }`}>
                                {category.name}
                              </span>
                            ) : null;
                          })}
                          <button
                            onClick={() => setSelectedCategoriesForDaily([])}
                            className={`ml-auto px-2 py-1 text-xs rounded transition-colors ${
                              theme === 'dark' 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            Filtreyi Temizle
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Günlük Ciro
                            </p>
                            <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(dailyData.summary.totalRevenue)}
                            </p>
                          </div>
                          <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-green-900/50' : 'bg-green-100'}`}>
                            <span className="text-2xl">💰</span>
                        </div>
                          </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              İşlem Sayısı
                            </p>
                            <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {formatNumber(dailyData.summary.transactionCount)}
                            </p>
                          </div>
                          <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                            <span className="text-2xl">📊</span>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              Ortalama İşlem
                            </p>
                            <p className={`text-xl md:text-2xl font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(dailyData.summary.averageTransaction)}
                            </p>
                  </div>
                          <div className={`p-3 rounded-full flex-shrink-0 ${theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                            <span className="text-2xl">📈</span>
                    </div>
                  </div>
                      </motion.div>
                    </div>

                    {/* Daily Breakdown */}
                    {(() => {
                      if (dailyData.dailyBreakdown && dailyData.dailyBreakdown.length > 0) {
                        // Backend'den gelen dailyBreakdown varsa onu kullan
                        return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                    className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                  >
                    <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              Seçilen Gün Detayı
                    </h3>
                            <div className="flex justify-center">
                              {dailyData.dailyBreakdown.map((day) => (
                                                                  <div key={day.day} className="text-center max-w-md w-full">
                                  <div className={`p-8 rounded-xl border-2 ${
                                    theme === 'dark' 
                                      ? 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600' 
                                      : 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
                                  }`}>
                                    <div className={`text-4xl mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                      📅
                                    </div>
                                    <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                      {day.dayName}
                                    </p>
                                    <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {new Date(day.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                    <div className={`mt-6 p-4 rounded-lg ${
                                      theme === 'dark' ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'
                                    }`}>
                                      <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                        {formatCurrency(day.revenue)}
                                      </p>
                                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Toplam Ciro
                        </p>
                      </div>
                                    <div className={`mt-4 p-3 rounded-lg ${
                                      theme === 'dark' ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                                    }`}>
                                      <p className={`text-xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                        {day.transactionCount}
                                      </p>
                                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        İşlem Sayısı
                        </p>
                      </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        );
                      } else {
                        // Backend'den dailyBreakdown yoksa, summary'den gün verisi oluştur
                        const selectedDate = new Date(selectedDailyDate);
                        const dayData = {
                          day: selectedDate.getDay() + 1,
                          dayName: selectedDate.toLocaleDateString('tr-TR', { weekday: 'long' }),
                          date: selectedDailyDate,
                          revenue: dailyData.summary.totalRevenue,
                          transactionCount: dailyData.summary.transactionCount
                        };
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                            className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                          >
                            <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              Seçilen Gün Detayı
                            </h3>
                            <div className="flex justify-center">
                              <div className="text-center max-w-md w-full">
                                <div className={`p-8 rounded-xl border-2 ${
                                  theme === 'dark' 
                                    ? 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600' 
                                    : 'bg-gradient-to-br from-gray-50 to-white border-gray-300'
                                }`}>
                                  <div className={`text-4xl mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    📅
                                  </div>
                                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {dayData.dayName}
                                  </p>
                                  <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </p>
                                  <div className={`mt-6 p-4 rounded-lg ${
                                    theme === 'dark' ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'
                                  }`}>
                                    <p className={`text-3xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                      {formatCurrency(dayData.revenue)}
                                    </p>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                      Toplam Ciro
                                    </p>
                                  </div>
                                  <div className={`mt-4 p-3 rounded-lg ${
                                    theme === 'dark' ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'
                                  }`}>
                                    <p className={`text-xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                                      {dayData.transactionCount}
                                    </p>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                      İşlem Sayısı
                                    </p>
                                  </div>
                                </div>
                      </div>
                    </div>
                  </motion.div>
                        );
                      }
                })()}

                    {/* İşlem Listesi */}
                    {dailyData.transactions && dailyData.transactions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                        className={`p-6 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                      >
                        <h3 className={`text-lg font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          İşlem Detayları ({dailyData.transactions.length} işlem)
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className={`border-b ${theme === 'dark' ? 'border-slate-700' : 'border-gray-200'}`}>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Tarih
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Açıklama
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Kategori
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Araç
                                </th>
                                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Personel
                                </th>
                                <th className={`text-right py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Tutar
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {dailyData.transactions.map((transaction) => (
                                <tr key={transaction.id} className={`border-b ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {new Date(transaction.transaction_date).toLocaleDateString('tr-TR')}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.description}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.category_name}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.vehicle_plate || '-'}
                                  </td>
                                  <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {transaction.personnel_name || '-'}
                                  </td>
                                  <td className={`text-right py-3 px-4 font-medium ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                    {formatCurrency(transaction.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                      Veri Bulunamadı
                    </h3>
                    <p>Seçilen günler için veri bulunmuyor.</p>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default RevenuePage; 