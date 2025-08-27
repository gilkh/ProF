

'use client'

import { useEffect, useState } from 'react';
import type { VendorProfile, ServiceOrOffer, Service, Offer, Review } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, ShieldCheck, Mail, Phone, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ServiceCard } from '@/components/service-card';
import { OfferCard } from '@/components/offer-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getReviewsForVendor, logPhoneNumberReveal } from '@/lib/services';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';

interface VendorPublicProfileProps {
    vendor: VendorProfile | null;
    listings: ServiceOrOffer[];
}

export function VendorPublicProfile({ vendor: initialVendor, listings: initialListings }: VendorPublicProfileProps) {
  const [vendor] = useState<VendorProfile | null>(initialVendor);
  const [listings] = useState<ServiceOrOffer[]>(initialListings);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const { userId } = useAuth();


  useEffect(() => {
    if (initialVendor) {
        setIsLoading(true);
        getReviewsForVendor(initialVendor.id)
            .then(setReviews)
            .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [initialVendor]);

  const handleRevealPhone = async () => {
      if (!vendor) return;
      setIsRevealing(true);
      try {
          await logPhoneNumberReveal(vendor.id, userId || undefined);
          setPhoneVisible(true);
      } catch (error) {
          console.error("Failed to log phone number reveal:", error);
      } finally {
          setIsRevealing(false);
      }
  }


  if (!vendor) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Vendor not found</h1>
        <p className="text-muted-foreground">This vendor may no longer be on the platform.</p>
        <Link href="/client/explore">
            <Button className="mt-4">Back to Explore</Button>
        </Link>
      </div>
    );
  }
  
  const myOffers = listings.filter(item => item.type === 'offer') as Offer[];
  const myServices = listings.filter(item => item.type === 'service') as Service[];
  const approvedPortfolio = vendor.portfolio?.filter(p => p.status === 'approved') || [];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary/50">
              <AvatarImage src={vendor.avatar} alt={vendor.businessName} data-ai-hint="company logo" />
              <AvatarFallback>{vendor.businessName?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-grow mt-2">
              <h1 className="text-3xl md:text-4xl font-bold">{vendor.businessName}</h1>
              <p className="text-muted-foreground text-lg">{vendor.tagline}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-gold" />
                  <span className="font-bold">{(vendor.rating || 0).toFixed(1)}</span>
                  <span className="text-muted-foreground">({vendor.reviewCount || 0} reviews)</span>
                </div>
                 {vendor.verification === 'verified' && (
                    <Badge variant="secondary" className="gap-1.5 pl-2 border-green-600">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        Verified Vendor
                    </Badge>
                )}
                {vendor.verification === 'trusted' && (
                    <Badge variant="gold" className="gap-1.5 pl-2">
                        <ShieldCheck className="h-4 w-4" />
                        Trusted Vendor
                    </Badge>
                )}
                <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{vendor.email}</span>
                </div>
                 <div className="flex items-center gap-1.5">
                    {phoneVisible ? (
                        <>
                           <Phone className="w-4 h-4 text-muted-foreground" />
                           <a href={`tel:${vendor.phone}`} className="font-semibold">{vendor.phone}</a>
                        </>
                    ) : (
                        <Button variant="secondary" size="sm" onClick={handleRevealPhone} disabled={isRevealing}>
                            {isRevealing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                            Reveal Phone Number
                        </Button>
                    )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
            <p className="text-muted-foreground mt-4">{vendor.description}</p>
        </CardContent>
      </Card>
      
       <Tabs defaultValue="services" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex mb-4">
                <TabsTrigger value="services">Services & Offers</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({vendor.reviewCount || 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="services">
                 <Card>
                    <CardHeader>
                        <CardTitle>Portfolio</CardTitle>
                        <CardDescription>Browse all services and special offers from {vendor.businessName}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="offers" className="w-full">
                            <TabsList className="mb-4">
                                <TabsTrigger value="offers">Offers ({myOffers.length})</TabsTrigger>
                                <TabsTrigger value="services">Services ({myServices.length})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="offers">
                                {myOffers.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myOffers.map((offer) => (
                                            <OfferCard key={offer.id} offer={offer} role="client" />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">This vendor currently has no special offers.</p>
                                )}
                            </TabsContent>
                            <TabsContent value="services">
                                {myServices.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myServices.map((service) => (
                                            <ServiceCard key={service.id} service={service} role="client" />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">This vendor currently has no quote-based services.</p>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="reviews">
                <Card>
                    <CardHeader>
                        <CardTitle>Client Feedback</CardTitle>
                         <CardDescription>Read what past clients have to say.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        ) : reviews.length > 0 ? reviews.map((review, index) => (
                            <div key={review.id}>
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-10 w-10">
                                         <AvatarImage src={review.clientAvatar} alt={review.clientName} />
                                        <AvatarFallback>{review.clientName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">{review.clientName}</p>
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(review.rating)].map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 text-gold" />
                                                ))}
                                                {[...Array(5 - review.rating)].map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 text-muted" />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground mt-1">"{review.comment}"</p>
                                    </div>
                                </div>
                                {index < reviews.length -1 && <Separator className="mt-6" />}
                            </div>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">This vendor doesn't have any reviews yet.</p>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
       </Tabs>
    </div>
  );
}
