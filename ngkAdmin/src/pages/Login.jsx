import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { loginAdmin } from '../redux/adminSlice';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.admin);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginAdmin({ email, password }));
  };

  return (
    <div className="min-h-screen w-full bg-[#0D0D0D] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C6122E]/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#161616] border border-[#262626] rounded-3xl p-10 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#C6122E] to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-900/40 ring-4 ring-red-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-wide">NGK ADMIN PORTAL</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Enterprise Command Center</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-400 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs font-bold tracking-wide">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Admin Email</label>
            <div className="relative flex items-center">
              <Mail className="w-5 h-5 text-gray-500 absolute left-4" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ngk.com"
                className="w-full h-14 bg-[#222222] border border-[#333333] rounded-2xl pl-12 pr-4 text-white font-semibold text-sm focus:border-[#C6122E] focus:outline-none focus:ring-2 focus:ring-[#C6122E]/20 transition-all duration-200 placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-5 h-5 text-gray-500 absolute left-4" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 bg-[#222222] border border-[#333333] rounded-2xl pl-12 pr-4 text-white font-semibold text-sm focus:border-[#C6122E] focus:outline-none focus:ring-2 focus:ring-[#C6122E]/20 transition-all duration-200 placeholder:text-gray-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-[#C6122E] hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl shadow-red-900/40 transition-all duration-200 flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AUTHENTICATING...
              </>
            ) : (
              'ACCESS COMMAND CENTER'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center border-t border-[#262626] pt-6">
          <p className="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
            Authorized Enterprise Personnel Only • NGK Spark Plugs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
