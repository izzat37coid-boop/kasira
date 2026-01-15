
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
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          const profileFound = await fetchProfile(data.session.user.id, data.session.user.email!);
          if (!profileFound) {
            console.warn("Sesi ditemukan tapi profil kosong. Membersihkan sesi...");
            await handleLogout();
          }
        } else {
          setLoading(false);
        }
      } catch (e) {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        const profileFound = await fetchProfile(session.user.id, session.user.email!);
        if (!profileFound) await handleLogout();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id: string, email: string): Promise<boolean> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !profile) {
        return false;
      }
      
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
      return true;
    } catch (e) {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear(); 
    setUser(null);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/50 font-bold uppercase tracking-widest text-[10px]">Sinkronisasi Data KASIRA...</p>
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
