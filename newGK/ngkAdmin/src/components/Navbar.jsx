import React from 'react';
import { useSelector } from 'react-redux';
import { Bell, Search, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { adminUser } = useSelector((state) => state.admin);

  return (
    <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-gray-100 px-4 py-2.5 rounded-2xl w-96 border border-gray-200/80 focus-within:border-[#C6122E] focus-within:bg-white focus-within:shadow-md transition-all duration-200">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search global records, users, enquiries..."
          className="bg-transparent border-none outline-none text-sm font-semibold text-gray-800 w-full placeholder:text-gray-400"
        />
      </div>

      {/* Right User Profile & Badges */}
      <div className="flex items-center gap-6">
        <button className="relative p-2.5 rounded-full bg-gray-100 hover:bg-red-50 hover:text-[#C6122E] text-gray-600 transition-colors duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#C6122E] rounded-full ring-2 ring-white animate-pulse"></span>
        </button>

        <div className="h-8 w-[1px] bg-gray-200"></div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-black text-gray-900 leading-none">{adminUser?.name || 'Super Admin'}</span>
            <span className="text-xs font-bold text-[#C6122E] uppercase tracking-wider mt-1">{adminUser?.role || 'Administrator'}</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#C6122E] to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30 ring-2 ring-red-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
