
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Role, AccountStatus } from './types';
import { supabase, isDbConfigured } from './services/supabase';
import { api } from './services/api';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerDashboard from './pages/owner/Dashboard';
import OwnerBranches from './pages/owner/Branches';
import OwnerStaff from './pages/owner/Staff';
import OwnerProducts from './pages/owner/Products';
import OwnerStock from './pages/owner/Stock';
import OwnerReports from './pages/owner/Reports';
import OwnerPerformance from './pages/owner/BranchComparison';
import KasirPOS from './pages/kasir/POS';
import KasirHistory from './pages/kasir/History';
import { RefreshCw, Database } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!isDbConfigured) {
        console.warn("KASIRA: Database environment not found. Running in DEMO MODE.");
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: session.user.email!,
              role: profile.role as Role,
              businessName: profile.business_name,
              status: profile.status as AccountStatus,
              packageType: profile.package_type,
              expiredAt: profile.expired_at,
              branchId: profile.branch_id
            });
          }
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setLoading(false);
      }
    };

    init();

    if (isDbConfigured) {
      // Menambahkan tipe :any secara eksplisit untuk memperbaiki error TS7006 saat build
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, _session: any) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    if (isDbConfigured) await supabase.auth.signOut();
    localStorage.clear();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-6"></div>
        <h2 className="text-white font-black uppercase tracking-[0.3em] text-[10px] mb-2">Sinkronisasi Kasira</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">Menghubungkan Terminal...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      {/* Demo Warning Removed for Production */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />
        <Route path="/register" element={<Register onRegister={(u) => setUser(u)} />} />

        <Route
          path="/owner/*"
          element={
            user?.role === Role.OWNER ? (
              <Routes>
                <Route path="/" element={<OwnerDashboard user={user} onLogout={handleLogout} />} />
                <Route path="/branches" element={<OwnerBranches user={user} onLogout={handleLogout} />} />
                <Route path="/staff" element={<OwnerStaff user={user} onLogout={handleLogout} />} />
                <Route path="/products" element={<OwnerProducts user={user} onLogout={handleLogout} />} />
                <Route path="/stock" element={<OwnerStock user={user} onLogout={handleLogout} />} />
                <Route path="/reports" element={<OwnerReports user={user} onLogout={handleLogout} />} />
                <Route path="/performance" element={<OwnerPerformance user={user} onLogout={handleLogout} />} />
              </Routes>
            ) : <Navigate to="/login" />
          }
        />

        <Route
          path="/kasir/*"
          element={
            user?.role === Role.KASIR ? (
              <Routes>
                <Route path="/" element={<KasirPOS user={user} onLogout={handleLogout} />} />
                <Route path="/history" element={<KasirHistory user={user} onLogout={handleLogout} />} />
              </Routes>
            ) : <Navigate to="/login" />
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
