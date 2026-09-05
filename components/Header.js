// components/Header.js
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { apiFetch } from '@/lib/api';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'system';
  return localStorage.getItem('theme') || 'system';
};

const Header = () => {
  const [user, setUser] = useState(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState(getInitialTheme);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const getPreferredName = (currentUser) => {
    if (!currentUser) return 'Learner';

    const fullName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name;
    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName.trim();
    }

    const email = currentUser.email || '';
    if (email) {
      return email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    }

    return 'Learner';
  };

  const getInitials = (name) => {
    const parts = (name || 'Learner').split(/\s+/).filter(Boolean).slice(0, 2);
    if (!parts.length) return 'L';
    return parts.map((part) => part[0]?.toUpperCase() || '').join('');
  };

  const applyTheme = (themeName) => {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
  };

  const switchTheme = (themeName) => {
    setTheme(themeName);
  };

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(async ({ data: { user: currentUser } }) => {
      if (!currentUser) {
        setUser(null);
        setIsPlatformAdmin(false);
        return;
      }
      const sessionData = await apiFetch('/session');
      setUser({
        ...currentUser,
        email: sessionData.user?.email ?? currentUser.email,
        id: sessionData.user?.id ?? currentUser.id,
      });
      setIsPlatformAdmin(Boolean(sessionData.isPlatformAdmin));
    }).catch((error) => {
      console.error('Error loading user:', error);
      setUser(null);
      setIsPlatformAdmin(false);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="header-container">
      <div className="header-content">
        <div className="header-left">
          <Link href="/" className="brand" aria-label="ODU Learner Companion home">
            <span className="brand-mark" aria-hidden="true">OL</span>
            <span className="brand-copy"><strong>ODU Learner</strong><small>Companion</small></span>
          </Link>
        </div>

        <div className="header-right">
          <nav className="top-nav" aria-label="Main navigation">
            <Link href="/explore" className={pathname === '/' || pathname.startsWith('/explore') ? 'nav-link active' : 'nav-link'}>Explore</Link>
            {user && <Link href="/journey" className={pathname.startsWith('/journey') || pathname.startsWith('/paths') ? 'nav-link active' : 'nav-link'}>My Journey</Link>}
          </nav>

          {/* Theme Switcher */}
          <div className="theme-switcher">
            <button
              onClick={() => switchTheme('light')}
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              title="Light theme"
            >
              ☀️
            </button>
            <button
              onClick={() => switchTheme('dark')}
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              title="Dark theme"
            >
              🌙
            </button>
            <button
              onClick={() => switchTheme('neon')}
              className={`theme-btn ${theme === 'neon' ? 'active' : ''}`}
              title="Neon theme"
            >
              ⚡
            </button>
            <button
              onClick={() => switchTheme('system')}
              className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
              title="System theme"
            >
              💻
            </button>
          </div>

          {/* User Menu */}
          {!isLoading && (
            <div className="user-menu">
              {user ? (
                <div className="profile-menu-wrap">
                  <button
                    type="button"
                    className="profile-menu-trigger"
                    onClick={() => setIsProfileMenuOpen((current) => !current)}
                    aria-expanded={isProfileMenuOpen}
                  >
                    <span className="profile-avatar">{getInitials(getPreferredName(user))}</span>
                    <span className="profile-meta">
                      <strong>{getPreferredName(user)}</strong>
                      <small>{user.email}</small>
                    </span>
                  </button>

                  {isProfileMenuOpen && (
                    <div className="profile-dropdown">
                      <button type="button" className="dropdown-item" onClick={() => { router.push('/profile'); setIsProfileMenuOpen(false); }}>
                        Profile
                      </button>
                      <button type="button" className="dropdown-item" onClick={() => { router.push('/paths'); setIsProfileMenuOpen(false); }}>
                        My Journey
                      </button>
                      {isPlatformAdmin && (
                        <button type="button" className="dropdown-item" onClick={() => { router.push('/admin'); setIsProfileMenuOpen(false); }}>
                          Admin
                        </button>
                      )}
                      <button type="button" className="dropdown-item danger" onClick={() => { handleLogout(); setIsProfileMenuOpen(false); }}>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth" className="button-primary">
                  Sign In
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .header-container {
          background: color-mix(in srgb, var(--bg-secondary) 94%, transparent);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border-color);
          padding: 0.8rem 2rem;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
        }

        .header-left { flex: 1; }.brand { align-items: center; color: var(--text-primary); display: inline-flex; gap: .7rem; text-decoration: none; }.brand:hover { color: var(--text-primary); text-decoration: none; }.brand-mark { align-items: center; background: var(--accent-primary); border-radius: .35rem; color: #fff; display: inline-flex; font-family: var(--font-sans); font-size: .7rem; font-weight: 800; height: 2rem; justify-content: center; letter-spacing: .04em; width: 2rem; }.brand-copy { display: flex; flex-direction: column; line-height: 1.05; }.brand-copy strong { font-family: var(--font-display); font-size: 1.12rem; }.brand-copy small { color: var(--text-secondary); font-size: .7rem; font-weight: 700; letter-spacing: .06em; margin-top: .18rem; text-transform: uppercase; }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .top-nav {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-right: 0.25rem;
        }

        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: .88rem;
          font-weight: 700;
          padding: 0.5rem 0.7rem;
          border-radius: var(--radius-sm);
        }

        .nav-link.active {
          color: var(--accent-primary);
          background: rgba(25, 87, 184, 0.1);
        }

        .theme-switcher {
          display: flex;
          gap: 0.15rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 0.16rem;
        }

        .theme-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.4rem;
          font-size: .9rem;
          border-radius: 4px;
          transition: all 0.2s ease;
          color: var(--text-secondary);
        }

        .theme-btn:hover {
          background: var(--bg-secondary);
          color: var(--accent-primary);
        }

        .theme-btn.active {
          background: var(--accent-primary);
          color: white;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 1rem;
          position: relative;
        }

        .profile-menu-wrap {
          position: relative;
        }

        .profile-menu-trigger {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: .45rem;
          padding: 0.3rem 0.6rem 0.3rem 0.35rem;
          cursor: pointer;
          color: var(--text-primary);
          box-shadow: var(--shadow-sm);
        }

        .profile-avatar {
          width: 2.2rem;
          height: 2.2rem;
          border-radius: 50%;
          background: var(--accent-secondary);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .profile-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          line-height: 1.2;
        }

        .profile-meta strong {
          font-size: 0.9rem;
        }

        .profile-meta small {
          color: var(--text-secondary);
          max-width: 12rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .profile-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 0.6rem);
          min-width: 12rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-md);
          padding: 0.35rem;
          display: flex;
          flex-direction: column;
          z-index: 60;
        }

        .dropdown-item {
          border: none;
          background: transparent;
          color: var(--text-primary);
          text-align: left;
          padding: 0.7rem 0.8rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font: inherit;
        }

        .dropdown-item:hover {
          background: var(--bg-secondary);
        }

        .dropdown-item.danger {
          color: var(--accent-danger);
        }

        @media (max-width: 768px) {
          .header-content {
            gap: 1rem;
          }

          .brand-copy strong { font-size: 1rem; }

          .theme-switcher {
            gap: 0.25rem;
          }

          .theme-btn {
            padding: 0.4rem;
            font-size: 0.9rem;
          }

          .profile-meta { display: none; }
        }
      `}</style>
    </header>
  );
};

export default Header;