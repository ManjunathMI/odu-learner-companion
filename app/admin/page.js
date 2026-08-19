// app/admin/page.js
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../../lib/auth';
import { get } from '../../lib/api';
import AdminPanel from '../../components/AdminPanel';
import LoadingSpinner from '../../components/LoadingSpinner';

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/');
        return;
      }
      const response = await get('/admin/me');
      if (response.isAdmin) {
        setIsAdmin(true);
      } else {
        setError('Not an admin');
        router.push('/');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setError('Access denied');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Checking admin status..." />;
  }

  if (error || !isAdmin) {
    return (
      <div className="error-container">
        <h2>Access Denied</h2>
        <p>You don't have admin access.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPanel />
      <style jsx>{`
        .admin-page {
          width: 100%;
        }

        .error-container {
          text-align: center;
          padding: 3rem;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export default Admin;
