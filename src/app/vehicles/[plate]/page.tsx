"use client"
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { selectIsLoggedIn } from '../../redux/sliceses/authSlices';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getVehicleApi, getTransactionsByVehicleApi } from '../../api';

interface VehiclePageProps {
    params: Promise<{ plate: string }>;
}

interface Vehicle {
    id: string;
    plate: string;
    year: number;
    customer_email?: string;
    customer_phone?: string;
    created_at: string;
}

interface Transaction {
    id: string;
    personnel_id: string;
    vehicle_id: string;
    description: string;
    amount: number | string;
    transaction_date: string;
    category_id: string;
    created_at: string;
    // Joined data
    vehicle_plate?: string;
    personnel_name?: string;
    category_name?: string;
}

const VehiclePage: React.FC<VehiclePageProps> = ({ params }) => {
    const theme = useSelector((state: RootState) => state.theme.theme);
    const isLoggedIn = useSelector(selectIsLoggedIn);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [plate, setPlate] = useState<string>("");

    // ✅ Auth kontrolü kaldırıldı - AuthInitializer yönlendirme yapacak

    // Handle async params - optimize with useCallback
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

    // Data loading function - optimize with useCallback
    const loadData = useCallback(async (vehiclePlate: string) => {
        if (!vehiclePlate || !isLoggedIn) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Token not found');
                return;
            }

            setIsLoading(true);
            setError(null);

            // Load vehicle and transactions in parallel
            const [vehicleResponse, transactionsResponse] = await Promise.all([
                getVehicleApi(token, vehiclePlate),
                getTransactionsByVehicleApi(token, vehiclePlate)
            ]);

            setVehicle(vehicleResponse.data);
            setTransactions(transactionsResponse.data || []);
        } catch (error: unknown) {
            console.error('Error loading vehicle data:', error);
            let errorMessage = 'Error loading vehicle information';
            if (error && typeof error === 'object' && 'message' in error) {
                errorMessage += `: ${(error as { message?: string }).message}`;
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [isLoggedIn]);

    // Load data when plate changes
    useEffect(() => {
        if (plate) {
            loadData(plate);
        }
    }, [plate, loadData]);

    // Calculate transaction statistics - optimize with useMemo
    const transactionStats = React.useMemo(() => {
        const totalAmount = transactions.reduce((sum, transaction) => {
            const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
            return sum + (amount || 0);
        }, 0);
        const averageAmount = transactions.length > 0 ? totalAmount / transactions.length : 0;
        
        return { totalAmount, averageAmount };
    }, [transactions]);

    // Giriş yapmamış kullanıcılar için loading göster
    if (!isLoggedIn) {
        return (
            <div className="flex-1 min-h-screen w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className={`flex-1 bg-gradient-to-br min-h-screen flex items-center justify-center ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
                <div className={`text-center ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}>
                    <div className={`animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4 ${theme === 'dark' ? 'border-blue-400' : 'border-blue-600'}`}></div>
                    <p className="font-medium">Loading vehicle information...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex-1 bg-gradient-to-br min-h-screen flex items-center justify-center ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
                <div className={`text-center ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Error Occurred</h1>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{error}</p>
                    <Link href="/vehicles" className={`mt-4 inline-block px-6 py-3 rounded-lg transition-colors ${theme === 'dark' ? 'bg-blue-800 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        Back to Vehicles
                    </Link>
                </div>
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className={`flex-1 bg-gradient-to-br min-h-screen flex items-center justify-center ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
                <div className={`text-center ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    <div className="text-6xl mb-4">🚗</div>
                    <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Vehicle Not Found</h1>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>No vehicle found with this plate number.</p>
                    <Link href="/vehicles" className={`mt-4 inline-block px-6 py-3 rounded-lg transition-colors ${theme === 'dark' ? 'bg-blue-800 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        Back to Vehicles
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
                className="max-w-7xl mx-auto"
            >
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div className="flex items-center space-x-4">
                            <Link 
                                href="/vehicles" 
                                className={`flex items-center space-x-2 transition-colors ${theme === 'dark' ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}
                            >
                                <span>←</span>
                                <span>Back to Vehicles</span>
                            </Link>
                            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Vehicle Details
                            </h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800`}>
                                Active
                            </span>
                        </div>
                    </div>

                    {/* Vehicle Basic Info Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className={`p-6 rounded-xl shadow-lg border ${
                            theme === 'dark' 
                                ? 'bg-slate-800/50 border-slate-700' 
                                : 'bg-white/80 border-gray-200'
                        }`}
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🚗</div>
                                <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {vehicle.plate}
                                </h2>
                                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {vehicle.plate}
                                </p>
                            </div>
                            <div className="lg:col-span-2">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-50'}`}>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Year</p>
                                        <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{vehicle.year}</p>
                                    </div>
                                    <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-50'}`}>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Transactions</p>
                                        <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{transactions.length}</p>
                                    </div>
                                    <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-yellow-900/50' : 'bg-yellow-50'}`}>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Total Amount</p>
                                        <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₺{transactionStats.totalAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="mb-6"
                >
                    <div className={`flex flex-wrap justify-center gap-2 p-1 rounded-lg ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-white/80'}`}>
                        {[
                            { id: "overview", name: "Overview", icon: "📊" },
                            { id: "transactions", name: "Transactions", icon: "📋" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                                    activeTab === tab.id
                                        ? "bg-blue-600 text-white shadow-lg"
                                        : theme === 'dark' 
                                            ? "text-gray-300 hover:text-gray-100 hover:bg-slate-700"
                                            : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                                }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Tab Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="space-y-6"
                >
                    {activeTab === "overview" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Vehicle Details */}
                            <div className={`p-6 rounded-xl shadow-lg border ${
                                theme === 'dark' 
                                    ? 'bg-slate-800/50 border-slate-700' 
                                    : 'bg-white/80 border-gray-200'
                            }`}>
                                <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Vehicle Information
                                </h3>
                                <div className="space-y-4">
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Plate:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {vehicle.plate}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Year:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {vehicle.year}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Date Added:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString('en-US') : 'No date'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Details */}
                            <div className={`p-6 rounded-xl shadow-lg border ${
                                theme === 'dark' 
                                    ? 'bg-slate-800/50 border-slate-700' 
                                    : 'bg-white/80 border-gray-200'
                            }`}>
                                <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Customer Information
                                </h3>
                                <div className="space-y-4">
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Email:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {vehicle.customer_email || 'Not specified'}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Phone:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {vehicle.customer_phone || 'Not specified'}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between items-center py-2 ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Customer Status:</span>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            (vehicle.customer_email || vehicle.customer_phone)
                                                ? theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                                : theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {(vehicle.customer_email || vehicle.customer_phone) ? 'Registered' : 'Incomplete Info'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Statistics */}
                            <div className={`p-6 rounded-xl shadow-lg border ${
                                theme === 'dark' 
                                    ? 'bg-slate-800/50 border-slate-700' 
                                    : 'bg-white/80 border-gray-200'
                            }`}>
                                <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Transaction Statistics
                                </h3>
                                <div className="space-y-4">
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Total Transactions:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {transactions.length}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Total Amount:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            ₺{transactionStats.totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Average Amount:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            ₺{transactionStats.averageAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Last Transaction:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {transactions.length > 0 
                                                ? new Date(transactions[0].transaction_date).toLocaleDateString('en-US')
                                                : 'No transactions'
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "transactions" && (
                        <div className={`p-6 rounded-xl shadow-lg border ${
                            theme === 'dark' 
                                ? 'bg-slate-800/50 border-slate-700' 
                                : 'bg-white/80 border-gray-200'
                        }`}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Vehicle Transactions
                                </h3>
                                <Link 
                                    href={`/vehicles/${vehicle.plate}/add-transaction`}
                                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                                        theme === 'dark'
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                >
                                    <span className="hidden sm:inline">+ Add Transaction</span>
                                    <span className="sm:hidden">+ Add</span>
                                </Link>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📋</div>
                                    <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                                        No Transactions Yet
                                    </h3>
                                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                        No transaction records found for this vehicle.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Desktop Table View */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                                <tr>
                                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        Date
                                                    </th>
                                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        Transaction Type
                                                    </th>
                                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        Description
                                                    </th>
                                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        Amount
                                                    </th>
                                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        Personnel
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-700' : 'divide-gray-200'}`}>
                                                {transactions.map((transaction, index) => (
                                                    <motion.tr
                                                        key={transaction.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                                        className={`${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-50'} transition-colors duration-200`}
                                                    >
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                                            {new Date(transaction.transaction_date).toLocaleDateString('en-US')}
                                                        </td>
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                theme === 'dark' 
                                                                    ? 'bg-blue-900 text-blue-200' 
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {transaction.category_name || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                                            <div className="max-w-xs truncate" title={transaction.description}>
                                                                {transaction.description || 'No description'}
                                                            </div>
                                                        </td>
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                                            (typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount) >= 0 
                                                                ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                                                : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                                                        }`}>
                                                            ₺{(typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount).toLocaleString('en-US')}
                                                        </td>
                                                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                                            {transaction.personnel_name || 'N/A'}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden space-y-3">
                                        {transactions.map((transaction, index) => (
                                            <motion.div
                                                key={transaction.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                                className={`p-4 rounded-lg border ${
                                                    theme === 'dark' 
                                                        ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50' 
                                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                                } transition-all duration-200`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                                theme === 'dark' 
                                                                    ? 'bg-blue-900 text-blue-200' 
                                                                    : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                                {transaction.category_name || 'N/A'}
                                                            </span>
                                                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                {new Date(transaction.transaction_date).toLocaleDateString('en-US')}
                                                            </span>
                                                        </div>
                                                        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-1`}>
                                                            {transaction.description || 'No description'}
                                                        </p>
                                                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            Personnel: {transaction.personnel_name || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className={`text-right ml-3`}>
                                                        <p className={`text-lg font-bold ${
                                                            (typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount) >= 0 
                                                                ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                                                : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                                                        }`}>
                                                            ₺{(typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount).toLocaleString('en-US')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
};

export default VehiclePage;