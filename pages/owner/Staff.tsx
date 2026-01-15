
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { User, Branch, Role } from '../../types';
import { api } from '../../services/api';
import { Plus, UserCheck, Mail, Store, Trash2, CheckCircle, AlertCircle, Lock, ShieldCheck, X } from 'lucide-react';

interface Props { user: User; onLogout: () => void; }

const OwnerStaff: React.FC<Props> = ({ user, onLogout }) => {
  const [staff, setStaff] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    branchId: '' 
  });

  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const s = await api.getStaff(user.id);
    const b = await api.getBranches(user.id);
    setStaff(s);
    setBranches(b);
    if (b.length > 0) setFormData(prev => ({ ...prev, branchId: b[0].id }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validasi Frontend
    if (formData.password.length < 8) {
      setError('Password minimal harus 8 karakter.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await api.addStaff(formData);
      setShowModal(false);
      setSuccess('Akun kasir berhasil dibuat! Kasir sekarang bisa login.');
      setFormData({ name: '', email: '', password: '', confirmPassword: '', branchId: branches[0]?.id || '' });
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Gagal membuat akun kasir. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;
    try {
      await api.deleteStaff(confirmDelete.id, user.role);
      setStaff(prev => prev.filter(s => s.id !== confirmDelete.id));
      setSuccess('Akun kasir berhasil dihapus.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Gagal menghapus akun kasir.');
    } finally {
      setConfirmDelete({ isOpen: false, id: null });
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Kasir</h1>
          <p className="text-slate-500 font-medium">Kelola akses terminal untuk operasional cabang.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} /> Tambah Kasir Baru
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3 animate-fade-in font-bold">
          <CheckCircle size={20} /> {success}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((s) => (
          <div key={s.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group hover:border-blue-400 transition-all">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner">
                 {s.name.charAt(0)}
               </div>
               <div>
                 <h3 className="font-bold text-slate-800">{s.name}</h3>
                 <p className="text-xs text-slate-400 flex items-center gap-1 font-medium"><Mail size={12} /> {s.email}</p>
               </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Penempatan</p>
               <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                 <Store size={14} className="text-blue-500" /> 
                 {branches.find(b => b.id === s.branchId)?.name || 'Cabang Dihapus'}
               </p>
            </div>
            <button 
              onClick={() => setConfirmDelete({ isOpen: true, id: s.id })}
              className="w-full py-3 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-rose-100"
            >
               <Trash2 size={14} /> Hapus Akses
            </button>
          </div>
        ))}
        {staff.length === 0 && (
          <div className="col-span-full py-24 text-center bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
            <UserCheck size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold italic uppercase tracking-widest text-xs">Belum ada kasir terdaftar.</p>
          </div>
        )}
      </div>

      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        title="Hapus Kasir?"
        message="Akses login kasir ini akan dicabut permanen. Mereka tidak akan bisa masuk ke terminal POS lagi."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-in my-auto">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Akun Kasir Baru</h2>
                    <p className="text-slate-400 text-xs font-medium">Buat kredensial login untuk staf Anda.</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><X size={24} /></button>
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 px-6 py-4 rounded-2xl mb-8 flex items-center gap-3 animate-fade-in text-sm font-bold">
                  <AlertCircle size={20} className="shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Kasir</label>
                  <input required type="text" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition outline-none" placeholder="Masukkan nama kasir" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Login</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="email" className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition outline-none" placeholder="email@kasira.id" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input required type="password" title="Minimal 8 karakter" className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition outline-none" placeholder="Minimal 8 karakter" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Konfirmasi</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input required type="password" className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition outline-none" placeholder="Ulangi password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Penempatan Cabang</label>
                   <div className="relative">
                      <Store className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <select required className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-700 focus:ring-4 focus:ring-blue-500/10 transition outline-none appearance-none cursor-pointer" value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})}>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-800 transition uppercase tracking-widest text-[10px]">Batal</button>
                  <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]">
                    {loading ? 'Memproses...' : 'Buat Akun Kasir'}
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

export default OwnerStaff;
