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
    <aside className="w-64 bg-brand-dark text-white flex flex-col h-screen fixed left-0 top-0 z-30 shadow-2xl border-r border-white/5">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-brand-red to-rose-500 p-2 rounded-xl shadow-lg shadow-brand-red/20">
            <span className="text-white font-extrabold text-lg tracking-wider px-1">NGK</span>
          </div>
          <div>
            <h1 className="font-black text-sm tracking-widest leading-none text-white">ADMIN PORTAL</h1>
            <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase block mt-1">ENTERPRISE SYSTEM</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto dark-scroll">
        <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Main Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 border-l-2 relative ${
                  isActive
                    ? 'bg-brand-red/10 text-white border-brand-red shadow-[inset_0_0_12px_rgba(225,29,72,0.08)] pl-5'
                    : 'text-gray-400 hover:bg-white/[0.03] hover:text-white border-transparent pl-4 hover:translate-x-0.5'
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
      <div className="p-4 border-t border-white/5 bg-black/20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/5 text-gray-400 hover:bg-brand-red/20 hover:text-white hover:border-brand-red/30 font-bold text-xs tracking-widest uppercase transition-all duration-200 group"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          Logout Session
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
