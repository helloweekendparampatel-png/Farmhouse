'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { errorMessageFromUnknown } from '../lib/api-errors';
import { useAuth } from '../lib/auth-context';
import { apiGet, apiPost } from '../lib/backend-api';
import { PageIntro, SectionCard, StatCard } from '../ui/admin-ui';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export default function UsersPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') {
      router.replace('/farms');
    }
  }, [user, loading, router]);

  const loadUsers = async () => {
    if (!token) return;
    try {
      const data = await apiGet<User[]>('/users', token);
      setUsers(data);
    } catch (err: any) {
      setError(errorMessageFromUnknown(err, 'Failed to load users'));
    }
  };

  useEffect(() => {
    if (token) {
      void loadUsers();
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiPost<User>('/users', token, {
        email,
        name,
        password,
      });
      setEmail('');
      setName('');
      setPassword('');
      await loadUsers();
    } catch (err: any) {
      setError(errorMessageFromUnknown(err, 'Failed to create user'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="page">
      <PageIntro
        eyebrow="Access"
        title="Team administration"
        description="Create new admin accounts and review the current access roster."
      />
      {error && <div className="error-banner">{error}</div>}
      <div className="stat-grid">
        <StatCard
          label="Active users"
          value={users.length}
          meta="Accounts currently listed in the system."
        />
        <StatCard
          label="Role coverage"
          value="Admin"
          meta="This screen remains restricted to administrators only."
        />
      </div>
      <section className="split-grid">
        <SectionCard
          title="Create user"
          description="Add a new account without changing the existing submission flow."
        >
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              <span className="field-label">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              <span className="field-label">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="full-width">
              <span className="field-label">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <div className="full-width farm-row-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create user'}
              </button>
            </div>
          </form>
        </SectionCard>
        <SectionCard
          title="Admin note"
          description="Use dedicated user accounts instead of shared credentials for better accountability."
        >
          <div className="empty-panel">
            <h3>Access hygiene</h3>
            <p>
              The UI is refreshed, but role rules and user creation logic stay exactly the same.
            </p>
          </div>
        </SectionCard>
      </section>

      <SectionCard
        title="Existing users"
        description="A current snapshot of all configured admin users."
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-state">
                    No users found.
                  </td>
                </tr>
              ) : (
                <>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="cell-title">{u.email}</td>
                      <td>{u.name}</td>
                      <td>
                        <span className="status-chip status-chip--success">{u.role}</span>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
