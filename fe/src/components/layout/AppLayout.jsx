import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import ToastBanner from '../common/ToastBanner';

export default function AppLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#FAF7F2] text-slate-800">
      <ToastBanner />
      <Header />
      <div className="flex-1 flex min-w-0 w-full items-start">
        <Sidebar />
        <main className="flex-1 min-w-0 w-full pb-28 md:pb-10">
          <div className="w-full max-w-7xl mx-auto p-3 sm:p-5 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
