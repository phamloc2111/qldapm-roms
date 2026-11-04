import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, LogOut } from 'lucide-react';
import { useRoms } from '../context/RomsContext';

export default function ProfilePage() {
  const { currentUser, logout } = useRoms();
  const navigate = useNavigate();

  const user = currentUser || {
    username: 'nguyenvana',
    roleDisplay: 'Phục vụ',
    avatarInitial: 'P',
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
        Thông tin cá nhân
      </h1>

      <div className="p-5 bg-[#FFF8F1] flex items-center gap-4 sm:gap-5">
        <div className="w-20 h-20 rounded-full bg-[#FFEAD5] text-orange-500 font-extrabold text-3xl flex items-center justify-center shrink-0">
          {user.avatarInitial}
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {user.username}
          </h2>
          <p className="text-sm sm:text-base font-bold text-orange-600 mt-0.5">
            {user.roleDisplay}
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        <div className="py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
            <User className="w-4 h-4 text-slate-400" />
            <span>Tên đăng nhập</span>
          </div>
          <span className="text-sm font-bold text-slate-900">
            {user.username}
          </span>
        </div>

        <div className="py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
            <Briefcase className="w-4 h-4 text-slate-400" />
            <span>Vai trò</span>
          </div>
          <span className="text-sm font-bold text-slate-900">
            {user.roleDisplay}
          </span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3.5 px-6 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
      >
        <LogOut className="w-5 h-5" />
        <span>Đăng xuất</span>
      </button>
    </div>
  );
}
