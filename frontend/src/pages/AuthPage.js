import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Coffee, Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser, registerUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;
    if (mode === 'register') {
      if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
      result = await registerUser(name.trim(), email.trim(), password);
    } else {
      result = await loginUser(email.trim(), password);
    }

    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  const handleGoogleAuth = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#FDFBF7] flex items-center justify-center px-4" data-testid="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Coffee className="w-8 h-8 text-[#B55B49] mx-auto mb-3" />
          <h1 className="font-['Cormorant_Garamond'] text-3xl font-light text-[#2C1A12]">
            {mode === 'login' ? 'Welcome back' : 'Join Coffee Grind'}
          </h1>
          <p className="text-[#6B5744] text-sm mt-1">
            {mode === 'login'
              ? 'Sign in to rate cafes and join the conversation'
              : 'Create an account to share your coffee experiences'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-[#E8E3D9] rounded-lg p-6 shadow-sm">
          {/* Google Auth Button */}
          <Button
            type="button"
            onClick={handleGoogleAuth}
            variant="outline"
            className="w-full border-[#E8E3D9] text-[#2C1A12] hover:bg-[#E8E3D9]/30 gap-2 mb-5"
            data-testid="google-auth-btn"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E8E3D9]" />
            <span className="text-xs text-[#6B5744]/60 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-[#E8E3D9]" />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700" data-testid="auth-error">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <Label className="text-[#2C1A12] text-sm">Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5744]/50" />
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="pl-10 bg-[#FDFBF7] border-[#E8E3D9]"
                    required
                    data-testid="register-name-input"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-[#2C1A12] text-sm">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5744]/50" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 bg-[#FDFBF7] border-[#E8E3D9]"
                  required
                  data-testid="auth-email-input"
                />
              </div>
            </div>

            <div>
              <Label className="text-[#2C1A12] text-sm">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5744]/50" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Create a password (min 6 chars)' : 'Your password'}
                  className="pl-10 pr-10 bg-[#FDFBF7] border-[#E8E3D9]"
                  required
                  minLength={mode === 'register' ? 6 : undefined}
                  data-testid="auth-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5744]/50 hover:text-[#6B5744]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-xs text-[#B55B49]/80 mt-1.5">
                  Please create a unique password for Coffee Grind. Do not reuse your email password.
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B55B49] hover:bg-[#9a4d3e] text-white"
              data-testid="auth-submit-btn"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Toggle mode */}
          <div className="mt-5 text-center text-sm text-[#6B5744]">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-[#B55B49] hover:underline font-medium"
                  data-testid="switch-to-register"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); }}
                  className="text-[#B55B49] hover:underline font-medium"
                  data-testid="switch-to-login"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Admin link */}
        <div className="text-center mt-4">
          <Link to="/admin/login" className="text-xs text-[#6B5744]/40 hover:text-[#6B5744]/60 transition-colors" data-testid="admin-login-link">
            Admin access
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
