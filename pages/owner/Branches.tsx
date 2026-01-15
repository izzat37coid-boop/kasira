
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { User, Branch, Role } from '../../types';
import { api } from '../../services/api';
import { Plus, MapPin, MoreVertical, Edit2, Trash2, CheckCircle, AlertCircle, Terminal, Loader2 } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const OwnerBranches: React.FC<Props> = ({ user, onLogout }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', location: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isRlsError, setIsRlsError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const data = await api.getBranches(user.id);
      setBranches(data);
    } catch (err: any) {
      console.error("Load branches error:", err);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsRlsError(false);
    setLoading(true);

    try {
      await api.addBranch({ ...newBranch, ownerId: user.id });
      setShowModal(false);
      setSuccess('Cabang berhasil ditambahkan!');
      setNewBranch({ name: '', location: '' });
      loadBranches();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const msg = err.message || '';
      setError(msg);
      if (msg.toLowerCase().includes('row-level security') || msg.toLowerCase().includes('rls')) {
        setIsRlsError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    
    setError('');
    try {
      const response = await api.deleteBranch(confirmDelete.id, user.role);
      if (response.success) {
        setBranches(prev => prev.filter(b => b.id !== confirmDelete.id));
        setSuccess('Cabang berhasil dihapus.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus cabang.');
    } finally {
      setConfirmDelete({ isOpen: false, id: null });
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Cabang</h1>
          <p className="text-slate-500">Kelola operasional tiap lokasi bisnis Anda.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} /> Tambah Cabang
        </button>
      </div>

      {(error || isRlsError) && (
        <div className="space-y-4 mb-6 animate-fade-in">
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-6 py-4 rounded-xl flex items-center gap-3 text-xs font-bold">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error || 'Terjadi kesalahan sistem database.'}</span>
          </div>
          
          {isRlsError && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Terminal size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Database Setup Instruction</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
                Tabel <b>branches</b> memerlukan izin RLS. Jalankan perintah ini di SQL Editor Supabase Anda:
              </p>
              <pre className="bg-slate-950 p-3 rounded-xl text-[9px] text-blue-400 font-mono overflow-x-auto border border-white/5">
                {`CREATE POLICY "Manage Branches" ON branches \nFOR ALL USING (auth.uid() = owner_id);`}
              </pre>
            </div>
          )}
        </div>
      )}

      {success && (
        <div className="bg-emerald-100 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3 animate-fade-in">
          <CheckCircle size={20} /> {success}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((b) => (
          <div key={b.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <MapPin size={24} />
              </div>
              <div className="relative group/menu">
                <button className="text-slate-400 hover:text-slate-600 p-1"><MoreVertical size={20} /></button>
                <div className="absolute right-0 top-8 bg-white border rounded-xl shadow-xl hidden group-hover/menu:block z-20 overflow-hidden w-40">
                  <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-slate-600 font-bold"><Edit2 size={16} /> Edit</button>
                  <button 
                    onClick={() => setConfirmDelete({ isOpen: true, id: b.id })}
                    className="w-full text-left px-4 py-3 hover:bg-red-50 flex items-center gap-2 text-red-600 font-bold"
                  >
                    <Trash2 size={16} /> Hapus
                  </button>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">{b.name}</h3>
            <p className="text-slate-500 mb-6 flex items-center gap-1"><MapPin size={14} /> {b.location}</p>
            <div className="flex gap-4 pt-4 border-t border-gray-50">
               <div className="flex-1">
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Status</p>
                 <span className="text-green-600 font-bold text-sm">Aktif</span>
               </div>
            </div>
          </div>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <MapPin size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Belum ada cabang. Silakan tambahkan cabang pertama Anda.</p>
          </div>
        )}
      </div>

      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        title="Hapus Cabang?"
        message="Menghapus cabang akan menghapus SEMUA data produk dan kasir yang terdaftar di cabang tersebut."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Tambah Cabang Baru</h2>
              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Nama Cabang</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition" 
                    placeholder="Contoh: KASIRA Jakarta Selatan"
                    value={newBranch.name}
                    onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Lokasi / Alamat</label>
                  <textarea 
                    required 
                    className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition" 
                    placeholder="Jalan Sudirman Kav 21..."
                    rows={3}
                    value={newBranch.location}
                    onChange={e => setNewBranch({...newBranch, location: e.target.value})}
                  ></textarea>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:text-slate-800 transition">Batal</button>
                  <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Simpan Cabang'}
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

export default OwnerBranches;
