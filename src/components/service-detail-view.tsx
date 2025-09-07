

'use client';
import { getServiceOrOfferWithReviews } from '@/lib/services';
import type { Service, MediaItem, Review } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/error-boundary';
import { Star, MessageSquare, ArrowLeft, Send, Video } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { QuoteRequestDialog } from '@/components/quote-request-dialog';
import { useEffect, useState } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useLanguage } from '@/hooks/use-language';


// This is the client component that renders the UI
export function ServiceDetailView({ service: initialService, id }: { service: Service | null, id: string }) {
    const [service, setService] = useState(initialService);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const { translations } = useLanguage();
    const t = translations.serviceDetail;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsDataLoading(true);
                if(!initialService) {
                    const { item, reviews } = await getServiceOrOfferWithReviews(id);
                    setService(item as Service | null);
                    setReviews(reviews);
                } else {
                    const { reviews } = await getServiceOrOfferWithReviews(id);
                    setReviews(reviews);
                }
            } catch (error) {
                console.error('Error fetching service data:', error);
            } finally {
                setIsLoading(false);
                setIsDataLoading(false);
            }
        };
        fetchData();
    }, [initialService, id]);

  if (isLoading || isDataLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Skeleton className="h-10 w-32 mb-4" />
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-20 w-full rounded" />
              <Skeleton className="h-20 w-full rounded" />
              <Skeleton className="h-20 w-full rounded" />
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="flex items-center gap-2 mb-4">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-32 mb-4" />
            </div>
            
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-18 rounded-full" />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>
        </div>
        
        <div className="mt-12">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24" />
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Skeleton key={j} className="h-4 w-4" />
                          ))}
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">{t.notFound.title}</h1>
        <p className="text-muted-foreground">{t.notFound.description}</p>
        <Link href="/client/explore">
            <Button className="mt-4">{t.notFound.backButton}</Button>
        </Link>
      </div>
    );
  }
    const approvedMedia = service.media?.filter(m => m.status === 'approved') || [];
    const mediaItems = approvedMedia.length > 0 ? approvedMedia : [{ url: service.image, type: 'image' as const, status: 'approved' as const, isThumbnail: true }];


  return (
    <ErrorBoundary>
      <div className="space-y-8">
         <Link href="/client/explore" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              {t.backLink}
          </Link>

        <div className="relative">
             <Carousel className="w-full overflow-hidden rounded-xl">
                <CarouselContent>
                    {mediaItems.map((mediaItem, index) => (
                        <CarouselItem key={index} className="relative h-[300px] md:h-[500px]">
                            {mediaItem.type === 'image' ? (
                                <Image
                                    src={mediaItem.url}
                                    alt={`${service.title} - media ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    data-ai-hint="event service"
                                />
                            ) : (
                                <video
                                    src={mediaItem.url}
                                    className="w-full h-full object-cover"
                                    muted
                                    loop
                                    autoPlay
                                    playsInline
                                />
                            )}
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {mediaItems.length > 1 && (
                    <>
                        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
                        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
                    </>
                )}
            </Carousel>
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl pointer-events-none" />
             <div className="absolute bottom-6 left-6 text-white z-10 pointer-events-none">
                <Badge className="mb-2" variant="secondary">{service.category}</Badge>
                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{service.title}</h1>
             </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t.descriptionTitle}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground">
                        <p>{service.description}</p>
                    </CardContent>
                </Card>
            </div>
            
            <div className="lg:col-span-1 space-y-6">
                 <Card className="sticky top-24">
                    <CardHeader className="text-center">
                        <p className="text-5xl font-bold text-primary">{t.priceLabel}</p>
                         <p className="text-muted-foreground">{t.priceDescription}</p>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <QuoteRequestDialog service={service}>
                                <Button size="lg" className="w-full text-lg h-12">
                                    <MessageSquare className="mr-2 h-5 w-5" />
                                    {translations.common.requestAQuote}
                                </Button>
                            </QuoteRequestDialog>
                            <QuoteRequestDialog service={service}>
                                <Button size="lg" variant="outline" className="h-12 w-12 p-0">
                                    <Send className="h-5 w-5" />
                                </Button>
                            </QuoteRequestDialog>
                        </div>
                    </CardContent>
                 </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>{t.aboutVendorTitle}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href={`/vendor/${service.vendorId}`} className="group/vendor">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border-2 border-primary">
                                    <AvatarImage src={service.vendorAvatar} alt={service.vendorName} />
                                    <AvatarFallback>{service.vendorName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-bold text-lg group-hover/vendor:underline">{service.vendorName}</p>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        <span className="font-bold">{service.rating.toFixed(1)}</span>
                                        <span>({service.reviewCount} {t.reviews})</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </CardContent>
                 </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader><CardTitle>{t.reviewsTitle} ({reviews.length})</CardTitle></CardHeader>
                    <CardContent className="space-y-6">
                         {isLoading ? (
                            <p className="text-muted-foreground">{translations.common.loading}</p>
                        ) : reviews.length > 0 ? reviews.map((review, index) => (
                            <div key={review.id}>
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-10 w-10">
                                         <AvatarImage src={review.clientAvatar} />
                                        <AvatarFallback>{review.clientName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-grow">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold">{review.clientName}</p>
                                            <div className="flex items-center gap-0.5">
                                                {[...Array(review.rating)].map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                                ))}
                                                {[...Array(5-review.rating)].map((_, i) => (
                                                    <Star key={i} className="h-4 w-4 fill-muted text-muted-foreground" />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground mt-1">"{review.comment}"</p>
                                    </div>
                                </div>
                                {index < reviews.length -1 && <Separator className="mt-6" />}
                            </div>
                        )) : (
                             <p className="text-center text-muted-foreground py-8">{t.noReviews}</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
