
import { LogoutButton } from '@/components/logout-button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Neutral admin root layout; per-route layouts enforce access.
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <div className="flex h-14 items-center justify-end px-4 sm:px-6 lg:px-8">
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
