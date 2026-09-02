import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Users,
  MessageSquareText,
  Search,
  Store,
  LogOut,
  ShieldCheck,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { logout } from '../redux/adminSlice';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { enquiries } = useSelector((state) => state.admin);

  const pendingEnquiriesCount = (enquiries || []).filter(
    (e) => (e.status || '').toLowerCase() === 'pending'
  ).length;

  const handleLogout = () => {
    dispatch(logout());
  };

  const navItems = [
    {
      name: 'User Management',
      path: '/users',
      icon: Users,
      badge: null,
      description: 'Accounts & Roles',
    },
    {
      name: 'Enquiries',
      path: '/enquiries',
      icon: MessageSquareText,
      badge: pendingEnquiriesCount > 0 ? pendingEnquiriesCount : null,
      description: 'Support & Tickets',
    },
    {
      name: 'Part Finder',
      path: '/parts',
      icon: Search,
      badge: null,
      description: 'TecDoc Pegasus 3.0',
    },
    {
      name: 'Dealers Directory',
      path: '/dealers',
      icon: Store,
      badge: null,
      description: 'Reseller Network',
    },
  ];

  return (
    <aside className="w-58 bg-[#090D16] text-white flex flex-col h-screen fixed left-0 top-0 z-30 shadow-2xl border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800/80 bg-slate-950/40 justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center font-black text-white text-xs tracking-wider shadow-md shadow-brand-red/30 ring-1 ring-white/20">
            NGK
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs tracking-wider text-white">COMMAND</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-xs bg-slate-800 text-slate-300">
                PRO
              </span>
            </div>
            <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase block">
              Enterprise Admin
            </span>
          </div>
        </div>
      </div>



      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto dark-scroll">
        <p className="px-3 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mb-2">
          Management
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg font-bold text-xs tracking-tight transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-brand-red text-white shadow-sm shadow-brand-red/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span>{item.name}</span>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                        isActive
                          ? 'bg-white text-brand-red font-black'
                          : 'bg-brand-red text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Session Info & Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-rose-950/40 border border-slate-700/60 hover:border-brand-red/40 text-slate-300 hover:text-rose-300 font-bold text-[11px] tracking-wider uppercase transition-all duration-150 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
