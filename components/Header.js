// components/Header.js
'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '../lib/supabase/client';
import { apiFetch } from '@/lib/api';
import { resolveThemePreference } from '../lib/theme-preference';

const subscribeToTheme = (onStoreChange) => {
  window.addEventListener('odu-theme-change', onStoreChange);
  return () => window.removeEventListener('odu-theme-change', onStoreChange);
};

const getThemeSnapshot = () => resolveThemePreference(document.documentElement.dataset.theme, false);
const getServerThemeSnapshot = () => 'light';

const Header = () => {
  const [user, setUser] = useState(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [profile, setProfile] = useState({ display_name: '', avatar_url: null });
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const getPreferredName = (currentUser) => {
    if (!currentUser) return 'Learner';

    if (typeof profile.display_name === 'string' && profile.display_name.trim()) return profile.display_name.trim();

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
    try {
      localStorage.setItem('theme', themeName);
    } catch {}
    window.dispatchEvent(new Event('odu-theme-change'));
  };

  const switchTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  };

  useEffect(() => {
    const supabase = createClient();
    const loadIdentity = async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setIsPlatformAdmin(false);
        setProfile({ display_name: '', avatar_url: null });
        setAvatarFailed(false);
        return;
      }
      const sessionData = await apiFetch('/session');
      const profileData = await apiFetch('/profile');
      setUser({
        ...currentUser,
        email: sessionData.user?.email ?? currentUser.email,
        id: sessionData.user?.id ?? currentUser.id,
      });
      setProfile({
        display_name: profileData.display_name ?? '',
        avatar_url: profileData.avatar_url ?? null,
      });
      setAvatarFailed(false);
      setIsPlatformAdmin(Boolean(sessionData.isPlatformOwner));
    };

    const loadCurrentUser = () => supabase.auth.getUser().then(({ data: { user: currentUser } }) => loadIdentity(currentUser));
    void loadCurrentUser().catch((error) => {
      console.error('Error loading user:', error);
      setUser(null);
      setIsPlatformAdmin(false);
    }).finally(() => setIsLoading(false));

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void loadCurrentUser().catch((error) => console.error('Error refreshing user:', error));
    });
    const handleProfileUpdate = (event) => {
      const updatedProfile = event.detail;
      setProfile({
        display_name: updatedProfile.display_name ?? '',
        avatar_url: updatedProfile.avatar_url ?? null,
      });
      setAvatarFailed(false);
    };
    window.addEventListener('odu-profile-updated', handleProfileUpdate);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('odu-profile-updated', handleProfileUpdate);
    };
  }, []);

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

          <button
            type="button"
            role="switch"
            aria-label="Dark mode"
            aria-checked={theme === 'dark'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`theme-toggle ${theme === 'dark' ? 'is-dark' : ''}`}
            onClick={switchTheme}
          >
            <span className="theme-toggle-thumb" aria-hidden="true" />
          </button>

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
                    <span className="profile-avatar">
                      {profile.avatar_url && !avatarFailed ? <img src={profile.avatar_url} alt="" onError={() => setAvatarFailed(true)} /> : getInitials(getPreferredName(user))}
                    </span>
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
                      <button type="button" className="dropdown-item" onClick={() => { router.push('/journey'); setIsProfileMenuOpen(false); }}>
                        My Journey
                      </button>
                      <button type="button" className="dropdown-item" onClick={() => { router.push('/account'); setIsProfileMenuOpen(false); }}>
                        Manage Account
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

        .header-left { flex: 1; }.brand { align-items: center; color: var(--text-primary); display: inline-flex; gap: .7rem; text-decoration: none; }.brand:hover { color: var(--text-primary); text-decoration: none; }.brand-mark { align-items: center; background: var(--accent-gradient); border-radius: .35rem; color: var(--text-on-accent); display: inline-flex; font-family: var(--font-sans); font-size: .7rem; font-weight: 800; height: 2rem; justify-content: center; letter-spacing: .04em; width: 2rem; }.brand-copy { display: flex; flex-direction: column; line-height: 1.05; }.brand-copy strong { font-family: var(--font-display); font-size: 1.12rem; }.brand-copy small { color: var(--text-secondary); font-size: .7rem; font-weight: 700; letter-spacing: .06em; margin-top: .18rem; text-transform: uppercase; }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .top-nav {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
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
          background: var(--surface-accent);
        }

        .theme-toggle {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          width: 3.25rem;
          height: 1.9rem;
          padding: 0 0.35rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-full);
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          cursor: pointer;
          transition: background-color 180ms ease, border-color 180ms ease;
        }

        .theme-toggle:disabled {
          cursor: default;
        }

        .theme-toggle-thumb {
          position: absolute;
          top: 0.16rem;
          left: 0.16rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.48rem;
          height: 1.48rem;
          border: 1px solid var(--border-color);
          border-radius: 50%;
          background: var(--bg-primary);
          box-shadow: var(--shadow-sm);
          transition: transform 180ms ease;
        }

        .theme-toggle-thumb::before {
          content: "☼";
          color: var(--accent-primary);
          font-size: 0.78rem;
          line-height: 1;
        }

        .theme-toggle.is-dark .theme-toggle-thumb::before {
          content: "☾";
          color: var(--accent-violet);
        }

        .theme-toggle.is-dark .theme-toggle-thumb {
          transform: translateX(1.34rem);
        }

        .theme-toggle:focus-visible {
          outline: 3px solid var(--focus-ring);
          outline-offset: 3px;
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
          overflow: hidden;
        }

        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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

        @media (max-width: 600px) {
          .header-container { padding: .65rem 1rem; }
          .header-content { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .5rem; }
          .header-left { grid-column: 1; grid-row: 1; min-width: 0; }
          .brand-mark { flex-shrink: 0; }
          .brand-copy strong { white-space: nowrap; }
          .header-right { display: contents; }
          .user-menu { grid-column: 2; grid-row: 1; justify-self: end; }
          .top-nav { grid-column: 1; grid-row: 2; margin: 0; }
          .nav-link { font-size: .8rem; padding: .45rem .35rem; white-space: nowrap; }
          .theme-toggle { grid-column: 2; grid-row: 2; justify-self: end; }
        }

        @media (max-width: 768px) {
          .header-content {
            column-gap: .5rem;
          }

          .brand-copy strong { font-size: 1rem; }

          .profile-meta { display: none; }
        }
      `}</style>
    </header>
  );
};

export default Header;