import { broadcastTokenExpired } from './utils/broadcastChannel';

let API_BASE_URL = '';

// Environment variables'dan API URL'ini al
if (process.env.NODE_ENV === 'production') {
  // Production ortamında Railway server'ını kullan
  API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_API1 || process.env.NEXT_PUBLIC_API_URL || 'https://ulasserver-production.up.railway.app';
} else {
  // Development ortamında local server'ı kullan
  API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_API || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
} 

// Fallback için güvenlik kontrolü - protokolü garanti et
if (!API_BASE_URL || !API_BASE_URL.startsWith('http')) {
  console.warn('API_BASE_URL is not set or invalid, using default localhost');
  API_BASE_URL = 'http://localhost:5000';
}

console.log('=== API DEBUG INFO ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_SERVER_API:', process.env.NEXT_PUBLIC_SERVER_API);
console.log('NEXT_PUBLIC_SERVER_API1:', process.env.NEXT_PUBLIC_SERVER_API1);
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('Final API_BASE_URL:', API_BASE_URL);
console.log('========================');

export async function loginApi({ username, password }: { username: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Giriş başarısız');
  }
  return res.json();  
}



export async function getProfileApi(token: string) {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    // Token expired durumunda diğer sekmelere bildir
    if (res.status === 401) {
      broadcastTokenExpired();
    }
    throw new Error(error.message || 'Profil alınamadı');
  }
  return res.json();
}

export async function changePasswordApi(token: string, { oldPassword, newPassword }: { oldPassword: string; newPassword: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ oldPassword, newPassword }),
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
  const res = await fetch(`${API_BASE_URL}/transaction-categories`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Kategoriler alınamadı');
  }
  const data = await res.json();
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
  brand: string; 
  model: string; 
  year: number; 
  color: string; 
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
  brand?: string; 
  model?: string; 
  year?: number; 
  color?: string; 
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

export async function deletePersonnelApi(token: string, id: string) {
  const res = await fetch(`${API_BASE_URL}/personnel/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Personel silinemedi');
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
  
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'İşlemler alınamadı');
  }
  return res.json();
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
  category_id?: string; 
  amount?: number; 
  description?: string; 
  transaction_date?: string; 
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