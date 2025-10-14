import { tokenManager } from './token-manager';

// API Configuration - NODE_ENV'e göre sunucu seçimi
const getBaseURL = () => {
  const baseUrl = process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_RAILWAY_LOCAL || 'http://localhost:5000'
    : process.env.NEXT_PUBLIC_RAILWAY_SERVER || 'https://upwork-cms-backend-production.up.railway.app';
  
  // /api prefix'i ekle
  return `${baseUrl}/api`;
};

const API_CONFIG = {
  baseURL: getBaseURL(),
  timeout: 30000, // Increased timeout for token refresh operations
  retries: 3,
  retryDelay: 1000
};

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
  statusCode: number;
}

// Request configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  requiresAuth?: boolean;
}

// Internal request config with all required fields
interface InternalRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: unknown;
  timeout: number;
  retries: number;
  requiresAuth: boolean;
  url: string;
}

// Request interceptor type
type RequestInterceptor = (config: InternalRequestConfig) => Promise<InternalRequestConfig>;

// Response interceptor type
type ResponseInterceptor = (response: Response, config: InternalRequestConfig) => Promise<Response>;

// Error interceptor type
type ErrorInterceptor = (error: ApiError, config: InternalRequestConfig) => Promise<never>;

// Custom error class
export class ApiClientError extends Error implements ApiError {
  public statusCode: number;
  public error: string;
  public originalError?: unknown;

  constructor(message: string, statusCode: number = 500, error: string = 'UNKNOWN_ERROR', originalError?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.error = error;
    this.originalError = originalError;
  }
}

// Enhanced API Client with automatic token management
class EnhancedApiClient {
  private baseURL: string;
  private defaultTimeout: number;
  private defaultRetries: number;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.defaultTimeout = API_CONFIG.timeout;
    this.defaultRetries = API_CONFIG.retries;
    
    // Add default interceptors
    this.setupDefaultInterceptors();
    
    console.log('🚀 Enhanced API Client initialized:', {
      baseURL: this.baseURL,
      timeout: this.defaultTimeout,
      retries: this.defaultRetries
    });
  }

  // Setup default interceptors
  private setupDefaultInterceptors(): void {
    // Request interceptor for automatic token injection
    this.addRequestInterceptor(async (config) => {
      console.log('📤 Request interceptor:', {
        method: config.method,
        url: config.url,
        requiresAuth: config.requiresAuth
      });

      // Add automatic token for authenticated requests
      if (config.requiresAuth !== false) {
        const token = await tokenManager.getValidToken();
        if (token) {
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${token}`
          };
          console.log('🔐 Token automatically added to request');
        } else {
          console.warn('⚠️ No valid token available for authenticated request');
        }
      }

      // Ensure Content-Type is set for non-GET requests
      if (config.method !== 'GET' && config.body) {
        config.headers = {
          'Content-Type': 'application/json',
          ...config.headers
        };
      }

      return config;
    });

    // Response interceptor for automatic token refresh
    this.addResponseInterceptor(async (response, config) => {
      console.log('📥 Response interceptor:', {
        status: response.status,
        statusText: response.statusText,
        url: config.url
      });

      // Check for authentication errors
      if (response.status === 401) {
        console.log('🚨 401 Unauthorized - Token may be expired');
        
        // Don't try to refresh token if this is a login request
        const isLoginRequest = config.url.includes('/auth/login');
        
        // If this was an authenticated request, try to refresh token and retry
        if (!isLoginRequest && config.requiresAuth !== false && tokenManager.isAuthenticated()) {
          console.log('🔄 Attempting token refresh and request retry...');
          try {
            // Token manager will handle the refresh automatically
            const newToken = await tokenManager.getValidToken();
            if (newToken) {
              // Retry the original request with new token
              const retryConfig = {
                ...config,
                headers: {
                  ...config.headers,
                  'Authorization': `Bearer ${newToken}`
                }
              };
              
              console.log('🔄 Retrying request with refreshed token');
              return await this.makeRawRequest(config.url, retryConfig);
            }
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            // Let the error interceptor handle logout
          }
        } else if (isLoginRequest) {
          console.log('🚨 Login request failed - invalid credentials');
        }
      }

      return response;
    });

    // Error interceptor for centralized error handling
    this.addErrorInterceptor(async (error, config) => {
      console.error('❌ Error interceptor:', {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error,
        url: config.url
      });

      // Handle authentication errors
      if (error.statusCode === 401) {
        // Don't logout if this is a login request (wrong credentials)
        const isLoginRequest = config.url.includes('/auth/login');
        
        if (!isLoginRequest) {
          console.log('🚨 Authentication failed - redirecting to login');
          await tokenManager.logout();
        } else {
          console.log('🚨 Login failed - invalid credentials (not logging out)');
        }
      }

      // Handle network errors
      if (error.statusCode === 0 || error.error === 'NETWORK_ERROR') {
        console.log('🌐 Network error detected');
        // Could add network status checking here
      }

      // Handle rate limiting
      if (error.statusCode === 429) {
        console.log('⏸️ Rate limited - implement backoff strategy');
        // Could add exponential backoff here
      }

      throw error;
    });
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  // Add error interceptor
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
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

  // Make raw request (used for retries)
  private async makeRawRequest(endpoint: string, config: RequestConfig): Promise<Response> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout
    } = config;

    const requestOptions: RequestInit = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    return await this.createRequestWithTimeout(url, requestOptions, timeout);
  }

  // Retry mechanism with exponential backoff
  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries: number,
    delay: number = API_CONFIG.retryDelay
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        const actualDelay = delay * Math.pow(2, API_CONFIG.retries - retries); // Exponential backoff
        console.log(`🔄 Retrying request in ${actualDelay}ms... (${API_CONFIG.retries - retries + 1}/${API_CONFIG.retries})`);
        
        await new Promise(resolve => setTimeout(resolve, actualDelay));
        return this.retryRequest(requestFn, retries - 1, delay);
      }
      throw error;
    }
  }

  // Check if error is retryable
  private isRetryableError(error: unknown): boolean {
    if (error instanceof ApiClientError) {
      // Don't retry auth errors, client errors, or successful responses
      return [408, 429, 500, 502, 503, 504].includes(error.statusCode);
    }
    
    // Retry network errors
    if (error instanceof TypeError && (error as { code?: string }).code === 'NETWORK_ERROR') {
      return true;
    }
    
    return false;
  }

  // Main request method with interceptors
  async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const fullConfig = {
      method: (config.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      headers: {},
      timeout: this.defaultTimeout,
      retries: this.defaultRetries,
      requiresAuth: true, // Default to requiring auth
      ...config,
      url: endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
    };

    console.log(`🌐 API Request initiated: ${fullConfig.method} ${fullConfig.url}`);

    const makeRequest = async (): Promise<ApiResponse<T>> => {
      let processedConfig = { ...fullConfig };

      try {
        // Apply request interceptors
        for (const interceptor of this.requestInterceptors) {
          processedConfig = await interceptor(processedConfig);
        }

        // Make the actual request
        let response = await this.makeRawRequest(processedConfig.url, processedConfig);

        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          response = await interceptor(response, processedConfig);
        }

        // Parse response
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const error = new ApiClientError(
            data.message || `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            data.error || 'HTTP_ERROR',
            data
          );

          // Apply error interceptors
          for (const interceptor of this.errorInterceptors) {
            await interceptor(error, processedConfig);
          }

          throw error; // This will be caught by the catch block below
        }

        console.log(`✅ Request successful: ${fullConfig.method} ${fullConfig.url}`);
        
        // 🔧 FIX: Avoid double wrapping if backend already returns ApiResponse format
        // Check if backend response already has success/data structure
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          console.log('📦 Backend already returned ApiResponse format, avoiding double wrap');
          return data as ApiResponse<T>;
        }
        
        // Return consistent ApiResponse format only if backend doesn't already use it
        return {
          success: true,
          data: data
        } as ApiResponse<T>;

      } catch (error) {
        // Convert various error types to ApiClientError
        let apiError: ApiClientError;

        if (error instanceof ApiClientError) {
          apiError = error;
        } else if (error instanceof TypeError && error.message.includes('fetch')) {
          apiError = new ApiClientError('Network error - please check your connection', 0, 'NETWORK_ERROR', error);
        } else {
          apiError = new ApiClientError(
            error instanceof Error ? error.message : 'Unknown error occurred',
            500,
            'UNKNOWN_ERROR',
            error
          );
        }

        console.error(`❌ Request failed: ${fullConfig.method} ${fullConfig.url}`, apiError);

        // Apply error interceptors if not already applied
        if (!(error instanceof ApiClientError)) {
          for (const interceptor of this.errorInterceptors) {
            try {
              await interceptor(apiError, processedConfig);
            } catch (interceptorError) {
              // Error interceptors might throw, which is expected for logout etc.
              throw interceptorError;
            }
          }
        }

        throw apiError;
      }
    };

    // Apply retry mechanism
    return this.retryRequest(makeRequest, fullConfig.retries || 0);
  }

  // Convenience methods with automatic token management
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, body: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  async put<T>(endpoint: string, body: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body: unknown, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // Public (no-auth) request methods
  async publicGet<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'requiresAuth'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET', requiresAuth: false });
  }

  async publicPost<T>(endpoint: string, body: unknown, config?: Omit<RequestConfig, 'method' | 'body' | 'requiresAuth'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body, requiresAuth: false });
  }

  // Health check method
  async healthCheck(): Promise<ApiResponse<{ status: string; [key: string]: unknown }>> {
    return this.publicGet('/health');
  }

  // Method to clear all interceptors (useful for testing)
  clearInterceptors(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
    this.setupDefaultInterceptors(); // Re-add defaults
  }

  // Method to get current configuration
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.defaultTimeout,
      retries: this.defaultRetries,
      interceptors: {
        request: this.requestInterceptors.length,
        response: this.responseInterceptors.length,
        error: this.errorInterceptors.length
      }
    };
  }
}

// Create singleton instance
export const enhancedApiClient = new EnhancedApiClient();

// Export the client as default
export default enhancedApiClient; 