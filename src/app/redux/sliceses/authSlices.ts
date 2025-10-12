import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'

// Define a type for the slice state
interface AuthState {
  isLoggedIn: boolean
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'user'
  } | null
  loading: boolean
  error: string | null
  isInitialized: boolean
}

// Define the initial state using that type
const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  loading: false,
  error: null,
  isInitialized: false,
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
    },
    logout: (state) => {
      state.isLoggedIn = false
      state.user = null
      state.loading = false
      state.error = null
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
    restoreAuth: (state, action: PayloadAction<{ id: string; email: string; name: string; role: 'admin' | 'user' }>) => {
      state.isLoggedIn = true
      state.user = action.payload
      state.loading = false
      state.error = null
      state.isInitialized = true
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload
    },
  },
})

export const { login, logout, setLoading, setError, clearError, restoreAuth, setInitialized } = authSlice.actions

// Selectors
export const selectIsLoggedIn = (state: RootState) => state.auth.isLoggedIn
export const selectUser = (state: RootState) => state.auth.user
export const selectLoading = (state: RootState) => state.auth.loading
export const selectError = (state: RootState) => state.auth.error
export const selectIsAdmin = (state: RootState) => state.auth.user?.role === 'admin'
export const selectIsInitialized = (state: RootState) => state.auth.isInitialized

export default authSlice.reducer