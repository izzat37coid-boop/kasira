
import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout';
import { User, Transaction, FinancialStats, Branch, Product } from '../../types';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { 
  Download, 
  ArrowDownRight, 
  CheckCircle, 
  Search, 
  Store,
  RefreshCw,
  TrendingUp,
  Zap,
  ChevronDown,
  Info,
  Activity,
  Tag
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

const OwnerReports: React.FC<Props> = ({ user, onLogout }) => {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<FinancialStats>({ 
    revenue: 0, cogs: 0, grossProfit: 0, netProfit: 0, totalDiscount: 0, totalTax: 0, orderCount: 0 
  });
  const [chartData, setChartData] = useState<any[]>([]);
  
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('1m');
  const [dateRange, setDateRange] = useState({ 
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInitialData();
    const ownerChannel = realtime.privateChannel(`owner.${user.id}`);
    ownerChannel.listen('TransactionCreated', () => loadFinancialData());
    return () => realtime.stopListening(`owner.${user.id}`, 'TransactionCreated');
  }, []);

  useEffect(() => {
    loadFinancialData();
  }, [dateRange, filterBranch]);

  const loadInitialData = async () => {
    const b = await api.getBranches(user.id);
    setBranches(b);
  };

  const handlePeriodPreset = (preset: string) => {
    setFilterPeriod(preset);
    const now = new Date();
    let start = new Date();
    switch (preset) {
      case 'today': start = new Date(now.setHours(0,0,0,0)); break;
      case '7d': start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '1m': start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    }
    setDateRange({ start: start.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
  };

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const { transactions, stats: newStats } = await api.getFinancialReport({
        ownerId: user.id,
        branchId: filterBranch,
        startDate: dateRange.start + 'T00:00:00.000Z',
        endDate: dateRange.end + 'T23:59:59.999Z'
      });
      setTxs(transactions.reverse());
      setStats(newStats);

      const dailyMap: Record<string, any> = {};
      transactions.forEach(t => {
        const day = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        if (!dailyMap[day]) dailyMap[day] = { name: day, revenue: 0, profit: 0 };
        dailyMap[day].revenue += t.subtotal;
        dailyMap[day].profit += (t.subtotal - t.items.reduce((acc, i) => acc + (i.cost_snapshot * i.quantity), 0) - t.discount);
      });
      setChartData(Object.values(dailyMap));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Invoice', 'Tanggal', 'Revenue', 'HPP', 'Diskon', 'Laba Bersih', 'Tax(PPN)'];
    const rows = txs.map(t => {
      const hpp = t.items.reduce((acc, i) => acc + (i.cost_snapshot * i.quantity), 0);
      return [t.id, t.date, t.subtotal, hpp, t.discount, (t.subtotal - hpp - t.discount), t.tax];
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `KASIRA_Report_${dateRange.start}.csv`;
    link.click();
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Laporan Keuangan</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Audit Penjualan & Perhitungan Laba Akurat</p>
        </div>
        <button onClick={handleExport} className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-bold hover:bg-blue-600 transition shadow-xl">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-10 flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Periode</p>
           <div className="flex flex-wrap gap-2">
              {['today', '7d', '1m'].map(p => (
                <button key={p} onClick={() => handlePeriodPreset(p)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filterPeriod === p ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                  {p === 'today' ? 'Hari Ini' : p === '7d' ? '7 Hari' : '1 Bulan'}
                </button>
              ))}
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <input type="date" className="bg-transparent outline-none text-[10px] font-black" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                <span className="text-slate-300">-</span>
                <input type="date" className="bg-transparent outline-none text-[10px] font-black" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
              </div>
           </div>
        </div>

        <div className="lg:w-64">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 ml-1">Lokasi</p>
           <div className="relative">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <select className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 pl-12 pr-10 text-[10px] font-black uppercase tracking-widest appearance-none outline-none" value={filterBranch} onChange={e => setFilterBranch(e.target.value)}>
                <option value="all">Semua Cabang</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
           </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
           <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <TrendingUp size={22} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Omzet Kotor (Revenue)</p>
           <h3 className="text-2xl font-black tracking-tighter">Rp {stats.revenue.toLocaleString()}</h3>
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
           <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6">
              <ArrowDownRight size={22} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Beban Pokok (HPP)</p>
           <h3 className="text-2xl font-black tracking-tighter">Rp {stats.cogs.toLocaleString()}</h3>
        </div>

        <div className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm">
           <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
              <Tag size={22} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Diskon</p>
           <h3 className="text-2xl font-black tracking-tighter text-rose-500">- Rp {stats.totalDiscount.toLocaleString()}</h3>
        </div>

        <div className="p-8 bg-slate-950 text-white rounded-[2.5rem] shadow-2xl shadow-emerald-500/10 border border-slate-900">
           <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
              <CheckCircle size={22} />
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">Laba Bersih Aktual</p>
           <h3 className="text-2xl font-black tracking-tighter text-emerald-400">Rp {stats.netProfit.toLocaleString()}</h3>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-slate-950 p-10 rounded-[3rem] shadow-2xl mb-12 relative overflow-hidden border border-slate-900">
        <div className="absolute top-0 right-0 p-10 opacity-5">
           <Activity size={150} />
        </div>
        <div className="flex justify-between items-center mb-10 relative z-10">
          <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">Pertumbuhan Finansial</h3>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-[10px] text-white/50 font-black uppercase">Revenue</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] text-white/50 font-black uppercase">Profit</span>
             </div>
          </div>
        </div>
        <div className="h-80 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                <linearGradient id="colProf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff0a" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: '900'}} dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: '900'}} />
              <Tooltip contentStyle={{backgroundColor: '#0f172a', borderRadius: '20px', border: '1px solid #1e293b'}} itemStyle={{fontWeight: '900', fontSize: '12px'}} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" strokeWidth={4} fill="url(#colRev)" />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={4} fill="url(#colProf)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit Reconciliation */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden mb-12">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
           <h3 className="text-lg font-black text-slate-800 uppercase italic">Log Transaksi & Audit</h3>
           <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
              <Search size={18} className="text-slate-300" />
              <input type="text" placeholder="Cari No Invoice..." className="bg-transparent outline-none font-bold text-xs uppercase" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
              <tr>
                <th className="px-10 py-6">No Invoice</th>
                <th className="px-10 py-6">Revenue</th>
                <th className="px-10 py-6">HPP</th>
                <th className="px-10 py-6">Diskon</th>
                <th className="px-10 py-6">Laba Bersih</th>
                <th className="px-10 py-6">PPN (Titipan)</th>
                <th className="px-10 py-6 text-right">Cash-In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {txs.filter(t => t.id.toLowerCase().includes(searchQuery.toLowerCase())).map((t) => {
                const hpp = t.items.reduce((acc, i) => acc + (i.cost_snapshot * i.quantity), 0);
                const labaBersih = t.subtotal - hpp - t.discount;
                return (
                  <tr key={t.id} className="hover:bg-blue-50/20 transition group">
                    <td className="px-10 py-6">
                       <p className="font-black text-slate-800 text-sm">#{t.id}</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(t.date).toLocaleString('id-ID')}</p>
                    </td>
                    <td className="px-10 py-6 font-black text-slate-700">Rp {t.subtotal.toLocaleString()}</td>
                    <td className="px-10 py-6 text-slate-400 font-bold italic">Rp {hpp.toLocaleString()}</td>
                    <td className="px-10 py-6 text-rose-500 font-black">- Rp {t.discount.toLocaleString()}</td>
                    <td className="px-10 py-6 font-black text-emerald-600">Rp {labaBersih.toLocaleString()}</td>
                    <td className="px-10 py-6 text-slate-400 font-bold">Rp {t.tax.toLocaleString()}</td>
                    <td className="px-10 py-6 text-right font-black text-slate-900 bg-slate-50/30">Rp {t.total.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-8 rounded-[2.5rem] flex gap-6 items-start">
         <Info className="text-blue-600 shrink-0" size={24} />
         <div>
            <h4 className="font-black text-blue-900 uppercase text-xs mb-1">Catatan Akuntansi KASIRA</h4>
            <p className="text-blue-800/70 text-sm leading-relaxed">
              Revenue dihitung dari nilai total barang terjual sebelum diskon dan pajak. 
              PPN (Pajak) dihitung sebagai liabilitas (titipan) dan tidak menambah laba usaha. 
              Diskon mengurangi nilai Laba Bersih namun tidak mengurangi nilai Revenue Kotor untuk keperluan audit performa produk.
            </p>
         </div>
      </div>
    </Layout>
  );
};

export default OwnerReports;
