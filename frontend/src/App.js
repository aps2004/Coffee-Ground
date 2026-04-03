import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Lock } from 'lucide-react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ShopDetail from './pages/ShopDetail';
import MapView from './pages/MapView';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AuthCallback from './pages/AuthCallback';
import CUKPPage from './pages/CUKPPage';
import ContactPage from './pages/ContactPage';
import './App.css';

function AppRouter() {
  const location = useLocation();

  // Check URL fragment for session_id - detect before routing
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
      <Navbar />
      <main className="pt-14">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop/:shopId" element={<ShopDetail />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/cukp" element={<CUKPPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      {/* Footer */}
      <footer className="bg-[#2C1A12] text-white/60 py-12 px-4 sm:px-8" data-testid="footer">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="font-['Cormorant_Garamond'] text-xl text-white/90 mb-2">Coffee Grounds</p>
              <p className="text-xs text-white/50 leading-relaxed max-w-xs">
                Curating the finest coffee experiences across the United Kingdom since 2024.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-white/70 uppercase tracking-wider mb-3">Explore</p>
              <div className="space-y-1.5">
                <Link to="/" className="block text-xs text-white/50 hover:text-white/80 transition-colors">Home</Link>
                <Link to="/map" className="block text-xs text-white/50 hover:text-white/80 transition-colors">Cafe Map</Link>
                <Link to="/cukp" className="block text-xs text-white/50 hover:text-white/80 transition-colors">About CUKP</Link>
                <Link to="/contact" className="block text-xs text-white/50 hover:text-white/80 transition-colors">Contact Us</Link>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-white/70 uppercase tracking-wider mb-3">Admin</p>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                data-testid="footer-admin-login"
              >
                <Lock className="w-3 h-3" /> Admin Login
              </Link>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-white/30">Coffee Grounds &mdash; The Coffee United Kingdom Project</p>
          </div>
        </div>
      </footer>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
