import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const match = hash.match(/session_id=([^&]+)/);
      if (!match) {
        navigate('/');
        return;
      }
      const sessionId = match[1];

      try {
        const res = await axios.post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true });
        setUser(res.data);
        // Clear hash and navigate
        window.history.replaceState(null, '', window.location.pathname);
        navigate('/', { state: { user: res.data } });
      } catch (err) {
        console.error('Auth callback failed:', err);
        navigate('/');
      }
    };

    processAuth();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]" data-testid="auth-callback">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#B55B49] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#6B5744]">Signing you in...</p>
      </div>
    </div>
  );
}
