'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOutIcon, Home } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Wrap with withAuth to ensure authentication

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
            >
              <Home className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Noteworthy</h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {/* User email would be fetched via API in a real implementation */}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
            >
              <LogOutIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-gray-500">
          Noteworthy - Your Self-Hosted Knowledge Hub
        </div>
      </footer>
    </div>
  );
}
