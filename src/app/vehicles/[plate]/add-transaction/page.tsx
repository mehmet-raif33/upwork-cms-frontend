"use client"
import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { selectIsLoggedIn } from '../../../redux/sliceses/authSlices';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useToast } from '../../../AppLayoutClient';
import { getVehicleApi, getTransactionCategoriesApi, createTransactionApi } from '../../../api';

interface VehicleAddTransactionPageProps {
    params: Promise<{ plate: string }>;
}

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

const VehicleAddTransactionPage: React.FC<VehicleAddTransactionPageProps> = ({ params }) => {
    const theme = useSelector((state: RootState) => state.theme.theme);
    const isLoggedIn = useSelector(selectIsLoggedIn);
    const router = useRouter();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [categories, setCategories] = useState<TransactionCategory[]>([]);
    const [plate, setPlate] = useState<string>("");
    
    // Form states
    const [formData, setFormData] = useState({
        category_id: '',
        description: '',
        amount: '',
        expense: '',
        is_expense: true,
        transaction_date: new Date().toISOString().split('T')[0]
    });

    // Handle async params
    const handleParams = useCallback(async () => {
        try {
            const resolvedParams = await params;
            setPlate(resolvedParams.plate);
        } catch (error) {
            console.error('Error resolving params:', error);
        }
    }, [params]);

    useEffect(() => {
        handleParams();
    }, [handleParams]);

    // Load vehicle and categories data
    useEffect(() => {
        if (!plate || !isLoggedIn) return;
        
        const loadData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Token not found');
                    return;
                }
                
                setLoading(true);
                setError(null);
                
                // Load vehicle and categories in parallel
                const [vehicleResponse, categoriesResponse] = await Promise.all([
                    getVehicleApi(token, plate),
                    getTransactionCategoriesApi(token)
                ]);
                
                setVehicle(vehicleResponse.data);
                setCategories(categoriesResponse.data || []);
                console.log('🚗 Vehicle loaded for transaction:', vehicleResponse.data);
                
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
    }, [plate, isLoggedIn]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Giriş yapmamış kullanıcılar için loading göster
    if (!isLoggedIn) {
        return (
            <div className="flex-1 min-h-screen w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            if (!vehicle) {
                throw new Error('Vehicle information not found');
            }

            // Transaction validation
            if (!formData.category_id) {
                setError('Transaction category selection is required');
                return;
            }
            
            if (!formData.description.trim()) {
                setError('Description field is required');
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

            const transactionData = {
                vehicle_id: vehicle.id,
                category_id: formData.category_id,
                amount: parseFloat(formData.amount),
                expense: formData.is_expense ? parseFloat(formData.expense) : undefined,
                is_expense: formData.is_expense,
                description: formData.description.trim(),
                transaction_date: formData.transaction_date
            };

            await createTransactionApi(token, transactionData);
            
            // Show success message and redirect to vehicle detail page
            showToast('Transaction successfully added!', 'success');
            router.push(`/vehicles/${plate}`);
            
        } catch (error: unknown) {
            console.error('Transaction creation error:', error);
            let errorMessage = 'Error adding transaction';
            if (error && typeof error === 'object' && 'message' in error) {
                errorMessage = (error as { message?: string }).message || errorMessage;
            }
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !vehicle) {
        return (
            <div className="flex-1 min-h-screen w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className={`flex-1 bg-gradient-to-br min-h-screen p-3 sm:p-6 ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto"
            >
                {/* Header */}
                <div className="mb-4 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                        <h1 className={`text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {vehicle ? `${vehicle.plate} - Add Transaction` : 'Add Transaction'}
                        </h1>
                        <p className={`text-base sm:text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {vehicle ? `Add a new transaction for ${vehicle.plate} (${vehicle.year})` : 'Add a new transaction for the vehicle'}
                        </p>
                    </div>
                    
                    {/* Back Button */}
                    <motion.button
                        onClick={() => router.push(`/vehicles/${plate}`)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                            theme === 'dark'
                                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                        }`}
                    >
                        <span className="flex items-center">
                            <span className="text-base sm:text-lg mr-1 sm:mr-2">←</span>
                            <span className="hidden sm:inline">Back to Vehicle</span>
                            <span className="sm:hidden">Back</span>
                        </span>
                    </motion.button>
                </div>

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border ${
                            theme === 'dark' 
                                ? 'bg-red-900/20 border-red-800 text-red-200' 
                                : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                    >
                        <div className="flex items-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm sm:text-base">{error}</span>
                        </div>
                    </motion.div>
                )}

                {/* Vehicle Info Card */}
                {vehicle && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 p-4 rounded-lg border ${
                            theme === 'dark' 
                                ? 'bg-blue-900/20 border-blue-800 text-blue-200' 
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                    >
                        <div className="flex items-center">
                            <div className="text-2xl mr-3">🚗</div>
                            <div>
                                <h3 className="font-semibold text-lg">Selected Vehicle: {vehicle.plate}</h3>
                                <p className="text-sm opacity-90">Year: {vehicle.year} • {vehicle.customer_email && `Customer: ${vehicle.customer_email}`}</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Form */}
                <motion.form
                    onSubmit={handleSubmit}
                    className={`p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-xl backdrop-blur-sm border ${
                        theme === 'dark' 
                            ? 'bg-slate-800/50 border-slate-700' 
                            : 'bg-white/80 border-gray-200'
                    }`}
                >
                    <div className="space-y-4 sm:space-y-6">
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
                                Transaction Category *
                            </label>
                            <select
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleInputChange}
                                className={`w-full p-2.5 sm:p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                                    theme === 'dark' 
                                        ? 'border-slate-600 bg-slate-700 text-white' 
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                                required
                            >
                                <option value="">Select transaction category</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Amount and Date Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {/* Amount */}
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {formData.is_expense ? 'Revenue ($)' : 'Amount ($)'} *
                                </label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    className={`w-full p-2.5 sm:p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                                        theme === 'dark' 
                                            ? 'border-slate-600 bg-slate-700 text-white' 
                                            : 'border-gray-300 bg-white text-gray-900'
                                    }`}
                                    placeholder="0.00"
                                    required
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
                                    className={`w-full p-2.5 sm:p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                                        theme === 'dark' 
                                            ? 'border-slate-600 bg-slate-700 text-white' 
                                            : 'border-gray-300 bg-white text-gray-900'
                                    }`}
                                    required
                                />
                            </div>
                        </div>

                        {/* Expense (only for expense transactions) */}
                        {formData.is_expense && (
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Expense ($) *
                                </label>
                                <input
                                    type="number"
                                    name="expense"
                                    value={formData.expense}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="0"
                                    className={`w-full p-2.5 sm:p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                                        theme === 'dark'
                                            ? 'border-slate-600 bg-slate-700 text-white'
                                            : 'border-gray-300 bg-white text-gray-900'
                                    }`}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        )}

                        {/* Description */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className={`w-full p-2.5 sm:p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                                    theme === 'dark' 
                                        ? 'border-slate-600 bg-slate-700 text-white' 
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                                placeholder="Describe transaction details..."
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6 sm:mt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 text-sm sm:text-base ${
                                loading
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:shadow-lg'
                            } ${
                                theme === 'dark'
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                                    <span className="hidden sm:inline">Adding...</span>
                                    <span className="sm:hidden">Adding...</span>
                                </div>
                            ) : (
                                <div>
                                    <span className="hidden sm:inline">Add Transaction</span>
                                    <span className="sm:hidden">Add</span>
                                </div>
                            )}
                        </button>
                    </div>
                </motion.form>
            </motion.div>
        </div>
    );
};

export default VehicleAddTransactionPage;