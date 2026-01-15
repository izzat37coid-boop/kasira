
import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { User, Product, Transaction, PaymentStatus } from '../../types';
import { api } from '../../services/api';
import { realtime } from '../../services/realtime';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  Banknote, 
  QrCode, 
  CheckCircle, 
  X,
  Zap,
  Printer,
  RefreshCw,
  CreditCard,
  ChevronRight,
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface Props { user: User; onLogout: () => void; }

const BANKS = [
  { id: 'BCA', name: 'BCA Virtual Account', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg' },
  { id: 'BNI', name: 'BNI Virtual Account', icon: 'https://upload.wikimedia.org/wikipedia/id/5/55/BNI_logo.svg' },
  { id: 'BRI', name: 'BRI Virtual Account', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/BRI_Logo.svg' },
  { id: 'MANDIRI', name: 'Mandiri Virtual Account', icon: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Bank_Mandiri_logo_2016.svg' },
];

const KasirPOS: React.FC<Props> = ({ user, onLogout }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{ productId: string, name: string, price: number, quantity: number }[]>([]);
  const [search, setSearch] = useState('');
  
  // Payment States
  const [showPayment, setShowPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'method' | 'processing' | 'success'>('method');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'QRIS'>('CASH');
  const [selectedBank, setSelectedBank] = useState<string>('BCA');
  const [loading, setLoading] = useState(false);
  const [currentTx, setCurrentTx] = useState<Transaction | null>(null);

  useEffect(() => {
    loadProducts();
    
    // Listen to real-time status updates (Callback simulation)
    const branchChannel = realtime.privateChannel(`branch.${user.branchId}`);
    
    branchChannel.listen('PaymentStatusUpdated', (payload: { status: PaymentStatus, transactionId: string }) => {
      if (currentTx && currentTx.id === payload.transactionId) {
        if (payload.status === 'success') {
          setPaymentStep('success');
          setCurrentTx(prev => prev ? { ...prev, status: 'success' } : null);
        } else if (payload.status === 'failed') {
          alert('Pembayaran Gagal/Kadaluarsa');
          setShowPayment(false);
        }
      }
    });

    branchChannel.listen('StockUpdated', () => loadProducts());

    return () => {
      realtime.stopListening(`branch.${user.branchId}`, 'PaymentStatusUpdated');
      realtime.stopListening(`branch.${user.branchId}`, 'StockUpdated');
    };
  }, [currentTx]);

  const loadProducts = async () => {
    const data = await api.getProducts(user.branchId);
    setProducts(data);
  };

  const addToCart = (p: Product) => {
    const existing = cart.find(item => item.productId === p.id);
    if (existing) {
      if (existing.quantity + 1 > p.stock) return alert('Stok tidak cukup!');
      setCart(cart.map(item => item.productId === p.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      if (p.stock < 1) return alert('Stok habis!');
      setCart([...cart, { productId: p.id, name: p.name, price: p.price, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    const existing = cart.find(item => item.productId === id);
    if (existing && existing.quantity > 1) {
      setCart(cart.map(item => item.productId === id ? { ...item, quantity: item.quantity - 1 } : item));
    } else {
      setCart(cart.filter(item => item.productId !== id));
    }
  };

  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const tax = subtotal * 0.11;
  const total = subtotal + tax;

  const handleProcessPayment = async () => {
    setLoading(true);
    try {
      const tx = await api.createTransaction({
        branchId: user.branchId!,
        cashierId: user.id,
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
        bank: paymentMethod === 'TRANSFER' ? selectedBank : undefined,
        tax
      });
      setCurrentTx(tx);
      
      if (paymentMethod === 'CASH') {
        setPaymentStep('success');
      } else {
        setPaymentStep('processing');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = async () => {
    if (!currentTx) return;
    await api.simulateMidtransCallback(currentTx.id, 'success');
  };

  const resetPOS = () => {
    setCart([]);
    setShowPayment(false);
    setPaymentStep('method');
    setCurrentTx(null);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="flex gap-8 h-[calc(100vh-160px)] font-sans">
        {/* Left: Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
           <div className="mb-6 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="text" 
                placeholder="Cari menu..." 
                className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-14 pr-6 shadow-sm focus:ring-4 focus:ring-blue-500/5 transition-all text-base font-semibold outline-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
             {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
               <button 
                 key={p.id}
                 onClick={() => addToCart(p)}
                 className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group"
               >
                 <div className="w-full h-32 rounded-2xl overflow-hidden mb-3 bg-slate-50">
                    <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                 </div>
                 <h4 className="font-black text-slate-800 text-sm truncate">{p.name}</h4>
                 <div className="flex justify-between items-center mt-2">
                   <p className="text-blue-600 font-black text-sm">Rp {p.price.toLocaleString()}</p>
                   <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase ${p.stock < 10 ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                     {p.stock} pcs
                   </span>
                 </div>
               </button>
             ))}
           </div>
        </div>

        {/* Right: Cart Panel */}
        <div className="w-[400px] bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col text-white overflow-hidden border border-white/5">
           <div className="p-8 border-b border-white/5 bg-white/5">
              <h3 className="text-xl font-black tracking-tighter uppercase italic">Pesanan Aktif</h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Terminal: {user.name}</p>
           </div>
           
           <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {cart.map(item => (
                <div key={item.productId} className="flex gap-4 items-center animate-fade-in">
                   <div className="flex-1">
                     <p className="font-black text-sm">{item.name}</p>
                     <p className="text-[10px] font-black text-blue-400 mt-1">Rp {item.price.toLocaleString()}</p>
                   </div>
                   <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5">
                     <button onClick={() => removeFromCart(item.productId)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-rose-500/20 text-slate-400"><Minus size={14} /></button>
                     <span className="font-black w-8 text-center text-xs">{item.quantity}</span>
                     <button onClick={() => addToCart(products.find(p => p.id === item.productId)!)} className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center"><Plus size={14} /></button>
                   </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                   <ShoppingCart size={48} className="mb-4" />
                   <p className="font-black text-[10px] uppercase tracking-[0.3em]">Menunggu Menu</p>
                </div>
              )}
           </div>

           <div className="p-10 bg-white/5 border-t border-white/5">
              <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center text-xs text-slate-500 font-black uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="text-slate-300">Rp {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white font-black uppercase tracking-widest text-sm italic">Total Akhir</span>
                  <span className="text-white font-black text-3xl tracking-tighter">Rp {total.toLocaleString()}</span>
                </div>
              </div>
              <button 
                onClick={() => setShowPayment(true)}
                disabled={cart.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-blue-500/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 active:scale-95"
              >
                <Zap size={20} className="fill-white" /> Lanjut Pembayaran
              </button>
           </div>
        </div>
      </div>

      {/* MIDTRANS PAYMENT MODAL */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-scale-in my-auto overflow-hidden">
            
            {/* STEP 1: PILIH METODE */}
            {paymentStep === 'method' && (
              <div className="p-10">
                <div className="flex justify-between items-start mb-10">
                   <div>
                      <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Pilih Metode Pembayaran</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Sistem Terintegrasi Midtrans</p>
                   </div>
                   <button onClick={() => setShowPayment(false)} className="p-2 text-slate-300 hover:text-rose-500"><X size={28} /></button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-10">
                  {[
                    { id: 'CASH', icon: Banknote, label: 'Tunai', color: 'blue' },
                    { id: 'TRANSFER', icon: CreditCard, label: 'Transfer VA', color: 'indigo' },
                    { id: 'QRIS', icon: QrCode, label: 'QRIS', color: 'emerald' },
                  ].map(m => (
                    <button 
                      key={m.id} 
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-6 rounded-[2rem] border-4 transition-all flex flex-col items-center gap-3 ${paymentMethod === m.id ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-50 text-slate-300 hover:border-slate-100'}`}
                    >
                      <m.icon size={32} />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Sub-method: Bank VA */}
                {paymentMethod === 'TRANSFER' && (
                  <div className="space-y-4 mb-10 animate-fade-in">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Pilih Bank Virtual Account</p>
                    <div className="grid grid-cols-2 gap-3">
                      {BANKS.map(bank => (
                        <button 
                          key={bank.id}
                          onClick={() => setSelectedBank(bank.id)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${selectedBank === bank.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 hover:bg-slate-50'}`}
                        >
                          <img src={bank.icon} className="h-6 w-12 object-contain" />
                          <span className="text-[10px] font-black uppercase">{bank.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 p-8 rounded-[2.5rem] flex justify-between items-center text-white mb-8">
                   <div>
                      <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Total Tagihan</p>
                      <p className="text-3xl font-black tracking-tighter italic">Rp {total.toLocaleString()}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">Biaya Admin</p>
                      <p className="text-sm font-black text-emerald-400 italic">Gratis</p>
                   </div>
                </div>

                <button 
                  onClick={handleProcessPayment}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-blue-600/20 hover:bg-blue-700 transition uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                >
                  {loading ? <RefreshCw className="animate-spin" /> : <CheckCircle size={20} />}
                  Konfirmasi & Bayar
                </button>
              </div>
            )}

            {/* STEP 2: PROCESSING (Display VA / QRIS) */}
            {paymentStep === 'processing' && currentTx && (
              <div className="p-10 text-center">
                 <div className="mb-10">
                    <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Menunggu Pembayaran</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">ID Order: {currentTx.id}</p>
                 </div>

                 {paymentMethod === 'TRANSFER' ? (
                   <div className="bg-slate-50 p-10 rounded-[3rem] border-4 border-dashed border-slate-200 mb-10">
                      <div className="flex flex-col items-center gap-4 mb-6">
                         <img src={BANKS.find(b => b.id === currentTx.paymentDetails?.bank)?.icon} className="h-12 w-32 object-contain" />
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomor Virtual Account</p>
                         <p className="text-4xl font-black text-indigo-600 tracking-[0.2em]">{currentTx.paymentDetails?.va_number}</p>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-indigo-500 font-black uppercase text-[10px]">
                         <Clock size={14} /> Kadaluarsa dalam 24 Jam
                      </div>
                   </div>
                 ) : (
                   <div className="bg-white p-10 rounded-[3rem] border-4 border-slate-100 mb-10 inline-block shadow-inner">
                      <img src={currentTx.paymentDetails?.qris_url} className="w-64 h-64 mx-auto rounded-3xl" />
                      <div className="mt-6 flex items-center justify-center gap-2 text-emerald-500 font-black uppercase text-[10px]">
                         <RefreshCw size={14} className="animate-spin" /> Scan Untuk Membayar
                      </div>
                   </div>
                 )}

                 <div className="bg-blue-50 p-6 rounded-2xl flex items-center gap-4 mb-10 text-left">
                    <Loader2 className="text-blue-600 animate-spin shrink-0" size={24} />
                    <p className="text-[10px] font-black text-blue-800 leading-relaxed uppercase tracking-widest">
                      Sistem sedang memantau pembayaran Anda secara real-time melalui Midtrans Callback Engine.
                    </p>
                 </div>

                 <div className="flex gap-4">
                    <button onClick={resetPOS} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Batalkan</button>
                    <button onClick={simulatePayment} className="flex-[2] bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-slate-800 transition uppercase tracking-widest text-[10px]">Simulasi Bayar (Demo)</button>
                 </div>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {paymentStep === 'success' && currentTx && (
              <div className="p-12 text-center">
                 <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/30 animate-bounce">
                    <CheckCircle size={48} />
                 </div>
                 <h2 className="text-4xl font-black text-slate-800 italic uppercase tracking-tighter mb-4">Pembayaran Sukses!</h2>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-12">Dana telah diverifikasi & stok diperbarui otomatis.</p>
                 
                 <div className="bg-slate-50 p-8 rounded-[2.5rem] text-left mb-12 font-mono text-xs border border-slate-100">
                    <div className="flex justify-between mb-2"><span>No. Struk</span><span className="font-bold">#{currentTx.id}</span></div>
                    <div className="flex justify-between mb-2"><span>Kasir</span><span className="font-bold">{user.name}</span></div>
                    <div className="flex justify-between mb-4"><span>Metode</span><span className="font-bold">{currentTx.paymentMethod} {currentTx.paymentDetails?.bank || ''}</span></div>
                    <div className="border-t border-slate-200 pt-4 flex justify-between">
                       <span className="font-black text-slate-400 uppercase">Total Bayar</span>
                       <span className="text-xl font-black text-slate-800 tracking-tighter">Rp {currentTx.total.toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="flex gap-4">
                    <button onClick={() => window.print()} className="flex-1 bg-white border-2 border-slate-100 text-slate-400 font-black py-4 rounded-2xl hover:text-slate-800 transition uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                       <Printer size={16} /> Print Struk
                    </button>
                    <button onClick={resetPOS} className="flex-[2] bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition uppercase tracking-widest text-[10px]">Transaksi Baru</button>
                 </div>
              </div>
            )}

          </div>
        </div>
      )}
    </Layout>
  );
};

export default KasirPOS;
