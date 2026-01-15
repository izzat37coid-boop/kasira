
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import { User, FinancialStats, Transaction, BranchPerformance, Product } from '../../types';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { 
  TrendingUp, 
  ShoppingBag, 
  Wallet, 
  RefreshCw,
  Zap,
  Sparkles,
  BrainCircuit,
  Lightbulb,
  Clock,
  ArrowRight,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface Props { user: User; onLogout: () => void; }

const TypewriterText: React.FC<{ text: string }> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text.charAt(index));
        setIndex(prev => prev + 1);
      }, 10);
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return <p className="text-sm font-medium leading-relaxed opacity-95 whitespace-pre-line">{displayedText}</p>;
};

const OwnerDashboard: React.FC<Props> = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(true);
  // Fixed initialization to include all required fields of FinancialStats interface
  const [stats, setStats] = useState<FinancialStats>({ 
    revenue: 0, 
    cogs: 0, 
    grossProfit: 0,
    netProfit: 0, 
    totalDiscount: 0,
    totalTax: 0,
    orderCount: 0 
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('7d');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [branchPerf, setBranchPerf] = useState<BranchPerformance[]>([]);

  useEffect(() => {
    fetchData();

    const ownerChannel = realtime.privateChannel(`owner.${user.id}`);
    ownerChannel.listen('TransactionCreated', (tx: Transaction) => {
      // Fixed setStats update logic to calculate and include all required FinancialStats fields
      setStats(prev => {
        const itemCogs = tx.items.reduce((acc, i) => acc + (i.cost_snapshot * i.quantity), 0);
        const newRevenue = prev.revenue + tx.subtotal;
        const newCogs = prev.cogs + itemCogs;
        const newDiscount = prev.totalDiscount + (tx.discount || 0);
        const newTax = prev.totalTax + (tx.tax || 0);
        const newGrossProfit = newRevenue - newCogs;
        const newNetProfit = newGrossProfit - newDiscount;

        return {
          revenue: newRevenue,
          cogs: newCogs,
          grossProfit: newGrossProfit,
          netProfit: newNetProfit,
          totalDiscount: newDiscount,
          totalTax: newTax,
          orderCount: prev.orderCount + 1
        };
      });
      // Silent refresh for the chart to keep it real-time
      fetchData(false);
    });

    return () => realtime.stopListening(`owner.${user.id}`, 'TransactionCreated');
  }, [filterType]);

  useEffect(() => {
    if (!loading && stats.orderCount > 0) {
      fetchAIInsight();
    }
  }, [loading, filterType]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    let startDate = '';
    const now = new Date();
    if (filterType === '7d') startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    else if (filterType === '30d') startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    else startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString();

    const [report, prods, perf] = await Promise.all([
      api.getFinancialReport({ ownerId: user.id, startDate }),
      api.getProducts(),
      api.getBranchComparison(user.id, startDate)
    ]);

    setStats(report.stats);
    setProducts(prods);
    setBranchPerf(perf);

    const dailyData: any = {};
    report.transactions.forEach(t => {
      const day = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      dailyData[day] = (dailyData[day] || 0) + t.total;
    });

    setChartData(Object.entries(dailyData).map(([name, sales]) => ({ name, sales })));
    if (showLoading) setLoading(false);
  };

  const fetchAIInsight = async () => {
    setAiLoading(true);
    const insight = await api.getAIAnalysis({
      stats,
      products,
      branches: branchPerf,
      period: filterType === '7d' ? '7 Hari Terakhir' : (filterType === '30d' ? '1 Bulan Terakhir' : '1 Tahun Terakhir')
    });
    setAiInsight(insight);
    setAiLoading(false);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Ringkasan Bisnis</h1>
             <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] font-bold uppercase tracking-widest">Real-time Dashboard</span>
             </div>
          </div>
          <p className="text-slate-500 font-medium text-sm">Monitor performa keuangan dan operasional Anda.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
          {['7d', '30d', '1y'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all ${filterType === t ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {t === '7d' ? '7 Hari' : t === '30d' ? '1 Bulan' : '1 Tahun'}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Penjualan', value: stats.revenue, icon: ShoppingBag, color: 'blue' },
          { label: 'Modal (HPP)', value: stats.cogs, icon: Wallet, color: 'rose' },
          { label: 'Laba Bersih', value: stats.netProfit, icon: TrendingUp, color: 'emerald' },
          { label: 'Transaksi Sukses', value: stats.orderCount, icon: Zap, color: 'indigo', noCurrency: true },
        ].map((item, i) => (
          <div key={i} className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
             <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center`}>
                   <item.icon size={22} />
                </div>
             </div>
             <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                {item.noCurrency ? item.value : `Rp ${item.value.toLocaleString()}`}
             </h3>
             <p className="text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>

      {/* AI Business Consultant Panel */}
      <div className="group relative overflow-hidden bg-slate-900 rounded-[3rem] mb-10 shadow-2xl shadow-blue-500/20 border border-white/5 p-1">
         <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
         
         <div className="relative bg-slate-950 rounded-[2.9rem] p-8 md:p-10 overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none transform rotate-12 scale-150">
               <BrainCircuit size={200} />
            </div>

            <div className="flex flex-col lg:flex-row gap-10 relative z-10">
               <div className="lg:w-1/3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-2xl text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-6">
                     <Sparkles size={14} className="animate-pulse" /> KASIRA AI Business Consultant
                  </div>
                  <h3 className="text-3xl font-black text-white leading-tight mb-4 tracking-tighter">Insight & Strategi <br/><span className="text-blue-500 italic">Pintar Hari Ini</span></h3>
                  <p className="text-slate-500 text-sm font-medium mb-8">Rekomendasi otomatis berbasis data riil penjualan dan stok Anda.</p>
                  
                  <div className="flex items-center gap-3 text-slate-600">
                     <Clock size={14} />
                     <span className="text-[10px] font-bold uppercase tracking-widest">Analisis Terakhir: {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
               </div>

               <div className="lg:w-2/3">
                  <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 min-h-[250px] shadow-inner relative flex flex-col">
                     <div className="flex-1 text-blue-50">
                        {aiLoading ? (
                          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-10">
                             <div className="relative">
                                <RefreshCw size={40} className="animate-spin text-blue-500" />
                                <Zap size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                             </div>
                             <div>
                                <p className="text-sm font-black uppercase tracking-[0.3em] text-blue-500">Menganalisis Data</p>
                                <p className="text-xs text-slate-500 font-medium mt-1 italic">Menghitung probabilitas bisnis...</p>
                             </div>
                          </div>
                        ) : (
                          <div className="animate-live-in">
                             {aiInsight ? (
                               <TypewriterText text={aiInsight} />
                             ) : (
                               <div className="flex flex-col items-center justify-center h-full py-10 text-slate-500">
                                  <Lightbulb size={48} className="mb-4 opacity-20" />
                                  <p className="font-bold italic">Hubungkan data untuk memulai analisis.</p>
                               </div>
                             )}
                          </div>
                        )}
                     </div>
                     
                     <div className="mt-8 pt-6 border-t border-white/5 flex justify-end items-center">
                        <button 
                          onClick={fetchAIInsight} 
                          disabled={aiLoading}
                          className="group flex items-center gap-3 bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
                        >
                           <RefreshCw size={14} className={aiLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'} />
                           Refresh Analisis
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Grafik Penjualan Real-time Section */}
      <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-10">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                 <Activity size={20} />
              </div>
              <div>
                 <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">Grafik Penjualan Real-time</h3>
                 <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Visualisasi Pendapatan Harian</p>
              </div>
           </div>
           <button onClick={() => fetchData(true)} className="text-slate-300 hover:text-blue-600 transition-colors p-2">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
           </button>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '600'}} 
                dy={15} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '600'}} 
              />
              <Tooltip 
                contentStyle={{backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                itemStyle={{color: '#3b82f6', fontWeight: '700', fontSize: '12px'}}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                name="Penjualan"
                stroke="#3b82f6" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorSales)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
};

export default OwnerDashboard;
