import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ListChecks, User } from 'lucide-react';
import { useRoms } from '../../context/RomsContext';
import { TABLE_STATUS } from '../../data/mockData';

export default function MobileNav() {
  const { tables } = useRoms();

  const readyDishesCount = tables.reduce(
    (sum, t) => sum + (t.status === TABLE_STATUS.READY_TO_SERVE ? t.badgeCount : 0),
    0
  );

  const navItems = [
    {
      to: '/tables',
      label: 'Sơ đồ bàn',
      icon: Home,
    },
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
    <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 z-30 bg-white px-3 grid grid-cols-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center h-full font-semibold text-xs transition-colors ${
                isActive ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="mt-1">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 w-16 h-1 rounded-t-full bg-orange-500" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

