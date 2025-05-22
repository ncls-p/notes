import { ReactNode } from 'react';
import Link from 'next/link';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header for public pages */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="font-bold text-xl">
            Notes App
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="hover:underline">
              Home
            </Link>
            <Link href="/signin" className="hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow bg-background">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-muted py-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto">
          &copy; {new Date().getFullYear()} Notes App - View with public share link
        </div>
      </footer>
    </div>
  );
}