
import { getAllUsersAndVendors, getUserProfile, getVendorProfile, getServicesAndOffers } from '@/lib/services';
import { AdminUserManagement } from '@/components/admin-user-management';
import type { UserProfile, VendorProfile, ServiceOrOffer } from '@/lib/types';


export default async function AdminUserManagementPage({ params }: { params: { id: string } }) {
  // Data fetching happens on the server
  const [user, vendor, listings] = await Promise.all([
      getUserProfile(params.id),
      getVendorProfile(params.id),
      getServicesAndOffers(params.id)
  ]);
  
  // The interactive UI is in a separate client component
  return <AdminUserManagement initialUser={user} initialVendor={vendor} initialListings={listings} userId={params.id} />;
}

// This function tells Next.js which pages to pre-render at build time.
// It runs only on the server.
export async function generateStaticParams() {
  const users = await getAllUsersAndVendors();
  return users.map((user) => ({
    id: user.id,
  }));
}
