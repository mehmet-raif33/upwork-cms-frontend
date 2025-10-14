"use client"
import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { selectIsLoggedIn, selectUser, selectIsInitialized } from '../redux/sliceses/authSlices';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getTransactionCategoriesApi, createTransactionCategoryApi, updateTransactionCategoryApi, deleteTransactionCategoryApi } from '../api';
import { useToast } from '../AppLayoutClient';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';

// Transaction Category interface
interface TransactionCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  transaction_count?: number;
}

const TransactionCategoriesPage: React.FC = () => {
    const theme = useSelector((state: RootState) => state.theme.theme);
    const isLoggedIn = useSelector(selectIsLoggedIn);
    const isInitialized = useSelector(selectIsInitialized);
    const user = useSelector(selectUser);
    const router = useRouter();
    const { showToast } = useToast();
    const { modalState, showConfirmModal, hideConfirmModal, handleConfirm } = useConfirmModal();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<TransactionCategory[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);
    const [formData, setFormData] = useState({
        name: ''
    });



    // ✅ Auth check removed - AuthInitializer will handle redirect

    // Redirect non-admin users to home page - ONLY after auth is initialized
    useEffect(() => {
        // ✅ Wait if auth not yet initialized
        if (!isInitialized) return;
        
        if (isLoggedIn && user?.role !== 'admin') {
            console.log('🔄 [TransactionCategories] Non-admin user, redirecting to dashboard');
            router.push('/');
        }
    }, [isLoggedIn, isInitialized, user, router]); // ✅ isInitialized dependency added

    // Load categories on component mount
    useEffect(() => {
        if (isLoggedIn) {
            const loadCategories = async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        return;
                    }
                    setLoading(true);
                    const response = await getTransactionCategoriesApi(token);
                    
                    setCategories(response.data || []);
                } catch (error: unknown) {
                    console.error('Error loading categories:', error);
                    showToast('Error loading categories', 'error');
                } finally {
                    setLoading(false);
                }
            };
            loadCategories();
        }
    }, [isLoggedIn, showToast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const resetForm = () => {
        setFormData({ name: '' });
        setEditingCategory(null);
        setShowAddForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.name.trim()) {
                showToast('Transaction type name is required', 'error');
                return;
            }

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            if (editingCategory) {
                // Update existing category
                const response = await updateTransactionCategoryApi(token, editingCategory.id, {
                    name: formData.name.trim()
                });
                setCategories(prev => prev.map(cat => 
                    cat.id === editingCategory.id ? response.data : cat
                ));
                showToast('Transaction type successfully updated!', 'success');
            } else {
                // Create new category
                const response = await createTransactionCategoryApi(token, {
                    name: formData.name.trim()
                });
                setCategories(prev => [...prev, response.data]);
                showToast('Transaction type successfully added!', 'success');
            }
            resetForm();
        } catch (error: unknown) {
            console.error('Error saving category:', error);
            let message = 'Error saving transaction type';
            if (error && typeof error === 'object' && 'message' in error) {
                message += `: ${(error as { message?: string }).message}`;
            }
            showToast(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (category: TransactionCategory) => {
        setEditingCategory(category);
        setFormData({
            name: category.name
        });
        setShowAddForm(true);
    };

    const handleDelete = async (categoryId: string) => {
        const categoryToDelete = categories.find(cat => cat.id === categoryId);
        if (categoryToDelete) {
            showConfirmModal(
                'Delete Transaction Type',
                `Are you sure you want to delete the transaction type "${categoryToDelete.name}"?\n\nIt cannot be deleted if there are transactions with this type.`,
                async () => {
                    try {
                        const token = localStorage.getItem('token');
                        if (!token) {
                            throw new Error('Token not found');
                        }
                        await deleteTransactionCategoryApi(token, categoryToDelete.id);
                        setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
                        showToast('Transaction type successfully deleted!', 'success');
                    } catch (error: unknown) {
                        console.error('Error deleting category:', error);
                        let message = 'Error deleting transaction type';
                        if (error && typeof error === 'object' && 'message' in error) {
                            message = (error as { message?: string }).message || message;
                        }
                        showToast(message, 'error');
                    }
                },
                {
                    confirmText: 'Delete',
                    cancelText: 'Cancel',
                    type: 'danger',
                    icon: '🗑️'
                }
            );
        }
    };

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

    return (
        <div className={`flex-1 bg-gradient-to-br min-h-screen p-6 ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
            {/* Header */}
            <motion.div 
                className="mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Transaction Types</h1>
                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Manage transaction types for better tracking</p>
            </motion.div>

            {/* Success Message */}
            {/* Error Message */}
            {/* Loading State */}
            {loading && categories.length === 0 && (
                <motion.div 
                    className="flex items-center justify-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </motion.div>
            )}

            {/* Add Button */}
            {user?.role === 'admin' && (
                <motion.div 
                    className="mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        + Add Transaction Type
                    </button>
                </motion.div>
            )}

            {/* Add/Edit Form Modal */}
            {showAddForm && (
                <motion.div 
                    className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div 
                        className={`w-full max-w-md rounded-xl shadow-lg p-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">
                                {editingCategory ? 'Edit Transaction Type' : 'Add New Transaction Type'}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Transaction Type Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        theme === 'dark' 
                                            ? 'bg-slate-700 border-slate-600 text-gray-100' 
                                            : 'bg-white border-gray-300 text-gray-800'
                                    }`}
                                    placeholder="Fuel, Maintenance, Insurance..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Add')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}

            {/* Categories Grid */}
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
            >
                {categories.map((category, index) => (
                    <motion.div
                        key={category.id}
                        className={`rounded-xl shadow-sm border p-6 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        whileHover={{ y: -2 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-blue-500 text-white`}>
                                    {category.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                                        {category.name}
                                    </h3>
                                </div>
                            </div>
                            {user?.role === 'admin' && (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(category)}
                                        className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className={`flex items-center justify-between text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span>Created: {category.created_at ? new Date(category.created_at).toLocaleDateString('en-US') : 'No date'}</span>
                            {category.transaction_count !== undefined && (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    category.transaction_count > 0 
                                        ? theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                                        : theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                }`}>
                                    {category.transaction_count} transactions
                                </span>
                            )}
                        </div>
                        
                        {/* Show warning if transaction count is 0 */}
                        {category.transaction_count === 0 && (
                            <div className={`mt-2 p-2 rounded-lg text-xs ${
                                theme === 'dark' ? 'bg-orange-900/20 text-orange-200 border border-orange-800' 
                                : 'bg-orange-50 text-orange-800 border border-orange-200'
                            }`}>
                                ⚠️ No transactions yet for this category.
                            </div>
                        )}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={() => router.push(`/transactions?category_id=${category.id}`)}
                                disabled={category.transaction_count === 0}
                                className={`w-full text-center py-2 px-4 rounded-lg transition-colors ${
                                    category.transaction_count === 0
                                        ? theme === 'dark'
                                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : theme === 'dark' 
                                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                            >
                                {category.transaction_count === 0 ? 'No Transactions' : 'View Transactions'}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Empty State */}
            {categories.length === 0 && !loading && (
                <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className={`text-xl font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                        No Transaction Types Yet
                    </h3>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {user?.role === 'admin' 
                            ? 'Click "Add Transaction Type" button to add your first transaction type.'
                            : 'No transaction types have been added yet. Contact your administrator.'
                        }
                    </p>
                </motion.div>
            )}

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={modalState.isOpen}
                onClose={hideConfirmModal}
                onConfirm={handleConfirm}
                title={modalState.title}
                message={modalState.message}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                type={modalState.type}
                icon={modalState.icon}
            />
        </div>
    );
};

export default TransactionCategoriesPage; 