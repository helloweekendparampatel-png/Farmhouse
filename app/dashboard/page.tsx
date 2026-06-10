'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { errorMessageFromUnknown } from '../lib/api-errors';
import { apiGet } from '../lib/backend-api';
import { PageIntro, SectionCard, StatCard } from '../ui/admin-ui';

type DashboardSummary = {
  totalFarms: number;
  popularFarms: number;
  highRatedFarms: number;
  totalUsers: number;
  totalDecorations: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [farmCount, setFarmCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [decorationCount, setDecorationCount] = useState<number | null>(null);
  const [popularFarmCount, setPopularFarmCount] = useState<number | null>(null);
  const [highRatedCount, setHighRatedCount] = useState<number | null>(null);
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

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const summary = await apiGet<DashboardSummary>('/dashboard-summary', token);
        setFarmCount(summary.totalFarms);
        setUserCount(summary.totalUsers);
        setDecorationCount(summary.totalDecorations);
        setPopularFarmCount(summary.popularFarms);
        setHighRatedCount(summary.highRatedFarms);
      } catch (err: any) {
        setError(errorMessageFromUnknown(err, 'Failed to load analytics'));
      }
    };
    void load();
  }, [token]);

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="page">
      <PageIntro
        eyebrow="Overview"
        title="Operations dashboard"
        description="Track inventory, staff access, and premium listings from a single control surface."
      />
      {error && <div className="error-banner">{error}</div>}
      <SectionCard
        title="Portfolio performance"
        description="A quick operational snapshot of the admin system."
      >
        <div className="dashboard-grid">
          <StatCard label="Total farms" value={farmCount !== null ? farmCount : '—'} />
          <StatCard label="Total users" value={userCount !== null ? userCount : '—'} />
          <StatCard
            label="Total decorations"
            value={decorationCount !== null ? decorationCount : '—'}
          />
          <div className="stat-card">
            <div className="stat-label">Popular farms</div>
            <div className="stat-value">{popularFarmCount !== null ? popularFarmCount : '—'}</div>
            <div className="stat-meta">Properties currently highlighted to customers.</div>
            {farmCount !== null && popularFarmCount !== null && farmCount > 0 && (
              <div className="bar-row">
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.min(100, Math.round((popularFarmCount / farmCount) * 100))}%`,
                  }}
                />
              </div>
            )}
          </div>
          <div className="stat-card">
            <div className="stat-label">Rating ≥ 4.5</div>
            <div className="stat-value">{highRatedCount !== null ? highRatedCount : '—'}</div>
            <div className="stat-meta">High-performing listings based on customer feedback.</div>
            {farmCount !== null && highRatedCount !== null && farmCount > 0 && (
              <div className="bar-row">
                <div
                  className="bar-fill bar-fill--secondary"
                  style={{
                    width: `${Math.min(100, Math.round((highRatedCount / farmCount) * 100))}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </SectionCard>
      <section className="split-grid">
        <SectionCard
          title="Management focus"
          description="Use these figures to prioritize updates across the platform."
        >
          <div className="list-grid">
            <div className="list-panel">
              <h3>Catalog health</h3>
              <ul>
                <li>{farmCount ?? 0} total farms available in the system.</li>
                <li>{popularFarmCount ?? 0} are marked as popular.</li>
                <li>{highRatedCount ?? 0} have ratings of 4.5 or above.</li>
              </ul>
            </div>
            <div className="list-panel">
              <h3>Administration</h3>
              <ul>
                <li>{userCount ?? 0} total users can access the admin workflows.</li>
                <li>{decorationCount ?? 0} decoration records are currently maintained.</li>
                <li>All values are read directly from the existing APIs.</li>
              </ul>
            </div>
          </div>
        </SectionCard>
        <SectionCard
          title="Activity note"
          description="This dashboard is presentation-only and keeps existing analytics behavior intact."
        >
          <div className="empty-panel">
            <h3>Professionalized interface</h3>
            <p>The dashboard now emphasizes clarity, hierarchy, and executive readability.</p>
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
