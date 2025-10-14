import { broadcastTokenExpired } from './utils/broadcastChannel';

// Environment'a göre API URL'ini belirle
const getApiBaseUrl = () => {
  const baseUrl = process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_RAILWAY_LOCAL || 'http://localhost:5000'
    : process.env.NEXT_PUBLIC_RAILWAY_SERVER || 'https://ulasserver-production.up.railway.app';
  
  // /api prefix'i ekle
  return `${baseUrl}/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging (sadece development'ta)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    RAILWAY_LOCAL: process.env.NEXT_PUBLIC_RAILWAY_LOCAL,
    RAILWAY_SERVER: process.env.NEXT_PUBLIC_RAILWAY_SERVER,
    SELECTED_URL: API_BASE_URL
  });
}

// Token validation helper
function validateTokenStructure(token: string): boolean {
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('🚨 Invalid JWT structure - parts:', parts.length);
      return false;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < currentTime) {
      console.error('🚨 Token expired:', {
        exp: payload.exp,
        current: currentTime,
        expiredBy: currentTime - payload.exp
      });
      return false;
    }
    
    console.log('✅ Token valid:', {
      userId: payload.id,
      role: payload.role,
      exp: payload.exp,
      remainingTime: payload.exp - currentTime
    });
    
    return true;
  } catch (error) {
    console.error('🚨 Token validation error:', error);
    return false;
  }
}

export async function loginApi({ username, password }: { username: string; password: string }) {
  console.log('🔐 Login attempt:', { username, baseUrl: API_BASE_URL });
  
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  console.log('📡 Login response:', {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries())
  });
  
  if (!res.ok) {
    const error = await res.json();
    console.error('❌ Login failed:', error);
    throw new Error(error.message || 'Giriş başarısız');
  }
  
  const data = await res.json();
  console.log('✅ Login successful:', {
    hasToken: !!data.token,
    tokenLength: data.token?.length,
    userId: data.user?.id,
    role: data.user?.role
  });
  
  return data;  
}

export async function getProfileApi(token: string) {
  console.log('👤 Getting profile with token validation...');
  
  if (!validateTokenStructure(token)) {
    console.error('🚨 Invalid token structure');
    throw new Error('Token geçersiz veya süresi dolmuş');
  }
  
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });
  
  console.log('📡 Profile response:', {
    status: res.status,
    statusText: res.statusText,
    url: `${API_BASE_URL}/auth/profile`
  });
  
  if (!res.ok) {
    const error = await res.json();
    console.error('❌ Profile fetch failed:', {
      status: res.status,
      error: error,
      token: token.substring(0, 20) + '...'
    });
    
    // Token expired durumunda diğer sekmelere bildir
    if (res.status === 401) {
      broadcastTokenExpired();
    }
    throw new Error(error.message || 'Profil alınamadı');
  }
  
  const data = await res.json();
  console.log('✅ Profile fetched successfully:', {
    userId: data.user?.id,
    role: data.user?.role
  });
  
  return data;
}

export async function changePasswordApi(token: string, { oldPassword, newPassword }: { oldPassword: string; newPassword: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Şifre değiştirme başarısız');
  }
  return res.json();
}

export async function getUserApi(token: string, userId: string) {
  const res = await fetch(`${API_BASE_URL}/user/${userId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Kullanıcı bilgisi alınamadı');
  }
  return res.json();
}

export async function getUsersApi(token: string) {
  const res = await fetch(`${API_BASE_URL}/user`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    // Token expired durumunda diğer sekmelere bildir
    if (res.status === 401) {
      broadcastTokenExpired();
    }
    throw new Error(error.message || 'Kullanıcılar alınamadı');
  }
  return res.json();
}

// Health check endpoint
export async function healthCheckApi() {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Health check başarısız');
  }
  return res.json();
}

// Transaction Categories API
export async function getTransactionCategoriesApi(token: string) {
  console.log('Fetching transaction categories from:', `${API_BASE_URL}/transaction-categories`);
  
  const res = await fetch(`${API_BASE_URL}/transaction-categories`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  console.log('Transaction Categories API Response Status:', res.status);
  
  if (!res.ok) {
    const error = await res.json();
    // Token expired durumunda diğer sekmelere bildir
    if (res.status === 401) {
      broadcastTokenExpired();
    }
    throw new Error(error.message || 'Kategoriler alınamadı');
  }
  
  const data = await res.json();
  console.log('Transaction Categories API Response Data:', data);
  return data;
}

export async function createTransactionCategoryApi(token: string, data: { name: string }) {
  const res = await fetch(`${API_BASE_URL}/transaction-categories`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Kategori oluşturulamadı');
  }
  return res.json();
}

export async function updateTransactionCategoryApi(token: string, id: string, data: { name: string }) {
  const res = await fetch(`${API_BASE_URL}/transaction-categories/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Kategori güncellenemedi');
  }
  return res.json();
}

export async function deleteTransactionCategoryApi(token: string, id: string) {
  const res = await fetch(`${API_BASE_URL}/transaction-categories/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Kategori silinemedi');
  }
  return res.json();
}

// Vehicles API
export async function getVehiclesApi(token: string, params?: { page?: number; limit?: number; search?: string }) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  
  const url = `${API_BASE_URL}/vehicles${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Araçlar alınamadı');
  }
  const data = await res.json();
  return data;
}

export async function getVehicleApi(token: string, plate: string) {
  const res = await fetch(`${API_BASE_URL}/vehicles/${plate}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Araç bilgisi alınamadı');
  }
  return res.json();
}

export async function createVehicleApi(token: string, data: { 
  plate: string; 
  year: number; 
  customer_email?: string; 
  customer_phone?: string; 
}) {
  const res = await fetch(`${API_BASE_URL}/vehicles`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Araç oluşturulamadı');
  }
  return res.json();
}

export async function updateVehicleApi(token: string, plate: string, data: { 
  year?: number; 
  customer_email?: string; 
  customer_phone?: string; 
}) {
  const res = await fetch(`${API_BASE_URL}/vehicles/${plate}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Araç güncellenemedi');
  }
  return res.json();
}

export async function deleteVehicleApi(token: string, plate: string) {
  const res = await fetch(`${API_BASE_URL}/vehicles/${plate}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Araç silinemedi');
  }
  return res.json();
}

// Personnel API
export async function getPersonnelApi(token: string, params?: { page?: number; limit?: number; search?: string; status?: string }) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status) queryParams.append('status', params.status);
  
  const url = `${API_BASE_URL}/personnel${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Personel alınamadı');
  }
  const data = await res.json();
  return data;
}

export async function getPersonnelByIdApi(token: string, id: string) {
  const res = await fetch(`${API_BASE_URL}/personnel/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Personel bilgisi alınamadı');
  }
  return res.json();
}

export async function createPersonnelApi(token: string, data: { 
  full_name: string; 
  username?: string; 
  email: string; 
  phone?: string; 
  hire_date?: string; 
  status: string; 
  notes?: string;
  password?: string;
  role?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/personnel`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Personel oluşturulamadı');
  }
  return res.json();
}

export async function updatePersonnelApi(token: string, id: string, data: { 
  full_name?: string; 
  username?: string; 
  email?: string; 
  phone?: string; 
  hire_date?: string; 
  status?: string; 
  notes?: string;
  is_active?: boolean;
  role?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/personnel/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Personel güncellenemedi');
  }
  return res.json();
}

// Personel durumu güncelle (aktif/pasif)
export async function updatePersonnelStatusApi(token: string, id: string, is_active: boolean) {
  const res = await fetch(`${API_BASE_URL}/personnel/${id}/status`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ is_active })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Personel durumu güncellenemedi');
  }
  return res.json();
}

// Transactions API
export async function getTransactionsApi(token: string, params?: { 
  page?: number; 
  limit?: number; 
  vehicle_id?: string; 
  personnel_id?: string; 
  category_id?: string; 
  start_date?: string; 
  end_date?: string; 
}) {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.vehicle_id) queryParams.append('vehicle_id', params.vehicle_id);
  if (params?.personnel_id) queryParams.append('personnel_id', params.personnel_id);
  if (params?.category_id) queryParams.append('category_id', params.category_id);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  
  const url = `${API_BASE_URL}/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  console.log('Fetching transactions from:', url);
  
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  console.log('Transactions API Response Status:', res.status);
  
  if (!res.ok) {
    const error = await res.json();
    // Token expired durumunda diğer sekmelere bildir
    if (res.status === 401) {
      broadcastTokenExpired();
    }
    throw new Error(error.message || 'İşlemler alınamadı');
  }
  
  const data = await res.json();
  console.log('Transactions API Response Data:', data);
  return data;
}

export async function getTransactionApi(token: string, id: string) {
  const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'İşlem bilgisi alınamadı');
  }
  return res.json();
}

export async function createTransactionApi(token: string, data: { 
  vehicle_id: string; 
  category_id: string; 
  amount: number; 
  expense?: number;
  is_expense?: boolean;
  description: string; 
  transaction_date: string; 
}) {
  const res = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'İşlem oluşturulamadı');
  }
  return res.json();
}

export async function updateTransactionApi(token: string, id: string, data: { 
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
}) {
  const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'İşlem güncellenemedi');
  }
  return res.json();
}

export async function deleteTransactionApi(token: string, id: string) {
  const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'İşlem silinemedi');
  }
  return res.json();
}

// Get transactions by vehicle
export async function getTransactionsByVehicleApi(token: string, plate: string) {
  const res = await fetch(`${API_BASE_URL}/transactions/by-plate/${plate}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Araç işlemleri alınamadı');
  }
  return res.json();
}

// Get transactions by category
export async function getTransactionsByCategoryApi(token: string, categoryId: string) {
  const res = await fetch(`${API_BASE_URL}/transactions/category/${categoryId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Kategori işlemleri alınamadı');
  }
  return res.json();
}

// Get transaction history
export async function getTransactionHistoryApi(token: string, transactionId: string) {
  const res = await fetch(`${API_BASE_URL}/transactions/${transactionId}/history`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'İşlem geçmişi alınamadı');
  }
  return res.json();
}

// Update transaction status
export async function updateTransactionStatusApi(token: string, transactionId: string, data: { status: string; notes?: string }) {
  const res = await fetch(`${API_BASE_URL}/transactions/${transactionId}/status`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'İşlem durumu güncellenemedi');
  }
  return res.json();
} 

export async function getActivitiesApi(token: string) {
  const res = await fetch(`${API_BASE_URL}/activities`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Etkinlikler alınamadı');
  }
  const data = await res.json();
  return data.data || data; // Backend'den gelen veriyi düzgün şekilde al
}

export async function getPersonnelActivitiesApi(token: string, personnelId: string) {
  const res = await fetch(`${API_BASE_URL}/activities/personnel/${personnelId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Personel etkinlikleri alınamadı');
  }
  const data = await res.json();
  return data.data || data; // Backend'den gelen veriyi düzgün şekilde al
}

export async function getTotalRevenueApi(token: string) {
  const res = await fetch(`${API_BASE_URL}/activities/total-revenue`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Toplam ciro alınamadı');
  }
  const data = await res.json();
  return data.data;
} 

export async function getVehiclesCountApi(token: string) {
  const res = await fetch(`${API_BASE_URL}/vehicles/stats/overview`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Araç sayısı alınamadı');
  }
  const data = await res.json();
  return data.stats?.total_vehicles || 0;
}

export async function getPersonnelCountApi(token: string) {
  const res = await fetch(`${API_BASE_URL}/personnel/stats/overview`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Personel sayısı alınamadı');
  }
  const data = await res.json();
  return data.stats?.active_personnel || 0;
}

export async function getTransactionsStatsApi(token: string, start_date?: string, end_date?: string) {
  let url = `${API_BASE_URL}/transactions/stats/overview`;
  if (start_date && end_date) {
    url += `?start_date=${start_date}&end_date=${end_date}`;
  }
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'İşlem istatistikleri alınamadı');
  }
  const data = await res.json();
  return data.stats;
}

// Dinamik işlem istatistikleri API
export async function getTransactionsSummaryStatsApi(token: string, params?: { 
  vehicle_id?: string; 
  personnel_id?: string; 
  category_id?: string; 
  start_date?: string; 
  end_date?: string; 
}) {
  const queryParams = new URLSearchParams();
  if (params?.vehicle_id) queryParams.append('vehicle_id', params.vehicle_id);
  if (params?.personnel_id) queryParams.append('personnel_id', params.personnel_id);
  if (params?.category_id) queryParams.append('category_id', params.category_id);
  if (params?.start_date) queryParams.append('start_date', params.start_date);
  if (params?.end_date) queryParams.append('end_date', params.end_date);
  
  const url = `${API_BASE_URL}/transactions/stats/summary${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  console.log('Fetching transaction stats from:', url);
  
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  console.log('Transaction Stats API Response Status:', res.status);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'İşlem istatistikleri alınamadı');
  }
  
  const data = await res.json();
  console.log('Transaction Stats API Response Data:', data);
  return data.stats;
}

// Ciro hesaplama API'leri
export async function getMonthlyRevenueApi(token: string, year?: number, month?: number) {
  const params = new URLSearchParams();
  if (year) params.append('year', year.toString());
  if (month) params.append('month', month.toString());
  
  const res = await fetch(`${API_BASE_URL}/activities/monthly-revenue?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Aylık ciro alınamadı');
  }
  return res.json();
}

export async function getYearlyRevenueApi(token: string, year?: number) {
  const params = new URLSearchParams();
  if (year) params.append('year', year.toString());
  
  const res = await fetch(`${API_BASE_URL}/activities/yearly-revenue?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Yıllık ciro alınamadı');
  }
  return res.json();
}

export async function getCategoryRevenueApi(token: string, categoryId?: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (categoryId) params.append('categoryId', categoryId);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const res = await fetch(`${API_BASE_URL}/activities/category-revenue?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Kategori ciro alınamadı');
  }
  return res.json();
}

// Kategori bazında yıllık ciro
export async function getCategoryYearlyRevenueApi(token: string, params: { categoryId?: string; year?: number }) {
  let url = `${API_BASE_URL}/activities/category-yearly-revenue`;
  const queryParams = new URLSearchParams();
  
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.year) queryParams.append('year', params.year.toString());
  
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Kategori yıllık ciro verisi alınamadı');
  }
  return res.json();
}

// Kategori bazında aylık ciro
export async function getCategoryMonthlyRevenueApi(token: string, params: { categoryId?: string; year?: number; month?: number }) {
  let url = `${API_BASE_URL}/activities/category-monthly-revenue`;
  const queryParams = new URLSearchParams();
  
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.year) queryParams.append('year', params.year.toString());
  if (params.month) queryParams.append('month', params.month.toString());
  
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Kategori aylık ciro verisi alınamadı');
  }
  return res.json();
}

// Kategori bazında haftalık ciro
export async function getCategoryWeeklyRevenueApi(token: string, params: { categoryId?: string; year?: number; week?: number }) {
  let url = `${API_BASE_URL}/activities/category-weekly-revenue`;
  const queryParams = new URLSearchParams();
  
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.year) queryParams.append('year', params.year.toString());
  if (params.week) queryParams.append('week', params.week.toString());
  
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Kategori haftalık ciro verisi alınamadı');
  }
  return res.json();
}

// Kategori bazında günlük ciro
export async function getCategoryDailyRevenueApi(token: string, params: { categoryId?: string; date?: string }) {
  let url = `${API_BASE_URL}/activities/category-daily-revenue`;
  const queryParams = new URLSearchParams();
  
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.date) queryParams.append('date', params.date);
  
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Kategori günlük ciro verisi alınamadı');
  }
  return res.json();
}

// Kategori bazında manuel tarih aralığı ciro
export async function getCategoryCustomRevenueApi(token: string, params: { categoryId?: string; startDate?: string; endDate?: string }) {
  let url = `${API_BASE_URL}/activities/category-custom-revenue`;
  const queryParams = new URLSearchParams();
  
  if (params.categoryId) queryParams.append('categoryId', params.categoryId);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  
  if (queryParams.toString()) {
    url += `?${queryParams.toString()}`;
  }

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Kategori manuel ciro verisi alınamadı');
  }
  return res.json();
}

// Customer Statistics API
export async function getCustomerStatsApi(token: string) {
  const res = await fetch(`${API_BASE_URL}/vehicles/customer-stats`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Müşteri istatistikleri alınamadı');
  }
  const data = await res.json();
  return data;
}

export async function getTopCustomersApi(token: string, limit?: number) {
  const url = `${API_BASE_URL}/vehicles/top-customers${limit ? `?limit=${limit}` : ''}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'En çok işlem yapan müşteriler alınamadı');
  }
  const data = await res.json();
  return data.data;
}

export async function getCustomerRevenueShareApi(token: string) {
  const res = await fetch(`${API_BASE_URL}/vehicles/customer-revenue-share`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Müşteri ciro payları alınamadı');
  }
  const data = await res.json();
  return data.data;
}