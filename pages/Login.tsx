
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, AlertCircle, Sparkles, Clock, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { User, Role, AccountStatus } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{msg: string, type: 'error' | 'warning' | 'expired'} | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await api.login(email);
      if (user) {
        // Validation Logic
        if (user.status === AccountStatus.EXPIRED) {
          setError({ msg: 'Masa aktif paket KASIRA Anda telah berakhir. Silakan lakukan perpanjangan.', type: 'expired' });
          setLoading(false);
          return;
        }

        onLogin(user);
        if (user.role === Role.OWNER) navigate('/owner');
        else navigate('/kasir');
      } else {
        setError({ msg: 'Akun tidak ditemukan. Silakan daftarkan akun bisnis Anda terlebih dahulu di KASIRA.', type: 'error' });
      }
    } catch (err) {
      setError({ msg: 'Gagal menghubungkan ke database.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 selection:bg-blue-600 font-sans">
      <div className="w-full max-w-md flex flex-col min-h-[500px]">
        <Link to="/" className="inline-flex items-center gap-3 text-slate-500 hover:text-white mb-10 transition-all group font-semibold uppercase tracking-widest text-[10px]">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        
        <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden flex-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[50px] -z-10 rounded-full"></div>
          
          <div className="mb-10 text-center">
            <div className="inline-flex p-3 bg-blue-600/10 text-blue-500 rounded-2xl mb-6">
               <Sparkles size={24} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Login Kasira</h1>
            <p className="text-slate-500 font-medium text-sm">Masuk ke terminal bisnis KASIRA Anda.</p>
          </div>

          {error && (
            <div className={`border p-4 rounded-xl mb-8 flex gap-3 items-start animate-fade-in ${
              error.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 
              error.type === 'expired' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              {error.type === 'error' && <ShieldAlert size={18} className="shrink-0 mt-0.5" />}
              {error.type === 'expired' && <Clock size={18} className="shrink-0 mt-0.5" />}
              <p className="text-xs font-semibold leading-relaxed">{error.msg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 ml-1">Email KASIRA</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-700 outline-none"
                  placeholder="owner@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-700 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Masuk Dashboard'}
            </button>
          </form>

          <p className="mt-10 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-600">
            Belum punya akun? <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">Daftar Sekarang</Link>
          </p>
        </div>
        
        <div className="mt-12 text-center">
          <div className="text-slate-700 text-[10px] font-semibold uppercase tracking-widest">
            © 2026 KASIRA Digital Indonesia.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
