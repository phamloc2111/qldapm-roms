import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RomsLogo } from '../common/TableIcon';
import { useRoms } from '../../context/RomsContext';

export default function Header() {
  const {
    currentUser,
    notifications,
    markAllNotificationsRead,
    setSelectedTableId,
  } = useRoms();
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur px-4 lg:px-8 flex items-center justify-between shadow-2xs">
      <button
        onClick={() => navigate('/tables')}
        className="cursor-pointer focus:outline-none"
      >
        <RomsLogo size="md" />
      </button>

      <div className="flex items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setNotifOpen((prev) => !prev);
              if (!notifOpen) markAllNotificationsRead();
            }}
            className="relative p-2 rounded-xl text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
            aria-label="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-orange-500" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800">Thông báo</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.tableId) setSelectedTableId(item.tableId);
                      setNotifOpen(false);
                      navigate('/tracking');
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-orange-50/50 transition-colors flex items-start gap-3 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center shadow-sm shadow-orange-500/30 cursor-pointer"
          title="Cá nhân"
        >
          {currentUser?.avatarInitial || 'P'}
        </button>
      </div>
    </header>
  );
}
