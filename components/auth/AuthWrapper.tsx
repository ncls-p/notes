'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/store';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthWrapper({ children, requireAuth = true }: AuthWrapperProps) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (requireAuth && !user) {
      router.push('/login');
    }
  }, [user, requireAuth, router]);

  if (requireAuth && !user) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
