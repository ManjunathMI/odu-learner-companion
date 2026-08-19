// components/Header.js
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '../lib/supabase/client';

const Header = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState('system');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadUser();
    loadTheme();
  }, []);

  const loadUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  };

  const applyTheme = (themeName) => {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
  };

  const switchTheme = (themeName) => {
    setTheme(themeName);
    applyTheme(themeName);
  };

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
          <h1 className="header-title">ODU Learner Companion</h1>
        </div>

        <div className="header-right">
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
                <div className="user-authenticated">
                  <span className="user-email">{user.email}</span>
                  <button onClick={handleLogout} className="button-secondary">
                    Logout
                  </button>
                </div>
              ) : (
                <a href="/auth" className="button-primary">
                  Sign In
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .header-container {
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          padding: 1rem 2rem;
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

        .header-left {
          flex: 1;
        }

        .header-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .theme-switcher {
          display: flex;
          gap: 0.5rem;
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 0.25rem;
        }

        .theme-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          font-size: 1rem;
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
        }

        .user-authenticated {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-email {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .button-primary,
        .button-secondary {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          display: inline-block;
        }

        .button-primary {
          background: var(--accent-primary);
          color: white;
          border: none;
        }

        .button-primary:hover {
          opacity: 0.9;
        }

        .button-secondary {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .button-secondary:hover {
          background: var(--bg-tertiary);
        }

        @media (max-width: 768px) {
          .header-content {
            gap: 1rem;
          }

          .header-title {
            font-size: 1.2rem;
          }

          .theme-switcher {
            gap: 0.25rem;
          }

          .theme-btn {
            padding: 0.4rem;
            font-size: 0.9rem;
          }

          .user-email {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;