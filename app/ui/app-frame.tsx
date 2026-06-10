'use client';

import { ReactNode, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Menu, Search, X } from 'lucide-react';
import { Sidebar } from './sidebar';
import { ProfileMenu } from './profile-menu';

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    return <div className="auth-page-root">{children}</div>;
  }

  return (
    <div className="app-shell">
      <div
        className="app-shell__backdrop"
        data-open={mobileNavOpen}
        onClick={() => setMobileNavOpen(false)}
      />
      <Sidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />
      <div className="app-shell__content">
        <div className="mobile-topbar">
          <button
            type="button"
            className="icon-btn"
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="mobile-topbar-title">Farmhouse</div>
        </div>
        <header className="topbar">
          <div className="topbar__left">
            <button
              type="button"
              className="icon-btn icon-btn--mobile"
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <span className="topbar__eyebrow">Farmhouse admin</span>
              <div className="topbar__title">
                {pathname === '/dashboard'
                  ? 'Overview'
                  : (pathname.split('/').filter(Boolean).at(-1)?.replace(/-/g, ' ') ?? 'Workspace')}
              </div>
            </div>
          </div>
          <div className="topbar__right">
            <div className="topbar-search">
              <Search size={16} />
              <span>Operations workspace</span>
            </div>
            <button type="button" className="icon-btn" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <ProfileMenu />
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
