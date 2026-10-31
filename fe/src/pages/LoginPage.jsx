import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, AlertCircle, LogIn } from 'lucide-react';
import { useRoms } from '../context/RomsContext';

export default function LoginPage() {
  const { login } = useRoms();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const result = login(username, password);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    if (result.user?.role === 'KITCHEN') {
      navigate('/kitchen', { replace: true });
    } else {
      navigate('/tables', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-orange-500 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo & Tên hệ thống ROMS nổi bật trên nền cam */}
        <div className="flex items-center justify-center gap-3 mb-8 select-none">
          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-orange-500 shadow-md">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 3C6.34315 3 5 4.567 5 6.5C5 8.1549 5.98404 9.54167 7.3 9.9035V21H8.7V9.9035C10.016 9.54167 11 8.1549 11 6.5C11 4.567 9.65685 3 8 3Z"
                fill="currentColor"
              />
              <path
                d="M15 3V8C15 9.10457 15.8954 10 17 10V21H18.5V10C19.6046 10 20.5 9.10457 20.5 8V3H19.2V7.2H18.3V3H17.2V7.2H16.3V3H15Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-white">
            ROMS
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-white/95 text-rose-600 text-xs sm:text-sm font-semibold animate-fade-in"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Ô nhập tài khoản */}
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="block text-sm font-bold text-white"
            >
              Tên đăng nhập
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                autoComplete="username"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border-0 outline-none focus:outline-none focus:ring-0 text-slate-900 text-sm font-medium transition-all"
              />
            </div>
          </div>

          {/* Ô nhập mật khẩu */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-bold text-white"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage('');
                }}
                autoComplete="current-password"
                className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-white border-0 outline-none focus:outline-none focus:ring-0 text-slate-900 text-sm font-medium transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer border-0"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Nút Đăng nhập màu trắng nổi bật */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-orange-50 active:scale-[0.99] text-orange-600 font-extrabold text-sm sm:text-base border-0 outline-none shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogIn className="w-5 h-5" />
              <span>Đăng nhập</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
