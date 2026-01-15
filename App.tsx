
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, Role } from './types';
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

  useEffect(() => {
    const savedUser = localStorage.getItem('kasira_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('kasira_session', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('kasira_session');
  };

  return (
    <HashRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onRegister={handleLogin} />} />

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
