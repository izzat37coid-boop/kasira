
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Package, 
  BarChart3, 
  LogOut, 
  ShoppingCart, 
  History,
  Archive,
  Database
} from 'lucide-react';
import { User, Role } from '../types';
import { isDbConfigured } from '../services/supabase';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const location = useLocation();

  const ownerLinks = [
    { to: '/owner', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/owner/branches', icon: Store, label: 'Cabang' },
    { to: '/owner/staff', icon: Users, label: 'Kasir' },
    { to: '/owner/products', icon: Package, label: 'Produk' },
    { to: '/owner/stock', icon: Archive, label: 'Stok' },
    { to: '/owner/reports', icon: BarChart3, label: 'Laporan' },
  ];

  const kasirLinks = [
    { to: '/kasir', icon: ShoppingCart, label: 'POS Kasir' },
    { to: '/kasir/history', icon: History, label: 'Riwayat' },
  ];

  const links = user.role === Role.OWNER ? ownerLinks : kasirLinks;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <aside className="w-72 bg-slate-900 text-white flex flex-col hidden md:flex">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl italic shadow-lg shadow-blue-600/20">K</div>
            <h1 className="text-2xl font-bold tracking-tight">KASIRA</h1>
          </div>
          
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-full">
              <div className={`w-2 h-2 rounded-full ${user.role === Role.OWNER ? 'bg-blue-400' : 'bg-emerald-400'}`}></div>
              <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">{user.role} Account</span>
            </div>
            
            {!isDbConfigured && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl w-full">
                <Database size={12} className="text-amber-500" />
                <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Offline Demo</span>
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 mt-4 px-6 space-y-2 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} className={isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
                <span className="font-medium text-sm">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button
            onClick={onLogout}
            className="flex items-center gap-4 w-full px-5 py-4 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-2xl transition-all group"
          >
            <LogOut size={20} className="group-hover:rotate-180 transition-transform duration-500" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 py-4 px-10 flex justify-between items-center sticky top-0 z-40">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {user.role === Role.OWNER ? user.businessName : 'Cashier Terminal'}
            </h2>
            <div className="flex items-center gap-2 text-slate-400">
               <div className={`w-1.5 h-1.5 rounded-full ${isDbConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
               <p className="text-xs">
                 {isDbConfigured ? 'Connected to HQ' : 'Demo Local Instance'} • <span className="text-slate-600 font-medium">{user.name}</span>
               </p>
            </div>
          </div>
          <div className="flex items-center gap-5">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/20">
               {user.name.charAt(0)}
             </div>
          </div>
        </header>
        <div className="p-10 max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-80px)]">
          <div className="flex-1">
            {children}
          </div>
          <footer className="mt-20 pt-8 border-t border-slate-200/60 pb-8 text-center sm:text-left">
            <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">
              © 2026 KASIRA Digital Indonesia.
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Layout;
