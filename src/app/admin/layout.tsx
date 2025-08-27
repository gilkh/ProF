
'use client';

import { useAuth, logout } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, isLoading } = useAuth();
  const router = useRouter();

  // With middleware in place, this client-side check is now a secondary layer of defense
  // and handles the UI state while the user is being redirected.
  useEffect(() => {
    if (!isLoading && role !== 'admin') {
      router.replace('/login');
    }
  }, [isLoading, role, router]);

  // While loading, or if the user is not an admin, show a loading screen.
  // This prevents any of the child components (the actual admin page) from rendering
  // for unauthorized users.
  if (isLoading || role !== 'admin') {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  // Only render the admin content if the user is authenticated as an admin.
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
            <h1 className="text-xl font-semibold">Farhetkoun Admin</h1>
            <Link href="/login">
                <Button variant="outline" onClick={() => logout()}>Logout</Button>
            </Link>
        </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
      </main>
    </div>
  );
}
