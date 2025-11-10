
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Neutral admin root layout; per-route layouts enforce access.
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
