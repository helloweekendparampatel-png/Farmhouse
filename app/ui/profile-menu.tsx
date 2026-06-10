'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export function ProfileMenu() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!user) return null;

  return (
    <div className="topbar-profile-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`topbar-profile${pathname === '/profile' ? ' topbar-profile--active' : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="topbar-profile-menu"
        id="topbar-profile-trigger"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="topbar-profile__avatar">{user.name.slice(0, 1).toUpperCase()}</span>
        <span className="topbar-profile__meta">
          <strong>{user.name}</strong>
          <span>{user.role}</span>
        </span>
        <ChevronDown
          size={18}
          className={`topbar-profile__chevron${open ? ' topbar-profile__chevron--open' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id="topbar-profile-menu"
          className="topbar-profile-dropdown"
          role="menu"
          aria-labelledby="topbar-profile-trigger"
        >
          {/* <div className="topbar-profile-dropdown__title" role="presentation">
            Profile
          </div> */}
          <Link
            href="/profile"
            className="topbar-profile-dropdown__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
        </div>
      )}
    </div>
  );
}
