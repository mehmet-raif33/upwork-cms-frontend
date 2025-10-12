// API functions for the frontend application

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to make API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Helper function to make authenticated API requests
async function authenticatedApiRequest(endpoint: string, token: string, options: RequestInit = {}) {
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

// Activities API
export async function getActivitiesApi(token: string) {
  return authenticatedApiRequest('/activities', token);
}

// Vehicles API
export async function getVehiclesCountApi(token: string) {
  return authenticatedApiRequest('/vehicles/count', token);
}

export async function getVehicleApi(token: string, plate: string) {
  return authenticatedApiRequest(`/vehicles/${plate}`, token);
}

export async function getTransactionsByVehicleApi(token: string, plate: string) {
  return authenticatedApiRequest(`/vehicles/${plate}/transactions`, token);
}

// Personnel API
export async function getPersonnelCountApi(token: string) {
  return authenticatedApiRequest('/personnel/count', token);
}

export async function getPersonnelApi(token: string) {
  return authenticatedApiRequest('/personnel', token);
}

export async function getPersonnelByIdApi(token: string, id: string) {
  return authenticatedApiRequest(`/personnel/${id}`, token);
}

export async function updatePersonnelApi(token: string, id: string, data: any) {
  return authenticatedApiRequest(`/personnel/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Transactions API
export async function getTransactionsStatsApi(token: string) {
  return authenticatedApiRequest('/transactions/stats', token);
}

export async function getTransactionApi(token: string, id: string) {
  return authenticatedApiRequest(`/transactions/${id}`, token);
}

export async function getTransactionHistoryApi(token: string, id: string) {
  return authenticatedApiRequest(`/transactions/${id}/history`, token);
}

export async function updateTransactionStatusApi(token: string, id: string, data: any) {
  return authenticatedApiRequest(`/transactions/${id}/status`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Auth API
export async function changePasswordApi(token: string, data: { oldPassword: string; newPassword: string }) {
  return authenticatedApiRequest('/auth/change-password', token, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getUsersApi(token: string) {
  return authenticatedApiRequest('/users', token);
} 