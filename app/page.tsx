'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './lib/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return null;
}
