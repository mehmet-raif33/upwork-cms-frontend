"use client"
import React, { useState, useEffect } from "react";
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
    brand: string;
    model: string;
    year: number;
    color: string;
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
    vehicle_brand?: string;
    vehicle_model?: string;
    personnel_name?: string;
    category_name?: string;
}

const VehiclePage: React.FC<VehiclePageProps> = ({ params }) => {
    const theme = useSelector((state: RootState) => state.theme.theme);
    const isLoggedIn = useSelector(selectIsLoggedIn);
    const router = useRouter();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [plate, setPlate] = useState<string>("");

    // Giriş yapmamış kullanıcıları landing page'e yönlendir
    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/landing');
        }
    }, [isLoggedIn, router]);

    // Handle async params
    useEffect(() => {
        const getParams = async () => {
            const resolvedParams = await params;
            setPlate(resolvedParams.plate);
        };
        getParams();
    }, [params]);

    // Load vehicle data and transactions
    useEffect(() => {
        if (!plate || !isLoggedIn) return;

        const loadData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Token bulunamadı');
                    return;
                }

                setIsLoading(true);
                setError(null);

                // Load vehicle and transactions in parallel
                const [vehicleResponse, transactionsResponse] = await Promise.all([
                    getVehicleApi(token, plate),
                    getTransactionsByVehicleApi(token, plate)
                ]);

                setVehicle(vehicleResponse.data);
                setTransactions(transactionsResponse.data || []);
            } catch (error: unknown) {
                console.error('Error loading vehicle data:', error);
                let errorMessage = 'Araç bilgileri yüklenirken hata oluştu';
                if (error && typeof error === 'object' && 'message' in error) {
                    errorMessage += `: ${(error as { message?: string }).message}`;
                }
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [plate, isLoggedIn]);

    // Calculate transaction statistics
    const totalAmount = transactions.reduce((sum, transaction) => {
        const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount;
        return sum + (amount || 0);
    }, 0);
    const averageAmount = transactions.length > 0 ? totalAmount / transactions.length : 0;
    // const recentTransactions = transactions.slice(0, 5); // Last 5 transactions

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
                    <p className="font-medium">Araç bilgileri yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex-1 bg-gradient-to-br min-h-screen flex items-center justify-center ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
                <div className={`text-center ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Hata Oluştu</h1>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{error}</p>
                    <Link href="/vehicles" className={`mt-4 inline-block px-6 py-3 rounded-lg transition-colors ${theme === 'dark' ? 'bg-blue-800 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        Araçlara Dön
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
                    <h1 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Araç Bulunamadı</h1>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Bu plakaya sahip araç sistemde bulunmamaktadır.</p>
                    <Link href="/vehicles" className={`mt-4 inline-block px-6 py-3 rounded-lg transition-colors ${theme === 'dark' ? 'bg-blue-800 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        Araçlara Dön
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
                                <span>Araçlara Dön</span>
                            </Link>
                            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Araç Detayları
                            </h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800`}>
                                Aktif
                            </span>
                            <Link 
                                href={`/vehicles/${plate}/edit`}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    theme === 'dark'
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            >
                                Düzenle
                            </Link>
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
                                    {vehicle.brand} {vehicle.model}
                                </h2>
                                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {vehicle.plate}
                                </p>
                            </div>
                            <div className="lg:col-span-2">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-50'}`}>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Yıl</p>
                                        <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{vehicle.year}</p>
                                    </div>
                                    <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-green-900/50' : 'bg-green-50'}`}>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Renk</p>
                                        <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{vehicle.color || 'Belirtilmemiş'}</p>
                                    </div>
                                    <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-50'}`}>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Toplam İşlem</p>
                                        <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{transactions.length}</p>
                                    </div>
                                    <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-yellow-900/50' : 'bg-yellow-50'}`}>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Toplam Tutar</p>
                                        <p className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>₺{totalAmount.toLocaleString()}</p>
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
                        { id: "overview", name: "Genel Bakış", icon: "📊" },
                        { id: "transactions", name: "İşlemler", icon: "📋" }
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Vehicle Details */}
                            <div className={`p-6 rounded-xl shadow-lg border ${
                                theme === 'dark' 
                                    ? 'bg-slate-800/50 border-slate-700' 
                                    : 'bg-white/80 border-gray-200'
                            }`}>
                                <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Araç Bilgileri
                                </h3>
                                <div className="space-y-4">
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Marka/Model:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {vehicle.brand} {vehicle.model}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Plaka:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {vehicle.plate}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Yıl:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {vehicle.year}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Renk:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {vehicle.color || 'Belirtilmemiş'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Eklenme Tarihi:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString('tr-TR') : 'Tarih yok'}
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
                                    İşlem İstatistikleri
                                </h3>
                                <div className="space-y-4">
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Toplam İşlem:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {transactions.length}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Toplam Tutar:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            ₺{totalAmount.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className={`flex justify-between items-center py-2 border-b ${theme === 'dark' ? 'border-slate-600' : 'border-gray-200'}`}>
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Ortalama Tutar:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            ₺{averageAmount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Son İşlem:</span>
                                        <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            {transactions.length > 0 
                                                ? new Date(transactions[0].transaction_date).toLocaleDateString('tr-TR')
                                                : 'İşlem yok'
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
                                    Araç İşlemleri
                                </h3>
                                <Link 
                                    href="/add-transaction"
                                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                                        theme === 'dark'
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                >
                                    <span className="hidden sm:inline">+ İşlem Ekle</span>
                                    <span className="sm:hidden">+ Ekle</span>
                                </Link>
                            </div>

                            {transactions.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📋</div>
                                    <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                                        Henüz İşlem Yok
                                    </h3>
                                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                        Bu araç için henüz işlem kaydı bulunmuyor.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                            <tr>
                                                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    Tarih
                                                </th>
                                                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    İşlem Türü
                                                </th>
                                                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    Açıklama
                                                </th>
                                                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    Tutar
                                                </th>
                                                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>
                                                    Personel
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
                                                        {new Date(transaction.transaction_date).toLocaleDateString('tr-TR')}
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
                                                            {transaction.description || 'Açıklama yok'}
                                                        </div>
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                                                        (typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount) >= 0 
                                                            ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                                            : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                                                    }`}>
                                                        ₺{(typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount).toLocaleString('tr-TR')}
                                                    </td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                                                        {transaction.personnel_name || 'N/A'}
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
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