import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ShopDetail from './pages/ShopDetail';
import MapView from './pages/MapView';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AuthCallback from './pages/AuthCallback';
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
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop/:shopId" element={<ShopDetail />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      {/* Footer */}
      <footer className="bg-[#2C1A12] text-white/60 py-10 px-4 sm:px-8" data-testid="footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-['Cormorant_Garamond'] text-lg text-white/80">UK Coffee Guide</p>
          <p className="text-xs">Curating the finest coffee experiences across the United Kingdom</p>
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
