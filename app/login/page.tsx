'use client';

import { FormEvent, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Eye, EyeOff, Images, ShieldCheck, Trees, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { errorMessageFromUnknown } from '../lib/api-errors';
import { useAuth } from '../lib/auth-context';

type LoginStats = { farms: number; users: number; decorMedia: number };

const AUTH_HIGHLIGHTS: { label: string; key: keyof LoginStats; Icon: LucideIcon }[] = [
  { key: 'farms', label: 'Live properties in catalog', Icon: Trees },
  { key: 'users', label: 'Admin & team accounts', Icon: Users },
  { key: 'decorMedia', label: 'Decor & photography sets', Icon: Images },
];

function formatStat(n: number | null) {
  if (n === null) return '—';
  return n.toLocaleString();
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [stats, setStats] = useState<LoginStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/login-stats', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as LoginStats;
        if (!cancelled && data && typeof data.farms === 'number') {
          setStats({
            farms: data.farms,
            users: data.users,
            decorMedia: data.decorMedia ?? 0,
          });
        }
      } catch {
        /* keep null stats; hero still renders */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(errorMessageFromUnknown(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <section className="auth-hero">
        <div className="auth-hero__mesh" aria-hidden />
        <div className="auth-hero__glow auth-hero__glow--a" aria-hidden />
        <div className="auth-hero__glow auth-hero__glow--b" aria-hidden />
        <div className="auth-hero__orbit" aria-hidden>
          <span className="auth-hero__orbit-ring" />
          <span className="auth-hero__orbit-mark">F</span>
        </div>
        <div className="auth-hero__content">
          <span className="auth-hero__badge">Farmhouse admin</span>
          <h1>Manage premium stays with a polished control room.</h1>
          <p className="auth-hero__lede">
            Review listings, align your operations team, and keep decor, photography, and guest
            touchpoints consistent — all from one calm, focused workspace.
          </p>
          <div className="auth-highlights">
            {AUTH_HIGHLIGHTS.map(({ key, label, Icon }) => (
              <div key={key} className="auth-highlight-card">
                <div className="auth-highlight-card__icon-wrap" aria-hidden>
                  <Icon className="auth-highlight-card__icon" size={22} strokeWidth={1.65} />
                </div>
                <div className="auth-highlight-card__body">
                  <strong className="auth-highlight-card__value">
                    {formatStat(stats ? stats[key] : null)}
                  </strong>
                  <span className="auth-highlight-card__label">{label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel__sheen" aria-hidden />
        <form className="card auth-form-card" onSubmit={handleSubmit}>
          <div className="auth-form-card__head">
            <div className="auth-form-card__mark" aria-hidden>
              <span>F</span>
            </div>
            <div>
              <h2>Welcome back</h2>
              <p className="auth-form-card__sub">Sign in to open your admin workspace.</p>
            </div>
          </div>
          <p className="auth-form-card__trust">
            <ShieldCheck size={16} strokeWidth={2} aria-hidden />
            Encrypted session · role-based access
          </p>
          <label>
            <span className="field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="username"
              required
            />
          </label>
          <label>
            <span className="field-label">Password</span>
            <div className="password-field-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-field-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={2} aria-hidden />
                ) : (
                  <Eye size={18} strokeWidth={2} aria-hidden />
                )}
              </button>
            </div>
          </label>
          {error && <div className="error-banner">{error}</div>}
          <div className="auth-actions">
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? (
                'Signing in…'
              ) : (
                <>
                  Enter dashboard
                  <ArrowRight size={18} strokeWidth={2.25} aria-hidden />
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
