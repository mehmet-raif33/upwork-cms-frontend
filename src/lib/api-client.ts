import { broadcastTokenExpired } from '../app/utils/broadcastChannel';

// Environment'a göre API URL'ini belirle
const getApiBaseUrl = () => {
  // NODE_ENV'e göre sunucu seçimi
  const baseUrl = process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_RAILWAY_LOCAL || 'http://localhost:5000'
    : process.env.NEXT_PUBLIC_RAILWAY_SERVER || 'https://ulasserver-production.up.railway.app';
  
  // /api prefix'i ekle
  return `${baseUrl}/api`;
};

// API Configuration
const API_CONFIG = {
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  retries: 3
};

// Debug logging
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Client Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    BASE_URL: API_CONFIG.baseURL,
    RAILWAY_LOCAL: process.env.NEXT_PUBLIC_RAILWAY_LOCAL,
    RAILWAY_SERVER: process.env.NEXT_PUBLIC_RAILWAY_SERVER
  });
}

// Token validation helper
function validateToken(token: string): boolean {
  if (!token) return false;
  
  try {
    // Basic JWT structure check
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload to check expiry
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < currentTime) {
      console.warn('🚨 Token expired:', {
        exp: payload.exp,
        current: currentTime
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('🚨 Token validation error:', error);
    return false;
  }
}

// Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  error: string;
  statusCode?: number;
}

// Custom error class
export class ApiClientError extends Error {
  public statusCode: number;
  public errorCode: string;

  constructor(message: string, statusCode: number = 500, errorCode: string = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// Request configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

// API Client class
class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.defaultTimeout = API_CONFIG.timeout;
    this.defaultRetries = API_CONFIG.retries;
  }

  // Create request with timeout
  private createRequestWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    return Promise.race([
      fetch(url, options),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new ApiClientError('Request timeout', 408, 'TIMEOUT')), timeout)
      )
    ]);
  }

  // Retry mechanism
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number,
    delay: number = 1000
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        console.log(`🔄 Retrying request... (${this.defaultRetries - retries + 1}/${this.defaultRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  // Check if error is retryable
  private isRetryableError(error: unknown): boolean {
    if (error instanceof ApiClientError) {
      return [408, 429, 500, 502, 503, 504].includes(error.statusCode);
    }
    return false;
  }

  // Main request method
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    console.log(`🌐 API Request: ${method} ${url}`, {
      headers: requestOptions.headers,
      body: method !== 'GET' ? body : undefined
    });

    const makeRequest = async (): Promise<ApiResponse<T>> => {
      try {
        const response = await this.createRequestWithTimeout(url, requestOptions, timeout);
        
        console.log(`📡 API Response: ${method} ${url}`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        // Handle token expiration
        if (response.status === 401) {
          console.error('🚨 Authentication expired (401)');
          broadcastTokenExpired();
          throw new ApiClientError('Authentication expired', 401, 'TOKEN_EXPIRED');
        }

        // Handle forbidden error
        if (response.status === 403) {
          console.error('🚨 Access forbidden (403) - Token might be invalid');
          const errorText = await response.text();
          console.error('403 Error details:', errorText);
          throw new ApiClientError('Access forbidden - Invalid token', 403, 'ACCESS_FORBIDDEN');
        }

        const data = await response.json();

        if (!response.ok) {
          throw new ApiClientError(
            data.message || 'Request failed',
            response.status,
            data.error || 'REQUEST_FAILED'
          );
        }

        return data;
      } catch (error) {
        if (error instanceof ApiClientError) {
          throw error;
        }
        
        if (error instanceof TypeError && error.message.includes('fetch')) {
          console.error('🌐 Network error:', error);
          throw new ApiClientError('Network error', 0, 'NETWORK_ERROR');
        }
        
        console.error('❌ Unknown API error:', error);
        throw new ApiClientError('Unknown error occurred', 500, 'UNKNOWN_ERROR');
      }
    };

    return this.retryRequest(makeRequest, retries);
  }

  // Convenience methods
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  async post<T>(endpoint: string, body: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  async put<T>(endpoint: string, body: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  async patch<T>(endpoint: string, body: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  }

  // Authenticated request helper
  async authenticatedRequest<T>(
    endpoint: string,
    token: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    // Validate token before making request
    if (!validateToken(token)) {
      console.error('🚨 Invalid token provided to authenticatedRequest');
      throw new ApiClientError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }

    console.log('🔐 Making authenticated request with token:', {
      endpoint,
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...'
    });

    return this.request<T>(endpoint, {
      ...config,
      headers: {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      },
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export convenience functions
export const api = {
  // Auth endpoints
  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login', credentials),

  getProfile: (token: string) =>
    apiClient.authenticatedRequest('/auth/profile', token),

  changePassword: (token: string, passwords: { currentPassword: string; newPassword: string }) =>
    apiClient.authenticatedRequest('/auth/change-password', token, {
      method: 'PUT',
      body: { oldPassword: passwords.currentPassword, newPassword: passwords.newPassword }
    }),

  // User endpoints
  getUsers: (token: string) =>
    apiClient.authenticatedRequest('/user', token),

  getUser: (token: string, userId: string) =>
    apiClient.authenticatedRequest(`/user/${userId}`, token),

  // Transaction endpoints
  getTransactions: (token: string, params?: Record<string, string>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient.authenticatedRequest(`/transactions${queryString}`, token);
  },

  getTransaction: (token: string, id: string) =>
    apiClient.authenticatedRequest(`/transactions/${id}`, token),

  createTransaction: (token: string, data: unknown) =>
    apiClient.authenticatedRequest('/transactions', token, {
      method: 'POST',
      body: data
    }),

  updateTransaction: (token: string, id: string, data: unknown) =>
    apiClient.authenticatedRequest(`/transactions/${id}`, token, {
      method: 'PUT',
      body: data
    }),

  deleteTransaction: (token: string, id: string) =>
    apiClient.authenticatedRequest(`/transactions/${id}`, token, {
      method: 'DELETE'
    }),

  // Vehicle endpoints
  getVehicles: (token: string, params?: Record<string, string>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient.authenticatedRequest(`/vehicles${queryString}`, token);
  },

  getCustomers: (token: string, params?: Record<string, string>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient.authenticatedRequest(`/vehicles/customers${queryString}`, token);
  },

  getVehicle: (token: string, plate: string) =>
    apiClient.authenticatedRequest(`/vehicles/${plate}`, token),

  createVehicle: (token: string, data: unknown) =>
    apiClient.authenticatedRequest('/vehicles', token, {
      method: 'POST',
      body: data
    }),

  updateVehicle: (token: string, plate: string, data: unknown) =>
    apiClient.authenticatedRequest(`/vehicles/${plate}`, token, {
      method: 'PUT',
      body: data
    }),

  deleteVehicle: (token: string, plate: string) =>
    apiClient.authenticatedRequest(`/vehicles/${plate}`, token, {
      method: 'DELETE'
    }),

  // Personnel endpoints
  getPersonnel: (token: string, params?: Record<string, string>) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiClient.authenticatedRequest(`/personnel${queryString}`, token);
  },

  getPersonnelById: (token: string, id: string) =>
    apiClient.authenticatedRequest(`/personnel/${id}`, token),

  createPersonnel: (token: string, data: unknown) =>
    apiClient.authenticatedRequest('/personnel', token, {
      method: 'POST',
      body: data
    }),

  updatePersonnel: (token: string, id: string, data: unknown) =>
    apiClient.authenticatedRequest(`/personnel/${id}`, token, {
      method: 'PUT',
      body: data
    }),

  deletePersonnel: (token: string, id: string) =>
    apiClient.authenticatedRequest(`/personnel/${id}`, token, {
      method: 'DELETE'
    }),

  // Category endpoints
  getTransactionCategories: (token: string) =>
    apiClient.authenticatedRequest('/transaction-categories', token),

  createTransactionCategory: (token: string, data: { name: string }) =>
    apiClient.authenticatedRequest('/transaction-categories', token, {
      method: 'POST',
      body: data
    }),

  updateTransactionCategory: (token: string, id: string, data: { name: string }) =>
    apiClient.authenticatedRequest(`/transaction-categories/${id}`, token, {
      method: 'PUT',
      body: data
    }),

  deleteTransactionCategory: (token: string, id: string) =>
    apiClient.authenticatedRequest(`/transaction-categories/${id}`, token, {
      method: 'DELETE'
    }),

  // Activity endpoints
  getActivities: (token: string) =>
    apiClient.authenticatedRequest('/activities', token),

  // Health check
  healthCheck: () => apiClient.get('/health'),
};

export default apiClient; 