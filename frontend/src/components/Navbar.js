import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Coffee, MapPin, User, LogOut, Settings, Menu, X, FlaskConical, KeyRound } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordForm.newPass.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordError('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      await axios.post(`${API}/auth/change-password`, {
        current_password: passwordForm.current,
        new_password: passwordForm.newPass,
      }, { withCredentials: true });
      setPasswordSuccess('Password updated successfully');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      setTimeout(() => setShowPasswordDialog(false), 1500);
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const navLinkClass = (path) =>
    `text-sm font-medium transition-colors ${
      location.pathname === path ? 'text-[#B55B49]' : 'text-[#2C1A12] hover:text-[#B55B49]'
    }`;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-[#FDFBF7]/95 backdrop-blur-xl border-b border-[#E8E3D9]"
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="flex items-center h-14 relative">
          {/* Left — Coffee Grinder Logo */}
          <Link to="/" className="shrink-0 hover:opacity-80 transition-opacity" data-testid="nav-logo">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" strokeLinecap="round" strokeLinejoin="round">
              {/* Crank handle knob */}
              <circle cx="20" cy="10" r="4" stroke="#2C1A12" strokeWidth="3.5" fill="none"/>
              {/* Crank arm */}
              <line x1="24" y1="10" x2="48" y2="10" stroke="#2C1A12" strokeWidth="3.5"/>
              {/* Crank funnel */}
              <path d="M44 4 L52 4 L50 10 L46 10 Z" stroke="#2C1A12" strokeWidth="3.5" fill="none"/>
              {/* Top body */}
              <rect x="14" y="14" width="28" height="28" rx="3" stroke="#2C1A12" strokeWidth="3.5" fill="none"/>
              {/* Viewing slot */}
              <rect x="25" y="20" width="6" height="16" rx="3" stroke="#2C1A12" strokeWidth="3.5" fill="none"/>
              {/* Divider line */}
              <line x1="14" y1="42" x2="42" y2="42" stroke="#2C1A12" strokeWidth="3.5"/>
              {/* Drawer */}
              <rect x="14" y="42" width="28" height="16" rx="3" stroke="#2C1A12" strokeWidth="3.5" fill="none"/>
              {/* Drawer handle */}
              <path d="M30 52 L34 52 L34 55" stroke="#2C1A12" strokeWidth="3" fill="none"/>
            </svg>
          </Link>

          {/* Center — Navigation Links */}
          <div className="hidden md:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">
            <Link to="/" className={navLinkClass('/')} data-testid="nav-home">
              Home
            </Link>
            <Link to="/map" className={`${navLinkClass('/map')} flex items-center gap-1.5`} data-testid="nav-cafe">
              <MapPin className="w-3.5 h-3.5" /> Cafe
            </Link>
            <Link to="/labs" className={`${navLinkClass('/labs')} flex items-center gap-1.5`} data-testid="nav-labs">
              <FlaskConical className="w-3.5 h-3.5" /> Labs
            </Link>
            <Link to="/cukp" className={navLinkClass('/cukp')} data-testid="nav-cukp">
              CUKP
            </Link>
            <Link to="/contact" className={navLinkClass('/contact')} data-testid="nav-contact">
              Contact Us
            </Link>
          </div>

          {/* Right — Auth */}
          <div className="hidden md:flex items-center gap-3 ml-auto">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 cursor-pointer" data-testid="user-menu-trigger">
                    <Avatar className="w-8 h-8 border border-[#E8E3D9]">
                      <AvatarImage src={user.picture} />
                      <AvatarFallback className="bg-[#D4B996] text-[#2C1A12] text-sm">
                        {(user.name || user.email || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-[#2C1A12] font-medium">{user.name || user.email}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border-[#E8E3D9] w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-[#2C1A12]">{user.name || 'User'}</p>
                    <p className="text-xs text-[#6B5744]">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-[#E8E3D9]" />
                  {(user.role === 'admin' || user.role === 'contributor') && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer" data-testid="nav-admin-link">
                        <Settings className="w-4 h-4 mr-2" /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.password_hash !== undefined || !user.google_id ? (
                    <DropdownMenuItem onClick={() => { setShowPasswordDialog(true); setPasswordError(''); setPasswordSuccess(''); }} className="cursor-pointer" data-testid="nav-change-password">
                      <KeyRound className="w-4 h-4 mr-2" /> Change Password
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600" data-testid="nav-logout-btn">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button
                  size="sm"
                  className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2"
                  data-testid="nav-signin-btn"
                >
                  <User className="w-4 h-4" /> Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-[#2C1A12] touch-manipulation"
            onClick={(e) => { e.stopPropagation(); setMobileOpen(prev => !prev); }}
            data-testid="mobile-menu-toggle"
            type="button"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#E8E3D9] py-4 space-y-3" data-testid="mobile-nav">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-[#6B5744] hover:text-[#2C1A12] py-1">
              Home
            </Link>
            <Link to="/map" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-[#6B5744] hover:text-[#2C1A12] py-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Cafe
            </Link>
            <Link to="/labs" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-[#6B5744] hover:text-[#2C1A12] py-1 flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5" /> Labs
            </Link>
            <Link to="/cukp" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-[#6B5744] hover:text-[#2C1A12] py-1">
              CUKP
            </Link>
            <Link to="/contact" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-[#6B5744] hover:text-[#2C1A12] py-1">
              Contact Us
            </Link>
            {user ? (
              <>
                <div className="text-sm text-[#6B5744] py-1">Signed in as {user.name || user.email}</div>
                {(user.role === 'admin' || user.role === 'contributor') && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-[#6B5744] hover:text-[#2C1A12] py-1">
                    Dashboard
                  </Link>
                )}
                <button onClick={() => { logout(); setMobileOpen(false); }} className="text-sm text-red-600 py-1">
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#B55B49] py-1">
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-white border-[#E8E3D9] max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-['Cormorant_Garamond'] text-xl text-[#2C1A12]">Change Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4 mt-2">
            {passwordError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2" data-testid="password-change-error">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2" data-testid="password-change-success">{passwordSuccess}</p>
            )}
            <div>
              <Label className="text-[#2C1A12] text-sm">Current Password</Label>
              <Input
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                required
                className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]"
                data-testid="current-password-input"
              />
            </div>
            <div>
              <Label className="text-[#2C1A12] text-sm">New Password</Label>
              <Input
                type="password"
                value={passwordForm.newPass}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                required
                minLength={6}
                className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]"
                data-testid="new-password-input"
              />
            </div>
            <div>
              <Label className="text-[#2C1A12] text-sm">Confirm New Password</Label>
              <Input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                required
                minLength={6}
                className="mt-1 bg-[#FDFBF7] border-[#E8E3D9]"
                data-testid="confirm-password-input"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={passwordLoading} className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white" data-testid="submit-password-change">
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowPasswordDialog(false)} className="border-[#E8E3D9] text-[#6B5744]">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
