import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  loading: false,
  error: null,
  isInitialized: false
}

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ id: string; email: string; name: string; role: 'admin' | 'user' }>) => {
      state.isLoggedIn = true
      state.user = action.payload
      state.loading = false
      state.error = null
      // User bilgisini localStorage'a kaydet
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
    logout: (state) => {
      state.isLoggedIn = false
      state.user = null
      state.loading = false
      state.error = null
      // LocalStorage'dan user bilgisini temizle - TokenManager ile uyumlu key'ler kullan
      localStorage.removeItem('user_data')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('token_expires_at')
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
      state.loading = false
    },
    clearError: (state) => {
      state.error = null
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload
    },
    restoreAuth: (state, action: PayloadAction<{ id: string; email: string; name: string; role: 'admin' | 'user' }>) => {
      state.isLoggedIn = true
      state.user = action.payload
      state.loading = false
      state.error = null
      // User bilgisini localStorage'a kaydet
      localStorage.setItem('user', JSON.stringify(action.payload))
    }
  },
})

export const { login, logout, setLoading, setError, clearError, setInitialized, restoreAuth } = authSlice.actions

// Selectors
export const selectIsLoggedIn = (state: { auth: AuthState }) => state.auth.isLoggedIn
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectLoading = (state: { auth: AuthState }) => state.auth.loading
export const selectError = (state: { auth: AuthState }) => state.auth.error
export const selectIsInitialized = (state: { auth: AuthState }) => state.auth.isInitialized

export default authSlice.reducer 