"use client"
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "../../../redux/store";
import { selectIsLoggedIn, selectUser } from "../../../redux/sliceses/authSlices";
import Link from "next/link";
import { motion } from 'framer-motion';
import { getPersonnelByIdApi, getPersonnelApi, updatePersonnelApi } from '../../../api';

interface PersonnelEditPageProps {
  params: Promise<{ slug: string }>;
}

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

interface FormData {
  full_name: string;
  username: string;
  email: string;
  phone: string;
  hire_date: string;
  status: string;
  notes: string;
  is_active: boolean;
  role: string;
}

const PersonnelEditPage: React.FC<PersonnelEditPageProps> = ({ params }) => {
  const theme = useSelector((state: RootState) => state.theme.theme);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user = useSelector(selectUser);
  const router = useRouter();
  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    hire_date: '',
    status: 'active',
    notes: '',
    is_active: true,
    role: 'personnel'
  });

  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    const getParams = async () => {
      const { slug } = await params;
      return slug;
    };

    const loadData = async () => {
      try {
        const slug = await getParams();
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Token not found');
          return;
        }

        setLoading(true);
        
        // Slug'dan ID'yi çıkar (format: id-name)
        const idFromSlug = slug.split('-')[0];
        
        // Önce tüm personeli çek ve slug'a göre bul
        const allPersonnelResponse = await getPersonnelApi(token);
        let allPersonnel = [];
        
        if (allPersonnelResponse.success && allPersonnelResponse.data) {
          allPersonnel = allPersonnelResponse.data;
        } else if (Array.isArray(allPersonnelResponse)) {
          allPersonnel = allPersonnelResponse;
        }

        const foundPersonnel = allPersonnel.find((p: Personnel) => p.id === idFromSlug);
        
        if (foundPersonnel) {
          setPersonnel(foundPersonnel);
          setFormData({
            full_name: foundPersonnel.full_name || '',
            username: foundPersonnel.username || '',
            email: foundPersonnel.email || '',
            phone: foundPersonnel.phone || '',
            hire_date: foundPersonnel.hire_date ? foundPersonnel.hire_date.split('T')[0] : '',
            status: foundPersonnel.status || 'active',
            notes: foundPersonnel.notes || '',
            is_active: foundPersonnel.is_active ?? true,
            role: foundPersonnel.role || 'personnel'
          });

          // Manager control
          if (foundPersonnel.role === 'admin') {
            setCanEdit(false);
            setError('Manager accounts cannot be edited');
            return;
          }


        } else {
          // ID ile bulamazsa, slug'dan çıkarılan ID'yi kullanarak API'den çek
          try {
            const response = await getPersonnelByIdApi(token, idFromSlug);
            console.log('Personnel Edit API Response:', response);
            
                         if (response.success && response.data) {
               setPersonnel(response.data);
               setFormData({
                 full_name: response.data.full_name || '',
                 username: response.data.username || '',
                 email: response.data.email || '',
                 phone: response.data.phone || '',
                 hire_date: response.data.hire_date ? response.data.hire_date.split('T')[0] : '',
                 status: response.data.status || 'active',
                 notes: response.data.notes || '',
                 is_active: response.data.is_active ?? true,
                 role: response.data.role || 'personnel'
               });

               // Manager control
               if (response.data.role === 'admin') {
                 setCanEdit(false);
                 setError('Manager accounts cannot be edited');
                 return;
               }


                         } else if (response.id) {
               setPersonnel(response);
               setFormData({
                 full_name: response.full_name || '',
                 username: response.username || '',
                 email: response.email || '',
                 phone: response.phone || '',
                 hire_date: response.hire_date ? response.hire_date.split('T')[0] : '',
                 status: response.status || 'active',
                 notes: response.notes || '',
                 is_active: response.is_active ?? true,
                 role: response.role || 'personnel'
               });

               // Manager control
               if (response.role === 'admin') {
                 setCanEdit(false);
                 setError('Manager accounts cannot be edited');
                 return;
               }


            } else {
              setError('Personnel not found');
            }
          } catch {
            setError('Personnel not found');
          }
        }
      } catch (error: unknown) {
        console.error('Error loading personnel:', error);
        setError('Error loading personnel information');
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      loadData();
    }
  }, [params, isLoggedIn]);

  // ✅ Auth kontrolleri kaldırıldı - AuthInitializer yönlendirme yapacak

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!personnel) {
      setError('Personnel information not found');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Token not found');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData = {
        ...formData,
        id: personnel.id
      };

      const response = await updatePersonnelApi(token, personnel.id, updateData);
      console.log('Update API Response:', response);

      if (response.success) {
        setSuccess('Personnel successfully updated!');
        setTimeout(() => {
          router.push(`/personnel/${personnel.id}-${formData.full_name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'personel'}`);
        }, 1500);
      } else {
        setError(response.message || 'Error during update');
      }
    } catch (error: unknown) {
      console.error('Error updating personnel:', error);
      setError('Error updating personnel');
    } finally {
      setSaving(false);
    }
  };

  // Giriş yapmamış kullanıcılar için loading göster
  if (!isLoggedIn) {
    return (
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Admin olmayan kullanıcılar için loading göster (yönlendirme sırasında)
  if (isLoggedIn && user?.role !== 'admin') {
    return (
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`flex-1 bg-gradient-to-br min-h-screen flex items-center justify-center ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
        <div className={`text-center ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}>
          <div className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4 ${theme === 'dark' ? 'border-blue-400' : 'border-blue-600'}`}></div>
          <p className="font-medium">Loading personnel information...</p>
        </div>
      </div>
    );
  }

  if (error && !personnel) {
    return (
      <div className={`flex-1 bg-gradient-to-br min-h-screen flex items-center justify-center ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
        <div className={`text-center ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Error Occurred</h1>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{error}</p>
          <Link href="/personnel" className={`mt-4 inline-block px-6 py-3 rounded-lg transition-colors ${theme === 'dark' ? 'bg-blue-800 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            Back to Personnel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 bg-gradient-to-br min-h-screen p-6 ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/personnel/${personnel?.id}-${personnel?.full_name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'personel'}`}
                className={`flex items-center space-x-2 transition-colors ${theme === 'dark' ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}
              >
                <span>←</span>
                <span>Back</span>
              </Link>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Edit Personnel
              </h1>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg mb-6 bg-green-100 border border-green-400 text-green-700`}
            >
              {success}
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg mb-6 bg-red-100 border border-red-400 text-red-700`}
            >
              {error}
            </motion.div>
          )}



          {/* Edit Form - Sadece düzenlenebilir durumda göster */}
          {canEdit ? (
            <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onSubmit={handleSubmit}
            className={`p-6 rounded-xl shadow-lg border ${
              theme === 'dark' 
                ? 'bg-slate-800/50 border-slate-700' 
                : 'bg-white/80 border-gray-200'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Full Name"
                />
              </div>

              {/* Username */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Username"
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="example@email.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="+1 555 123 45 67"
                />
              </div>

              {/* Hire Date */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Hire Date
                </label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Status */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Role */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="personnel">Personnel</option>
                  <option value="admin">Manager</option>
                </select>
              </div>

              {/* Is Active */}
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Active Personnel
                  </span>
                </label>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-slate-700 border-slate-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Notes about personnel..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  saving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              
              <Link
                href={`/personnel/${personnel?.id}-${personnel?.full_name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'personel'}`}
                className={`flex-1 px-6 py-3 rounded-lg font-medium text-center transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                    : 'bg-gray-500 hover:bg-gray-600 text-white'
                }`}
              >
                Cancel
              </Link>
                         </div>
           </motion.form>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`p-6 rounded-xl shadow-lg border text-center ${
                theme === 'dark' 
                  ? 'bg-slate-800/50 border-slate-700' 
                  : 'bg-white/80 border-gray-200'
              }`}
            >
              <div className="text-6xl mb-4">🔒</div>
              <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Editing Restricted
              </h3>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                This personnel cannot be edited at this time.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PersonnelEditPage; 