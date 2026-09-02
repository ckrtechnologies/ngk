import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-[#090D16] flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-brand-red/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-sm bg-[#111624] border border-slate-800/90 rounded-2xl p-7 shadow-2xl relative z-10 animate-scale-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-11 h-11 bg-brand-red rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-brand-red/30 ring-1 ring-white/20">
            <span className="text-white font-black text-sm tracking-wider">NGK</span>
          </div>
          <h1 className="text-lg font-black text-white tracking-wide uppercase">Command Center</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            Enterprise Fleet & Catalog Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 flex items-center gap-2 text-rose-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span className="text-xs font-bold">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Admin Email
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ngk.com"
                className="w-full h-10 bg-slate-900/80 border border-slate-700/80 rounded-lg pl-9 pr-3 text-white font-medium text-xs focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red placeholder:text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 bg-slate-900/80 border border-slate-700/80 rounded-lg pl-9 pr-3 text-white font-medium text-xs focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red placeholder:text-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-brand-red hover:bg-brand-red-hover active:bg-brand-red-dark disabled:opacity-50 text-white rounded-lg font-bold text-xs tracking-wider uppercase shadow-md shadow-brand-red/20 transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Access Command Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center border-t border-slate-800/80 pt-4">
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
            NGK Spark Plugs • Restricted Access
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
