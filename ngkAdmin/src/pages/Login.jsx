import { useState } from 'react';
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
    <div className="min-h-screen w-full bg-[#090A0E] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-red/10 rounded-full blur-[130px] pointer-events-none animate-glow-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/5 rounded-full blur-[110px] pointer-events-none"></div>

      <div className="w-full max-w-md glassmorphism-dark rounded-3xl p-10 shadow-2xl relative z-10 animate-scale-up border border-white/5">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-gradient-to-tr from-brand-red to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-red/25 ring-4 ring-brand-red/10">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide uppercase">NGK ADMIN</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Enterprise Command Center</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 text-rose-400 animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                className="w-full h-14 bg-white/[0.04] border border-white/5 rounded-2xl pl-12 pr-4 text-white font-semibold text-sm focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10 transition-all duration-200 placeholder:text-gray-500"
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
                className="w-full h-14 bg-white/[0.04] border border-white/5 rounded-2xl pl-12 pr-4 text-white font-semibold text-sm focus:border-brand-red focus:outline-none focus:ring-4 focus:ring-brand-red/10 transition-all duration-200 placeholder:text-gray-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-gradient-to-r from-brand-red to-brand-red-hover hover:from-brand-red-hover hover:to-brand-red-dark disabled:opacity-50 text-white rounded-2xl font-extrabold text-xs tracking-widest uppercase shadow-lg shadow-brand-red/20 transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-[0.98]"
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
        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-[9px] font-semibold text-gray-500 tracking-widest uppercase">
            Authorized Enterprise Personnel Only • NGK Spark Plugs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
