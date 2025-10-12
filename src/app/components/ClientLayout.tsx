"use client";
import React, { useState, useEffect } from "react";
import NavbarCom from "./NavbarCom";
import { ThemeFAB } from "./ThemeEffect";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div className="flex-1 min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <>
      <NavbarCom isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      {/* Sidebar açıkken arka planı karartan overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <ThemeFAB />
      <main className={`flex-1 w-full transition-all duration-300 ml-0 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-[72px]'}`}>
        {children}
      </main>
    </>
  );
} 