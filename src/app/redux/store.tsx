import { configureStore } from '@reduxjs/toolkit'
import authReducer from './sliceses/authSlices'
import themeReducer from './sliceses/themeSlice'

// Auth state'i AuthInitializer ile yükleyeceğiz, burada preload etmeyelim
// Bu, TokenManager ile conflict yaratıyordu
export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
  }
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch 