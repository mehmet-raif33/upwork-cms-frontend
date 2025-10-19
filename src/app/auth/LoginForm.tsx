"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { login, setError, setLoading } from "../redux/sliceses/authSlices";
import { RootState } from "../redux/store";
import { authApi } from "../../lib/api-endpoints";
import { tokenManager } from "../../lib/token-manager";
import { broadcastLogin } from "../utils/broadcastChannel";

const LoginForm: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const theme = useSelector((state: RootState) => state.theme.theme);
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoadingState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

    // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If already submitting, don't run again
    if (isSubmitting || loading) {
      return;
    }

    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    dispatch(setLoading(true));
    setLoadingState(true);
    
    try {
      console.log('🔐 Attempting login with enhanced API...');
      
      // Enhanced API client ile login yap
      const response = await authApi.login({ username, password });
      
      if (!response || !response.data || !response.data.user || !response.data.token) {
        throw new Error('Login response data is missing');
      }
      
      const { user, token, refreshToken } = response.data;
      
      // Normalize user information
      const userData = {
        id: user.id.toString(),
        email: user.email,
        name: user.username || user.full_name || "",
        role: user.role === "manager" ? "manager" : "personnel" as "manager" | "personnel",
      };
      
      console.log('✅ Login successful, setting up token manager...');
      
      // Save token and user info with token manager
      await tokenManager.setTokens(token, userData, refreshToken);
      
      // Update Redux state
      dispatch(login(userData));
      
      console.log('📡 Broadcasting login to other tabs...');
      
      // Send login message to other tabs (Token manager already does this but for extra security)
      broadcastLogin(userData);
      
      // Show success message
      setSuccessMessage('Login successful! Redirecting...');
      
      console.log('🔄 Redirecting to dashboard...');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
      
    } catch (err: unknown) {
      console.error('❌ Login failed:', err);
      
      let message = "An error occurred";
      
      // Enhanced error handling
      if (err && typeof err === "object") {
        if ('message' in err) {
          message = (err as { message?: string }).message || message;
        } else if ('data' in err && err.data && typeof err.data === 'object' && 'message' in err.data) {
          message = (err.data as { message?: string }).message || message;
        }
      } else if (typeof err === "string") {
        message = err;
      }
      
      // Specific error messages
      if (message.includes('401') || message.includes('Unauthorized') || message.includes('Invalid credentials')) {
        message = 'Invalid username or password';
      } else if (message.includes('Network') || message.includes('fetch')) {
        message = 'Connection error. Please check your internet connection.';
      } else if (message.includes('timeout')) {
        message = 'Request timed out. Please try again.';
      }
      
      setFormError(message);
      dispatch(setError(message));
    } finally {
      dispatch(setLoading(false));
      setLoadingState(false);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`w-full p-6 backdrop-blur-sm rounded-xl shadow-xl space-y-4 border transition-all duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-800/90 border-slate-700/50' 
        : 'bg-white/90 border-gray-200/50'
    }`}>
      <h2 className={`text-2xl font-bold mb-4 text-center transition-colors duration-300 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>Login</h2>
      
      <div>
        <label className={`block mb-1 font-medium transition-colors duration-300 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>Username or Email</label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            theme === 'dark' 
              ? 'border-slate-600 bg-slate-700/80 text-white placeholder-gray-400 focus:ring-blue-400' 
              : 'border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
          }`}
          required
          disabled={loading || isSubmitting}
        />
      </div>
      
      <div>
        <label className={`block mb-1 font-medium transition-colors duration-300 ${
          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className={`w-full border rounded-lg px-3 py-2 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            theme === 'dark' 
              ? 'border-slate-600 bg-slate-700/80 text-white placeholder-gray-400 focus:ring-blue-400' 
              : 'border-gray-300 bg-white/80 text-gray-900 placeholder-gray-500 focus:ring-blue-500'
          }`}
          required
          disabled={loading || isSubmitting}
        />
      </div>
      
      {formError && (
        <div className={`border rounded-lg p-4 mb-4 transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-red-900/20 border-red-800' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 transition-colors duration-300 ${
                theme === 'dark' ? 'text-red-300' : 'text-red-400'
              }`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-red-200' : 'text-red-800'
              }`}>Login Error</h3>
              <div className={`mt-1 text-sm transition-colors duration-300 ${
                theme === 'dark' ? 'text-red-300' : 'text-red-700'
              }`}>{formError}</div>
            </div>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className={`border rounded-lg p-4 mb-4 transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-green-900/20 border-green-800' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 transition-colors duration-300 ${
                theme === 'dark' ? 'text-green-300' : 'text-green-400'
              }`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium transition-colors duration-300 ${
                theme === 'dark' ? 'text-green-200' : 'text-green-800'
              }`}>Success!</h3>
              <div className={`mt-1 text-sm transition-colors duration-300 ${
                theme === 'dark' ? 'text-green-300' : 'text-green-700'
              }`}>{successMessage}</div>
            </div>
          </div>
        </div>
      )}
      
      <button
        type="submit"
        className={`w-full text-white py-3 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] ${
          theme === 'dark' 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : 'bg-blue-600 hover:bg-blue-700'
        } ${(loading || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={loading || isSubmitting}
      >
        {loading || isSubmitting ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};

export default LoginForm; 