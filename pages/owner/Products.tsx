
import React, { useState, useEffect, useRef } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { User, Product, Branch, Role, Category } from '../../types';
import { api } from '../../services/api';
import { 
  Plus, 
  Package, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  AlertCircle, 
  X, 
  ImageIcon, 
  ChevronRight,
  Camera,
  Layers
} from 'lucide-react';

interface Props { 
  user: User; 
  onLogout: () => void; 
}

const OwnerProducts: React.FC<Props> = ({ user, onLogout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const initialForm = {
    name: '', 
    category: '', 
    price: '', 
    costPrice: '', 
    stock: '', 
    branchId: '', 
    imageUrl: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  useEffect(() => { 
    loadData(); 
  }, []);

  const loadData = async () => {
    const [p, b, c] = await Promise.all([
      api.getProducts(),
      api.getBranches(user.id),
      api.getCategories()
    ]);
    setProducts(p);
    setBranches(b);
    setCategories(c);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ ...initialForm, branchId: branches[0]?.id || '' });
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setIsEditMode(true);
    setEditingId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      stock: product.stock.toString(),
      branchId: product.branchId,
      imageUrl: product.imageUrl
    });
    setImagePreview(product.imageUrl);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Updated limit to 20MB (20 * 1024 * 1024 bytes)
      if (file.size > 20 * 1024 * 1024) return setError('Ukuran gambar maksimal 20MB');
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData(prev => ({ ...prev, imageUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.name || !formData.category || !formData.branchId) return "Nama, Kategori, dan Cabang wajib diisi.";
    if (Number(formData.price) <= 0) return "Harga Jual harus lebih besar dari 0.";
    if (Number(formData.costPrice) < 0) return "Harga Modal tidak boleh negatif.";
    if (Number(formData.stock) < 0) return "Stok tidak boleh negatif.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditMode && editingId) {
        await api.updateProduct(editingId, formData, user.role);
        setSuccess('Produk berhasil diperbarui!');
      } else {
        await api.addProduct(formData);
        setSuccess('Produk berhasil ditambahkan!');
      }

      await loadData();
      setTimeout(() => {
        setShowModal(false);
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await api.deleteProduct(confirmDelete.id, user.role);
      setProducts(prev => prev.filter(p => p.id !== confirmDelete.id));
      setSuccess('Produk berhasil dihapus.');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConfirmDelete({ isOpen: false, id: null });
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = filterBranch === 'all' || p.branchId === filterBranch;
    return matchesSearch && matchesBranch;
  });

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">Katalog Produk</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manual Inventory Control</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black hover:bg-blue-700 transition shadow-xl shadow-blue-600/20 active:scale-95 uppercase tracking-widest text-xs"
        >
          <Plus size={18} /> Tambah Produk Baru
        </button>
      </div>

      <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama produk..." 
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 transition"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-slate-400" />
          <select 
            className="bg-slate-50 border-none rounded-xl py-3 px-4 text-sm font-black text-slate-600 focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
            value={filterBranch}
            onChange={e => setFilterBranch(e.target.value)}
          >
            <option value="all">Semua Cabang</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3 animate-fade-in font-black text-sm">
          <CheckCircle size={20} /> {success}
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
            <tr>
              <th className="px-8 py-6">Detail Produk</th>
              <th className="px-8 py-6">Kategori & Cabang</th>
              <th className="px-8 py-6">Stok Fisik</th>
              <th className="px-8 py-6">Harga (HPP vs Jual)</th>
              <th className="px-8 py-6 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredProducts.map((p) => {
              const branch = branches.find(b => b.id === p.branchId);
              return (
                <tr key={p.id} className="hover:bg-blue-50/20 transition group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shadow-sm">
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 tracking-tight">{p.name}</p>
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {p.category}
                      </span>
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                        <ChevronRight size={12} className="text-blue-300" /> {branch?.name || 'Loading...'}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-lg font-black ${p.stock < 10 ? 'text-rose-500' : 'text-slate-800'}`}>
                      {p.stock} <small className="text-[10px] text-slate-400">pcs</small>
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-black text-emerald-600">Rp {p.price.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-300 font-bold italic">HPP: Rp {p.costPrice.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(p)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition shadow-sm"><Edit2 size={16} /></button>
                      <button onClick={() => setConfirmDelete({ isOpen: true, id: p.id })} className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition shadow-sm"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="py-24 text-center">
            <Package size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-black italic">Belum ada produk untuk kriteria pencarian ini.</p>
          </div>
        )}
      </div>

      {/* Manual Input Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-scale-in my-auto">
            <div className="p-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                   <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase">
                     {isEditMode ? 'Edit Data Produk' : 'Tambah Produk Manual'}
                   </h2>
                   <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Lengkapi data finansial & stok dengan benar.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-3 bg-slate-50 text-slate-300 rounded-full hover:bg-rose-50 hover:text-rose-500 transition"><X size={20} /></button>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3 animate-fade-in font-bold text-sm">
                  <AlertCircle size={20} /> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="flex items-center gap-8 bg-slate-50 p-6 rounded-[2rem] border-2 border-dashed border-slate-200 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-24 h-24 rounded-3xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                    {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-slate-200" />}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-sm">Gambar Produk</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Klik untuk upload foto (Maksimal 20MB)</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                    <button type="button" className="px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Pilih File</button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nama Produk *</label>
                    <input required type="text" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition" placeholder="Americano Cold Brew" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Kategori Produk *</label>
                    <div className="relative">
                      <Layers className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input 
                        list="category-list"
                        required 
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition"
                        placeholder="Pilih atau Ketik Kategori Baru"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      />
                      <datalist id="category-list">
                        {categories.map(c => <option key={c.id} value={c.name} />)}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cabang Penjualan *</label>
                    <select className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition cursor-pointer" value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})}>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Stok Awal Fisik *</label>
                    <input required type="number" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition" placeholder="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Harga Modal (HPP) *</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                       <input required type="number" className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Harga Jual Konsumen *</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-300">Rp</span>
                       <input required type="number" className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:text-slate-800 transition">Batal</button>
                  <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 text-white font-black py-5 rounded-2xl shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all uppercase tracking-widest text-[11px] disabled:opacity-50">
                    {loading ? 'Processing...' : (isEditMode ? 'Simpan Perubahan' : 'Publish Produk Baru')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmDelete.isOpen} title="Hapus Produk?" message="Data produk akan dihilangkan dari sistem secara permanen." onConfirm={executeDelete} onCancel={() => setConfirmDelete({ isOpen: false, id: null })} />
    </Layout>
  );
};

export default OwnerProducts;
