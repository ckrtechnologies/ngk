import { useSelector } from 'react-redux';
import { Bell, Search, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { adminUser } = useSelector((state) => state.admin);

  return (
    <header className="h-20 glassmorphism px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-slate-200/50">
      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-slate-100/60 px-4 py-2.5 rounded-2xl w-96 border border-slate-200/60 focus-within:border-brand-red focus-within:bg-white focus-within:shadow-premium focus-within:ring-4 focus-within:ring-brand-red/5 transition-all duration-200">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search global records, users, enquiries..."
          className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 w-full placeholder:text-slate-400"
        />
      </div>

      {/* Right User Profile & Badges */}
      <div className="flex items-center gap-6">
        <button className="relative p-2.5 rounded-2xl bg-slate-100/80 hover:bg-rose-50 hover:text-brand-red text-slate-600 transition-all duration-200 border border-transparent hover:border-rose-100/50">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-red rounded-full ring-2 ring-white animate-pulse"></span>
        </button>

        <div className="h-6 w-[1px] bg-slate-200/80"></div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-xs font-extrabold text-slate-900 leading-none">{adminUser?.name || 'Super Admin'}</span>
            <span className="text-[10px] font-bold text-brand-red uppercase tracking-wider mt-1">{adminUser?.role || 'Administrator'}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-red to-rose-500 flex items-center justify-center text-white shadow-lg shadow-brand-red/20 ring-2 ring-rose-50">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
