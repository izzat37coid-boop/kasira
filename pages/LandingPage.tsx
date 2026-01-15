
// Fix: Removed testimonial images for a cleaner, more minimalist SaaS look
import React from 'react';
import { Link } from 'react-router-dom';
import LandingDashboardPreview from '../components/LandingDashboardPreview';
import { 
  CheckCircle2, 
  ShoppingBag, 
  BarChart, 
  Store, 
  UserCheck, 
  Package, 
  Zap,
  TrendingUp,
  LayoutDashboard,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Star
} from 'lucide-react';

const LandingPage: React.FC = () => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-blue-500 selection:text-white font-sans overflow-x-hidden">
      {/* Navbar - Sticky & Glassmorphism */}
      <nav className="fixed w-full z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl italic shadow-xl shadow-blue-600/30">K</div>
            <span className="text-xl font-bold">KASIRA</span>
          </div>
          <div className="hidden lg:flex gap-8 items-center font-medium text-sm">
            <button onClick={() => scrollTo('fitur')} className="text-slate-400 hover:text-blue-400 transition-colors">Fitur</button>
            <button onClick={() => scrollTo('harga')} className="text-slate-400 hover:text-blue-400 transition-colors">Harga</button>
            <button onClick={() => scrollTo('testimoni')} className="text-slate-400 hover:text-blue-400 transition-colors">Testimoni</button>
            <Link to="/login" className="px-5 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-all">Masuk</Link>
            <Link to="/register" className="bg-blue-600 px-6 py-2.5 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">Mulai Gratis</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-8 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[150px] -z-10 rounded-full"></div>
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-5 py-2 rounded-full text-xs font-semibold tracking-wide text-blue-400 mb-8">
            <Zap size={14} className="fill-blue-400" /> Sistem Kasir Cloud Terintegrasi
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.15]">
            Kelola Penjualan <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Lebih Cerdas & Cepat</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-normal leading-relaxed">
            Sistem kasir cloud dengan QRIS, stok real-time per cabang, dan laporan laba otomatis untuk akselerasi UMKM modern.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="bg-white text-slate-900 px-8 py-4 rounded-xl font-semibold text-base hover:bg-blue-600 hover:text-white transition-all shadow-xl group">
              Coba Gratis 7 Hari <ChevronRight className="inline ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button onClick={() => scrollTo('fitur')} className="bg-white/5 border border-white/10 px-8 py-4 rounded-xl font-semibold text-base hover:bg-white/10 transition-all backdrop-blur-md">
              Jelajahi Fitur
            </button>
          </div>
        </div>
        
        {/* Dashboard Preview Mockup */}
        <div className="max-w-6xl mx-auto mt-20 relative">
          <div className="absolute inset-0 bg-blue-600/20 blur-[100px] -z-10 rounded-full scale-75"></div>
          <div className="transition-transform duration-700">
             <LandingDashboardPreview />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="fitur" className="py-24 bg-slate-950 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold mb-5">Efisiensi Tanpa Batas</h2>
              <p className="text-slate-400 text-lg font-normal leading-relaxed">Semua yang Anda butuhkan untuk ekspansi bisnis dalam satu ekosistem cloud yang aman.</p>
            </div>
            <div className="text-blue-500 font-semibold uppercase tracking-widest text-[10px]">Features Overview</div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShoppingBag, title: 'POS Cepat & Handal', desc: 'Transaksi kurang dari 5 detik dengan antarmuka terminal POS yang didesain untuk kecepatan.' },
              { icon: Store, title: 'Multi Cabang', desc: 'Monitor puluhan cabang dari satu layar. Data stok dan transaksi terisolasi secara profesional.' },
              { icon: TrendingUp, title: 'Laporan Otomatis', desc: 'Grafik penjualan, laba kotor, dan laba bersih dihitung otomatis secara real-time dari database.' },
              { icon: Package, title: 'Stok Real-Time', desc: 'Sinkronisasi inventori otomatis setiap kali terjadi transaksi di terminal kasir cabang manapun.' },
              { icon: UserCheck, title: 'Multi Kasir', desc: 'Kelola hak akses karyawan dengan sistem RBAC (Role-Based Access Control) yang aman.' },
              { icon: CreditCard, title: 'Pembayaran Digital', desc: 'Dukungan penuh QRIS, Transfer Bank Indonesia, dan Tunai dalam satu sistem kasir.' },
            ].map((f, i) => (
              <div key={i} className="group p-8 bg-slate-900 border border-white/5 rounded-[2rem] hover:bg-blue-600/5 hover:border-blue-500/50 transition-all duration-500">
                <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                  <f.icon size={20} />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-slate-500 text-base leading-relaxed group-hover:text-slate-300 transition-colors">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="harga" className="py-24 px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Pilih Paket Bisnis Anda</h2>
            <p className="text-slate-500 font-medium text-sm">Hemat hingga 20% dengan sistem pembayaran tahunan.</p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8 items-end">
            {/* Package 1 */}
            <div className="p-10 bg-slate-800/50 border border-white/5 rounded-[2.5rem] backdrop-blur-md hover:bg-slate-800 transition-colors">
              <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">Free Trial</h3>
              <div className="flex items-baseline gap-1 mb-10">
                <span className="text-4xl font-bold">Rp 0</span>
                <span className="text-slate-500 font-medium text-xs">/ 7 Hari</span>
              </div>
              <div className="space-y-4 mb-10">
                {['1 Cabang Aktif', '1 Akun Kasir', 'Laporan Harian', 'Metode Tunai & QRIS'].map((t, i) => (
                  <div key={i} className="flex gap-3 items-center font-medium text-sm text-slate-400">
                    <ShieldCheck size={18} className="text-blue-500" /> {t}
                  </div>
                ))}
              </div>
              <Link to="/register" className="block text-center py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all">Daftar Sekarang</Link>
            </div>

            {/* Package 2 - Featured */}
            <div className="p-10 bg-blue-600 rounded-[2.5rem] shadow-2xl relative overflow-hidden transform lg:scale-105 z-10 border border-blue-400/20">
              <div className="absolute top-0 right-0 bg-white text-blue-600 px-4 py-1.5 font-bold text-[10px] uppercase tracking-wider rounded-bl-xl">⭐ Rekomendasi</div>
              <h3 className="text-xs font-semibold text-blue-100 uppercase tracking-widest mb-4">Paket Pro</h3>
              <div className="flex items-baseline gap-1 mb-10">
                <span className="text-4xl font-bold">Rp 199rb</span>
                <span className="text-blue-100 font-medium text-xs">/ Bulan</span>
              </div>
              <div className="space-y-4 mb-10">
                {['Hingga 5 Cabang', 'Hingga 10 Kasir', 'Laporan Laba/Rugi (CSV)', 'Dashboard Real-time', 'Multi-metode Pembayaran'].map((t, i) => (
                  <div key={i} className="flex gap-3 items-center font-medium text-sm text-white">
                    <CheckCircle2 size={18} className="text-white fill-white/10" /> {t}
                  </div>
                ))}
              </div>
              <Link to="/register" className="block text-center py-4 bg-white text-blue-600 rounded-xl font-bold text-sm hover:shadow-xl transition-all">Pilih Paket Pro</Link>
            </div>

            {/* Package 3 */}
            <div className="p-10 bg-slate-800/50 border border-white/5 rounded-[2.5rem] backdrop-blur-md hover:bg-slate-800 transition-colors">
              <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">Bisnis Tahunan</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold">Rp 1.9jt</span>
                <span className="text-slate-500 font-medium text-xs">/ Tahun</span>
              </div>
              <div className="flex gap-2 items-center mb-10">
                <span className="line-through text-slate-600 font-medium text-xs">Rp 2.4jt</span>
                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Diskon 20%</span>
              </div>
              <div className="space-y-4 mb-10">
                {['Cabang Tak Terbatas', 'Kasir Tak Terbatas', 'Premium Support 24/7', 'Branding Kostum PDF', 'Audit Log Lengkap'].map((t, i) => (
                  <div key={i} className="flex gap-3 items-center font-medium text-sm text-slate-400">
                    <ShieldCheck size={18} className="text-blue-500" /> {t}
                  </div>
                ))}
              </div>
              <Link to="/register" className="block text-center py-4 bg-white/5 border border-white/10 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all">Pilih Paket Bisnis</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className="py-24 px-8 bg-slate-950">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center mb-16 text-center">
             <div className="text-blue-500 font-semibold uppercase tracking-[0.3em] text-[10px] mb-4">User Feedback</div>
             <h2 className="text-4xl font-bold">Mitra yang Telah Berkembang</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Variel Sirait', role: 'Owner Kopi Seduhan', quote: 'KASIRA memudahkan saya memantau stok di 3 cabang berbeda secara real-time tanpa harus ke lokasi.' },
              { name: 'Muhammad Ridho', role: 'CEO Martabak Jaya', quote: 'Fitur QRIS-nya sangat membantu kecepatan transaksi saat jam sibuk. Customer jadi tidak perlu lama mengantri.' },
              { name: 'Reza Wiratama', role: 'Founder Retail Group', quote: 'Laporan keuangan KASIRA sangat akurat. Perhitungan laba kotor vs bersih membantu audit bulanan kami.' }
            ].map((t, i) => (
              <div key={i} className="p-8 bg-slate-900 border border-white/5 rounded-[2rem] group flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 text-blue-500 mb-6">
                    {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
                  </div>
                  <p className="text-slate-400 text-base font-normal leading-relaxed mb-8">"{t.quote}"</p>
                </div>
                <div className="flex flex-col">
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-1">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg italic">K</div>
              <span className="text-xl font-bold">KASIRA</span>
            </div>
            <p className="text-slate-500 font-medium text-xs tracking-wide text-center md:text-left">Solusi POS Pintar Untuk Indonesia Berkemajuan.</p>
          </div>
          <div className="flex gap-8 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors">Youtube</a>
          </div>
          <div className="text-slate-600 text-[10px] font-medium uppercase tracking-widest">
            © 2026 KASIRA Digital Indonesia.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
