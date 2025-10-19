"use client"
import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { selectIsLoggedIn } from '../../../redux/sliceses/authSlices';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { getTransactionApi, getVehiclesApi, getTransactionCategoriesApi, updateTransactionApi } from '../../../api';

// Vehicle interface matching backend schema
interface Vehicle {
  id: string;
  plate: string;
  year: number;
  customer_email?: string;
  customer_phone?: string;
  created_at: string;
}

// Transaction Category interface
interface TransactionCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

// Transaction interface matching backend schema
interface Transaction {
  id: string;
  personnel_id: string;
  vehicle_id: string;
  description: string;
  amount: string;
  expense?: string;
  is_expense?: boolean;
  transaction_date: string;
  category_id: string;
  payment_method?: string;
  notes?: string;
  status?: string;
  status_notes?: string;
  status_changed_at?: string;
  status_changed_by?: string;
  // Joined data
  vehicle_plate?: string;
  personnel_name?: string;
  category_name?: string;
  status_changed_by_name?: string;
}

const EditTransactionPage: React.FC = () => {
    const theme = useSelector((state: RootState) => state.theme.theme);
    const isLoggedIn = useSelector(selectIsLoggedIn);
    const router = useRouter();
    const params = useParams();
    const transactionId = params.id as string;
    
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [categories, setCategories] = useState<TransactionCategory[]>([]);
    
    // Form states
    const [formData, setFormData] = useState({
        vehicle_id: '',
        category_id: '',
        description: '',
        amount: '',
        expense: '',
        is_expense: true,
        transaction_date: '',
        payment_method: '',
        notes: ''
    });

    // ✅ Auth kontrolü kaldırıldı - AuthInitializer yönlendirme yapacak

    // Transaction'ı ve diğer verileri yükle
    useEffect(() => {
        if (isLoggedIn && transactionId) {
            const loadData = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        setError('Token not found');
                        return;
                    }
                    
                    setLoading(true);
                    setError(null);
                    
                    // Load all data in parallel
                    const [transactionResponse, vehiclesResponse, categoriesResponse] = await Promise.all([
                        getTransactionApi(token, transactionId),
                        getVehiclesApi(token),
                        getTransactionCategoriesApi(token)
                    ]);
                    
                    setTransaction(transactionResponse.transaction);
                    setVehicles(vehiclesResponse.data || []);
                    setCategories(categoriesResponse.data || []);
                    
                    // Set form data
                    const transactionData = transactionResponse.transaction;
                    setFormData({
                        vehicle_id: transactionData.vehicle_id || '',
                        category_id: transactionData.category_id || '',
                        description: transactionData.description || '',
                        amount: transactionData.amount || '',
                        expense: transactionData.expense || '',
                        is_expense: transactionData.is_expense !== undefined ? transactionData.is_expense : true,
                        transaction_date: transactionData.transaction_date.split('T')[0],
                        payment_method: transactionData.payment_method || '',
                        notes: transactionData.notes || ''
                    });
                    
                } catch (error: unknown) {
                    console.error('Error loading data:', error);
                    let errorMessage = 'Error loading data';
                    if (error && typeof error === 'object' && 'message' in error) {
                        errorMessage += `: ${(error as { message?: string }).message}`;
                    }
                    setError(errorMessage);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }
    }, [isLoggedIn, transactionId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            // Validation
            if (!formData.vehicle_id) {
                setError('Vehicle selection is required');
                return;
            }
            
            if (!formData.category_id) {
                setError('Transaction type selection is required');
                return;
            }
            
            if (!formData.amount || parseFloat(formData.amount) <= 0) {
                setError('Please enter a valid amount');
                return;
            }

            // Expense validation
            if (formData.is_expense && (!formData.expense || parseFloat(formData.expense) <= 0)) {
                setError('Please enter a valid expense amount');
                return;
            }
            
            if (!formData.transaction_date) {
                setError('Transaction date is required');
                return;
            }

            const updateData = {
                vehicle_id: formData.vehicle_id,
                category_id: formData.category_id,
                description: formData.description,
                amount: parseFloat(formData.amount),
                expense: formData.is_expense ? parseFloat(formData.expense) : undefined,
                is_expense: formData.is_expense,
                date: formData.transaction_date,
                payment_method: formData.payment_method || undefined,
                notes: formData.notes || undefined
            };

            await updateTransactionApi(token, transactionId, updateData);

            // Başarılı güncelleme sonrası detay sayfasına yönlendir
            router.push(`/transactions/${transactionId}`);
            
        } catch (error: unknown) {
            console.error('Error updating transaction:', error);
            let errorMessage = 'Error updating transaction';
            if (error && typeof error === 'object' && 'message' in error) {
                errorMessage += `: ${(error as { message?: string }).message}`;
            }
            setError(errorMessage);
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

    return (
        <div className={`flex-1 bg-gradient-to-br min-h-screen p-6 ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
            >
                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Edit Transaction
                        </h1>
                        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Update transaction information
                        </p>
                    </div>
                    
                    {/* Back Button */}
                    <motion.button
                        onClick={() => router.push(`/transactions/${transactionId}`)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg ${
                            theme === 'dark'
                                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        }`}
                    >
                        Back
                    </motion.button>
                </div>

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`mb-6 p-4 rounded-lg border ${
                            theme === 'dark' 
                                ? 'bg-red-900/20 border-red-800 text-red-200' 
                                : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                    >
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    </motion.div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Edit Form */}
                {!loading && transaction && (
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className={`rounded-xl shadow-lg border overflow-hidden ${
                            theme === 'dark' 
                                ? 'bg-slate-800/50 border-slate-700' 
                                : 'bg-white/80 border-gray-200'
                        }`}
                    >
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Vehicle Selection */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Vehicle *
                                    </label>
                                    <select
                                        name="vehicle_id"
                                        value={formData.vehicle_id}
                                        onChange={handleInputChange}
                                        required
                                        className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            theme === 'dark' 
                                                ? 'border-slate-600 bg-slate-700 text-white' 
                                                : 'border-gray-300 bg-white text-gray-900'
                                        }`}
                                    >
                                        <option value="">Select Vehicle</option>
                                        {vehicles.map((vehicle) => (
                                            <option key={vehicle.id} value={vehicle.id}>
                                                {vehicle.plate}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Transaction Type Selection */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Transaction Type *
                                    </label>
                                    <div className="flex gap-3">
                                        <label className={`flex items-center cursor-pointer ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <input
                                                type="radio"
                                                name="is_expense"
                                                value="true"
                                                checked={formData.is_expense === true}
                                                onChange={(e) => setFormData({...formData, is_expense: e.target.value === 'true'})}
                                                className="mr-2"
                                            />
                                            <span className="text-red-500 font-medium">💰 Expense</span>
                                        </label>
                                        <label className={`flex items-center cursor-pointer ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <input
                                                type="radio"
                                                name="is_expense"
                                                value="false"
                                                checked={formData.is_expense === false}
                                                onChange={(e) => setFormData({...formData, is_expense: e.target.value === 'true'})}
                                                className="mr-2"
                                            />
                                            <span className="text-green-500 font-medium">💵 Revenue</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Category Selection */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        🏷️ Transaction Type *
                                    </label>
                                    <select
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleInputChange}
                                        required
                                        className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            theme === 'dark' 
                                                ? 'border-slate-600 bg-slate-700 text-white' 
                                                : 'border-gray-300 bg-white text-gray-900'
                                        }`}
                                    >
                                        <option value="">Select Transaction Type</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Amount */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {formData.is_expense ? 'Expense ($)' : 'Revenue ($)'} *
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        step="0.01"
                                        className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            theme === 'dark' 
                                                ? 'border-slate-600 bg-slate-700 text-white' 
                                                : 'border-gray-300 bg-white text-gray-900'
                                        }`}
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* Transaction Date */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Transaction Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="transaction_date"
                                        value={formData.transaction_date}
                                        onChange={handleInputChange}
                                        required
                                        className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            theme === 'dark' 
                                                ? 'border-slate-600 bg-slate-700 text-white' 
                                                : 'border-gray-300 bg-white text-gray-900'
                                        }`}
                                    />
                                </div>

                                {/* Expense (only for expense transactions) */}
                                {formData.is_expense && (
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Actual Expense ($) *
                                        </label>
                                        <input
                                            type="number"
                                            name="expense"
                                            value={formData.expense}
                                            onChange={handleInputChange}
                                            step="0.01"
                                            min="0"
                                            className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                theme === 'dark'
                                                    ? 'border-slate-600 bg-slate-700 text-white'
                                                    : 'border-gray-300 bg-white text-gray-900'
                                            }`}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="mt-6">
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Payment Method
                                </label>
                                <select
                                    name="payment_method"
                                    value={formData.payment_method}
                                    onChange={handleInputChange}
                                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        theme === 'dark' 
                                            ? 'border-slate-600 bg-slate-700 text-white' 
                                            : 'border-gray-300 bg-white text-gray-900'
                                    }`}
                                >
                                    <option value="">Ödeme Yöntemi Seçin</option>
                                    <option value="Nakit">Nakit</option>
                                    <option value="Kredi Kartı">Kredi Kartı</option>
                                    <option value="Banka Kartı">Banka Kartı</option>
                                    <option value="Havale">Havale</option>
                                    <option value="EFT">EFT</option>
                                    <option value="Çek">Çek</option>
                                    <option value="Senet">Senet</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div className="mt-6">
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        theme === 'dark' 
                                            ? 'border-slate-600 bg-slate-700 text-white' 
                                            : 'border-gray-300 bg-white text-gray-900'
                                    }`}
                                    placeholder="Transaction description..."
                                />
                            </div>

                            {/* Notes */}
                            <div className="mt-6">
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Notlar
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        theme === 'dark' 
                                            ? 'border-slate-600 bg-slate-700 text-white' 
                                            : 'border-gray-300 bg-white text-gray-900'
                                    }`}
                                    placeholder="Ek notlar..."
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="mt-8 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => router.push(`/transactions/${transactionId}`)}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                                        theme === 'dark'
                                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg ${
                                        saving
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : theme === 'dark'
                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                : 'bg-blue-500 hover:bg-blue-600'
                                    }`}
                                >
                                    {saving ? (
                                        <span className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Updating...
                                        </span>
                                    ) : (
                                        'Update'
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.form>
                )}

                {/* Not Found State */}
                {!loading && !transaction && !error && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                            Transaction Not Found
                        </h3>
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            The transaction you want to edit does not exist or may have been deleted.
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default EditTransactionPage; 