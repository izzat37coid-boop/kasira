
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, Lock, CheckCircle2, QrCode, CreditCard, Sparkles, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { User, AccountStatus, PaymentRecord } from '../types';

interface RegisterProps {
  onRegister: (user: User) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: '',
    name: '',
    email: '',
    password: '',
    package: 'Trial',
    branches: 1,
    kasir: 1,
    payment: 'QRIS'
  });
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<PaymentRecord | null>(null);
  const navigate = useNavigate();

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.package === 'Trial') {
        const user = await api.registerTrial(formData);
        setSuccessMsg('✅ Akun berhasil dibuat. Anda sedang menggunakan Free Trial 7 Hari.');
        setShowSuccess(true);
        setTimeout(() => {
          onRegister(user);
          navigate('/owner');
        }, 3000);
      } else {
        // Init Midtrans Payment for Paid Packages
        const payment = await api.initiateRegistration(formData);
        setCurrentPayment(payment);
        setStep(2);
      }
    } catch (err) {
      alert('Gagal menghubungkan ke sistem KASIRA');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentPayment) return;
    setLoading(true);
    
    try {
      // Simulate Callback Verification
      const user = await api.handleRegistrationCallback(currentPayment.orderId, 'paid');
      if (user) {
        setSuccessMsg('✅ Pembayaran berhasil. Akun Pro Anda telah aktif sepenuhnya.');
        setShowSuccess(true);
        setTimeout(() => {
          onRegister(user);
          navigate('/owner');
        }, 3000);
      }
    } catch (err) {
      alert('Gagal memverifikasi pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 font-sans">
        <div className="bg-slate-900 border border-white/10 p-12 rounded-[3.5rem] shadow-2xl max-w-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600 animate-pulse"></div>
          <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Berhasil Terdaftar!</h1>
          <p className="text-slate-400 text-lg mb-8 font-medium">{successMsg}</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full transition-all duration-[3000ms] ease-linear" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 py-20 selection:bg-blue-500 font-sans">
      <div className="w-full max-w-3xl flex flex-col min-h-screen">
        <Link to="/" className="inline-flex items-center gap-3 text-slate-500 hover:text-white mb-10 transition-all group font-semibold uppercase tracking-widest text-[10px]">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Kembali ke Landing
        </Link>

        <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex-1">
          {formData.package !== 'Trial' && (
            <div className="flex bg-slate-800/30 p-6 border-b border-white/10">
              <div className={`flex-1 text-center py-4 font-semibold uppercase tracking-widest text-[10px] transition-all ${step === 1 ? 'text-blue-400' : 'text-slate-600'}`}>
                <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full mr-2 ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-500'}`}>1</span>
                Profil Bisnis
              </div>
              <div className={`flex-1 text-center py-4 font-semibold uppercase tracking-widest text-[10px] transition-all ${step === 2 ? 'text-blue-400' : 'text-slate-600'}`}>
                <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full mr-2 ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-500'}`}>2</span>
                Pembayaran Paket
              </div>
            </div>
          )}

          <div className="p-10">
            {step === 1 ? (
              <form onSubmit={handleInitialSubmit} className="space-y-6">
                <div className="text-center mb-10">
                   <h2 className="text-3xl font-bold text-white mb-2">Mulai Bisnis Pintar</h2>
                   <p className="text-slate-500 font-medium text-sm">Bergabung dengan ribuan UMKM modern di Indonesia.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 ml-1">Nama Usaha / Brand</label>
                    <div className="relative">
                      <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input
                        type="text" required value={formData.businessName}
                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                        className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-700 outline-none"
                        placeholder="Contoh: KASIRA Coffee"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 ml-1">Nama Owner</label>
                    <input
                      type="text" required value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 px-6 text-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-700 outline-none"
                      placeholder="Nama Lengkap"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 ml-1">Email Terdaftar</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="email" required value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-700 outline-none"
                      placeholder="owner@kasira.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="password" required value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 pl-14 pr-6 text-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-700 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 ml-1">Pilih Paket</label>
                    <select 
                      value={formData.package}
                      onChange={(e) => setFormData({...formData, package: e.target.value})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 px-6 text-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium outline-none cursor-pointer"
                    >
                      <option value="Trial">Free Trial 7 Hari (Langsung Aktif)</option>
                      <option value="Pro">Paket Pro (Bulanan - Rp 199rb)</option>
                      <option value="Bisnis">Paket Bisnis (Tahunan - Rp 1.9jt)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500 ml-1">Jumlah Cabang</label>
                    <input
                      type="number" min="1" value={formData.branches}
                      onChange={(e) => setFormData({...formData, branches: parseInt(e.target.value)})}
                      className="w-full bg-slate-800/50 border border-white/5 rounded-2xl py-3.5 px-6 text-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium outline-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest text-xs disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (formData.package === 'Trial' ? 'Daftar & Mulai Trial' : 'Lanjutkan ke Pembayaran')}
                </button>
              </form>
            ) : (
              <div className="space-y-10 animate-fade-in">
                <div className="text-center">
                   <h2 className="text-3xl font-bold text-white mb-2">Selesaikan Aktivasi</h2>
                   <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-4 py-1.5 rounded-xl text-blue-400 font-semibold text-[10px] uppercase tracking-wider mb-4">
                      <Zap size={12} /> Paket {formData.package} Terpilih
                   </div>
                   <p className="text-slate-500 font-medium text-sm">Silakan bayar tagihan untuk mengaktifkan akun Bisnis Anda.</p>
                </div>

                <div className="bg-slate-800/50 p-8 rounded-[2.5rem] border border-white/5 text-center">
                   <div className="mb-6 flex justify-between items-center text-left border-b border-white/5 pb-4">
                      <div>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Total Tagihan</p>
                        <p className="text-2xl font-bold text-white">Rp {currentPayment?.amount.toLocaleString()}</p>
                      </div>
                      <ShieldCheck className="text-emerald-500" size={32} />
                   </div>
                   
                   {currentPayment?.paymentType === 'qris' ? (
                     <div className="space-y-6">
                       <img src={currentPayment.qrisUrl} className="mx-auto rounded-[1.5rem] border-4 border-white p-2 shadow-2xl" alt="QRIS" />
                       <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold text-[10px] uppercase tracking-widest">
                          <Loader2 className="animate-spin" size={14} /> Scan Untuk Aktivasi Otomatis
                       </div>
                     </div>
                   ) : (
                     <div className="space-y-4 text-left">
                       <div className="p-6 bg-slate-900 rounded-[1.25rem] border border-white/5">
                         <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-1">{currentPayment?.bank} Virtual Account</p>
                         <p className="text-2xl font-bold tracking-widest text-blue-400">{currentPayment?.vaNumber}</p>
                       </div>
                       <p className="text-center text-[10px] text-slate-600 font-semibold uppercase tracking-widest pt-2 italic">Menunggu pembayaran terdeteksi sistem...</p>
                     </div>
                   )}
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 font-semibold text-slate-600 hover:text-white transition-all uppercase tracking-widest text-[10px]">Ganti Paket</button>
                  <button onClick={handleConfirmPayment} disabled={loading} className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Konfirmasi Pembayaran (Simulasi)'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-12 text-center pb-12">
          <div className="text-slate-700 text-[10px] font-semibold uppercase tracking-widest">
            © 2026 KASIRA Digital Indonesia.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
