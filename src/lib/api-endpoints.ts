import { enhancedApiClient } from './enhanced-api-client';

// Auth API endpoints
export const authApi = {
  // Login (no auth required)
  login: (credentials: { username: string; password: string }) =>
    enhancedApiClient.publicPost<{
      message: string;
      user: {
        id: string;
        username: string;
        email: string;
        role: string;
        full_name: string;
      };
      token: string;
      refreshToken?: string;
    }>('/auth/login', credentials),

  // Get profile (auth required)
  getProfile: () =>
    enhancedApiClient.get<{
      user: {
        id: string;
        username: string;
        email: string;
        role: string;
        full_name: string;
      };
    }>('/auth/profile'),

  // Change password (auth required)
  changePassword: (passwords: { oldPassword: string; newPassword: string }) =>
    enhancedApiClient.put<{ message: string }>('/auth/change-password', passwords),
};

// User API endpoints
export const userApi = {
  // Get all users
  getUsers: () =>
    enhancedApiClient.get<any[]>('/user'),

  // Get user by ID
  getUser: (userId: string) =>
    enhancedApiClient.get<any>(`/user/${userId}`),
};

// Transaction API endpoints
export const transactionApi = {
  // Get transactions with filters
  getTransactions: (params?: {
    page?: number;
    limit?: number;
    vehicle_id?: string;
    personnel_id?: string;
    category_id?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    
    return enhancedApiClient.get<{
      transactions: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/transactions${queryString}`);
  },

  // Get single transaction
  getTransaction: (id: string) =>
    enhancedApiClient.get<any>(`/transactions/${id}`),

  // Create transaction
  createTransaction: (data: {
    vehicle_id: string;
    category_id: string;
    amount: number;
    expense?: number;
    is_expense?: boolean;
    description: string;
    transaction_date: string;
  }) =>
    enhancedApiClient.post<{ message: string; transaction: any }>('/transactions', data),

  // Update transaction
  updateTransaction: (id: string, data: {
    vehicle_id?: string;
    personnel_id?: string | null;
    category_id?: string;
    amount?: number;
    expense?: number;
    is_expense?: boolean;
    description?: string;
    date?: string;
    payment_method?: string;
    notes?: string;
  }) =>
    enhancedApiClient.put<{ message: string; transaction: any }>(`/transactions/${id}`, data),

  // Delete transaction
  deleteTransaction: (id: string) =>
    enhancedApiClient.delete<{ message: string }>(`/transactions/${id}`),

  // Get transactions by vehicle plate
  getTransactionsByVehicle: (plate: string) =>
    enhancedApiClient.get<{ transactions: any[] }>(`/transactions/by-plate/${plate}`),

  // Get transactions by category
  getTransactionsByCategory: (categoryId: string) =>
    enhancedApiClient.get<{ transactions: any[] }>(`/transactions/category/${categoryId}`),

  // Get transaction history
  getTransactionHistory: (transactionId: string) =>
    enhancedApiClient.get<{ history: any[] }>(`/transactions/${transactionId}/history`),

  // Update transaction status
  updateTransactionStatus: (transactionId: string, data: { status: string; notes?: string }) =>
    enhancedApiClient.patch<{ message: string }>(`/transactions/${transactionId}/status`, data),

  // Get transaction statistics
  getTransactionStats: (params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    
    return enhancedApiClient.get<{
      stats: {
        total_transactions: number;
        total_revenue: number;
        total_expenses: number;
        net_profit: number;
      };
    }>(`/transactions/stats/overview${queryString}`);
  },

  // Get transaction summary stats
  getTransactionsSummaryStats: (params?: {
    vehicle_id?: string;
    personnel_id?: string;
    category_id?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    
    return enhancedApiClient.get<{
      stats: {
        total_revenue: number;
        total_expenses: number;
        net_profit: number;
        transaction_count: number;
      };
    }>(`/transactions/stats/summary${queryString}`);
  },
};

// Vehicle API endpoints
export const vehicleApi = {
  // Get vehicles with pagination and search
  getVehicles: (params?: {
    page?: number;
    limit?: number;
    search?: string;
      }) => {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    
    return enhancedApiClient.get<{
      vehicles: any[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/vehicles${queryString}`);
  },

  // Get customers (vehicles grouped by customer)
  getCustomers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    
    return enhancedApiClient.get<{
      customers: unknown[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/vehicles/customers${queryString}`);
  },

  // Get single vehicle by plate
  getVehicle: (plate: string) =>
    enhancedApiClient.get<{ vehicle: any }>(`/vehicles/${plate}`),

  // Create vehicle
  createVehicle: (data: {
    plate: string;
    year: number;
    customer_email?: string;
    customer_phone?: string;
  }) =>
    enhancedApiClient.post<{ message: string; vehicle: any }>('/vehicles', data),

  // Update vehicle
  updateVehicle: (plate: string, data: {
    year?: number;
    customer_email?: string;
    customer_phone?: string;
  }) =>
    enhancedApiClient.put<{ message: string; vehicle: any }>(`/vehicles/${plate}`, data),

  // Delete vehicle
  deleteVehicle: (plate: string) =>
    enhancedApiClient.delete<{ message: string }>(`/vehicles/${plate}`),

  // Get vehicle statistics
  getVehicleStats: () =>
    enhancedApiClient.get<{
      stats: {
        total_vehicles: number;
        active_vehicles: number;
      };
    }>('/vehicles/stats/overview'),

  // Get customer statistics
  getCustomerStats: () =>
    enhancedApiClient.get<{
      stats: {
        total_customers: number;
        customers_with_transactions: number;
      };
    }>('/vehicles/customer-stats'),

  // Get top customers
  getTopCustomers: (limit?: number) => {
    const queryString = limit ? `?limit=${limit}` : '';
    return enhancedApiClient.get<any[]>(`/vehicles/top-customers${queryString}`);
  },

  // Get customer revenue share
  getCustomerRevenueShare: () =>
    enhancedApiClient.get<any[]>('/vehicles/customer-revenue-share'),
};

// Personnel API endpoints
export const personnelApi = {
  // Get personnel with filters
  getPersonnel: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    
    return enhancedApiClient.get<{
      personnel: unknown[];
      pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/personnel${queryString}`);
  },

  // Get personnel by ID
  getPersonnelById: (id: string) =>
    enhancedApiClient.get<{ personnel: any }>(`/personnel/${id}`),

  // Create personnel
  createPersonnel: (data: {
    full_name: string;
    username?: string;
    email: string;
    phone?: string;
    hire_date?: string;
    status: string;
    notes?: string;
    password?: string;
    role?: string;
  }) =>
    enhancedApiClient.post<{ message: string; personnel: any }>('/personnel', data),

  // Update personnel
  updatePersonnel: (id: string, data: {
    full_name?: string;
    username?: string;
    email?: string;
    phone?: string;
    hire_date?: string;
    status?: string;
    notes?: string;
    is_active?: boolean;
    role?: string;
  }) =>
    enhancedApiClient.put<{ message: string; personnel: any }>(`/personnel/${id}`, data),

  // Delete personnel
  deletePersonnel: (id: string) =>
    enhancedApiClient.delete<{ message: string }>(`/personnel/${id}`),

  // Get personnel statistics
  getPersonnelStats: () =>
    enhancedApiClient.get<{
      stats: {
        active_personnel: number;
        total_personnel: number;
      };
    }>('/personnel/stats/overview'),
};

// Transaction Categories API endpoints
export const categoryApi = {
  // Get all categories
  getTransactionCategories: () =>
    enhancedApiClient.get<{
      success: boolean;
      data: Array<{
        id: number;
        name: string;
        description?: string;
        created_at?: string;
        transaction_count?: number;
      }>;
    }>('/transaction-categories'),

  // Create category
  createTransactionCategory: (data: { name: string }) =>
    enhancedApiClient.post<{ message: string; category: any }>('/transaction-categories', data),

  // Update category
  updateTransactionCategory: (id: string, data: { name: string }) =>
    enhancedApiClient.put<{ message: string; category: any }>(`/transaction-categories/${id}`, data),

  // Delete category
  deleteTransactionCategory: (id: string) =>
    enhancedApiClient.delete<{ message: string }>(`/transaction-categories/${id}`),
};

// Activities API endpoints
export const activityApi = {
  // Get activities
  getActivities: () =>
    enhancedApiClient.get<any[]>('/activities'),

  // Get total revenue
  getTotalRevenue: () =>
    enhancedApiClient.get<{ total_revenue: number }>('/activities/total-revenue'),

  // Get monthly revenue
  getMonthlyRevenue: (params?: { year?: number; month?: number }) => {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    
    return enhancedApiClient.get<{ revenue: number; period: string }>(`/activities/monthly-revenue${queryString}`);
  },

  // Get yearly revenue
  getYearlyRevenue: (params?: { year?: number }) => {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    
    return enhancedApiClient.get<{ revenue: number; year: number }>(`/activities/yearly-revenue${queryString}`);
  },

  // Get category revenue
  getCategoryRevenue: (params?: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}` : '';
    
    return enhancedApiClient.get<{ revenue: number; category: string }>(`/activities/category-revenue${queryString}`);
  },

  // Get category yearly revenue
  getCategoryYearlyRevenue: (params: { categoryId?: string; year?: number }) => {
    const queryString = `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}`;
    
    return enhancedApiClient.get<{ revenue: number }>(`/activities/category-yearly-revenue${queryString}`);
  },

  // Get category monthly revenue
  getCategoryMonthlyRevenue: (params: { categoryId?: string; year?: number; month?: number }) => {
    const queryString = `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}`;
    
    return enhancedApiClient.get<{ revenue: number }>(`/activities/category-monthly-revenue${queryString}`);
  },

  // Get category weekly revenue
  getCategoryWeeklyRevenue: (params: { categoryId?: string; year?: number; week?: number }) => {
    const queryString = `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}`;
    
    return enhancedApiClient.get<{ revenue: number }>(`/activities/category-weekly-revenue${queryString}`);
  },

  // Get category daily revenue
  getCategoryDailyRevenue: (params: { categoryId?: string; date?: string }) => {
    const queryString = `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}`;
    
    return enhancedApiClient.get<{ revenue: number }>(`/activities/category-daily-revenue${queryString}`);
  },

  // Get category custom date range revenue
  getCategoryCustomRevenue: (params: {
    categoryId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryString = `?${new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString()}`;
    
    return enhancedApiClient.get<{ revenue: number }>(`/activities/category-custom-revenue${queryString}`);
  },
};

// Profit Analysis API endpoints
export const profitApi = {
  // NEW: Daily profit analysis
  getDailyProfit: (date: string, categories?: number[]) => {
    const categoryParam = categories && categories.length > 0 ? `&categories=${categories.join(',')}` : '';
    return enhancedApiClient.get<{
      success: boolean;
      data: {
        period: {
          type: 'daily';
          date: string;
          dayName: string;
        };
        summary: {
          totalRevenue: number;
          totalExpense: number;
          totalProfit: number;
          profitMargin: number;
          transactionCount: number;
          averageTransaction: number;
        };
        breakdowns: {
          categories: Array<{
            category: string;
            revenue: number;
            expense: number;
            profit: number;
            profitMargin: number;
            percentage: string;
          }>;
          vehicles: Array<{
            vehicle: string;
            revenue: number;
            expense: number;
            profit: number;
            profitMargin: number;
            percentage: string;
          }>;
        };
        transactions: Array<{
          id: number;
          revenue: number;
          expense: number;
          profit: number;
          description: string;
          transaction_date: string;
          category_name: string;
          vehicle_plate: string;
          personnel_name: string;
          is_expense: boolean;
        }>;
      };
    }>(`/profit/daily?date=${date}${categoryParam}`);
  },

  // NEW: Weekly profit analysis
  getWeeklyProfit: (year?: number, week?: number, categories?: number[]) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (week) params.append('week', week.toString());
    if (categories && categories.length > 0) params.append('categories', categories.join(','));
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    return enhancedApiClient.get<{
      success: boolean;
      data: {
        period: {
          type: 'weekly';
          year: number;
          week: number;
          startDate: string;
          endDate: string;
        };
        summary: {
          totalRevenue: number;
          totalExpense: number;
          totalProfit: number;
          profitMargin: number;
          transactionCount: number;
          averageTransaction: number;
          averageDailyProfit: number;
        };
        breakdowns: {
          daily: Array<{
            rapor_bölümü: string;
            tarih: string;
            gun_adi: string;
            gunluk_gelir: number;
            gunluk_gider: number;
            gunluk_islem_sayisi: number;
            gunluk_kar: number;
          }>;
          categories: Array<{
            category: string;
            revenue: number;
            expense: number;
            profit: number;
            profitMargin: number;
            percentage: string;
          }>;
          vehicles: Array<{
            rapor_bölümü: string;
            arac_plaka: string;
            arac_bilgisi: string;
            arac_gelir: number;
            arac_gider: number;
            arac_kar: number;
            arac_kar_marji: number;
            islem_sayisi: number;
          }>;
          personnel: Array<{
            rapor_bölümü: string;
            personel_adi: string;
            personel_gelir: number;
            personel_gider: number;
            personel_kar: number;
            personel_kar_marji: number;
            islem_sayisi: number;
            ortalama_islem_tutari: number;
          }>;
        };
      };
    }>(`/profit/weekly${queryString}`);
  },

  // NEW: Monthly profit analysis
  getMonthlyProfit: (year: number, month: number, categories?: number[]) => {
    const categoryParam = categories && categories.length > 0 ? `&categories=${categories.join(',')}` : '';
    return enhancedApiClient.get<{
      success: boolean;
      data: {
        period: {
          type: 'monthly';
          year: number;
          month: number;
          monthName: string;
          startDate: string;
          endDate: string;
          dayCount: number;
        };
        summary: {
          totalRevenue: number;
          totalExpense: number;
          totalProfit: number;
          profitMargin: number;
          transactionCount: number;
          averageTransaction: number;
          averageDailyProfit: number;
        };
        analysis: {
          basicAnalysis: {
            rapor_bölümü: string;
            analiz_periyodu: string;
            toplam_gelir: number;
            toplam_gider: number;
            net_kar: number;
            kar_marji_yuzde: number;
            toplam_islem_sayisi: number;
            ortalama_islem_tutari: number;
          };
          categoryAnalysis: Array<{
            rapor_bölümü: string;
            kategori_adi: string;
            kategori_gelir: number;
            kategori_gider: number;
            kategori_kar: number;
            kategori_kar_marji: number;
            islem_sayisi: number;
          }>;
          vehicleAnalysis: Array<{
            rapor_bölümü: string;
            arac_plaka: string;
            arac_bilgisi: string;
            arac_gelir: number;
            arac_gider: number;
            arac_kar: number;
            arac_kar_marji: number;
            islem_sayisi: number;
          }>;
          personnelAnalysis: Array<{
            rapor_bölümü: string;
            personel_adi: string;
            personel_gelir: number;
            personel_gider: number;
            personel_kar: number;
            personel_kar_marji: number;
            islem_sayisi: number;
            ortalama_islem_tutari: number;
          }>;
          generalStats: {
            rapor_bölümü: string;
            gelir_islem_sayisi: number;
            gider_islem_sayisi: number;
            max_gelir_islem: number;
            max_gider_islem: number;
            ort_gelir_islem: number;
            ort_gider_islem: number;
            aktif_arac_sayisi: number;
            aktif_personel_sayisi: number;
            kullanilan_kategori_sayisi: number;
          };
        };
        trends: {
          dailyTrend: Array<{
            rapor_bölümü: string;
            tarih: string;
            gun_adi: string;
            gunluk_gelir: number;
            gunluk_gider: number;
            gunluk_kar: number;
            gunluk_islem_sayisi: number;
          }>;
        };
      };
    }>(`/profit/monthly?year=${year}&month=${month}${categoryParam}`);
  },

  // NEW: Yearly profit analysis
  getYearlyProfit: (year: number, categories?: number[]) => {
    const categoryParam = categories && categories.length > 0 ? `&categories=${categories.join(',')}` : '';
    return enhancedApiClient.get<{
      success: boolean;
      data: {
        period: {
          type: 'yearly';
          year: number;
          startDate: string;
          endDate: string;
        };
        summary: {
          totalRevenue: number;
          totalExpense: number;
          totalProfit: number;
          profitMargin: number;
          transactionCount: number;
          averageTransaction: number;
          averageMonthlyProfit: number;
        };
        breakdowns: {
          monthly: Array<{
            month: number;
            monthName: string;
            revenue: number;
            expense: number;
            profit: number;
            profitMargin: number;
            transactionCount: number;
          }>;
          categories: Array<{
            rapor_bölümü: string;
            kategori_adi: string;
            kategori_gelir: number;
            kategori_gider: number;
            kategori_kar: number;
            kategori_kar_marji: number;
            islem_sayisi: number;
          }>;
          topTransactions: Array<{
            rapor_bölümü: string;
            islem_id: number;
            tarih: string;
            arac_plaka: string;
            personel: string;
            kategori: string;
            aciklama: string;
            gelir: number;
            gider: number;
            net_etki: number;
            odeme_yontemi: string;
            durum: string;
          }>;
        };
      };
          }>(`/profit/yearly?year=${year}${categoryParam}`);
  },

  // LEGACY: Keep existing methods for backward compatibility
  getMonthlyAnalysis: async (year: number, month: number, categories?: number[]) => {
    console.log('📡 [API-CLIENT-DEBUG] getMonthlyAnalysis called:', {
      year,
      month,
      categories,
      timestamp: new Date().toISOString(),
      endpoint: `/transactions/profit-analysis/monthly/${year}/${month}`
    });
    
    console.time('API_CLIENT_REQUEST');
    try {
      const response = await enhancedApiClient.get<{
        success: boolean;
        message: string;
        data: {
          period: {
            year: number;
            month: number;
            monthName: string;
            startDate: string;
            endDate: string;
            periodType: 'monthly';
          };
          summary: {
            totalRevenue: number;
            totalExpense: number;
            totalProfit: number;
            profitMargin: number;
            transactionCount: number;
            averageTransaction: number;
          };
          breakdown: {
            byCategory: Array<{
              category: string;
              revenue: number;
              expense: number;
              profit: number;
              profitMargin: number;
              percentage: string;
            }>;
            byVehicle: Array<{
              vehicle: string;
              revenue: number;
              expense: number;
              profit: number;
              profitMargin: number;
              percentage: string;
            }>;
            byPersonnel: Array<{
              personnel: string;
              revenue: number;
              expense: number;
              profit: number;
              profitMargin: number;
              percentage: string;
            }>;
          };
          dailyTrend: Array<{
            date: string;
            dayName: string;
            revenue: number;
            expense: number;
            profit: number;
            transactionCount: number;
          }>;
          topTransactions: Array<{
            id: number;
            description: string;
            amount: number;
            expense: number;
            profit: number;
            date: string;
            category: string;
            vehicle: string;
            personnel: string;
            paymentMethod: string;
            status: string;
          }>;
          generalStats: {
            revenueTransactionCount: number;
            expenseTransactionCount: number;
            maxRevenueTransaction: number;
            maxExpenseTransaction: number;
            averageRevenueTransaction: number;
            averageExpenseTransaction: number;
            activeVehicleCount: number;
            activePersonnelCount: number;
            activeCategoryCount: number;
          };
          transactions: Array<{
            id: number;
            amount: number;
            expense: number;
            profit: number;
            description: string;
            transaction_date: string;
            category_name: string;
            vehicle_plate: string;
            personnel_name: string;
            is_expense: boolean;
            payment_method: string;
            status: string;
          }>;
        };
      }>(`/transactions/profit-analysis/monthly/${year}/${month}`);
      console.timeEnd('API_CLIENT_REQUEST');
      return response;
    } catch (error) {
      console.error('Error fetching monthly profit analysis:', error);
      throw error;
    }
  },

  getYearlyAnalysis: (year: number) =>
    enhancedApiClient.get<{
      success: boolean;
      message: string;
      data: {
        period: {
          year: number;
          startDate: string;
          endDate: string;
          periodType: 'yearly';
        };
        summary: {
          totalRevenue: number;
          totalExpense: number;
          totalProfit: number;
          profitMargin: number;
          totalTransactions: number;
          averageMonthlyProfit: number;
          averageTransactionValue: number;
        };
        monthlyBreakdown: Array<{
          month: number;
          monthName: string;
          revenue: number;
          expense: number;
          profit: number;
          profitMargin: number;
          transactionCount: number;
        }>;
        transactions: Array<{
          id: number;
          amount: number;
          expense: number;
          profit: number;
          description: string;
          transaction_date: string;
          category_name: string;
          vehicle_plate: string;
          personnel_name: string;
          is_expense: boolean;
          payment_method: string;
          status: string;
        }>;
      };
    }>(`/transactions/profit-analysis/yearly/${year}`),

  getDailyProfit_legacy: (date: string) =>
    enhancedApiClient.get<{
      success: boolean;
      data: {
        period: {
          startDate: string;
          endDate: string;
          periodType: 'daily';
        };
        summary: {
          totalRevenue: number;
          totalExpense: number;
          totalProfit: number;
          profitMargin: number;
          transactionCount: number;
          averageTransaction: number;
        };
        dailyBreakdown: Array<{
          date: string;
          dayName: string;
          revenue: number;
          expense: number;
          profit: number;
          transactionCount: number;
          transactions: any[];
        }>;
        transactions: any[];
      };
    }>(`/transactions/daily-profit?date=${date}`),
};

// NEW: Revenue Analysis API endpoints
export const revenueApi = {
  // Daily revenue analysis (using custom-revenue endpoint)
  getDailyRevenue: (date: string) =>
    enhancedApiClient.get<{
      success: boolean;
      data: {
        period: {
          startDate: string;
          endDate: string;
          periodType: string;
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
          id: number;
          amount: number;
          description: string;
          transaction_date: string;
          category_name: string;
          vehicle_plate: string;
          personnel_name: string;
        }>;
      };
    }>(`/activities/custom-revenue?startDate=${date}&endDate=${date}&periodType=daily`),

  // Custom date range revenue analysis
  getCustomDateRangeRevenue: (startDate: string, endDate: string, periodType: string = 'custom') =>
    enhancedApiClient.get<{
      success: boolean;
      data: {
        period: {
          startDate: string;
          endDate: string;
          periodType: string;
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
          id: number;
          amount: number;
          description: string;
          transaction_date: string;
          category_name: string;
          vehicle_plate: string;
          personnel_name: string;
        }>;
      };
    }>(`/activities/custom-revenue?startDate=${startDate}&endDate=${endDate}&periodType=${periodType}`),

  // Weekly revenue analysis
  getWeeklyRevenue: (year?: number, week?: number) => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (week) params.append('week', week.toString());
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    return enhancedApiClient.get<{
      success: boolean;
      data: {
        period: {
          year: number;
          week: number;
          startDate: string;
          endDate: string;
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
      };
    }>(`/activities/weekly-revenue${queryString}`);
  },

  // Monthly revenue analysis
  getMonthlyRevenue: (year: number, month: number) =>
    enhancedApiClient.get<{
      success: boolean;
      data: {
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
          id: number;
          amount: number;
          description: string;
          transaction_date: string;
          category_name: string;
          vehicle_plate: string;
          personnel_name: string;
        }>;
      };
    }>(`/activities/monthly-revenue?year=${year}&month=${month}`),

  // Yearly revenue analysis
  getYearlyRevenue: (year: number) =>
    enhancedApiClient.get<{
      success: boolean;
      data: {
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
          id: number;
          amount: number;
          description: string;
          transaction_date: string;
          category_name: string;
          vehicle_plate: string;
          personnel_name: string;
        }>;
      };
    }>(`/activities/yearly-revenue?year=${year}`),
};

// Health check endpoint
export const healthApi = {
  // Health check (public endpoint)
  check: () => enhancedApiClient.healthCheck(),
};

// Export everything as a combined API object
export const api = {
  auth: authApi,
  user: userApi,
  transaction: transactionApi,
  vehicle: vehicleApi,
  personnel: personnelApi,
  category: categoryApi,
  activity: activityApi,
  profit: profitApi,
  revenue: revenueApi,
  health: healthApi,
};

export default api; 

