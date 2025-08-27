

'use client';
import type { Service } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Edit, Heart, HeartCrack, Send, Video, ShieldCheck, MapPin } from 'lucide-react';
import Image from 'next/image';
import { QuoteRequestDialog } from './quote-request-dialog';
import { ManageServiceDialog } from './manage-service-dialog';
import { useEffect, useState } from 'react';
import { getUserProfile, toggleSavedItem } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';


interface ServiceCardProps {
  service: Service;
  role: 'client' | 'vendor' | 'admin';
  onListingUpdate?: () => void;
}

export function ServiceCard({ service, role, onListingUpdate }: ServiceCardProps) {
  const { userId } = useAuth();
  const { translations } = useLanguage();
  const t = translations.serviceCard;
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const approvedMedia = service.media?.filter(m => m.status === 'approved') || [];
  const mediaItems = approvedMedia.length > 0 ? approvedMedia : [{ url: service.image, type: 'image' as const, status: 'approved' as const, isThumbnail: true }];

  const statusColors = {
    pending: 'bg-amber-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500'
  }

  useEffect(() => {
    async function checkSavedStatus() {
        if (role === 'client' && userId) {
            try {
                const profile = await getUserProfile(userId);
                if (profile?.savedItemIds?.includes(service.id)) {
                    setIsSaved(true);
                }
            } catch (error) {
                console.warn("Could not check saved status. User profile might not exist yet.", error);
            }
        }
    }
    checkSavedStatus();
  }, [service.id, role, userId]);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    if (role !== 'client' || !userId) return;
    setIsSaving(true);
    try {
        await toggleSavedItem(userId, service.id);
        toast({
            title: isSaved ? t.unsaved.title : t.saved.title,
            description: isSaved ? t.unsaved.description.replace('{title}', service.title) : t.saved.description.replace('{title}', service.title)
        });
        setIsSaved(!isSaved);
    } catch (error) {
        console.error('Failed to toggle saved item', error);
        toast({ title: 'Error', description: 'Could not update saved items.', variant: 'destructive' });
    } finally {
        setIsSaving(false);
    }
  }


  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 rounded-xl group">
      
        <CardHeader className="p-0 relative overflow-hidden">
            <Carousel className="w-full">
                <CarouselContent>
                    {mediaItems.map((mediaItem, index) => (
                    <CarouselItem key={index}>
                        <Link href={`/client/service/${service.id}`}>
                            <div className="relative h-48 w-full">
                                {mediaItem.type === 'image' ? (
                                    <Image
                                        src={mediaItem.url}
                                        alt={service.title}
                                        fill
                                        className="object-cover"
                                        data-ai-hint="event service"
                                    />
                                ) : (
                                     <div className="relative w-full h-full">
                                        <video
                                            src={mediaItem.url}
                                            className="w-full h-full object-cover"
                                            muted
                                            loop
                                            playsInline
                                        />
                                        <div className="absolute bottom-2 right-2 bg-black/50 text-white rounded-full p-1.5">
                                            <Video className="h-4 w-4" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Link>
                    </CarouselItem>
                    ))}
                </CarouselContent>
                 {mediaItems.length > 1 && (
                    <>
                        <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                )}
            </Carousel>
          {role === 'client' && (
              <div className="absolute top-3 right-3 flex gap-2 z-10">
                <QuoteRequestDialog service={service}>
                  <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 bg-background/70 hover:bg-background">
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send to Vendor</span>
                  </Button>
                </QuoteRequestDialog>
                <Button size="icon" variant="secondary" onClick={handleSaveToggle} disabled={isSaving} className="rounded-full h-8 w-8 bg-background/70 hover:bg-background">
                    {isSaved ? <HeartCrack className="h-4 w-4 text-red-500" /> : <Heart className="h-4 w-4" />}
                    <span className="sr-only">Save</span>
                </Button>
              </div>
          )}
          {role === 'vendor' && (
              <Badge className={cn("absolute top-3 left-3 z-10 capitalize", statusColors[service.status])}>
                {service.status}
              </Badge>
          )}
          {role === 'client' && (
            <Badge className="absolute top-3 left-3 z-10" variant="secondary">
                {service.category}
            </Badge>
          )}
        </CardHeader>
        <div className="p-4 flex-grow flex flex-col">
          <Link href={`/client/service/${service.id}`} className="flex-grow">
            <h3 className="text-xl font-bold leading-tight mb-2">{service.title}</h3>
             <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                <MapPin className="h-4 w-4" />
                <span>{service.location}</span>
            </div>
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{service.description}</p>
          </Link>
          <div className="mt-auto pt-4 border-t border-dashed">
            <Link href={`/vendor/${service.vendorId}`} className="group/vendor" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-primary">
                    <AvatarImage src={service.vendorAvatar} alt={service.vendorName} />
                    <AvatarFallback>{service.vendorName.substring(0,2)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-sm group-hover/vendor:underline">{service.vendorName}</p>
                            {service.vendorVerification === 'verified' && <ShieldCheck className="h-4 w-4 text-green-600" />}
                            {service.vendorVerification === 'trusted' && <ShieldCheck className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            <span className="font-bold">{(service.rating || 0).toFixed(1)}</span>
                            <span>({service.reviewCount || 0} {t.reviews})</span>
                        </div>
                    </div>
                </div>
            </Link>
          </div>
        </div>
      
      <CardFooter className="p-4 pt-2 flex justify-between items-center bg-muted/50">
        <div>
          <p className="text-lg font-semibold text-primary">{t.priceLabel}</p>
        </div>
        {role === 'client' ? (
          <QuoteRequestDialog service={service}>
            <Button size="lg">{translations.common.getAQuote}</Button>
          </QuoteRequestDialog>
        ) : (
          <ManageServiceDialog service={service} onListingUpdate={onListingUpdate}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              {t.editService}
            </Button>
          </ManageServiceDialog>
        )}
      </CardFooter>
    </Card>
  );
}
