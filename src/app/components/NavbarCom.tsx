'use client'
import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { toggleTheme } from "../redux/sliceses/themeSlice";
import { logout } from "../redux/sliceses/authSlices";
import { broadcastLogout } from "../utils/broadcastChannel";
import Image from "next/image";

const NavbarList = [
    { name: "Dashboard", href: "/", icon: "📊", svgIcon: "/dashboard.svg", requiresAuth: true, adminOnly: false },
    { name: "Transactions", href: "/transactions", icon: "📋", svgIcon: "/transactions.svg", requiresAuth: true, adminOnly: false },
    { name: "Revenue Calculation", href: "/revenue", icon: "💰", svgIcon: "/revenue-calculator.svg", requiresAuth: true, adminOnly: true },
    { name: "Transaction Types", href: "/transaction-categories", icon: "🏷️", svgIcon: "/transaction-types.svg", requiresAuth: true, adminOnly: true },
    { name: "Vehicles", href: "/vehicles", icon: "🚗", svgIcon: "/vehicles.svg", requiresAuth: true, adminOnly: false },
    { name: "Personnel", href: "/personnel", icon: "👥", svgIcon: "/personnels.svg", requiresAuth: true, adminOnly: true }
]

interface NavbarComProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NavbarCom: React.FC<NavbarComProps> = ({ isOpen, setIsOpen }) => {
    const router = useRouter();
    const pathname = usePathname();
    const theme = useSelector((state: RootState) => state.theme.theme);
    const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
    const user = useSelector((state: RootState) => state.auth.user);
    const dispatch = useDispatch();

    const toggleSidebar = () => setIsOpen((prev) => !prev);
    const visibleItems = NavbarList.filter(item => !(item.adminOnly && user?.role !== 'manager'));

    const loggedIn = () => {
        router.push('/auth');
        setIsOpen(false);
    }

    const loggedOut = async () => {
        try {
            // Remove token from localStorage
            localStorage.removeItem('token');
            dispatch(logout()); // Clear Redux state
            
            // Send logout message to other tabs
            broadcastLogout();
            
            router.push('/auth');
            setIsOpen(false);
        } catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, clear localStorage and Redux state
            localStorage.removeItem('token');
            dispatch(logout());
            
            // Send logout message to other tabs
            broadcastLogout();
            
            router.push('/auth');
        }
    }

    return (
        <>
            {/* Desktop Sidebar */}
            <nav
                className={`hidden lg:flex shadow-lg h-screen fixed left-0 top-0 z-50 overflow-y-auto border-r transition-all duration-300
                    ${isOpen ? 'w-64 max-w-xs min-w-[200px] p-4 flex flex-col items-center justify-between' : 'w-[72px] px-0 py-2 flex flex-col items-center justify-between'}
                    ${theme === 'dark' ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700' : 'bg-red-700 border-red-600'}
                `}
            >
                <div className="w-full flex flex-col justify-between h-full">
                    <div>
                        {/* Toggle Button */}
                        <div className="flex items-center justify-between mb-4 px-2">
                            <button
                                onClick={toggleSidebar}
                                className={`rounded-lg text-lg font-medium transition-colors duration-200 shadow-sm border flex items-center justify-center
                                    ${theme === 'dark'
                                        ? 'text-gray-200 bg-slate-700 border-slate-600 hover:bg-slate-600 hover:text-white hover:border-slate-500'
                                        : 'text-white bg-red-500 border-red-400 hover:bg-red-600 hover:text-white hover:border-red-500'}
                                    ${isOpen ? 'p-2 h-10' : 'h-12 w-12 p-0 mx-auto'}
                                `}
                                aria-label={isOpen ? 'Collapse Menu' : 'Expand Menu'}
                            >
                                {isOpen ? <span className="text-lg">«</span> : <span className="text-xl">»</span>}
                            </button>
                            {isOpen && (
                                <div className="flex items-center space-x-4">
                                    <Image
                                        src="/logo2025 (2).png"
                                        alt="Autapex Logo"
                                        width={130}
                                        height={65}
                                        className="object-contain"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col space-y-2 w-full px-2">
                            {isLoggedIn && NavbarList.map((item, index) => {
                                // Hide adminOnly pages for non-admin users
                                if (item.adminOnly && user?.role !== 'manager') {
                                    return null;
                                }
                                
                                return (
                                    <Link
                                        href={item.href}
                                        className={`text-sm font-medium rounded-lg border flex items-center group transition-all duration-300
                                            ${theme === 'dark'
                                                ? 'text-gray-200 bg-slate-700 border-slate-600 hover:bg-slate-600 hover:text-white hover:border-slate-500'
                                                : 'text-white bg-red-500 border-red-400 hover:bg-red-600 hover:text-white hover:border-red-500'}
                                            ${isOpen ? 'p-2 justify-start w-full' : 'h-12 w-12 justify-center items-center p-0 mx-auto'}
                                        `}
                                        key={index}
                                    >
                                        <span className={`text-xl${isOpen ? ' mr-2' : ''}`}>{item.icon}</span>
                                        {isOpen && (
                                            <span className="group-hover:scale-105 transition-transform duration-200">
                                                {item.name}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                            {/* Role-based buttons (only if logged in) */}
                            {isLoggedIn && isOpen && (
                                <div className="flex flex-col space-y-2 mt-2">
                                    {user?.role === 'manager' && (
                                        <Link
                                            href="/auth/adminPage"
                                            className={`text-sm font-semibold rounded-lg border flex items-center justify-center transition-all duration-300
                                                ${theme === 'dark'
                                                    ? 'text-white bg-gradient-to-r from-autapex-700 to-autapex-800 border-autapex-700 hover:from-autapex-800 hover:to-autapex-900 hover:border-autapex-800 hover:shadow-lg'
                                                    : 'text-white bg-gradient-to-r from-green-600 to-green-700 border-green-500 hover:from-green-700 hover:to-green-800 hover:border-green-600 hover:shadow-lg'}
                                                transform hover:scale-105 active:scale-95 w-full p-2`}
                                        >
                                            <span className="text-lg mr-2">👤</span> Admin
                                        </Link>
                                    )}
                                    {user?.role === 'personnel' && (
                                        <Link
                                            href="/auth/userPage"
                                            className={`text-sm font-semibold rounded-lg border flex items-center justify-center transition-all duration-300
                                                ${theme === 'dark'
                                                    ? 'text-white bg-gradient-to-r from-autapex-600 to-autapex-700 border-autapex-600 hover:from-autapex-700 hover:to-autapex-800 hover:border-autapex-700 hover:shadow-lg'
                                                    : 'text-white bg-gradient-to-r from-red-500 to-red-600 border-red-400 hover:from-red-600 hover:to-red-700 hover:border-red-500 hover:shadow-lg'}
                                                transform hover:scale-105 active:scale-95 w-full p-2`}
                                        >
                                            <span className="text-lg mr-2">👨‍💼</span> User
                                        </Link>
                                    )}
                                </div>
                            )}
                            {/* Logout/Login buttons */}
                            {isLoggedIn ? (
                                isOpen ? (
                                    <button
                                        onClick={loggedOut}
                                        className={`text-sm font-semibold rounded-lg border flex items-center justify-center transition-all duration-300
                                        ${theme === 'dark'
                                            ? 'text-white bg-gradient-to-r from-red-700 to-red-800 border-red-700 hover:from-red-800 hover:to-red-900 hover:border-red-800 hover:shadow-lg'
                                            : 'text-white bg-gradient-to-r from-red-900 to-red-950 border-red-800 hover:from-red-950 hover:to-red-950 hover:border-red-900 hover:shadow-lg'}
                                        transform hover:scale-105 active:scale-95 w-full p-2`}
                                    >
                                        Logout
                                    </button>
                                ) : (
                                    <button
                                        onClick={loggedOut}
                                        className={`text-sm font-semibold rounded-lg border flex items-center justify-center transition-all duration-300
                                        ${theme === 'dark'
                                            ? 'text-white bg-gradient-to-r from-red-700 to-red-800 border-red-700 hover:from-red-800 hover:to-red-900 hover:border-red-800 hover:shadow-lg'
                                            : 'text-white bg-gradient-to-r from-red-900 to-red-950 border-red-800 hover:from-red-950 hover:to-red-950 hover:border-red-900 hover:shadow-lg'}
                                        transform hover:scale-105 active:scale-95 h-12 w-12 p-0 mx-auto`}
                                    >
                                        <span className="text-xl">🚪</span>
                                    </button>
                                )
                            ) : (
                                isOpen ? (
                                    <button
                                        onClick={loggedIn}
                                        className={`text-sm font-semibold rounded-lg border flex items-center justify-center transition-all duration-300
                                        ${theme === 'dark'
                                            ? 'text-white bg-gradient-to-r from-autapex-600 to-autapex-700 border-autapex-600 hover:from-autapex-700 hover:to-autapex-800 hover:border-autapex-700 hover:shadow-lg'
                                            : 'text-white bg-gradient-to-r from-red-500 to-red-600 border-red-400 hover:from-red-600 hover:to-red-700 hover:border-red-500 hover:shadow-lg'}
                                        transform hover:scale-105 active:scale-95 w-full p-2`}
                                    >
                                        Login
                                    </button>
                                ) : (
                                    <button
                                        onClick={loggedIn}
                                        className={`text-sm font-semibold rounded-lg border flex items-center justify-center transition-all duration-300
                                        ${theme === 'dark'
                                            ? 'text-white bg-gradient-to-r from-autapex-600 to-autapex-700 border-autapex-600 hover:from-autapex-700 hover:to-autapex-800 hover:border-autapex-700 hover:shadow-lg'
                                            : 'text-white bg-gradient-to-r from-red-500 to-red-600 border-red-400 hover:from-red-600 hover:to-red-700 hover:border-red-500 hover:shadow-lg'}
                                        transform hover:scale-105 active:scale-95 h-12 w-12 p-0 mx-auto`}
                                    >
                                        <span className="text-xl">🔓</span>
                                    </button>
                                )
                            )}
                            
                            {/* Theme Toggle Button */}
                            <div className="mt-4">
                                <button
                                    onClick={() => dispatch(toggleTheme())}
                                    className={`w-full p-2 rounded-lg border flex items-center justify-center transition-all duration-300 ${
                                        theme === 'dark'
                                            ? 'text-gray-200 bg-slate-700 border-slate-600 hover:bg-slate-600 hover:text-white hover:border-slate-500'
                                            : 'text-white bg-red-500 border-red-400 hover:bg-red-600 hover:text-white hover:border-red-500'
                                    }`}
                                    aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                >
                                    <span className={`text-xl${isOpen ? ' mr-2' : ''}`}>
                                        {theme === 'dark' ? '☀️' : '🌙'}
                                    </span>
                                    {isOpen && (
                                        <span className="font-medium">
                                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            {isLoggedIn && (
                <nav className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 shadow-lg border-t ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-red-700 border-red-600'}`}>
                    <div className="grid gap-1 px-2 py-2 h-18 items-center" style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}>
                        {visibleItems.map((item, index) => {
                            const isActive = pathname === item.href;
                            
                            return (
                                <Link
                                    href={item.href}
                                    className={`flex items-center justify-center h-14 w-full rounded-lg transition-all duration-300 transform ${
                                        isActive 
                                            ? theme === 'dark'
                                                ? 'bg-slate-700 scale-105 shadow-lg'
                                                : 'bg-red-600 scale-105 shadow-lg'
                                            : theme === 'dark' 
                                                ? 'hover:bg-slate-700 active:scale-95'
                                                : 'hover:bg-red-600 active:scale-95'
                                    } hover:scale-105`}
                                    key={index}
                                    title={item.name}
                                >
                                    <Image
                                        src={item.svgIcon}
                                        alt={item.name}
                                        width={28}
                                        height={28}
                                        className={`object-contain transition-all duration-300 ${
                                            theme === 'dark' 
                                                ? 'brightness-0 invert' 
                                                : 'brightness-0 invert'
                                        } ${isActive ? 'scale-110' : ''}`}
                                    />
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}

            {/* Mobile Header */}
            <div className={`lg:hidden fixed top-0 left-0 right-0 z-40 px-2 py-2 shadow-sm border-b h-14 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-red-700 border-red-600'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Image
                            src="/logo2025 (2).png"
                            alt="Autapex Logo"
                            width={80}
                            height={40}
                            className="object-contain"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => dispatch(toggleTheme())}
                            className={`p-2 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-red-600'}`}
                        >
                            <span className="text-lg">{theme === 'dark' ? '☀️' : '🌙'}</span>
                        </button>
                        {isLoggedIn && user?.role === 'manager' && (
                            <Link
                                href="/auth/adminPage"
                                className={`flex items-center space-x-1 p-2 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-red-600'}`}
                            >
                                <span className="text-lg">👤</span>
                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-white'}`}>Admin</span>
                            </Link>
                        )}
                        {isLoggedIn && user?.role === 'personnel' && (
                            <Link
                                href="/auth/userPage"
                                className={`flex items-center space-x-1 p-2 rounded-lg transition-all duration-200 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-red-600'}`}
                            >
                                <span className="text-lg">👨‍💼</span>
                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-white'}`}>User</span>
                            </Link>
                        )}
                        {/* Mobile Logout Button */}
                        {isLoggedIn && (
                            <button
                                onClick={loggedOut}
                                className={`flex items-center space-x-1 p-2 rounded-lg transition-all duration-200 ${
                                    theme === 'dark' 
                                        ? 'hover:bg-red-700 bg-red-600/20 border border-red-500/30' 
                                        : 'hover:bg-red-800 bg-red-600/20 border border-red-400/30'
                                }`}
                                title="Logout"
                            >
                                <span className="text-lg">🚪</span>
                                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-red-200' : 'text-red-100'}`}>Logout</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default NavbarCom;
