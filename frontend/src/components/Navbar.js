import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Coffee, MapPin, User, LogOut, Settings, Menu, X, FlaskConical } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
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
        <div className="flex items-center justify-between h-14">
          {/* Left — Navigation Links */}
          <div className="hidden md:flex items-center gap-7">
            <Link to="/" className={navLinkClass('/')} data-testid="nav-home">
              Home
            </Link>
            <Link to="/map" className={`${navLinkClass('/map')} flex items-center gap-1.5`} data-testid="nav-cafe">
              <MapPin className="w-3.5 h-3.5" /> Cafe
            </Link>
            <Link to="/cukp" className={navLinkClass('/cukp')} data-testid="nav-about">
              About
            </Link>
            <Link to="/labs" className={`${navLinkClass('/labs')} flex items-center gap-1.5`} data-testid="nav-labs">
              <FlaskConical className="w-3.5 h-3.5" /> Labs
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
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer" data-testid="nav-admin-link">
                        <Settings className="w-4 h-4 mr-2" /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600" data-testid="nav-logout-btn">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={handleGoogleLogin}
                size="sm"
                className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2"
                data-testid="nav-google-login-btn"
              >
                <User className="w-4 h-4" /> Sign In
              </Button>
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
            <Link to="/cukp" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-[#6B5744] hover:text-[#2C1A12] py-1">
              About
            </Link>
            <Link to="/labs" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-[#6B5744] hover:text-[#2C1A12] py-1 flex items-center gap-1">
              <FlaskConical className="w-3.5 h-3.5" /> Labs
            </Link>
            <Link to="/contact" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-[#6B5744] hover:text-[#2C1A12] py-1">
              Contact Us
            </Link>
            {user ? (
              <>
                <div className="text-sm text-[#6B5744] py-1">Signed in as {user.name || user.email}</div>
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-[#6B5744] hover:text-[#2C1A12] py-1">
                    Admin Dashboard
                  </Link>
                )}
                <button onClick={() => { logout(); setMobileOpen(false); }} className="text-sm text-red-600 py-1">
                  Sign Out
                </button>
              </>
            ) : (
              <button onClick={handleGoogleLogin} className="text-sm font-medium text-[#B55B49] py-1">
                Sign In with Google
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
