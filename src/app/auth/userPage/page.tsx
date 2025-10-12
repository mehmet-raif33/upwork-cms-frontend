"use client";
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import LoginForm from "../LoginForm";
import { selectIsLoggedIn } from "../../redux/sliceses/authSlices";

const UserPageContent: React.FC = () => {
    const theme = useSelector((state: RootState) => state.theme.theme);
    const [activeTab, setActiveTab] = useState('profile');
    const searchParams = useSearchParams();
    const [userData, setUserData] = useState({
        name: 'Ahmet Yılmaz',
        email: 'ahmet@ulas.com',
        role: 'Sürücü',
        department: 'Lojistik',
        phone: '+90 532 123 4567',
        status: 'active',
        lastLogin: '2024-02-20 14:30',
        permissions: ['vehicle_view', 'trip_log', 'maintenance_report'],
        assignedTasks: [
            { id: 1, title: 'İstanbul-Ankara seferi', status: 'active', dueDate: '2024-02-25', priority: 'high' },
            { id: 2, title: 'Araç bakım kontrolü', status: 'pending', dueDate: '2024-02-28', priority: 'medium' },
            { id: 3, title: 'Yakıt raporu hazırlama', status: 'completed', dueDate: '2024-02-20', priority: 'low' }
        ],
        joinDate: '2023-03-15',
        vehicleAssigned: '34 ABC 123 - Mercedes Sprinter'
    });

    // URL parametrelerinden kullanıcı verilerini al
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
                name: decodeURIComponent(name),
                email: decodeURIComponent(email),
                role: decodeURIComponent(role),
                department: decodeURIComponent(department),
                phone: decodeURIComponent(phone),
                status: decodeURIComponent(status),
                lastLogin: new Date().toLocaleString('tr-TR'),
                joinDate: new Date().toLocaleDateString('tr-TR'),
                // Kullanıcı ID'sine göre farklı görevler ve yetkiler
                permissions: id === '1' ? ['vehicle_view', 'trip_log', 'maintenance_report'] :
                           id === '2' ? ['vehicle_view', 'trip_log'] :
                           id === '3' ? ['vehicle_view', 'maintenance_report'] :
                           id === '4' ? ['vehicle_view', 'trip_log', 'maintenance_report', 'admin_panel'] :
                           ['vehicle_view'],
                assignedTasks: id === '1' ? [
                    { id: 1, title: 'İstanbul-Ankara seferi', status: 'active', dueDate: '2024-02-25', priority: 'high' },
                    { id: 2, title: 'Araç bakım kontrolü', status: 'pending', dueDate: '2024-02-28', priority: 'medium' }
                ] : id === '2' ? [
                    { id: 3, title: 'İzmir-İstanbul seferi', status: 'active', dueDate: '2024-02-26', priority: 'high' },
                    { id: 4, title: 'Yakıt raporu', status: 'completed', dueDate: '2024-02-20', priority: 'low' }
                ] : id === '3' ? [
                    { id: 5, title: 'Operasyon planlaması', status: 'active', dueDate: '2024-02-27', priority: 'medium' }
                ] : id === '4' ? [
                    { id: 6, title: 'Yönetim raporu', status: 'pending', dueDate: '2024-03-01', priority: 'high' }
                ] : [
                    { id: 7, title: 'Genel görev', status: 'active', dueDate: '2024-02-30', priority: 'low' }
                ]
            }));
        }
    }, [searchParams]);

    const getTaskStatusColor = (status: string) => {
        if (theme === 'dark') {
            if (status === 'active') return 'bg-blue-900 text-blue-200';
            if (status === 'pending') return 'bg-yellow-900 text-yellow-200';
            if (status === 'completed') return 'bg-green-900 text-green-200';
        }
        if (status === 'active') return 'bg-blue-100 text-blue-800';
        if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
        if (status === 'completed') return 'bg-green-100 text-green-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getTaskStatusText = (status: string) => {
        const texts = {
            active: 'Aktif',
            pending: 'Beklemede',
            completed: 'Tamamlandı'
        };
        return texts[status as keyof typeof texts] || status;
    };

    const getPriorityColor = (priority: string) => {
        if (theme === 'dark') {
            if (priority === 'high') return 'text-red-400';
            if (priority === 'medium') return 'text-yellow-400';
            if (priority === 'low') return 'text-green-400';
        }
        if (priority === 'high') return 'text-red-600';
        if (priority === 'medium') return 'text-yellow-600';
        if (priority === 'low') return 'text-green-600';
        return 'text-gray-600';
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br p-4 sm:p-6 ${theme === 'dark' ? 'from-slate-900 to-blue-950' : 'from-slate-50 to-blue-50'}`}>
            {/* Header */}
            <div className="mb-6 sm:mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        <Link href="/" className={`transition-colors text-sm sm:text-base ${theme === 'dark' ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'}`}>← Ana Sayfaya Dön</Link>
                        <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Kullanıcı Paneli</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${theme === 'dark' ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                            Kullanıcı
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className={`flex flex-wrap sm:flex-nowrap gap-1 backdrop-blur-sm rounded-lg sm:rounded-xl p-1 shadow-lg ${theme === 'dark' ? 'bg-slate-800/80' : 'bg-white/80'}`}>
                    {[
                        { id: 'profile', name: 'Profil', icon: '👤' },
                        { id: 'tasks', name: 'Görevler', icon: '📋' },
                        { id: 'permissions', name: 'Yetkiler', icon: '🔐' },
                        { id: 'activity', name: 'Aktivite', icon: '📊' }
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
                            <span className="hidden sm:inline">{tab.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
                {activeTab === 'profile' && (
                    <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white/20'} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border p-4 sm:p-6`}>
                        <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Profil Bilgileri</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-4">
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-2xl">👤</span>
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Ad Soyad</p>
                                        <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{userData.name}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-2xl">📧</span>
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>E-posta</p>
                                        <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{userData.email}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-2xl">📱</span>
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Telefon</p>
                                        <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{userData.phone}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-2xl">🏢</span>
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Departman</p>
                                        <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{userData.department}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-2xl">🎯</span>
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Rol</p>
                                        <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{userData.role}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-2xl">🚗</span>
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Atanan Araç</p>
                                        <p className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{userData.vehicleAssigned}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                    <span className="text-2xl">📊</span>
                                    <div>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Durum</p>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            userData.status === 'active' 
                                                ? (theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                                                : (theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800')
                                        }`}>
                                            {userData.status === 'active' ? 'Aktif' : 'Pasif'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white/20'} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border p-4 sm:p-6`}>
                        <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Atanan Görevler</h3>
                        <div className="space-y-3 sm:space-y-4">
                            {userData.assignedTasks.map((task) => (
                                <div key={task.id} className={`border rounded-lg sm:rounded-xl p-3 sm:p-4 transition-colors ${theme === 'dark' ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <h4 className={`font-semibold text-sm sm:text-base mb-1 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{task.title}</h4>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                                                    {getTaskStatusText(task.status)}
                                                </span>
                                                <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                    {task.priority === 'high' && '🔴 Yüksek'}
                                                    {task.priority === 'medium' && '🟡 Orta'}
                                                    {task.priority === 'low' && '🟢 Düşük'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Bitiş Tarihi</p>
                                            <p className={`font-medium text-sm ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                                                {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button className={`text-xs px-3 py-1 rounded-lg transition-colors ${theme === 'dark' ? 'bg-blue-900 text-blue-200 hover:bg-blue-800' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                                            Detaylar
                                        </button>
                                        {task.status === 'active' && (
                                            <button className={`text-xs px-3 py-1 rounded-lg transition-colors ${theme === 'dark' ? 'bg-green-900 text-green-200 hover:bg-green-800' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                                Tamamla
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'permissions' && (
                    <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white/20'} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border p-4 sm:p-6`}>
                        <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Yetkiler</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                            {userData.permissions.map((permission, index) => (
                                <div key={index} className={`flex items-center gap-2 p-3 rounded-lg ${theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-50'}`}>
                                    <span className="text-blue-600 text-sm sm:text-base">✓</span>
                                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                                        {permission === 'vehicle_view' && 'Araç Görüntüleme'}
                                        {permission === 'trip_log' && 'Sefer Kaydı'}
                                        {permission === 'maintenance_report' && 'Bakım Raporu'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                            <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Yetki Açıklamaları</h4>
                            <ul className={`text-sm space-y-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                                <li>• Araç Görüntüleme: Atanan araçların detaylarını görüntüleyebilir</li>
                                <li>• Sefer Kaydı: Yapılan seferleri kayıt altına alabilir</li>
                                <li>• Bakım Raporu: Araç bakım raporları oluşturabilir</li>
                            </ul>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className={`${theme === 'dark' ? 'bg-slate-800/80 border-slate-700' : 'bg-white/80 border-white/20'} backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border p-4 sm:p-6`}>
                        <h3 className={`text-lg sm:text-xl font-bold mb-4 sm:mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Son Aktiviteler</h3>
                        <div className="space-y-3 sm:space-y-4">
                            {[
                                { action: 'İstanbul-Ankara seferi tamamlandı', time: '2 saat önce', type: 'trip' },
                                { action: 'Araç bakım raporu gönderildi', time: '1 gün önce', type: 'maintenance' },
                                { action: 'Yakıt alımı yapıldı', time: '2 gün önce', type: 'fuel' },
                                { action: 'Görev tamamlandı', time: '3 gün önce', type: 'task' }
                            ].map((activity, index) => (
                                <div key={index} className={`border rounded-lg sm:rounded-xl p-3 sm:p-4 transition-colors ${theme === 'dark' ? 'border-slate-600 hover:bg-slate-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl sm:text-2xl">
                                            {activity.type === 'trip' && '🚗'}
                                            {activity.type === 'maintenance' && '🔧'}
                                            {activity.type === 'fuel' && '⛽'}
                                            {activity.type === 'task' && '✅'}
                                        </span>
                                        <div className="flex-1">
                                            <p className={`font-semibold text-sm sm:text-base ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>{activity.action}</p>
                                            <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{activity.time}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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