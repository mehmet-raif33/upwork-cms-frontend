"use client";
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import LoginForm from "../LoginForm";
import { selectIsLoggedIn, selectUser } from "../../redux/sliceses/authSlices";
import { getPersonnelActivitiesApi } from '../../api';

const UserPageContent: React.FC = () => {
    const theme = useSelector((state: RootState) => state.theme.theme);
    const user = useSelector(selectUser);
    const [activeTab, setActiveTab] = useState('profile');
    const searchParams = useSearchParams();
    const [activities, setActivities] = useState<Array<{
        id?: string;
        action?: string;
        created_at: string;
        user_name?: string;
    }>>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [userData, setUserData] = useState({
        id: '',
        name: 'John Doe',
        email: 'ahmet@ulas.com',
        role: 'Driver',
        department: 'Logistics',
        phone: '+90 532 123 4567',
        status: 'active',
        lastLogin: '2024-02-20 14:30',
        joinDate: '2023-03-15',
        vehicleAssigned: '34 ABC 123 - Mercedes Sprinter'
    });

    // Get user data from URL parameters
    useEffect(() => {
        const id = searchParams.get('id');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const role = searchParams.get('role');
        const department = searchParams.get('department');
        const phone = searchParams.get('phone');
        const status = searchParams.get('status');

        if (id && name && email && role && department && phone && status) {
            setUserData(prev => ({
                ...prev,
                id: id,
                name: decodeURIComponent(name),
                email: decodeURIComponent(email),
                role: decodeURIComponent(role),
                department: decodeURIComponent(department),
                phone: decodeURIComponent(phone),
                status: decodeURIComponent(status),
                lastLogin: new Date().toLocaleString('en-US'),
                joinDate: new Date().toLocaleDateString('en-US'),
            }));
        } else if (user) {
            // Get user information from Redux
            setUserData(prev => ({
                ...prev,
                id: user.id.toString(),
                name: user.name || 'User',
                email: user.email || '',
                role: user.role === 'manager' ? 'Manager' : 'Personnel',
                department: 'General',
                phone: '',
                status: 'active',
                lastLogin: new Date().toLocaleString('en-US'),
                joinDate: new Date().toLocaleDateString('en-US'),
            }));
        }
    }, [searchParams, user]);

    // Load activities - only for this personnel
    useEffect(() => {
        const loadActivities = async () => {
            if (activeTab === 'activity' && userData.id) {
                try {
                    setLoadingActivities(true);
                    const token = localStorage.getItem('token');
                    if (token) {
                        const response = await getPersonnelActivitiesApi(token, userData.id);
                        console.log('Personnel activities response:', response);
                        setActivities(response || []);
                    }
                } catch (error) {
                    console.error('Error loading personnel activities:', error);
                    setActivities([]);
                } finally {
                    setLoadingActivities(false);
                }
            }
        };

        loadActivities();
    }, [activeTab, userData.id]);

    const getActivityIcon = (action: string) => {
        if (action.includes('login')) return '🔐';
        if (action.includes('transaction')) return '💰';
        if (action.includes('vehicle')) return '🚗';
        if (action.includes('personel') || action.includes('personnel')) return '👤';
        if (action.includes('category')) return '📁';
        if (action.includes('update')) return '✏️';
        if (action.includes('delete')) return '🗑️';
        if (action.includes('create')) return '➕';
        return '📊';
    };

    const formatActivityTime = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            
            const minutes = Math.floor(diff / (1000 * 60));
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            if (minutes < 60) {
                return `${minutes} minutes ago`;
            } else if (hours < 24) {
                return `${hours} hours ago`;
            } else if (days < 7) {
                return `${days} days ago`;
            } else {
                return date.toLocaleDateString('en-US');
            }
        } catch {
            return 'Unknown';
        }
    };

    return (
        <div className={`min-h-screen w-full bg-gradient-to-br p-2 sm:p-4 lg:p-6 ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
            {/* Header */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <Link href="/" className={`text-xs sm:text-sm lg:text-base transition-colors ${theme === 'dark' ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}>
                            ← Back to Home
                        </Link>
                        <h1 className={`text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                            User Panel
                        </h1>
                    </div>
                    <div className="flex items-center">
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                            User
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-4 sm:mb-6">
                <div className={`flex w-full backdrop-blur-sm rounded-lg sm:rounded-xl p-1 shadow-lg ${theme === 'dark' ? 'bg-slate-800/80' : 'bg-white/80'}`}>
                    {[
                        { id: 'profile', name: 'Profile', icon: '👤' },
                        { id: 'activity', name: 'Activity', icon: '📊' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-2 sm:px-4 rounded-md sm:rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm ${
                                activeTab === tab.id
                                    ? "bg-blue-600 text-white shadow-lg"
                                    : theme === 'dark' 
                                        ? "text-gray-300 hover:text-gray-100 hover:bg-slate-700"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            }`}
                        >
                            <span className="text-sm sm:text-base">{tab.icon}</span>
                            <span className="text-xs sm:text-sm">{tab.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="w-full">
                {activeTab === 'profile' && (
                    <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white/20'} backdrop-blur-sm rounded-xl shadow-xl border p-3 sm:p-4 lg:p-6`}>
                        <h3 className={`text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 lg:mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                            Profile Information
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                            <div className="space-y-3 sm:space-y-4">
                                <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-lg sm:text-xl lg:text-2xl">👤</span>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Full Name</p>
                                        <p className={`font-semibold text-sm sm:text-base truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{userData.name}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-lg sm:text-xl lg:text-2xl">📧</span>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Email</p>
                                        <p className={`font-semibold text-sm sm:text-base truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{userData.email}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-lg sm:text-xl lg:text-2xl">📱</span>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Phone</p>
                                        <p className={`font-semibold text-sm sm:text-base truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{userData.phone || 'Not specified'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 sm:space-y-4">
                                <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-lg sm:text-xl lg:text-2xl">🏢</span>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Department</p>
                                        <p className={`font-semibold text-sm sm:text-base truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{userData.department}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-lg sm:text-xl lg:text-2xl">🎯</span>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Role</p>
                                        <p className={`font-semibold text-sm sm:text-base truncate ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{userData.role}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-lg sm:text-xl lg:text-2xl">📊</span>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Status</p>
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                            userData.status === 'active' 
                                                ? (theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                                                : (theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
                                        }`}>
                                            {userData.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white/20'} backdrop-blur-sm rounded-xl shadow-xl border p-3 sm:p-4 lg:p-6`}>
                        <h3 className={`text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 lg:mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                            My Recent Activities
                        </h3>
                        
                        {loadingActivities ? (
                            <div className="flex items-center justify-center py-6 sm:py-8">
                                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                                <span className={`ml-2 sm:ml-3 text-sm sm:text-base ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Loading activities...
                                </span>
                            </div>
                        ) : activities.length > 0 ? (
                            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                                {activities.map((activity, index) => (
                                    <div key={activity.id || index} className={`border rounded-lg p-2 sm:p-3 lg:p-4 transition-colors ${theme === 'dark' ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <span className="text-base sm:text-lg lg:text-xl flex-shrink-0 mt-0.5">
                                                {getActivityIcon(activity.action || '')}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold text-sm sm:text-base mb-1 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                                                    {activity.action || 'Unknown activity'}
                                                </p>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                    <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {formatActivityTime(activity.created_at)}
                                                    </p>
                                                    {activity.user_name && (
                                                        <>
                                                            <span className={`hidden sm:inline text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
                                                            <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                {activity.user_name}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 sm:py-8 lg:py-12">
                                <div className="text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4">📊</div>
                                <h4 className={`text-base sm:text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                                    No Activities Yet
                                </h4>
                                <p className={`text-xs sm:text-sm px-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Your activities will appear here when you start using the system.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const UserPage: React.FC = () => {
    const isLoggedIn = useSelector(selectIsLoggedIn);
    return (
        <div>
            {!isLoggedIn ? (
                <div className="flex justify-center items-start my-8">
                    <div className="w-full max-w-md">
                        <LoginForm />
                    </div>
                </div>
            ) : (
                <UserPageContent />
            )}
        </div>
    );
};

export default UserPage;