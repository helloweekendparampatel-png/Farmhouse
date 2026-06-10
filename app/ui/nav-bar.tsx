'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

const links = [
  { href: '/farms', label: 'Farms' },
  { href: '/users', label: 'Users' },
  { href: '/decorations', label: 'Decorations' },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="nav-bar">
      <div className="nav-left">
        <span className="brand">Farmhouse</span>
        {user && (
          <nav>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname.startsWith(link.href) ? 'nav-link active' : 'nav-link'}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
      <div className="nav-right">
        {user ? (
          <>
            <span className="user-info">
              {user.name} ({user.role})
            </span>
            <button onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <Link href="/login" className="nav-link">
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
