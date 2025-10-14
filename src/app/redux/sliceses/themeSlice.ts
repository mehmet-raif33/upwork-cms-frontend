import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ThemeState = {
  theme: "light" | "dark";
};

// localStorage'dan tema tercihini al, yoksa "light" kullan
const getInitialTheme = (): "light" | "dark" => {
  // Server-side rendering sırasında her zaman "light" döndür
  if (typeof window === 'undefined') {
    return "light";
  }
  
  try {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as "light" | "dark") || "light";
  } catch {
    return "light";
  }
};

const initialState: ThemeState = {
  theme: getInitialTheme(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
      // localStorage'a kaydet
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
      }
    },
    toggleTheme: (state) => {
      state.theme = state.theme === "light" ? "dark" : "light";
      // localStorage'a kaydet
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme);
      }
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer; 