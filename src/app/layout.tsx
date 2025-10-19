import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; 
import AppLayoutClient from "./AppLayoutClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  
});

export const metadata: Metadata = {
  title: "Autapex - Business Management System",
  description: "Record your vehicle transactions, calculate revenue, and manage your business with Autapex",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-white dark:bg-slate-900`} suppressHydrationWarning>
        <AppLayoutClient>{children}</AppLayoutClient>
      </body>
    </html>
  );
}
