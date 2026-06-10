'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { errorMessageFromUnknown } from '../lib/api-errors';
import { useAuth } from '../lib/auth-context';
import { HeaderLink, PageIntro, SectionCard } from '../ui/admin-ui';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, updateProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setMessage(null);
      setError(null);
    }
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError('Email is required.');
      return;
    }

    if (password || confirmPassword) {
      if (password.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password and confirmation do not match.');
        return;
      }
    }

    const emailChanged = trimmed.toLowerCase() !== user.email.toLowerCase();
    const passwordChange = password.length > 0;
    if (!emailChanged && !passwordChange) {
      setError('Change your email or enter a new password to save.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        email: trimmed,
        ...(passwordChange ? { password } : {}),
      });
      setPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setMessage('Profile updated.');
    } catch (err: unknown) {
      setError(errorMessageFromUnknown(err, 'Something went wrong.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageIntro
        eyebrow="Account"
        title="Profile"
        description="Update your sign-in email or password."
        actions={
          <HeaderLink href={user.role === 'ADMIN' ? '/dashboard' : '/farms'}>
            {user.role === 'ADMIN' ? 'Back to overview' : 'Back to farms'}
          </HeaderLink>
        }
      />

      <SectionCard
        title="Sign-in details"
        description="Changes apply immediately. Use a strong password if you rotate it."
      >
        <form onSubmit={handleSubmit} className="form-grid full-width">
          <label className="full-width">
            <span className="field-label">
              Email <span className="field-required">*</span>
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="full-width">
            <span className="field-label">New password</span>
            <div className="password-field-wrap">
              <input
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
              <button
                type="button"
                className="password-field-toggle"
                onClick={() => setShowNewPassword((v) => !v)}
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                aria-pressed={showNewPassword}
              >
                {showNewPassword ? (
                  <EyeOff size={18} strokeWidth={2} aria-hidden />
                ) : (
                  <Eye size={18} strokeWidth={2} aria-hidden />
                )}
              </button>
            </div>
          </label>
          <label className="full-width">
            <span className="field-label">Confirm new password</span>
            <div className="password-field-wrap">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat if changing password"
              />
              <button
                type="button"
                className="password-field-toggle"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} strokeWidth={2} aria-hidden />
                ) : (
                  <Eye size={18} strokeWidth={2} aria-hidden />
                )}
              </button>
            </div>
          </label>
          {error && <p className="full-width field-error-text">{error}</p>}
          {message && <p className="full-width profile-page-success">{message}</p>}
          <div className="full-width farm-row-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
