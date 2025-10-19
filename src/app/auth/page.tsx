"use client";
import LoginForm from "./LoginForm";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import Image from "next/image";

const AuthPage = () => {
  const theme = useSelector((state: RootState) => state.theme.theme);

  return (
    <div className={`h-screen w-full overflow-hidden transition-all duration-300 ${theme === 'dark'
      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950'
      : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-indigo-100'
    } flex items-center justify-center`}>
      <div className="w-full max-w-md p-4 sm:p-8 mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo2025 (2).png"
              alt="Autapex Logo"
              width={240}
              height={120}
              className="object-contain"
            />
          </div>
          <h1 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Autapex
          </h1>
          <p className={`transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Automotive • Real Estate • Car Wash
          </p>
        </div>
        
        <LoginForm />
        
        <div className="text-center mt-6">
          <p className={`text-sm transition-colors duration-300 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Contact your administrator for system access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;