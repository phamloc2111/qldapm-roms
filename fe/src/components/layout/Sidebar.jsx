import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ListChecks, User, LayoutGrid } from 'lucide-react';
import { useRoms } from '../../context/RomsContext';
import { TABLE_STATUS } from '../../utils/constants';

export default function Sidebar() {
  const { tables, selectedTable } = useRoms();
  const location = useLocation();

  const readyDishesCount = tables.reduce(
    (sum, t) => sum + (t.status === TABLE_STATUS.READY_TO_SERVE ? t.badgeCount : 0),
    0
  );

  const isMenuPage = location.pathname.startsWith('/menu');

  const navItems = [
    {
      to: '/tables',
      label: 'Sơ đồ bàn',
      icon: Home,
      exact: true,
    },
    ...(isMenuPage
      ? [
          {
            to: `/menu/${selectedTable?.id || 'T4'}`,
            label: 'Thực đơn',
            icon: LayoutGrid,
          },
        ]
      : []),
    {
      to: '/tracking',
      label: 'Theo dõi món',
      icon: ListChecks,
      badge: readyDishesCount > 0 ? readyDishesCount : null,
    },
    {
      to: '/profile',
      label: 'Cá nhân',
      icon: User,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] w-28 lg:w-56 shrink-0 bg-white py-6 px-3 lg:px-4 select-none shadow-2xs">
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group relative flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3.5 px-3 lg:px-4 py-3 rounded-2xl font-semibold text-xs lg:text-sm transition-all ${
                  isActive
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5 shrink-0" />
                {item.badge && (
                  <span className="lg:hidden absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-center lg:text-left leading-tight">{item.label}</span>
              {item.badge && (
                <span className="hidden lg:inline-flex ml-auto px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
