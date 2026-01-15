
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { User, Transaction } from '../../types';
import { api } from '../../services/api';
import { FileText, Printer, CheckCircle2 } from 'lucide-react';

interface Props {
  user: User;
  onLogout: () => void;
}

const KasirHistory: React.FC<Props> = ({ user, onLogout }) => {
  const [txs, setTxs] = useState<Transaction[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (user.branchId) {
      const data = await api.getTransactions(user.branchId);
      setTxs(data.reverse());
    }
  };

  const handlePrint = (tx: Transaction) => {
    alert(`Mencetak Struk untuk Transaksi #${tx.id}\nStatus: Berhasil\nTotal: Rp ${tx.total.toLocaleString()}`);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Riwayat Transaksi</h1>
        <p className="text-slate-500">Daftar semua penjualan di cabang Anda.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-slate-500 text-sm uppercase tracking-wider font-bold">
            <tr>
              <th className="px-8 py-4">ID / Tanggal</th>
              <th className="px-8 py-4">Items</th>
              <th className="px-8 py-4">Metode</th>
              <th className="px-8 py-4">Total</th>
              <th className="px-8 py-4">Status</th>
              <th className="px-8 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {txs.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50/50 transition">
                <td className="px-8 py-4">
                  <p className="font-bold text-slate-800">#{t.id.toUpperCase()}</p>
                  <p className="text-xs text-slate-400">{new Date(t.date).toLocaleString('id-ID')}</p>
                </td>
                <td className="px-8 py-4">
                   <p className="text-sm text-slate-600 line-clamp-1">
                     {t.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
                   </p>
                </td>
                <td className="px-8 py-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-widest">{t.paymentMethod}</span>
                </td>
                <td className="px-8 py-4">
                  <span className="font-bold text-slate-800">Rp {t.total.toLocaleString()}</span>
                </td>
                <td className="px-8 py-4">
                  <div className="flex items-center gap-1 text-green-600 font-bold text-sm italic">
                    <CheckCircle2 size={16} /> Berhasil
                  </div>
                </td>
                <td className="px-8 py-4 text-right">
                   <button onClick={() => handlePrint(t)} className="p-2 text-slate-400 hover:text-blue-500 transition border border-transparent hover:border-blue-100 rounded-lg">
                     <Printer size={20} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {txs.length === 0 && (
          <div className="p-20 text-center">
            <FileText size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Belum ada transaksi di cabang ini.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default KasirHistory;
