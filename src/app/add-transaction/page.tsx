"use client"
import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { selectIsLoggedIn } from '../redux/sliceses/authSlices';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useToast } from '../AppLayoutClient';
import { getVehiclesApi, getPersonnelApi, getTransactionCategoriesApi, createVehicleApi, createTransactionApi } from '../api';

// Vehicle interface matching backend schema
interface Vehicle {
  id: string;
  plate: string;
  year: number;
  customer_email?: string;
  customer_phone?: string;
  created_at: string;
}

// Personnel interface matching backend schema


// Transaction Category interface
interface TransactionCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

const AddTransactionPage: React.FC = () => {
    const theme = useSelector((state: RootState) => state.theme.theme);
    const isLoggedIn = useSelector(selectIsLoggedIn);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [categories, setCategories] = useState<TransactionCategory[]>([]);
    
    // Vehicle search state
    const [vehicleSearch, setVehicleSearch] = useState('');
    const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
    
    // Form states
    const [isNewVehicle, setIsNewVehicle] = useState(false);
    const [formData, setFormData] = useState({
        vehicle_id: '',
        category_id: '',
        description: '',
        amount: '',
        expense: '',
        is_expense: true,
        transaction_date: new Date().toISOString().split('T')[0]
    });
    
    // New vehicle form data
    const [newVehicleData, setNewVehicleData] = useState({
        plate: '',
        year: '',
        customer_email: '',
        customer_phone: ''
    });

    // ✅ Auth check removed - AuthInitializer will handle redirect
  
  // Load user and category data
    useEffect(() => {
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
                const [vehiclesResponse, , categoriesResponse] = await Promise.all([
                    getVehiclesApi(token),
                    getPersonnelApi(token),
                    getTransactionCategoriesApi(token)
                ]);
                
                setVehicles(vehiclesResponse.data || []);
                setCategories(categoriesResponse.data || []);
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
    }, []);

    // Vehicle filtreleme useEffect'i
    useEffect(() => {
        if (vehicleSearch.trim() === '') {
            setFilteredVehicles(vehicles);
        } else {
            const filtered = vehicles.filter(vehicle => 
                vehicle.plate.toLowerCase().includes(vehicleSearch.toLowerCase())
            );
            setFilteredVehicles(filtered);
        }
    }, [vehicles, vehicleSearch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleNewVehicleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewVehicleData({
            ...newVehicleData,
            [e.target.name]: e.target.value
        });
    };

    const handleVehicleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        
        if (value === 'new') {
            setIsNewVehicle(true);
            setFormData(prev => ({ ...prev, vehicle_id: '' }));
        } else {
            setIsNewVehicle(false);
            setFormData(prev => ({ ...prev, vehicle_id: value }));
            // Eğer URL'den gelen otomatik seçim değilse arama kutusunu temizle
            const urlPlate = searchParams.get('vehiclePlate');
            const selectedVehicle = vehicles.find(v => v.id === value);
            if (!urlPlate || (selectedVehicle && selectedVehicle.plate.toLowerCase() !== urlPlate.toLowerCase())) {
                setVehicleSearch('');
            }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            let vehicleId = formData.vehicle_id;

            // If new vehicle is being added, create vehicle first
            if (isNewVehicle) {
                // New vehicle validation
                if (!newVehicleData.plate.trim()) {
                    setError('License plate is required');
                    return;
                }
                
                if (!newVehicleData.year || parseInt(newVehicleData.year) < 1900 || parseInt(newVehicleData.year) > new Date().getFullYear() + 1) {
                    setError('Please enter a valid year');
                    return;
                }

                const vehicleData = {
                    plate: newVehicleData.plate.trim().toUpperCase(),
                    year: parseInt(newVehicleData.year),
                    customer_email: newVehicleData.customer_email.trim(),
                    customer_phone: newVehicleData.customer_phone.trim()
                };

                // Create new vehicle
                const vehicleResponse = await createVehicleApi(token, vehicleData);
                vehicleId = vehicleResponse.data.id;
                
                // Yerel state'e yeni aracı ekle
                setVehicles(prev => [...prev, vehicleResponse.data]);
            }

            // Transaction validation
            if (!vehicleId) {
                setError('Vehicle selection is required');
                return;
            }
            
            if (!formData.category_id) {
                setError('Transaction type selection is required');
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
                vehicle_id: vehicleId,
                category_id: formData.category_id,
                amount: parseFloat(formData.amount),
                expense: formData.is_expense ? parseFloat(formData.expense) : undefined,
                is_expense: formData.is_expense,
                description: formData.description.trim(),
                transaction_date: formData.transaction_date
            };

            await createTransactionApi(token, transactionData);
            
            // Show success message and redirect to transactions page
            showToast(
                isNewVehicle 
                    ? 'Vehicle and transaction successfully added!' 
                    : 'Transaction successfully added!', 
                'success'
            );
            router.push('/transactions');
            
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

    if (loading && vehicles.length === 0) {
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
                            Add New Transaction
                        </h1>
                        <p className={`text-base sm:text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            Add a new transaction record to the vehicle fleet management system
                        </p>
                    </div>
                    
                    {/* Back Button */}
                    <motion.button
                        onClick={() => router.push('/transactions')}
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
                            <span className="hidden sm:inline">Back to Transactions</span>
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
                        {/* Vehicle Selection Type */}
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Vehicle Selection *
                            </label>
                            
                            {/* Vehicle Search Input */}
                            <div className="mb-3">
                                <input
                                    type="text"
                                    placeholder="Search vehicle... (plate)"
                                    value={vehicleSearch}
                                    onChange={(e) => setVehicleSearch(e.target.value)}
                                    className={`w-full p-2.5 sm:p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                                        theme === 'dark' 
                                            ? 'border-slate-600 bg-slate-700 text-white' 
                                            : 'border-gray-300 bg-white text-gray-900'
                                    }`}
                                />
                                {vehicleSearch && (
                                    <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {filteredVehicles.length} vehicles found
                                    </p>
                                )}
                            </div>
                            
                            <select
                                value={isNewVehicle ? 'new' : formData.vehicle_id}
                                onChange={handleVehicleTypeChange}
                                className={`w-full p-2.5 sm:p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                                    theme === 'dark' 
                                        ? 'border-slate-600 bg-slate-700 text-white' 
                                        : 'border-gray-300 bg-white text-gray-900'
                                }`}
                                required
                            >
                                <option value="">Select vehicle</option>
                                <option value="new">➕ Add New Vehicle</option>
                                {filteredVehicles.map((vehicle) => (
                                    <option key={vehicle.id} value={vehicle.id}>
                                        {vehicle.plate} - {vehicle.year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* New Vehicle Form */}
                        {isNewVehicle && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`p-4 sm:p-6 rounded-lg border-2 border-dashed ${
                                    theme === 'dark' 
                                        ? 'border-blue-400 bg-blue-900/20' 
                                        : 'border-blue-300 bg-blue-50/50'
                                }`}
                            >
                                <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    🚗 New Vehicle Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-1.5 sm:mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            License Plate *
                                        </label>
                                        <input
                                            type="text"
                                            name="plate"
                                            value={newVehicleData.plate}
                                            onChange={handleNewVehicleInputChange}
                                            className={`w-full p-2.5 sm:p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                                                theme === 'dark' 
                                                    ? 'border-slate-600 bg-slate-700 text-white' 
                                                    : 'border-gray-300 bg-white text-gray-900'
                                            }`}
                                            placeholder="34ABC123"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-1.5 sm:mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Year *
                                        </label>
                                        <input
                                            type="number"
                                            name="year"
                                            value={newVehicleData.year}
                                            onChange={handleNewVehicleInputChange}
                                            className={`w-full p-2.5 sm:p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                                                theme === 'dark' 
                                                    ? 'border-slate-600 bg-slate-700 text-white' 
                                                    : 'border-gray-300 bg-white text-gray-900'
                                            }`}
                                            placeholder="2020"
                                            min="1900"
                                            max={new Date().getFullYear() + 1}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-1.5 sm:mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Customer Email
                                        </label>
                                        <input
                                            type="email"
                                            name="customer_email"
                                            value={newVehicleData.customer_email}
                                            onChange={handleNewVehicleInputChange}
                                            className={`w-full p-2.5 sm:p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                                                theme === 'dark' 
                                                    ? 'border-slate-600 bg-slate-700 text-white' 
                                                    : 'border-gray-300 bg-white text-gray-900'
                                            }`}
                                            placeholder="musteri@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-1.5 sm:mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Customer Phone
                                        </label>
                                        <input
                                            type="tel"
                                            name="customer_phone"
                                            value={newVehicleData.customer_phone}
                                            onChange={handleNewVehicleInputChange}
                                            className={`w-full p-2.5 sm:p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                                                theme === 'dark' 
                                                    ? 'border-slate-600 bg-slate-700 text-white' 
                                                    : 'border-gray-300 bg-white text-gray-900'
                                            }`}
                                            placeholder="+90 555 123 45 67"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

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
                                <option value="">Select transaction type</option>
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
                                    <span className="hidden sm:inline">{isNewVehicle ? 'Adding Vehicle and Transaction...' : 'Adding...'}</span>
                                    <span className="sm:hidden">Adding...</span>
                                </div>
                            ) : (
                                <div>
                                    <span className="hidden sm:inline">{isNewVehicle ? 'Add Vehicle and Transaction' : 'Add Transaction'}</span>
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

export default AddTransactionPage;