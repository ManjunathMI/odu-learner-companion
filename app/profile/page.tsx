'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import MultilingualLoader from '@/components/MultilingualLoader';

interface ProfileData {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  social_links: string[];
  repo_links: string[];
  profile_visibility: 'joined_paths_only' | 'public';
}

const defaultProfile: ProfileData = {
  user_id: '',
  display_name: '',
  avatar_url: null,
  bio: '',
  social_links: [],
  repo_links: [],
  profile_visibility: 'joined_paths_only',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(defaultProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiFetch<ProfileData>('/profile')
      .then((data) => setProfile({ ...defaultProfile, ...data, social_links: data.social_links ?? [], repo_links: data.repo_links ?? [] }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field: keyof ProfileData, value: string | null | string[]) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        social_links: profile.social_links,
        repo_links: profile.repo_links,
        profile_visibility: profile.profile_visibility,
      };

      const savedProfile = await apiFetch<ProfileData>('/profile', { method: 'PUT', body: payload });
      window.dispatchEvent(new CustomEvent('odu-profile-updated', { detail: savedProfile }));
      setMessage('Profile saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <MultilingualLoader message="Preparing your profile" />;

  return (
    <main className="profile-page">
      <div className="panel">
        <header className="page-header">
          <div>
            <p className="eyebrow">Your profile</p>
            <h1>Public learner identity</h1>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="profile-form">
          <label>
            Display name
            <input value={profile.display_name} onChange={(e) => handleChange('display_name', e.target.value)} placeholder="Jane Learner" />
          </label>

          <label>
            Avatar URL
            <input value={profile.avatar_url ?? ''} onChange={(e) => handleChange('avatar_url', e.target.value || null)} placeholder="https://example.com/avatar.png" />
          </label>

          <label>
            Short bio
            <textarea value={profile.bio ?? ''} onChange={(e) => handleChange('bio', e.target.value || null)} rows={5} placeholder="Tell other learners a bit about your goals." />
          </label>

          <label>
            Profile visibility
            <select value={profile.profile_visibility} onChange={(e) => handleChange('profile_visibility', e.target.value as 'joined_paths_only' | 'public')}>
              <option value="joined_paths_only">Joined paths only</option>
              <option value="public">Public</option>
            </select>
          </label>

          <label>
            Social links
            <textarea value={profile.social_links.join(', ')} onChange={(e) => handleChange('social_links', e.target.value.split(',').map((value) => value.trim()).filter(Boolean))} rows={3} placeholder="https://linkedin.com/in/you, https://github.com/you" />
          </label>

          <label>
            Repository links
            <textarea value={profile.repo_links.join(', ')} onChange={(e) => handleChange('repo_links', e.target.value.split(',').map((value) => value.trim()).filter(Boolean))} rows={3} placeholder="https://github.com/you/portfolio" />
          </label>

          {error && <p className="error">{error}</p>}
          {message && <p className="success">{message}</p>}

          <button className="button-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      <style jsx>{`
        .profile-page { max-width: 820px; margin: 0 auto; padding: 2rem 1rem; }
        .panel {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          padding: 1.5rem;
        }
        .page-header { margin-bottom: 1rem; }
        .eyebrow {
          text-transform: uppercase;
          letter-spacing: .08em;
          font-size: .75rem;
          font-weight: 700;
          color: var(--text-secondary);
          margin: 0 0 .35rem;
        }
        .page-header h1 { margin: 0; }
        .profile-form { display: flex; flex-direction: column; gap: 1rem; }
        .profile-form label { display: flex; flex-direction: column; gap: .45rem; font-weight: 600; }
        .profile-form input,
        .profile-form textarea,
        .profile-form select {
          width: 100%;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-primary);
          color: var(--text-primary);
          padding: .8rem .9rem;
          font: inherit;
        }
        .error { color: var(--accent-danger); }
        .success { color: var(--accent-primary); }
      `}</style>
    </main>
  );
}
