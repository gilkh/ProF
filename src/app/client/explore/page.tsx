
import { ClientDashboard } from '@/components/client-dashboard';

export default function ExplorePage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const initialCategory = typeof searchParams?.category === 'string' ? searchParams?.category : undefined;
  const initialEventType = typeof searchParams?.eventType === 'string' ? searchParams?.eventType : undefined;
  return <ClientDashboard initialCategory={initialCategory} initialEventType={initialEventType} />;
}
