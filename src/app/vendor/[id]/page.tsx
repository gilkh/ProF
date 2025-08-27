
import { getVendorProfile, getServicesAndOffers, getAllUsersAndVendors } from '@/lib/services';
import type { VendorProfile, ServiceOrOffer } from '@/lib/types';
import { VendorPublicProfile } from '@/components/vendor-public-profile';


export default async function VendorPublicProfilePage({ params }: { params: { id: string } }) {
  const [vendor, listings] = await Promise.all([
      getVendorProfile(params.id),
      getServicesAndOffers(params.id) // Fetch only this vendor's listings
  ]);

  return <VendorPublicProfile vendor={vendor} listings={listings} />;
}

export async function generateStaticParams() {
    const allUsers = await getAllUsersAndVendors();
    const vendors = allUsers.filter((user) => user.role === 'vendor');
    return vendors.map((vendor) => ({
        id: vendor.id,
    }));
}
