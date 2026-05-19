import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Users, FileText, Search, Store, LogOut } from 'lucide-react';
import { logout } from '../redux/adminSlice';

const Sidebar = () => {
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const navItems = [
    { name: 'User Management', path: '/users', icon: Users },
    { name: 'Enquiries Management', path: '/enquiries', icon: FileText },
    { name: 'Part Finder', path: '/parts', icon: Search },
    { name: 'Dealers Directory', path: '/dealers', icon: Store },
  ];

  return (
    <aside className="w-64 bg-[#111111] text-white flex flex-col h-screen fixed left-0 top-0 z-30 shadow-2xl border-r border-[#222222]">
      {/* Brand Header */}
      <div className="h-20 bg-[#C6122E] flex items-center px-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg shadow-md">
            <span className="text-[#C6122E] font-black text-xl tracking-wider">NGK</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wide leading-none">ADMIN PORTAL</h1>
            <span className="text-xs text-red-200 font-semibold tracking-wider">ENTERPRISE SYSTEM</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <p className="px-3 text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Main Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-[#C6122E] text-white shadow-lg shadow-red-900/40 translate-x-1'
                    : 'text-gray-400 hover:bg-[#222222] hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-[#222222] bg-[#0A0A0A]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#222222] text-gray-300 hover:bg-[#C6122E] hover:text-white font-bold text-sm tracking-wide transition-all duration-200 shadow-md group"
        >
          <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
          LOGOUT SESSION
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
