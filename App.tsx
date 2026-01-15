
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Role, AccountStatus } from './types';
import { supabase } from './services/supabase';
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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mengecek sesi aktif saat inisialisasi menggunakan API V2
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }
    };

    checkSession();

    // Listener perubahan status autentikasi
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (id: string, email: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (profile) {
        setUser({
          id: profile.id,
          name: profile.name,
          email: email,
          role: profile.role as Role,
          businessName: profile.business_name,
          status: profile.status as AccountStatus,
          packageType: profile.package_type,
          expiredAt: profile.expired_at,
          branchId: profile.branch_id
        });
      }
    } catch (e) {
      console.error("Error fetching profile", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/50 font-bold uppercase tracking-widest text-[10px]">Menghubungkan ke KASIRA Cloud...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login onLogin={(u) => setUser(u)} />} />
        <Route path="/register" element={<Register onRegister={(u) => setUser(u)} />} />

        {/* Owner Routes */}
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

        {/* Kasir Routes */}
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
