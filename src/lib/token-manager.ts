import { broadcastTokenExpired, broadcastLogin, broadcastLogout, broadcastTokenRefreshed, tabComm, MESSAGE_TYPES } from '../app/utils/broadcastChannel';

// Token interfaces
interface TokenData {
  token: string;
  refreshToken?: string;
  expiresAt: number;
  userId: string;
  role: string;
}

interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

// Request queue interface
interface QueuedRequest<T = unknown> {
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
  request: () => Promise<T>;
}

// Token storage keys
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
  EXPIRES_AT: 'token_expires_at'
} as const;

// Configuration
const getApiBaseUrl = () => {
  const baseUrl = process.env.NODE_ENV === 'development'
    ? process.env.NEXT_PUBLIC_RAILWAY_LOCAL || 'http://localhost:5000'
    : process.env.NEXT_PUBLIC_RAILWAY_SERVER || 'https://ulasserver-production.up.railway.app';
  
  // /api prefix'i ekle
  return `${baseUrl}/api`;
};

const CONFIG = {
  REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  API_BASE_URL: getApiBaseUrl()
} as const;

class TokenManager {
  private tokenData: TokenData | null = null;
  private userData: UserData | null = null;
  private refreshPromise: Promise<string> | null = null;
  private requestQueue: QueuedRequest<unknown>[] = [];
  private isRefreshing = false;
  private refreshTimer: NodeJS.Timeout | null = null;
  private initialized = false;

  constructor() {
    this.initializeCrossTabSync();
  }

  // Initialize cross-tab synchronization
  private initializeCrossTabSync(): void {
    if (typeof window === 'undefined') return;

    // Listen for token updates from other tabs
    tabComm.listen(MESSAGE_TYPES.LOGIN, (userData) => {
      console.log('🔄 Received login broadcast from another tab');
      this.handleExternalLogin(userData as UserData);
    });

    tabComm.listen(MESSAGE_TYPES.LOGOUT, () => {
      console.log('🔄 Received logout broadcast from another tab');
      this.handleExternalLogout();
    });

    tabComm.listen(MESSAGE_TYPES.TOKEN_EXPIRED, () => {
      console.log('🔄 Received token expired broadcast from another tab');
      this.handleTokenExpired();
    });

    // Listen for storage changes (fallback for older browsers)
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.TOKEN && !e.newValue) {
        this.handleExternalLogout();
      }
    });
  }

  // Initialize token manager
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('🚀 Initializing Token Manager...');
    
    try {
      await this.loadTokenFromStorage();
      
      if (this.tokenData) {
        await this.validateAndRefreshIfNeeded();
        this.scheduleTokenRefresh();
      }
      
      this.initialized = true;
      console.log('✅ Token Manager initialized successfully');
    } catch (error) {
      console.error('❌ Token Manager initialization failed:', error);
      await this.clearTokens();
    }
  }

  // Validate token and refresh if needed during initialization
  private async validateAndRefreshIfNeeded(): Promise<void> {
    if (!this.tokenData) return;

    try {
      // Check if token needs immediate refresh
      if (this.shouldRefreshToken()) {
        console.log('🔄 Token needs refresh during initialization');
        await this.refreshToken();
      }
    } catch (error) {
      console.error('❌ Token validation failed during initialization:', error);
      await this.clearTokens();
      throw error;
    }
  }

  // Load token from storage
  private async loadTokenFromStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
             // Try to load from new token manager keys first
       let token = localStorage.getItem(STORAGE_KEYS.TOKEN);
       const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
       let expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
       let userString = localStorage.getItem(STORAGE_KEYS.USER);

      // Fallback to legacy keys for backward compatibility
      if (!token || !userString) {
        token = localStorage.getItem('token');
        userString = localStorage.getItem('user');
        console.log('📱 Loading token from legacy storage keys');
      }

      if (!token || !userString) {
        return;
      }

      // If we don't have expiresAt from new system, try to parse token
      if (!expiresAt && token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          expiresAt = (payload.exp * 1000).toString(); // Convert to milliseconds
                 } catch {
           console.warn('⚠️ Could not parse token expiry, will check during validation');
         }
      }

      const userData = JSON.parse(userString);
      const expiresAtNum = expiresAt ? parseInt(expiresAt, 10) : Date.now() + (24 * 60 * 60 * 1000); // Default to 24h if not available

      // Check if token is expired (only if we have valid expiry time)
      if (expiresAt && Date.now() >= expiresAtNum) {
        console.log('🚨 Stored token is expired, clearing...');
        await this.clearTokens();
        return;
      }

      this.tokenData = {
        token,
        refreshToken: refreshToken || undefined,
        expiresAt: expiresAtNum,
        userId: userData.id,
        role: userData.role
      };

      this.userData = userData;
      
      console.log('✅ Token loaded from storage:', {
        userId: userData.id,
        role: userData.role,
        expiresIn: Math.round((expiresAtNum - Date.now()) / 1000 / 60) + ' minutes'
      });
    } catch (error) {
      console.error('❌ Error loading token from storage:', error);
      await this.clearTokens();
    }
  }

  // Save token to storage
  private saveTokenToStorage(tokenData: TokenData, userData: UserData): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, tokenData.token);
      localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, tokenData.expiresAt.toString());
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      
      // Backward compatibility: Eski API sistem için 'token' key'i ile de kaydet
      localStorage.setItem('token', tokenData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      if (tokenData.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refreshToken);
      }

      console.log('💾 Token saved to storage (both new and legacy keys)');
    } catch (error) {
      console.error('❌ Error saving token to storage:', error);
    }
  }

  // Set tokens after login
  async setTokens(token: string, userData: UserData, refreshToken?: string): Promise<void> {
    try {
      // Parse JWT to get expiry
      const payload = this.parseJWT(token);
      const expiresAt = payload.exp * 1000; // Convert to milliseconds

      this.tokenData = {
        token,
        refreshToken,
        expiresAt,
        userId: userData.id,
        role: userData.role
      };

      this.userData = userData;

      // Save to storage
      this.saveTokenToStorage(this.tokenData, userData);

      // Schedule refresh
      this.scheduleTokenRefresh();

      // Broadcast to other tabs
      broadcastLogin(userData);

      console.log('✅ Tokens set successfully:', {
        userId: userData.id,
        role: userData.role,
        expiresIn: Math.round((expiresAt - Date.now()) / 1000 / 60) + ' minutes'
      });
    } catch (error) {
      console.error('❌ Error setting tokens:', error);
      throw error;
    }
  }

  // Get current valid token
  async getValidToken(): Promise<string | null> {
    if (!this.tokenData) {
      return null;
    }

    // Check if token needs refresh
    if (this.shouldRefreshToken()) {
      try {
        return await this.refreshToken();
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        await this.handleTokenExpired();
        return null;
      }
    }

    return this.tokenData.token;
  }

  // Check if token should be refreshed
  private shouldRefreshToken(): boolean {
    if (!this.tokenData) return false;
    
    const timeUntilExpiry = this.tokenData.expiresAt - Date.now();
    return timeUntilExpiry <= CONFIG.REFRESH_THRESHOLD;
  }

  // Refresh token
  private async refreshToken(): Promise<string> {
    // If already refreshing, wait for the existing refresh
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    console.log('🔄 Attempting to refresh token...');

    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      
      // Process queued requests with new token
      this.processRequestQueue();
      
      return newToken;
    } catch (error) {
      // Reject all queued requests
      this.rejectRequestQueue(error);
      throw error;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  // Perform the actual token refresh
  private async performTokenRefresh(): Promise<string> {
    if (!this.tokenData || !this.tokenData.refreshToken) {
      throw new Error('No refresh token available for refresh');
    }

    try {
      // Call refresh endpoint with refresh token
      const response = await fetch(`${CONFIG.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: this.tokenData.refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Parse new JWT to get expiry
        const payload = this.parseJWT(data.token);
        const newExpiresAt = payload.exp * 1000;
        
        // Update token data
        this.tokenData = {
          token: data.token,
          refreshToken: data.refreshToken,
          expiresAt: newExpiresAt,
          userId: data.user.id,
          role: data.user.role
        };
        
                 // Update user data (with role mapping)
         this.userData = {
           id: data.user.id,
           email: data.user.email,
           name: data.user.full_name || data.user.username,
           role: data.user.role === 'admin' ? 'admin' : 'user' as 'admin' | 'user'
         };
        
        // Save to storage (with backward compatibility)
        this.saveTokenToStorage(this.tokenData, this.userData);
        
        // Schedule next refresh
        this.scheduleTokenRefresh();
        
        // Broadcast token refresh to other tabs
        broadcastTokenRefreshed(this.tokenData.expiresAt);
        
        console.log('✅ Token refreshed successfully:', {
          userId: this.userData.id,
          expiresIn: Math.round((newExpiresAt - Date.now()) / 1000 / 60) + ' minutes'
        });
        
        return this.tokenData.token;
      } else {
        // Refresh token is invalid or expired, trigger logout
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Refresh token invalid:', errorData);
        throw new Error('Refresh token invalid or expired');
      }
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      await this.handleTokenExpired();
      throw error;
    }
  }

  // Schedule token refresh
  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.tokenData) return;

    const timeUntilRefresh = this.tokenData.expiresAt - Date.now() - CONFIG.REFRESH_THRESHOLD;
    
    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken().catch(console.error);
      }, timeUntilRefresh);

      console.log(`⏰ Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
    }
  }

  // Add request to queue during refresh
  private queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push({
        resolve: resolve as (value: unknown) => void,
        reject,
        request: request as () => Promise<unknown>
      });
    });
  }

  // Process queued requests
  private processRequestQueue(): void {
    console.log(`🔄 Processing ${this.requestQueue.length} queued requests`);
    
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    queue.forEach(({ resolve, request }) => {
      request().then(resolve as (value: unknown) => void).catch((error) => {
        console.error('❌ Queued request failed:', error);
        resolve(null as unknown); // Don't reject to avoid breaking the flow
      });
    });
  }

  // Reject all queued requests
  private rejectRequestQueue(error: unknown): void {
    console.log(`❌ Rejecting ${this.requestQueue.length} queued requests`);
    
    const queue = [...this.requestQueue];
    this.requestQueue = [];

    queue.forEach(({ reject }) => {
      reject(error);
    });
  }

  // Make authenticated request with automatic token management
  async makeAuthenticatedRequest<T>(
    requestFn: (token: string) => Promise<T>
  ): Promise<T> {
    // If refreshing, queue the request
    if (this.isRefreshing) {
      return this.queueRequest(() => this.makeAuthenticatedRequest(requestFn));
    }

    const token = await this.getValidToken();
    
    if (!token) {
      throw new Error('No valid token available');
    }

    try {
      return await requestFn(token);
    } catch (error: unknown) {
      // If 401 error, try to refresh token and retry
      const errorObj = error as { statusCode?: number; message?: string };
      if (errorObj.statusCode === 401 || (errorObj.message && errorObj.message.includes('401'))) {
        console.log('🔄 Received 401, attempting token refresh...');
        
        try {
          const newToken = await this.refreshToken();
          return await requestFn(newToken);
        } catch (refreshError) {
          console.error('❌ Token refresh failed after 401:', refreshError);
          await this.handleTokenExpired();
          throw refreshError;
        }
      }
      
      throw error;
    }
  }

  // Handle token expiration
  private async handleTokenExpired(): Promise<void> {
    console.log('🚨 Token expired, logging out...');
    
    await this.clearTokens();
    broadcastTokenExpired();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath !== '/landing' && currentPath !== '/auth') {
        window.location.href = '/landing';
      }
    }
  }

  // Handle external login (from another tab)
  private handleExternalLogin(userData: UserData): void {
    if (typeof window === 'undefined') return;
    
         // Try new keys first, then legacy keys
     const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || localStorage.getItem('token');
     const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
     let expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
    
    // If no expiresAt from new system, try to parse from token
    if (!expiresAt && token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        expiresAt = (payload.exp * 1000).toString();
             } catch {
         console.warn('⚠️ Could not parse token expiry in external login');
         expiresAt = (Date.now() + (24 * 60 * 60 * 1000)).toString(); // Default 24h
       }
    }
    
    if (token && expiresAt) {
             this.tokenData = {
         token,
         refreshToken: refreshToken || undefined,
         expiresAt: parseInt(expiresAt, 10),
         userId: userData.id,
         role: userData.role
       };
      
      this.userData = userData;
      this.scheduleTokenRefresh();
    }
  }

  // Handle external logout (from another tab)
  private handleExternalLogout(): void {
    this.tokenData = null;
    this.userData = null;
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Clear all tokens
  async clearTokens(): Promise<void> {
    console.log('🧹 Clearing all tokens...');
    
    this.tokenData = null;
    this.userData = null;
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    if (typeof window !== 'undefined') {
      // Clear new token manager keys
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
      
      // Clear legacy keys for backward compatibility
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Logout
  async logout(): Promise<void> {
    // Call backend logout to invalidate refresh token
    if (this.tokenData?.refreshToken) {
      try {
        await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.tokenData.token && { 'Authorization': `Bearer ${this.tokenData.token}` })
          },
          body: JSON.stringify({
            refreshToken: this.tokenData.refreshToken
          })
        });
      } catch (error) {
        console.error('❌ Backend logout failed:', error);
        // Continue with local logout even if backend call fails
      }
    }

    await this.clearTokens();
    broadcastLogout();
    
    if (typeof window !== 'undefined') {
      window.location.href = '/landing';
    }
  }

  // Get current user data
  getUserData(): UserData | null {
    return this.userData;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!(this.tokenData && this.userData);
  }

  // Parse JWT token
  private parseJWT(token: string): { exp: number; id: string; role: string; [key: string]: unknown } {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('❌ Error parsing JWT:', error);
      throw new Error('Invalid token format');
    }
  }

  // Get token expiry info
  getTokenInfo(): { isValid: boolean; expiresAt?: number; expiresIn?: number } | null {
    if (!this.tokenData) {
      return null;
    }

    const now = Date.now();
    const isValid = this.tokenData.expiresAt > now;
    const expiresIn = Math.max(0, this.tokenData.expiresAt - now);

    return {
      isValid,
      expiresAt: this.tokenData.expiresAt,
      expiresIn
    };
  }
}

// Create singleton instance
export const tokenManager = new TokenManager();

// Export convenience functions
export const useTokenManager = () => ({
  initialize: () => tokenManager.initialize(),
  setTokens: (token: string, userData: UserData, refreshToken?: string) => tokenManager.setTokens(token, userData, refreshToken),
  getValidToken: () => tokenManager.getValidToken(),
  makeAuthenticatedRequest: <T>(requestFn: (token: string) => Promise<T>) => 
    tokenManager.makeAuthenticatedRequest(requestFn),
  logout: () => tokenManager.logout(),
  getUserData: () => tokenManager.getUserData(),
  isAuthenticated: () => tokenManager.isAuthenticated(),
  getTokenInfo: () => tokenManager.getTokenInfo(),
  clearTokens: () => tokenManager.clearTokens()
});

export default tokenManager; 