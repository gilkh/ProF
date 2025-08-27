
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { bookings, quoteRequests, services, offers } from '@/lib/placeholder-data';
import { ServiceCard } from './service-card';
import { OfferCard } from './offer-card';
import Link from 'next/link';
import { Users, Briefcase, CalendarClock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { memo } from 'react';

const MemoizedOfferCard = memo(OfferCard);
const MemoizedServiceCard = memo(ServiceCard);

export function VendorDashboard() {
  const myServices = services.slice(0, 1);
  const myOffers = offers.slice(0, 2); 
  const pendingRequests = quoteRequests.filter(q => q.status === 'pending').length;
  const upcomingBookings = bookings.filter(b => b.date >= new Date()).length;

  return (
    <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Services & Offers
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myServices.length + myOffers.length}</div>
              <p className="text-xs text-muted-foreground">
                {myServices.length} Services, {myOffers.length} Offers
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Requests
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{pendingRequests}</div>
               <Link href="/vendor/client-requests">
                <p className="text-xs text-muted-foreground underline hover:text-primary">
                    New quote requests from clients
                </p>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingBookings}</div>
              <Link href="/vendor/bookings">
                <p className="text-xs text-muted-foreground underline hover:text-primary">
                    Confirmed and scheduled events
                </p>
               </Link>
            </CardContent>
          </Card>
        </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle>Your Listings</CardTitle>
                    <CardDescription>A quick look at your current services and offers.</CardDescription>
                </div>
                <Link href="/vendor/manage-services">
                  <Button variant="outline">
                    Manage All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="offers">
                    <TabsList className="grid grid-cols-2 w-full sm:w-auto sm:inline-flex mb-4">
                        <TabsTrigger value="offers">Offers</TabsTrigger>
                        <TabsTrigger value="services">Services</TabsTrigger>
                    </TabsList>
                    <TabsContent value="offers">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myOffers.map((offer) => (
                                <MemoizedOfferCard key={offer.id} offer={offer} role="vendor" />
                            ))}
                        </div>
                    </TabsContent>
                    <TabsContent value="services">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myServices.map((service) => (
                                <MemoizedServiceCard key={service.id} service={service} role="vendor" />
                            ))}
                        </div>
                    </TabsContent>
                 </Tabs>
            </CardContent>
          </Card>
    </div>
  );
}
