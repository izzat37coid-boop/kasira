
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Store, 
  Users, 
  BarChart3, 
  ShoppingCart,
  TrendingUp,
  Zap,
  ArrowUpRight,
  MoreHorizontal,
  Bell,
  Search
} from 'lucide-react';

const LandingDashboardPreview: React.FC = () => {
  return (
    <div className="w-full bg-slate-100 rounded-[2rem] shadow-2xl border-4 border-white/10 overflow-hidden flex h-[580px] text-slate-800 font-sans">
      {/* Sidebar Mockup */}
      <aside className="w-60 bg-white border-r border-slate-200 p-8 flex flex-col gap-8 hidden md:flex">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20">K</div>
          <span className="font-bold text-lg tracking-tight text-slate-900">KASIRA</span>
        </div>
        
        <nav className="flex-1 space-y-1.5">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', active: true },
            { icon: Package, label: 'Produk' },
            { icon: Store, label: 'Cabang' },
            { icon: Users, label: 'Kasir' },
            { icon: BarChart3, label: 'Laporan' },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-3.5 px-5 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 ${item.active ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50'}`}>
              <item.icon size={18} />
              {item.label}
            </div>
          ))}
        </nav>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
           <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Plan</p>
           <p className="text-xs font-bold text-blue-600">Pro Enterprise</p>
        </div>
      </aside>

      {/* Main Content Mockup */}
      <main className="flex-1 flex flex-col bg-slate-50/50">
        {/* Header Mockup */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Dashboard Owner</h2>
            <p className="text-xs text-slate-400 font-medium">Monitoring performa bisnis hari ini</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
               <Bell size={18} />
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
               <div className="text-right">
                  <p className="text-xs font-bold text-slate-900">Budi Hartono</p>
                  <p className="text-[10px] font-medium text-slate-400">Owner</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">B</div>
            </div>
          </div>
        </header>

        {/* Content Body Mockup */}
        <div className="p-8 overflow-y-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Penjualan', val: 'Rp 12.5M', color: 'blue', icon: TrendingUp, change: '+12.5%' },
              { label: 'Transaksi', val: '124', color: 'emerald', icon: ShoppingCart, change: '+8%' },
              { label: 'Produk Aktif', val: '86', color: 'indigo', icon: Package, change: '0' },
              { label: 'Cabang Aktif', val: '3', color: 'rose', icon: Store, change: '+1' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center`}>
                    <stat.icon size={18} />
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${stat.change.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    {stat.change}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-1">{stat.val}</h4>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Chart Visual */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                   <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Grafik Penjualan 7 Hari</h3>
                   <p className="text-[10px] text-slate-400 font-medium">Data harian agregat</p>
                </div>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Zap size={16} />
                </div>
              </div>
              <div className="flex items-end justify-between h-40 gap-3 relative z-10 px-2">
                {[45, 65, 40, 85, 70, 95, 60].map((h, i) => (
                  <div key={i} className="flex-1 bg-slate-50 rounded-xl relative group overflow-hidden h-full">
                    <div 
                      className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-xl transition-all duration-1000 ease-out shadow-lg shadow-blue-500/10" 
                      style={{ height: `${h}%` }}
                    ></div>
                    <div className="absolute inset-0 bg-blue-600/0 hover:bg-blue-600/5 transition-colors cursor-pointer"></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-6 px-2">
                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
                  <span key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</span>
                ))}
              </div>
            </div>

            {/* Recent Orders List */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Transaksi Terakhir</h3>
                 <MoreHorizontal size={16} className="text-slate-300" />
              </div>
              <div className="space-y-6 flex-1">
                {[
                  { id: '#TX-812', branch: 'Pusat', total: 'Rp 250k', status: 'Paid', time: '14:20' },
                  { id: '#TX-811', branch: 'Bandung', total: 'Rp 1.2jt', status: 'Paid', time: '13:55' },
                  { id: '#TX-810', branch: 'Jakarta', total: 'Rp 85k', status: 'Pending', time: '12:10' },
                ].map((tx, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                       <div>
                         <p className="text-sm font-semibold text-slate-900">{tx.id}</p>
                         <p className="text-[10px] text-slate-400 font-medium">{tx.branch} • {tx.time}</p>
                       </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{tx.total}</p>
                      <span className={`text-[8px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-lg ${tx.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-8 py-3 bg-slate-50 rounded-xl text-[10px] font-semibold text-slate-400 uppercase tracking-widest hover:bg-slate-100 hover:text-blue-600 transition-all">Lihat Semua Laporan</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingDashboardPreview;
