
import { AppHeader } from '@/components/header';
import { BottomNavBar } from '@/components/bottom-nav-bar';
import { requireRole } from '@/lib/auth-server';

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole('vendor');
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto pb-24 lg:pb-8">
          {children}
      </main>
      <BottomNavBar />
    </div>
  );
}
