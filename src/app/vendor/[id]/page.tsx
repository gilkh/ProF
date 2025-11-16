
import { getVendorProfile, getServicesAndOffers, getAllUsersAndVendors } from '@/lib/services';
import type { VendorProfile, ServiceOrOffer } from '@/lib/types';
import { VendorPublicProfile } from '@/components/vendor-public-profile';


export default async function VendorPublicProfilePage({ params }: { params: { id: string } }) {
  const [vendor, listings] = await Promise.all([
      getVendorProfile(params.id),
      getServicesAndOffers(params.id) // Fetch only this vendor's listings
  ]);

  const safeVendor = vendor ? JSON.parse(JSON.stringify(vendor)) : null;
  const safeListings = JSON.parse(JSON.stringify(listings));
  return <VendorPublicProfile vendor={safeVendor as any} listings={safeListings as any} />;
}

export async function generateStaticParams() {
    const allUsers = await getAllUsersAndVendors();
    const vendors = allUsers.filter((user) => user.role === 'vendor');
    return vendors.map((vendor) => ({
        id: vendor.id,
    }));
}
