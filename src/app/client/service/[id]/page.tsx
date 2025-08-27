
import { getServiceOrOfferById } from '@/lib/services';
import type { Service } from '@/lib/types';
import { ServiceDetailView } from '@/components/service-detail-view';
import { getServices } from '@/lib/services';


// THIS IS THE MAIN SERVER COMPONENT FOR THE PAGE
export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  // Data fetching happens on the server
  const service = (await getServiceOrOfferById(params.id)) as Service | null;
  
  // The interactive UI is in a separate client component
  return <ServiceDetailView service={service} id={params.id} />;
}

// This function tells Next.js which pages to pre-render at build time.
// It runs only on the server.
export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({
    id: service.id,
  }));
}
