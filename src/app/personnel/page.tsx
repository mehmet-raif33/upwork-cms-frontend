"use client"
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "../redux/store";
import { selectIsLoggedIn, selectUser, selectIsInitialized } from '../redux/sliceses/authSlices';
import Link from "next/link";
import { motion } from 'framer-motion';
import { getPersonnelApi, createPersonnelApi, updatePersonnelStatusApi } from '../api';
import { useToast } from '../AppLayoutClient';

// Personnel interface matching backend schema
interface Personnel {
  id: string;
  full_name: string;
  username?: string;
  email: string;
  phone?: string;
  hire_date?: string;
  status: string;
  notes?: string;
  is_active: boolean;
  role?: string;
  created_at: string;
  updated_at?: string;
}

const statCards = [
  {
    label: "Total Personnel",
    icon: "👥",
    getValue: (list: Personnel[]) => list.length,
    color: "bg-blue-500",
  },
  {
    label: "Active Status",
    icon: "✅",
    getValue: (list: Personnel[]) => list.filter((p) => p.status === "active").length,
    color: "bg-green-500",
  },
  {
    label: "Active Records",
    icon: "👥",
    getValue: (list: Personnel[]) => list.filter((p) => p.is_active).length,
    color: "bg-purple-500",
  },
  {
    label: "New This Month",
    icon: "🆕",
    getValue: (list: Personnel[]) => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      return list.filter((p) => {
        if (!p.hire_date) return false;
        try {
          const hireDate = new Date(p.hire_date);
          return hireDate.getMonth() === currentMonth && hireDate.getFullYear() === currentYear;
        } catch {
          return false;
        }
      }).length;
    },
    color: "bg-yellow-500",
  },
];

const PersonnelPage: React.FC = () => {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isInitialized = useSelector(selectIsInitialized);
  const user = useSelector(selectUser);
  const router = useRouter();
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    hire_date: "",
    status: "active",
    notes: "",
    password: "",
    role: "personnel"
  });

  // ✅ Auth check removed - AuthInitializer will handle redirect

  // Redirect non-admin users to home page - ONLY after auth is initialized
  useEffect(() => {
    // ✅ Wait if auth not yet initialized
    if (!isInitialized) return;
    
    if (isLoggedIn && user?.role !== 'admin') {
      console.log('🔄 [Personnel] Non-admin user, redirecting to dashboard');
      router.push('/');
    }
  }, [isLoggedIn, isInitialized, user, router]); // ✅ isInitialized dependency added

  // Load personnel on component mount
  useEffect(() => {
    if (isLoggedIn) {
      const loadPersonnel = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setError('Token not found');
            return;
          }
          
          setLoading(true);
          const response = await getPersonnelApi(token);
          console.log('Personnel API Response:', response);
          // Check response format from backend
          if (response.success && response.data) {
            setPersonnel(response.data);
          } else if (Array.isArray(response)) {
            setPersonnel(response);
          } else {
            setPersonnel([]);
          }
        } catch (error: unknown) {
          console.error('Error loading personnel:', error);
          setError('Error loading personnel list');
        } finally {
          setLoading(false);
        }
      };
      loadPersonnel();
    }
  }, [isLoggedIn]);

  // Show loading for non-logged in users
  if (!isLoggedIn) {
    return (
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show loading for non-admin users (during redirect)
  if (isLoggedIn && user?.role !== 'admin') {
    return (
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredPersonnel = personnel.filter(
    (person) =>
      (person.full_name && person.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.username && person.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.email && person.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (person.phone && person.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Form validation
      if (!formData.full_name.trim()) {
        setError('Full name is required');
        showToast('Full name is required', 'error');
        return;
      }
      
      if (!formData.email.trim()) {
        setError('Email is required');
        showToast('Email is required', 'error');
        return;
      }
      
      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('Please enter a valid email address');
        showToast('Please enter a valid email address', 'error');
        return;
      }
      
      // Phone and hire_date can be optional
      // if (!formData.phone.trim()) {
      //   setError('Phone field is required');
      //   return;
      // }
      
      // if (!formData.hire_date) {
      //   setError('Hire date is required');
      //   return;
      // }
      
      if (formData.username && formData.password && formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        showToast('Password must be at least 6 characters', 'error');
        return;
      }

      const personnelData = {
        full_name: formData.full_name.trim(),
        username: formData.username.trim() || undefined,
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        hire_date: formData.hire_date || undefined,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
        password: formData.password || undefined,
        role: formData.role
      };

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const response = await createPersonnelApi(token, personnelData);
      
      // Add to local state - check response format
      if (response.success && response.data) {
        setPersonnel(prev => [...prev, response.data]);
      } else if (response.id) {
        setPersonnel(prev => [...prev, response]);
      }
      
      showToast("Personnel successfully added!", 'success');
      setShowAddForm(false);
      
      setFormData({
        full_name: "",
        username: "",
        email: "",
        phone: "",
        hire_date: "",
        status: "active",
        notes: "",
        password: "",
        role: "personnel"
      });
    } catch (error: unknown) {
      console.error('Error creating personnel:', error);
      let message = 'Error adding personnel';
      if (error && typeof error === 'object' && 'message' in error) {
        message += `: ${(error as { message?: string }).message}`;
      }
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Personnel status toggle function
  const handleToggleStatus = async (person: Personnel, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link click
    e.stopPropagation();
    
    if (user?.role !== 'admin') {
      showToast('Admin permission required for this action', 'error');
      return;
    }

    // Check if trying to change own account
    if (person.id === user?.id) {
      showToast('You cannot change your own account status', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token not found');
      }

      const newStatus = !person.is_active;
      const response = await updatePersonnelStatusApi(token, person.id, newStatus);
      
      if (response.success) {
        // Update local state
        setPersonnel(prev => prev.map(p => 
          p.id === person.id 
            ? { ...p, is_active: newStatus }
            : p
        ));
        
        const statusText = newStatus ? 'active' : 'inactive';
        showToast(`${person.full_name} set to ${statusText} status`, 'success');
      }
    } catch (error: unknown) {
      console.error('Error updating personnel status:', error);
      let message = 'Error updating personnel status';
      if (error && typeof error === 'object' && 'message' in error) {
        message += `: ${(error as { message?: string }).message}`;
      }
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-gradient-to-br p-4 sm:p-8 ${
        theme === "dark"
          ? "from-slate-900 to-blue-950"
          : "from-slate-50 to-blue-50"
      }`}
    >
      {/* Header */}
      <motion.div 
        className="mb-4 sm:mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1
          className={`text-xl sm:text-3xl font-bold mb-1 ${
            theme === "dark" ? "text-gray-100" : "text-gray-800"
          }`}
        >
          Personnel Management
        </h1>
        <p className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
          View and manage personnel information
        </p>
      </motion.div>

      {/* Stat Cards */}
      <motion.div 
        className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8 mb-6 sm:mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            className={`rounded-xl shadow-sm border p-4 sm:p-6 ${
              theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: 0.1 * (index + 1) }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs sm:text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}>
                  {card.label}
                </p>
                <p className={`text-lg sm:text-2xl font-bold ${
                  theme === "dark" ? "text-gray-100" : "text-gray-800"
                }`}>
                  {card.getValue(personnel)}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-12 sm:h-12 ${card.color} text-white rounded-lg flex items-center justify-center text-sm sm:text-2xl`}>
                {card.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Search and Add Button */}
      <motion.div 
        className="flex flex-col sm:flex-row gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search personnel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              theme === "dark"
                ? "bg-slate-800 border-slate-600 text-gray-100 placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
            }`}
          />
          {searchTerm && (
            <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {filteredPersonnel.length} personnel found
            </p>
          )}
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            + Add Personnel
          </button>
        )}
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div 
          className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      {/* Loading State */}
      {loading && personnel.length === 0 && (
        <motion.div 
          className="flex items-center justify-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </motion.div>
      )}

      {/* Add Personnel Form */}
      {showAddForm && (
        <motion.div 
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className={`w-full max-w-2xl rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Personnel</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-slate-700 border-slate-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="Ahmet Yılmaz"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-slate-700 border-slate-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="ahmet.yilmaz"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-slate-700 border-slate-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="ahmet.yilmaz@ulas.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-slate-700 border-slate-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="0555 123 4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-slate-700 border-slate-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                    placeholder="At least 6 characters"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-slate-700 border-slate-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Hire Date</label>
                  <input
                    type="date"
                    name="hire_date"
                    value={formData.hire_date}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-slate-700 border-slate-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  />
                </div>
                

                
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === 'dark' 
                        ? 'bg-slate-700 border-slate-600 text-gray-100' 
                        : 'bg-white border-gray-300 text-gray-800'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-gray-100' 
                      : 'bg-white border-gray-300 text-gray-800'
                  }`}
                  placeholder="Additional information about personnel..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Personnel List */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        {filteredPersonnel.map((person, index) => (
          <motion.div
            key={person.id}
            className={`rounded-xl shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow ${
              theme === "dark" ? "bg-slate-800 border-slate-700 hover:border-slate-600" : "bg-white border-gray-200 hover:border-gray-300"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
            whileHover={{ y: -2 }}
          >
            <div>
              <Link href={`/personnel/${person.id}-${person.full_name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'personel'}`} title={person.full_name || 'Personel Detayı'}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
                    {person.full_name || 'İsimsiz'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      person.is_active 
                        ? theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                        : theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                    }`}>
                      {person.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Email:</span>
                    <span className={theme === "dark" ? "text-gray-200" : "text-gray-800"}>{person.email || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Phone:</span>
                    <span className={theme === "dark" ? "text-gray-200" : "text-gray-800"}>{person.phone || 'Not specified'}</span>
                  </div>
                  {person.username && (
                    <div className="flex justify-between">
                      <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Username:</span>
                      <span className={theme === "dark" ? "text-gray-200" : "text-gray-800"}>{person.username}</span>
                    </div>
                  )}
                  {person.role && (
                    <div className="flex justify-between">
                      <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>Role:</span>
                      <span className={theme === "dark" ? "text-gray-200" : "text-gray-800"}>{person.role === 'admin' ? 'Administrator' : 'Personnel'}</span>
                    </div>
                  )}
                </div>
              </Link>
              
              {/* Admin Toggle Button */}
              {user?.role === 'admin' && person.id !== user?.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={(e) => handleToggleStatus(person, e)}
                    disabled={loading}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      person.is_active 
                        ? theme === 'dark'
                          ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-red-800'
                          : 'bg-red-500 hover:bg-red-600 text-white disabled:bg-red-300'
                        : theme === 'dark'
                          ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-800'  
                          : 'bg-green-500 hover:bg-green-600 text-white disabled:bg-green-300'
                    }`}
                  >
                    {loading ? '...' : person.is_active ? '🔴 Deactivate' : '🟢 Activate'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredPersonnel.length === 0 && personnel.length > 0 && (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-6xl mb-4">🔍</div>
          <h3 className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
            No Personnel Found
          </h3>
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
            No personnel matching &quot;{searchTerm}&quot; found.
          </p>
        </motion.div>
      )}

      {personnel.length === 0 && !loading && (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-6xl mb-4">👥</div>
          <h3 className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
            No Personnel Yet
          </h3>
          <p className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>
            Click &quot;Add Personnel&quot; button to add your first personnel.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default PersonnelPage;