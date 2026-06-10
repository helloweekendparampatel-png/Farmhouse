'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Camera, ChevronRight, Flower2, LayoutDashboard, LogOut, Trees, Users } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/farms', label: 'Farms', icon: Trees },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/decorations', label: 'Decorations', icon: Flower2 },
  { href: '/photography', label: 'Photography', icon: Camera },
];

export function Sidebar({
  mobileOpen,
  onNavigate,
}: {
  mobileOpen?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className={mobileOpen ? 'sidebar sidebar--open' : 'sidebar'}>
      <div className="sidebar-header">
        <div className="brand-mark">F</div>
        <div>
          <div className="brand">Farmhouse</div>
          <div className="sidebar-subtitle">Farm stays & rural listings</div>
        </div>
      </div>
      {user && (
        <>
          <div className="sidebar-group-label">Workspace</div>
          <nav className="sidebar-nav">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => onNavigate?.()}
                className={
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'sidebar-link active'
                    : 'sidebar-link'
                }
              >
                <span className="sidebar-link__lead">
                  <link.icon size={16} />
                  <span>{link.label}</span>
                </span>
                <ChevronRight size={14} className="sidebar-link__chevron" />
              </Link>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{user.role}</div>
            </div>
            <button className="sidebar-logout" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </>
      )}
      {!user && (
        <div className="sidebar-footer">
          <Link href="/login" className="sidebar-link">
            Login
          </Link>
        </div>
      )}
    </aside>
  );
}
