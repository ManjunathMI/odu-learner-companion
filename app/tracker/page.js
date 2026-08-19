// app/tracker/page.js
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '../../lib/auth';
import { get } from '../../lib/api';
import TrackerBoard from '../../components/TrackerBoard';
import LoadingSpinner from '../../components/LoadingSpinner';

const Tracker = () => {
  const [user, setUser] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/');
        return;
      }
      setUser(currentUser);
      const statusResponse = await get('/learners/status');
      if (statusResponse.status !== 'approved') {
        router.push('/');
        return;
      }
      setIsApproved(true);
      setRoomCode(statusResponse.roomCode || '');
    } catch (error) {
      console.error('Error checking access:', error);
      setError('Access denied');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Checking access..." />;
  }

  if (error || !isApproved) {
    return (
      <div className="error-container">
        <h2>Access Denied</h2>
        <p>You don't have access to the tracker.</p>
      </div>
    );
  }

  return (
    <div className="tracker-page">
      <TrackerBoard roomCode={roomCode} />
      <style jsx>{`
        .tracker-page {
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

export default Tracker;
