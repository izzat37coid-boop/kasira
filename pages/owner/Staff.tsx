
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { User, Branch, Role } from '../../types';
import { api } from '../../services/api';
import { Plus, UserCheck, Mail, Store, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

interface Props { user: User; onLogout: () => void; }

const OwnerStaff: React.FC<Props> = ({ user, onLogout }) => {
  const [staff, setStaff] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', branchId: '' });

  // Custom Confirmation State
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
    try {
      await api.addStaff(formData);
      setShowModal(false);
      setSuccess('Akun kasir berhasil dibuat!');
      loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Gagal membuat akun kasir.');
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete.id) return;

    setError('');
    try {
      const response = await api.deleteStaff(confirmDelete.id, user.role);
      if (response.success) {
        setStaff(prev => prev.filter(s => s.id !== confirmDelete.id));
        setSuccess('Akun kasir berhasil dihapus permanen.');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus akun kasir.');
    } finally {
      setConfirmDelete({ isOpen: false, id: null });
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Kasir</h1>
          <p className="text-slate-500">Atur akun akses untuk kasir di tiap cabang Anda.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold hover:bg-blue-700 transition shadow-lg"
        >
          <Plus size={20} /> Tambah Kasir
        </button>
      </div>

      {success && (
        <div className="bg-green-100 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3 animate-fade-in">
          <CheckCircle size={20} /> {success}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((s) => (
          <div key={s.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative group hover:border-blue-500/50 transition">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-lg">
                 {s.name.charAt(0)}
               </div>
               <div>
                 <h3 className="font-bold text-slate-800">{s.name}</h3>
                 <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={12} /> {s.email}</p>
               </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl mb-4">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Ditempatkan Di</p>
               <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                 <Store size={14} className="text-blue-500" /> 
                 {branches.find(b => b.id === s.branchId)?.name || 'N/A'}
               </p>
            </div>
            <button 
              onClick={() => setConfirmDelete({ isOpen: true, id: s.id })}
              className="w-full py-2 text-rose-600 text-xs font-bold hover:bg-rose-50 rounded-lg transition border border-transparent hover:border-rose-200 flex items-center justify-center gap-2"
            >
               <Trash2 size={14} /> Hapus Akses Kasir
            </button>
          </div>
        ))}
        {staff.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <UserCheck size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Belum ada kasir terdaftar.</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={confirmDelete.isOpen}
        title="Hapus Akun Kasir?"
        message="Akses login kasir ini akan dicabut secara permanen. Kasir tersebut tidak akan bisa masuk ke terminal terminal POS lagi."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Buat Akun Kasir</h2>
              <form onSubmit={handleAdd} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Nama Kasir</label>
                  <input required type="text" className="w-full border rounded-xl px-4 py-3" placeholder="Contoh: Andi Pratama" onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Email Login</label>
                  <input required type="email" className="w-full border rounded-xl px-4 py-3" placeholder="andi@kasira.com" onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-600 mb-2">Penempatan Cabang</label>
                   <select className="w-full border rounded-xl px-4 py-3" value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})}>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                   </select>
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:text-slate-800 transition">Batal</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">Buat Akun</button>
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
