import { requireRole } from '@/lib/auth-server';

export default async function AdminReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole('admin');
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {children}
    </div>
  );
}