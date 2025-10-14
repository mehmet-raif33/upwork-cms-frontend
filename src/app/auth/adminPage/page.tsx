"use client";
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import Link from 'next/link';
import { changePasswordApi, getActivitiesApi, getUsersApi } from '../../api';

const AdminPage: React.FC = () => {
    const theme = useSelector((state: RootState) => state.theme.theme);
    const user = useSelector((state: RootState) => state.auth.user);
    const [activeTab, setActiveTab] = useState('profile');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // State for users
    const [users, setUsers] = useState<Array<{ id: string; username?: string; email: string; role?: string }>>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);

    // State for activities
    const [activities, setActivities] = useState<Array<{ id: string; action: string; user_name?: string; created_at?: string }>>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [activitiesError, setActivitiesError] = useState<string | null>(null);

    const adminData = {
        name: user?.name || 'Admin User',
        email: user?.email || 'admin@ulas.com',
        role: user?.role === 'admin' ? 'System Administrator' : 'User',
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setPasswordMessage(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Session not found');
            await changePasswordApi(token, { oldPassword, newPassword });
            setPasswordMessage('Password successfully changed!');
            setOldPassword('');
            setNewPassword('');
        } catch (err: unknown) {
            const errorMessage = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message || 'Could not change password.' : 'Could not change password.';
            setPasswordMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Fetch users when users tab is opened
    useEffect(() => {
        if (activeTab === 'users') {
            const fetchUsers = async () => {
                setUsersLoading(true);
                setUsersError(null);
                try {
                    const token = localStorage.getItem('token');
                    if (!token) throw new Error('Session not found');
                    const data = await getUsersApi(token);
                    setUsers(Array.isArray(data) ? data : []);
                } catch (err: unknown) {
                    const errorMessage = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message || 'Could not fetch users' : 'Could not fetch users';
                    setUsersError(errorMessage);
                } finally {
                    setUsersLoading(false);
                }
            };
            fetchUsers();
        }
    }, [activeTab]);

    // Fetch activities when recent activities tab is opened
    useEffect(() => {
        if (activeTab === 'activity') {
            const fetchActivities = async () => {
                setActivitiesLoading(true);
                setActivitiesError(null);
                try {
                    const token = localStorage.getItem('token');
                    if (!token) throw new Error('Session not found');
                    const data = await getActivitiesApi(token);
                    setActivities(Array.isArray(data) ? data : []);
                } catch (err: unknown) {
                    const errorMessage = err && typeof err === 'object' && 'message' in err ? (err as { message?: string }).message || 'Could not fetch activities' : 'Could not fetch activities';
                    setActivitiesError(errorMessage);
                } finally {
                    setActivitiesLoading(false);
                }
            };
            fetchActivities();
        }
    }, [activeTab]);
    useEffect(() => {
        console.log('activities state:', activities);
        console.log('activitiesError:', activitiesError);
    }, [activities, activitiesError]);

    return (
        <div className={`min-h-screen bg-gradient-to-br p-4 sm:p-6 ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <Link href="/" className={`transition-colors text-sm sm:text-base ${theme === 'dark' ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}>← Back to Home</Link>
                        <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Admin Panel</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>Admin</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className={`flex flex-wrap gap-1 backdrop-blur-sm rounded-lg sm:rounded-xl p-1 shadow-lg ${theme === 'dark' ? 'bg-slate-800/80' : 'bg-white/80'}`}> 
                    <button onClick={() => setActiveTab('profile')} className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md sm:rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : theme === 'dark' ? 'text-gray-300 hover:text-gray-100 hover:bg-slate-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}>
                        <span className="text-sm sm:text-base">👤</span>
                        <span className="hidden sm:inline">Profile</span>
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md sm:rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : theme === 'dark' ? 'text-gray-300 hover:text-gray-100 hover:bg-slate-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}>
                        <span className="text-sm sm:text-base">👥</span>
                        <span className="hidden sm:inline">Users</span>
                    </button>
                    <button onClick={() => setActiveTab('password')} className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md sm:rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm ${activeTab === 'password' ? 'bg-blue-600 text-white shadow-lg' : theme === 'dark' ? 'text-gray-300 hover:text-gray-100 hover:bg-slate-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}>
                        <span className="text-sm sm:text-base">🔐</span>
                        <span className="hidden sm:inline">Change Password</span>
                    </button>
                    <button onClick={() => setActiveTab('activity')} className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md sm:rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm ${activeTab === 'activity' ? 'bg-blue-600 text-white shadow-lg' : theme === 'dark' ? 'text-gray-300 hover:text-gray-100 hover:bg-slate-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}>
                        <span className="text-sm sm:text-base">📊</span>
                        <span className="hidden sm:inline">Recent Activities</span>
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'profile' && (
                    <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white/20'} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border p-4 sm:p-6`}>
                        <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Profile Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-4">
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-2xl">👤</span>
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Full Name</p>
                                        <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{adminData.name}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-2xl">📧</span>
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Email</p>
                                        <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{adminData.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-2xl">🎯</span>
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Role</p>
                                        <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{adminData.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'users' && (
                    <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white/20'} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border p-4 sm:p-6`}>
                        <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Users</h3>
                        {usersLoading && <div className="text-center text-sm text-gray-400">Loading...</div>}
                        {usersError && <div className="text-center text-sm text-red-500">{usersError}</div>}
                        <div className="space-y-3">
                            {users.map((u) => (
                                <div key={u.id} className={`border rounded-lg p-4 transition-colors ${theme === 'dark' ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${u.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'}`}>{u.username?.charAt(0)?.toUpperCase() || '?'}</div>
                                        <div>
                                            <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{u.username}</p>
                                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{u.email}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!usersLoading && !usersError && users.length === 0 && (
                                <div className="text-center text-sm text-gray-400">Henüz kullanıcı yok.</div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'password' && (
                    <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white/20'} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border p-4 sm:p-6 max-w-md mx-auto`}>
                        <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Change Password</h3>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className={`block mb-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Current Password</label>
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={e => setOldPassword(e.target.value)}
                                    className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                                        ${theme === 'dark'
                                            ? 'bg-slate-700 border-slate-600 text-gray-100 placeholder-gray-400'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                                    `}
                                    required
                                    placeholder="Enter your current password"
                                />
                            </div>
                            <div>
                                <label className={`block mb-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                                        ${theme === 'dark'
                                            ? 'bg-slate-700 border-slate-600 text-gray-100 placeholder-gray-400'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}
                                    `}
                                    required
                                    placeholder="Enter your new password"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition-colors">{loading ? 'Changing...' : 'Change Password'}</button>
                            {passwordMessage && (
                                <div className={`mt-2 text-center text-sm font-medium ${passwordMessage.includes('success')
                                    ? (theme === 'dark' ? 'text-green-400' : 'text-green-600')
                                    : (theme === 'dark' ? 'text-red-400' : 'text-red-600')
                                }`}>
                                    {passwordMessage}
                                </div>
                            )}
                        </form>
                    </div>
                )}
                {activeTab === 'activity' && (
                    <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white/20'} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border p-4 sm:p-6`}>
                        <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Recent Activities</h3>
                        {activitiesLoading && <div className="text-center text-sm text-gray-400">Loading...</div>}
                        {activitiesError && <div className="text-center text-sm text-red-500">{activitiesError}</div>}
                        <div className="space-y-3 sm:space-y-4">
                            {activities.map((activity, index) => (
                                <div key={activity.id || index} className={`border rounded-lg sm:rounded-xl p-3 sm:p-4 transition-colors ${theme === 'dark' ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl sm:text-2xl">
                                            {activity.action?.toLowerCase().includes('araç') && '🚗'}
                                            {activity.action?.toLowerCase().includes('kullanıcı') && '👤'}
                                            {activity.action?.toLowerCase().includes('kategori') && '🏷️'}
                                            {activity.action?.toLowerCase().includes('işlem') && '💸'}
                                            {activity.action?.toLowerCase().includes('personel') && '👥'}
                                            {activity.action?.toLowerCase().includes('şifre') && '🔐'}
                                            {activity.action?.toLowerCase().includes('güncellendi') && '✏️'}
                                            {activity.action?.toLowerCase().includes('silindi') && '🗑️'}
                                            {activity.action?.toLowerCase().includes('eklendi') && '➕'}
                                        </span>
                                        <div className="flex-1">
                                            <p className={`font-semibold text-sm sm:text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{activity.action}</p>
                                            <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{activity.user_name ? `${activity.user_name} - ` : ''}{activity.created_at ? new Date(activity.created_at).toLocaleString('tr-TR') : ''}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!activitiesLoading && !activitiesError && activities.length === 0 && (
                                <div className="text-center text-sm text-gray-400">Henüz etkinlik yok.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPage;