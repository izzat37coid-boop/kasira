
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { User, BranchPerformance, Transaction } from '../../types';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Calendar, 
  RefreshCw, 
  Zap,
  ShoppingBag,
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react';

interface Props { user: User; onLogout: () => void; }

const BranchComparison: React.FC<Props> = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BranchPerformance[]>([]);
  const [filterType, setFilterType] = useState('7d');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  useEffect(() => {
    fetchData();

    // REAL-TIME LISTENER
    const ownerChannel = realtime.privateChannel(`owner.${user.id}`);
    ownerChannel.listen('TransactionCreated', (tx: Transaction) => {
      console.log('[Realtime Comparison] New TX detected:', tx.id);
      fetchData(); // Refetch comparison data when any branch has a transaction
    });

    return () => {
      realtime.stopListening(`owner.${user.id}`, 'TransactionCreated');
    };
  }, [filterType, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    const result = await api.getBranchComparison(
      user.id, 
      new Date(dateRange.start).toISOString(), 
      new Date(dateRange.end + 'T23:59:59').toISOString()
    );
    setData(result);
    setLoading(false);
  };

  const handleFilterChange = (type: string) => {
    setFilterType(type);
    const now = new Date();
    let start = new Date();
    if (type === 'today') start = new Date(now.setHours(0,0,0,0));
    else if (type === '7d') start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    else if (type === '1m') start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    });
  };

  const COLORS = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Performa Cabang</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Komparasi Profitabilitas Real-Time</p>
        </div>
        
        <div className="flex flex-wrap gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: '7d', label: '7 Hari' },
            { id: '1m', label: '1 Bulan' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => handleFilterChange(f.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterType === f.id ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {f.label}
            </button>
          ))}
          <div className="w-[1px] bg-slate-100 mx-2"></div>
          <div className="flex items-center gap-2">
             <Calendar size={16} className="text-slate-300" />
             <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="text-[10px] font-black uppercase tracking-widest outline-none bg-transparent" />
             <span className="text-slate-200">-</span>
             <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="text-[10px] font-black uppercase tracking-widest outline-none bg-transparent" />
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center flex flex-col items-center">
           <AlertCircle size={64} className="text-slate-200 mb-6" />
           <p className="text-xl font-black text-slate-400 italic">Belum ada cabang lain untuk dibandingkan.</p>
           <p className="text-slate-400 text-sm mt-2">Daftarkan cabang baru di menu "Cabang" untuk melihat analisis ini.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Charts Row */}
          <div className="grid lg:grid-cols-1 gap-8">
            <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl">
               <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-white italic tracking-tight uppercase">Komparasi Laba Bersih</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                    <Zap size={14} className="fill-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Live Engine Update</span>
                  </div>
               </div>
               <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
                      <XAxis dataKey="branchName" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: '900'}} dy={15} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: '900'}} />
                      <Tooltip 
                        cursor={{fill: '#ffffff05'}}
                        contentStyle={{backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b'}}
                        itemStyle={{fontWeight: '900'}}
                      />
                      <Legend iconType="circle" wrapperStyle={{paddingTop: '30px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}} />
                      <Bar dataKey="netProfit" name="Laba Bersih (Rp)" radius={[8, 8, 0, 0]}>
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                      <Bar dataKey="revenue" name="Omzet (Rp)" fill="#ffffff10" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>

          {/* Table Comparison */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-800 italic uppercase tracking-tighter">Matriks Performa Agregat</h3>
                <button onClick={fetchData} className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-blue-50 transition text-slate-400">
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
             </div>
             <table className="w-full text-left">
                <thead className="bg-slate-50/80 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                   <tr>
                      <th className="px-10 py-6">Nama Cabang</th>
                      <th className="px-10 py-6">Status</th>
                      <th className="px-10 py-6">Transaksi</th>
                      <th className="px-10 py-6">Omzet / Modal</th>
                      <th className="px-10 py-6">Laba (Kotor / Bersih)</th>
                      <th className="px-10 py-6">Best Seller</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {data.map((b, idx) => (
                     <tr key={b.branchId} className="hover:bg-slate-50 transition group">
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                                {b.branchName.charAt(0)}
                              </div>
                              <p className="font-black text-slate-800 text-sm tracking-tight">{b.branchName}</p>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             b.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 
                             b.trend === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                           }`}>
                             {b.trend === 'up' && <ArrowUpRight size={14} />}
                             {b.trend === 'down' && <ArrowDownRight size={14} />}
                             {b.trend === 'stable' && <Minus size={14} />}
                             {b.trend}
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <p className="font-black text-slate-800 flex items-center gap-2">
                             <Zap size={14} className="text-indigo-500 fill-indigo-500" /> {b.orderCount} <span className="text-[10px] text-slate-400 font-bold">Orders</span>
                           </p>
                        </td>
                        <td className="px-10 py-6">
                           <p className="font-black text-blue-600">Rp {b.revenue.toLocaleString()}</p>
                           <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic">Modal: Rp {b.cogs.toLocaleString()}</p>
                        </td>
                        <td className="px-10 py-6">
                           <p className="font-black text-slate-800">Rp {(b.revenue - b.cogs).toLocaleString()}</p>
                           <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1">
                             <TrendingUp size={12} /> Rp {b.netProfit.toLocaleString()}
                           </p>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 max-w-fit">
                              <Award size={14} className="fill-indigo-600" />
                              <span className="text-[10px] font-black uppercase tracking-widest truncate">{b.bestSeller}</span>
                           </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

          {/* Quick Insights Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center">
                  <ShoppingBag size={32} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Agregat Omzet</p>
                   <h4 className="text-2xl font-black text-slate-800 tracking-tighter italic">
                     Rp {data.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}
                   </h4>
                </div>
             </div>
             
             <div className="bg-emerald-600 p-10 rounded-[3rem] shadow-2xl shadow-emerald-600/20 text-white flex items-center gap-6 group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                <div className="w-16 h-16 bg-white/20 text-white rounded-[1.5rem] flex items-center justify-center relative z-10">
                  <TrendingUp size={32} />
                </div>
                <div className="relative z-10">
                   <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Total Laba Bersih</p>
                   <h4 className="text-2xl font-black tracking-tighter italic">
                     Rp {data.reduce((acc, curr) => acc + curr.netProfit, 0).toLocaleString()}
                   </h4>
                </div>
             </div>

             <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center">
                  <Zap size={32} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Transaksi / Cabang</p>
                   <h4 className="text-2xl font-black text-slate-800 tracking-tighter italic">
                     {(data.reduce((acc, curr) => acc + curr.orderCount, 0) / data.length).toFixed(1)} <span className="text-xs">Tx</span>
                   </h4>
                </div>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BranchComparison;
