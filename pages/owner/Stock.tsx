
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { User, Product, Branch } from '../../types';
import { api } from '../../services/api';
import { RefreshCw, Package, ArrowUpRight, ArrowDownRight, CheckCircle, Info } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const OwnerStock: React.FC<Props> = ({ user, onLogout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Adjustment Modal State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustNote, setAdjustNote] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const p = await api.getProducts();
    const b = await api.getBranches(user.id);
    setProducts(p);
    setBranches(b);
    setLoading(false);
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    
    try {
      await api.adjustStock(activeProduct.id, adjustAmount, adjustNote);
      setSuccess(`Stok ${activeProduct.name} berhasil diperbarui!`);
      setShowAdjustModal(false);
      setActiveProduct(null);
      setAdjustAmount(0);
      setAdjustNote('');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredProducts = selectedBranch === 'all' 
    ? products 
    : products.filter(p => p.branchId === selectedBranch);

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Stok</h1>
          <p className="text-slate-500">Sesuaikan jumlah inventori secara manual antar cabang.</p>
        </div>
        <div className="flex gap-4">
          <select 
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-white border rounded-xl px-4 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:border-blue-500 shadow-sm"
          >
            <option value="all">Semua Cabang</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button 
            onClick={loadData}
            className="p-2 bg-white border rounded-xl hover:bg-gray-50 transition text-slate-400"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3 animate-fade-in">
          <CheckCircle size={20} /> {success}
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-slate-400 text-[11px] uppercase tracking-widest font-black">
            <tr>
              <th className="px-8 py-5">Produk & Cabang</th>
              <th className="px-8 py-5">Kategori</th>
              <th className="px-8 py-5">Stok Saat Ini</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProducts.map((p) => {
              const branch = branches.find(b => b.id === p.branchId);
              return (
                <tr key={p.id} className="hover:bg-blue-50/30 transition">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400">{branch?.name || 'Cabang tidak ditemukan'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-gray-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <p className={`text-lg font-black ${p.stock < 10 ? 'text-rose-500' : 'text-slate-700'}`}>
                      {p.stock}
                    </p>
                  </td>
                  <td className="px-8 py-4">
                    {p.stock < 10 ? (
                      <span className="flex items-center gap-1 text-rose-500 text-xs font-bold">
                        <Info size={14} /> Stok Menipis
                      </span>
                    ) : (
                      <span className="text-emerald-500 text-xs font-bold">Stok Aman</span>
                    )}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button 
                      onClick={() => {
                        setActiveProduct(p);
                        setShowAdjustModal(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-md shadow-blue-600/20"
                    >
                      Update Stok
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="p-20 text-center">
            <Package size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium italic">Tidak ada produk ditemukan untuk kriteria ini.</p>
          </div>
        )}
      </div>

      {/* Adjustment Modal */}
      {showAdjustModal && activeProduct && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-10">
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                   <Package size={32} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800">Update Stok</h2>
                    <p className="text-slate-500">{activeProduct.name}</p>
                 </div>
              </div>

              <form onSubmit={handleAdjust} className="space-y-6">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-3">Jumlah Penyesuaian</label>
                   <div className="flex items-center gap-4">
                     <button 
                       type="button" 
                       onClick={() => setAdjustAmount(prev => prev - 1)}
                       className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition"
                     >
                       <Minus size={20} />
                     </button>
                     <input 
                       type="number"
                       className="flex-1 text-center text-2xl font-black bg-gray-50 border-none rounded-xl py-3"
                       value={adjustAmount}
                       onChange={e => setAdjustAmount(parseInt(e.target.value) || 0)}
                     />
                     <button 
                       type="button" 
                       onClick={() => setAdjustAmount(prev => prev + 1)}
                       className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition"
                     >
                       <Plus size={20} />
                     </button>
                   </div>
                   <div className="mt-4 flex justify-between text-xs font-bold uppercase tracking-widest px-2">
                     <span className="text-slate-400">Prediksi Baru</span>
                     <span className={activeProduct.stock + adjustAmount < 0 ? 'text-rose-500' : 'text-blue-600'}>
                       {activeProduct.stock} → {activeProduct.stock + adjustAmount}
                     </span>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Alasan / Catatan</label>
                   <input 
                     required
                     className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 transition"
                     placeholder="Contoh: Stok masuk baru / Barang rusak"
                     value={adjustNote}
                     onChange={e => setAdjustNote(e.target.value)}
                   />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAdjustModal(false);
                      setAdjustAmount(0);
                    }} 
                    className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-800 transition"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={activeProduct.stock + adjustAmount < 0}
                    className="flex-[2] bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition shadow-lg disabled:opacity-50"
                  >
                    Konfirmasi Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const Plus = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const Minus = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

export default OwnerStock;
