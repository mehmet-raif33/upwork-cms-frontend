"use client"
import React, { useState } from "react";
import { useSelector } from "react-redux";
import { selectIsLoggedIn } from "../redux/sliceses/authSlices";
import { api } from '@/lib/api-endpoints';

interface TestResults {
  dailyProfit?: unknown;
  dailyProfitError?: unknown;
  weeklyProfit?: unknown;
  weeklyProfitError?: unknown;
  monthlyProfit?: unknown;
  monthlyProfitError?: unknown;
  yearlyProfit?: unknown;
  yearlyProfitError?: unknown;
  dailyRevenue?: unknown;
  dailyRevenueError?: unknown;
  weeklyRevenue?: unknown;
  weeklyRevenueError?: unknown;
  monthlyRevenue?: unknown;
  monthlyRevenueError?: unknown;
  yearlyRevenue?: unknown;
  yearlyRevenueError?: unknown;
}

export default function TestApisPage() {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResults>({});

  if (!isLoggedIn) {
    return <div className="p-4">Please login</div>;
  }

  const testDailyProfit = async () => {
    setLoading(true);
    try {
      const response = await api.profit.getDailyProfit('2024-01-15');
      setResults(prev => ({ ...prev, dailyProfit: response }));
      console.log('✅ Daily Profit:', response);
    } catch (error) {
      console.error('❌ Daily Profit Error:', error);
      setResults(prev => ({ ...prev, dailyProfitError: error }));
    }
    setLoading(false);
  };

  const testWeeklyProfit = async () => {
    setLoading(true);
    try {
      const response = await api.profit.getWeeklyProfit(2024, 3);
      setResults(prev => ({ ...prev, weeklyProfit: response }));
      console.log('✅ Weekly Profit:', response);
    } catch (error) {
      console.error('❌ Weekly Profit Error:', error);
      setResults(prev => ({ ...prev, weeklyProfitError: error }));
    }
    setLoading(false);
  };

  const testMonthlyProfit = async () => {
    setLoading(true);
    try {
      const response = await api.profit.getMonthlyProfit(2024, 1);
      setResults(prev => ({ ...prev, monthlyProfit: response }));
      console.log('✅ Monthly Profit:', response);
    } catch (error) {
      console.error('❌ Monthly Profit Error:', error);
      setResults(prev => ({ ...prev, monthlyProfitError: error }));
    }
    setLoading(false);
  };

  const testYearlyProfit = async () => {
    setLoading(true);
    try {
      const response = await api.profit.getYearlyProfit(2024);
      setResults(prev => ({ ...prev, yearlyProfit: response }));
      console.log('✅ Yearly Profit:', response);
    } catch (error) {
      console.error('❌ Yearly Profit Error:', error);
      setResults(prev => ({ ...prev, yearlyProfitError: error }));
    }
    setLoading(false);
  };

  const testDailyRevenue = async () => {
    setLoading(true);
    try {
      const response = await api.revenue.getDailyRevenue('2024-01-15');
      setResults(prev => ({ ...prev, dailyRevenue: response }));
      console.log('✅ Daily Revenue:', response);
    } catch (error) {
      console.error('❌ Daily Revenue Error:', error);
      setResults(prev => ({ ...prev, dailyRevenueError: error }));
    }
    setLoading(false);
  };

  const testWeeklyRevenue = async () => {
    setLoading(true);
    try {
      const response = await api.revenue.getWeeklyRevenue(2024, 3);
      setResults(prev => ({ ...prev, weeklyRevenue: response }));
      console.log('✅ Weekly Revenue:', response);
    } catch (error) {
      console.error('❌ Weekly Revenue Error:', error);
      setResults(prev => ({ ...prev, weeklyRevenueError: error }));
    }
    setLoading(false);
  };

  const testMonthlyRevenue = async () => {
    setLoading(true);
    try {
      const response = await api.revenue.getMonthlyRevenue(2024, 1);
      setResults(prev => ({ ...prev, monthlyRevenue: response }));
      console.log('✅ Monthly Revenue:', response);
    } catch (error) {
      console.error('❌ Monthly Revenue Error:', error);
      setResults(prev => ({ ...prev, monthlyRevenueError: error }));
    }
    setLoading(false);
  };

  const testYearlyRevenue = async () => {
    setLoading(true);
    try {
      const response = await api.revenue.getYearlyRevenue(2024);
      setResults(prev => ({ ...prev, yearlyRevenue: response }));
      console.log('✅ Yearly Revenue:', response);
    } catch (error) {
      console.error('❌ Yearly Revenue Error:', error);
      setResults(prev => ({ ...prev, yearlyRevenueError: error }));
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 API Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profit API Tests */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-800">📊 Kar (Profit) API Testleri</h2>
          <div className="space-y-2">
            <button 
              onClick={testDailyProfit}
              disabled={loading}
              className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Daily Profit Test (2024-01-15)
            </button>
            <button 
              onClick={testWeeklyProfit}
              disabled={loading}
              className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Weekly Profit Test (2024, Week 3)
            </button>
            <button 
              onClick={testMonthlyProfit}
              disabled={loading}
              className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Monthly Profit Test (2024-01)
            </button>
            <button 
              onClick={testYearlyProfit}
              disabled={loading}
              className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              Yearly Profit Test (2024)
            </button>
          </div>
        </div>

        {/* Revenue API Tests */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">💰 Ciro (Revenue) API Testleri</h2>
          <div className="space-y-2">
            <button 
              onClick={testDailyRevenue}
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Daily Revenue Test (2024-01-15)
            </button>
            <button 
              onClick={testWeeklyRevenue}
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Weekly Revenue Test (2024, Week 3)
            </button>
            <button 
              onClick={testMonthlyRevenue}
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Monthly Revenue Test (2024-01)
            </button>
            <button 
              onClick={testYearlyRevenue}
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Yearly Revenue Test (2024)
            </button>
          </div>
        </div>
      </div>

      {/* Results Display */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">📋 Test Results</h2>
        {loading && (
          <div className="bg-yellow-100 p-4 rounded-lg">
            <p className="text-yellow-800">⏳ API call in progress...</p>
          </div>
        )}
        
        {Object.keys(results).length > 0 && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* API Endpoints Info */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🔗 Yeni API Endpoint&apos;leri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-green-700">Kar (Profit) API&apos;leri:</strong>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li>• <code>GET /profit/daily?date=2024-01-15</code></li>
              <li>• <code>GET /profit/weekly?year=2024&week=3</code></li>
              <li>• <code>GET /profit/monthly?year=2024&month=1</code></li>
              <li>• <code>GET /profit/yearly?year=2024</code></li>
            </ul>
          </div>
          <div>
            <strong className="text-blue-700">Ciro (Revenue) API&apos;leri:</strong>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li>• <code>GET /revenue/daily?date=2024-01-15</code></li>
              <li>• <code>GET /revenue/weekly?year=2024&week=3</code></li>
              <li>• <code>GET /revenue/monthly?year=2024&month=1</code></li>
              <li>• <code>GET /revenue/yearly?year=2024</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 