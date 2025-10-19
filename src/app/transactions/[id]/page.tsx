"use client"
import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { selectIsLoggedIn } from '../../redux/sliceses/authSlices';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { getTransactionApi, getTransactionHistoryApi, updateTransactionStatusApi } from '../../api';

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

// Transaction History interface
interface TransactionHistory {
  id: string;
  transaction_id: string;
  personnel_id: string;
  action: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  notes?: string;
  created_at: string;
  personnel_name?: string;
  personnel_username?: string;
}

const TransactionDetailPage: React.FC = () => {
    const theme = useSelector((state: RootState) => state.theme.theme);
    const isLoggedIn = useSelector(selectIsLoggedIn);
    const router = useRouter();
    const params = useParams();
    const transactionId = params.id as string;
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [history, setHistory] = useState<TransactionHistory[]>([]);
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [statusForm, setStatusForm] = useState({
        status: '',
        notes: ''
    });

    // Status modal'ını açarken mevcut durumu set et
    const openStatusModal = () => {
        setStatusForm({
            status: transaction?.status || '',
            notes: ''
        });
        setShowStatusModal(true);
    };

    // Transaction'ı yükle
    useEffect(() => {
        if (transactionId) {
            const loadTransaction = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        setError('Token not found');
                        return;
                    }
                    
                    setLoading(true);
                    setError(null);
                    
                    const [transactionResponse, historyResponse] = await Promise.all([
                        getTransactionApi(token, transactionId),
                        getTransactionHistoryApi(token, transactionId)
                    ]);
                    
                    setTransaction(transactionResponse.transaction);
                    setHistory(historyResponse.history || []);
                    
                } catch (error: unknown) {
                    console.error('Error loading transaction:', error);
                    let errorMessage = 'İşlem yüklenirken hata oluştu';
                    if (error && typeof error === 'object' && 'message' in error) {
                        errorMessage += `: ${(error as { message?: string }).message}`;
                    }
                    setError(errorMessage);
                } finally {
                    setLoading(false);
                }
            };
            loadTransaction();
        }
    }, [transactionId]);

    // Status güncelleme fonksiyonu
    const handleStatusUpdate = async () => {
        console.log('Status update başlatılıyor:', { statusForm, transactionId });
        
        if (!statusForm.status) {
            console.log('Status seçilmemiş');
            return;
        }
        
        setStatusLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            console.log('API call yapılıyor:', { status: statusForm.status, notes: statusForm.notes });
            await updateTransactionStatusApi(token, transactionId, {
                status: statusForm.status,
                notes: statusForm.notes
            });

            console.log('Status update başarılı');

            // Başarılı güncelleme sonrası form'u reset et ve modal'ı kapat
            setStatusForm({ status: '', notes: '' });
            setShowStatusModal(false);
            
            // Transaction'ı yeniden yükle
            console.log('Transaction yeniden yükleniyor');
            const [transactionResponse, historyResponse] = await Promise.all([
                getTransactionApi(token, transactionId),
                getTransactionHistoryApi(token, transactionId)
            ]);
            setTransaction(transactionResponse.transaction);
            setHistory(historyResponse.history || []);
            console.log('Transaction yeniden yüklendi');
        } catch (error: unknown) {
            console.error('Status update error:', error);
            console.error('Error type:', typeof error);
            console.error('Error details:', error);
            
            let errorMessage = 'Error updating status';
            if (error && typeof error === 'object' && 'message' in error) {
                errorMessage += `: ${(error as { message?: string }).message}`;
            }
            setError(errorMessage);
        } finally {
            setStatusLoading(false);
            setShowStatusModal(false);
            setStatusForm({ status: '', notes: '' });
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
                            İşlem Detayı
                        </h1>
                        <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            İşlem bilgilerini görüntüleyin
                        </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                        <motion.button
                            onClick={openStatusModal}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg ${
                                theme === 'dark'
                                    ? 'bg-purple-600 hover:bg-purple-700'
                                    : 'bg-purple-500 hover:bg-purple-600'
                            }`}
                        >
                            Update Status
                        </motion.button>
                        <motion.button
                            onClick={() => router.push(`/transactions/${transactionId}/edit`)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 shadow-lg ${
                                theme === 'dark'
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'bg-blue-500 hover:bg-blue-600'
                            }`}
                        >
                            Düzenle
                        </motion.button>
                        <motion.button
                            onClick={() => router.push('/transactions')}
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
                            Geri Dön
                        </motion.button>
                    </div>
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

                {/* Transaction History Tab */}
                {!loading && transaction && activeTab === 'history' && (
                    <motion.div
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
                            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                İşlem Süreç Geçmişi
                            </h3>
                            
                            {history.length > 0 ? (
                                <div className="space-y-4">
                                    {history.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                            className={`p-4 rounded-lg border ${
                                                theme === 'dark' 
                                                    ? 'bg-slate-700/50 border-slate-600' 
                                                    : 'bg-gray-50 border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            item.action === 'created' 
                                                                ? theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                                                : item.action === 'updated'
                                                                ? theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                                                                : theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {item.action === 'created' ? 'Created' : 
                                                             item.action === 'updated' ? 'Updated' : 
                                                             item.action === 'status_changed' ? 'Status Changed' : 
                                                             item.action}
                                                        </span>
                                                        <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {new Date(item.created_at).toLocaleString('en-US')}
                                                        </span>
                                                    </div>
                                                    
                                                    {item.field_name && (
                                                        <div className="mb-2">
                                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                                Alan: {item.field_name}
                                                            </span>
                                                        </div>
                                                    )}
                                                    
                                                    {item.old_value && item.new_value && (
                                                        <div className="mb-2">
                                                            <div className="flex items-center space-x-2">
                                                                <span className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                                                                    {item.old_value}
                                                                </span>
                                                                <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                    →
                                                                </span>
                                                                <span className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                                                    {item.new_value}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {item.notes && (
                                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {item.notes}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="text-right">
                                                    <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        {item.personnel_name || item.personnel_username || 'Bilinmeyen'}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📝</div>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Henüz işlem geçmişi bulunmuyor.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Tabs */}
                {!loading && transaction && (
                    <div className="mb-6">
                        <div className="flex space-x-1">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    activeTab === 'details'
                                        ? theme === 'dark'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-blue-500 text-white'
                                        : theme === 'dark'
                                            ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Detaylar
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    activeTab === 'history'
                                        ? theme === 'dark'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-blue-500 text-white'
                                        : theme === 'dark'
                                            ? 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Süreç Geçmişi ({history.length})
                            </button>
                        </div>
                    </div>
                )}

                {/* Transaction Details Tab */}
                {!loading && transaction && activeTab === 'details' && (
                    <motion.div
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
                                {/* Basic Information */}
                                <div>
                                    <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Temel Bilgiler
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                İşlem ID:
                                            </span>
                                            <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                #{transaction.id}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                İşlem Tarihi:
                                            </span>
                                            <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {new Date(transaction.transaction_date).toLocaleDateString('en-US')}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                İşlem Tipi:
                                            </span>
                                            <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {transaction.is_expense ? '💰 Gider' : '💵 Gelir'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                İşlem Türü:
                                            </span>
                                            <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {transaction.category_name || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Payment Method:
                                            </span>
                                            <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {transaction.payment_method || 'Nakit'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {transaction.is_expense ? 'Revenue:' : 'Amount:'}
                                            </span>
                                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                                                💵 ${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        {transaction.is_expense && transaction.expense && (
                                            <div>
                                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    Gider:
                                                </span>
                                                <p className={`text-lg font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                                                    💰 ${parseFloat(transaction.expense).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        )}
                                        {transaction.is_expense && transaction.expense && (
                                            <div>
                                                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    Kar/Zarar:
                                                </span>
                                                <p className={`text-lg font-bold ${
                                                    parseFloat(transaction.amount) - parseFloat(transaction.expense) >= 0
                                                        ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                                                        : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                                                }`}>
                                                    {parseFloat(transaction.amount) - parseFloat(transaction.expense) >= 0 ? '📈' : '📉'}
                                                    ${(parseFloat(transaction.amount) - parseFloat(transaction.expense)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Status:
                                            </span>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    transaction.status === 'pending' 
                                                        ? theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'
                                                        : transaction.status === 'in_progress'
                                                        ? theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                                                        : transaction.status === 'completed'
                                                        ? theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                                        : transaction.status === 'cancelled'
                                                        ? theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                                                        : theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {transaction.status === 'pending' ? 'Beklemede' : 
                                                     transaction.status === 'in_progress' ? 'Devam Ediyor' : 
                                                     transaction.status === 'completed' ? 'Tamamlandı' : 
                                                     transaction.status === 'cancelled' ? 'İptal Edildi' : 
                                                     'Bilinmiyor'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle Information */}
                                <div>
                                    <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Vehicle Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Plate:
                                            </span>
                                            <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {transaction.vehicle_plate || 'N/A'}
                                            </p>
                                        </div>

                                        <div>
                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Personnel:
                                            </span>
                                            <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {transaction.personnel_name || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                                İşlem Tarihi:
                                            </span>
                                            <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                {new Date(transaction.transaction_date).toLocaleDateString('en-US')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mt-6">
                                <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    Açıklama
                                </h3>
                                <div className={`p-4 rounded-lg ${
                                    theme === 'dark' 
                                        ? 'bg-slate-700/50 border border-slate-600' 
                                        : 'bg-gray-50 border border-gray-200'
                                }`}>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {transaction.description || 'Açıklama bulunmuyor'}
                                    </p>
                                </div>
                            </div>

                            {/* Notes */}
                            {transaction.notes && (
                                <div className="mt-6">
                                    <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Notes
                                    </h3>
                                    <div className={`p-4 rounded-lg ${
                                        theme === 'dark' 
                                            ? 'bg-slate-700/50 border border-slate-600' 
                                            : 'bg-gray-50 border border-gray-200'
                                    }`}>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {transaction.notes}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Not Found State */}
                {!loading && !transaction && !error && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                            İşlem Bulunamadı
                        </h3>
                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                            Aradığınız işlem mevcut değil veya silinmiş olabilir.
                        </p>
                    </div>
                )}

                {/* Status Update Modal */}
                {showStatusModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`p-6 rounded-xl shadow-lg max-w-md w-full mx-4 ${
                                theme === 'dark' 
                                    ? 'bg-slate-800 border border-slate-700' 
                                    : 'bg-white border border-gray-200'
                            }`}
                        >
                            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Update Transaction Status
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        New Status *
                                    </label>
                                    <select
                                        value={statusForm.status}
                                        onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                                        className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            theme === 'dark' 
                                                ? 'border-slate-600 bg-slate-700 text-white' 
                                                : 'border-gray-300 bg-white text-gray-900'
                                        }`}
                                    >
                                        <option value="">Select Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Notes
                                    </label>
                                    <textarea
                                        value={statusForm.notes}
                                        onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                                        rows={3}
                                        className={`w-full p-3 rounded-lg border transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            theme === 'dark' 
                                                ? 'border-slate-600 bg-slate-700 text-white' 
                                                : 'border-gray-300 bg-white text-gray-900'
                                        }`}
                                        placeholder="Note about status change..."
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowStatusModal(false);
                                        setStatusForm({ status: '', notes: '' });
                                    }}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                        theme === 'dark'
                                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                    }`}
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleStatusUpdate}
                                    disabled={statusLoading || !statusForm.status}
                                    className={`px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 ${
                                        statusLoading || !statusForm.status
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : theme === 'dark'
                                                ? 'bg-purple-600 hover:bg-purple-700'
                                                : 'bg-purple-500 hover:bg-purple-600'
                                    }`}
                                >
                                    {statusLoading ? 'Güncelleniyor...' : 'Güncelle'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default TransactionDetailPage; 