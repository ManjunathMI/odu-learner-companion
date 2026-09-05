// components/Footer.js
'use client';

import React from 'react';
import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section">
          <h3>ODU Learner Companion</h3>
          <p>A collaborative learning companion for students, professionals, and lifelong learners.</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <Link href="/explore">Explore</Link>
            </li>
            <li>
              <Link href="/journey">My Journey</Link>
            </li>
            <li>
              <Link href="/auth">Sign In</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li>
              <a href="https://www.linkedin.com/in/manjunath-islampure/" target="_blank" rel="noreferrer">Contact Us</a>
            </li>
            <li>
              <Link href="/docs">Documentation</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} ODU Learner Companion. All rights reserved.</p>
      </div>

      <style jsx>{`
        .footer-container {
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 2.75rem 2rem 1.5rem;
          margin-top: auto;
        }

        .footer-content {
          max-width: 1120px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2.5rem;
          margin-bottom: 2rem;
        }

        .footer-section h3 {
          margin: 0 0 1rem 0;
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .footer-section h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--text-primary);
        }

        .footer-section p {
          margin: 0;
          font-size: 0.9rem;
          line-height: 1.5;
          color: var(--text-tertiary);
        }

        .footer-section ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .footer-section li {
          margin-bottom: 0.65rem;
        }

        .footer-section a {
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.2s ease;
          font-size: 0.88rem;
        }

        .footer-section a:hover {
          color: var(--accent-primary);
        }

        .footer-bottom {
          max-width: 1400px;
          margin: 0 auto;
          border-top: 1px solid var(--border-color);
          padding-top: 1.5rem;
          text-align: center;
        }

        .footer-bottom p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-tertiary);
        }

        @media (max-width: 768px) {
          .footer-container {
            padding: 1.5rem;
          }

          .footer-content {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;