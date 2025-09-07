'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Eye, ThumbsUp, ThumbsDown, Star, MapPin, Calendar, DollarSign, Package, CheckCircle, XCircle, Clock, Play, Image as ImageIcon, Loader2, ChevronDown } from 'lucide-react';
import type { ServiceOrOffer, Service, Offer, MediaItem } from '@/lib/types';
import { format } from 'date-fns';
import Image from 'next/image';

interface AdminListingDetailViewProps {
  listing: ServiceOrOffer;
  onApprove: (delayHours?: number) => void;
  onReject: (reason: string) => void;
  isLoading: boolean;
}

function MediaViewer({ media }: { media: MediaItem[] }) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  if (!media || media.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
        <p>No media uploaded</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {media.map((item, index) => (
          <div key={index} className="relative group cursor-pointer" onClick={() => setSelectedMedia(item)}>
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              {item.type === 'image' ? (
                <Image
                  src={item.url}
                  alt={`Media ${index + 1}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black/80">
                  <Play className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            
            {/* Status indicator */}
            <div className="absolute top-2 right-2">
              {item.status === 'approved' && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Approved
                </Badge>
              )}
              {item.status === 'rejected' && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Rejected
                </Badge>
              )}
              {item.status === 'pending' && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              )}
            </div>

            {/* Thumbnail indicator */}
            {item.isThumbnail && (
              <div className="absolute bottom-2 left-2">
                <Badge variant="outline" className="bg-white/90">
                  Thumbnail
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Media Preview Dialog */}
      {selectedMedia && (
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Media Preview</DialogTitle>
            </DialogHeader>
            <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
              {selectedMedia.type === 'image' ? (
                <Image
                  src={selectedMedia.url}
                  alt="Preview"
                  fill
                  className="object-contain"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  className="w-full h-full"
                  autoPlay
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <Badge 
                variant={selectedMedia.status === 'approved' ? 'default' : 
                        selectedMedia.status === 'rejected' ? 'destructive' : 'secondary'}
              >
                {selectedMedia.status}
              </Badge>
              {selectedMedia.isThumbnail && (
                <Badge variant="outline">Thumbnail Image</Badge>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function InclusionsDisplay({ inclusions }: { inclusions?: any }) {
  if (!inclusions || Object.keys(inclusions).length === 0) {
    return <p className="text-muted-foreground">No specific inclusions listed</p>;
  }

  const inclusionLabels: { [key: string]: string } = {
    hasParking: 'Parking Available',
    hasValet: 'Valet Service',
    hasOnSiteCatering: 'On-site Catering',
    isOutdoors: 'Outdoor Space',
    hasPool: 'Pool Access',
    offersTastings: 'Food Tastings',
    servesAlcohol: 'Alcohol Service',
    hasVeganOptions: 'Vegan Options',
    hasGlutenFreeOptions: 'Gluten-free Options',
    providesOwnSoundSystem: 'Sound System Included',
    providesOwnLighting: 'Lighting Included',
    offersDroneFootage: 'Drone Footage',
    offersSameDayEdit: 'Same-day Edit',
    providesSetup: 'Setup Service',
    providesCleanup: 'Cleanup Service',
    travelsToClient: 'Travel to Client',
    offersTrials: 'Trial Sessions'
  };

  const activeInclusions = Object.entries(inclusions)
    .filter(([_, value]) => value === true)
    .map(([key, _]) => inclusionLabels[key] || key);

  if (activeInclusions.length === 0) {
    return <p className="text-muted-foreground">No specific inclusions listed</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activeInclusions.map((inclusion) => (
        <Badge key={inclusion} variant="outline">
          {inclusion}
        </Badge>
      ))}
    </div>
  );
}

export function AdminListingDetailView({ listing, onApprove, onReject, isLoading }: AdminListingDetailViewProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = () => {
    if (rejectReason.trim()) {
      onReject(rejectReason);
      setRejectOpen(false);
      setRejectReason('');
    }
  };

  const isOffer = listing.type === 'offer';
  const offer = isOffer ? (listing as Offer) : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-2" />
          Review Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{listing.title}</span>
            <Badge variant="secondary" className="capitalize">
              {listing.type}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Review all details and media before making an approval decision
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Vendor Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{listing.vendorName}</p>
                      <p className="text-sm text-muted-foreground">Vendor ID: {listing.vendorId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {listing.vendorVerification && (
                      <Badge variant={listing.vendorVerification === 'trusted' ? 'default' : 'secondary'}>
                        {listing.vendorVerification}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{listing.rating.toFixed(1)}</span>
                    <span>({listing.reviewCount} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{listing.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Listing Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Listing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm">{listing.category}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm leading-relaxed">{listing.description}</p>
                </div>

                {isOffer && offer && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Price</Label>
                      <div className="flex items-center gap-1 text-lg font-semibold text-green-600">
                        <DollarSign className="h-4 w-4" />
                        {offer.price.toLocaleString()}
                      </div>
                    </div>
                    
                    {offer.availableDates && offer.availableDates.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Available Dates</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {offer.availableDates.slice(0, 5).map((date, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {format(new Date(date), 'MMM dd')}
                            </Badge>
                          ))}
                          {offer.availableDates.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{offer.availableDates.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium">Service Inclusions</Label>
                  <div className="mt-2">
                    <InclusionsDisplay inclusions={listing.inclusions} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Media Portfolio
                </CardTitle>
                <CardDescription>
                  Review all uploaded images and videos. Media marked as "pending" will be automatically approved when the listing is approved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MediaViewer media={listing.media || []} />
              </CardContent>
            </Card>

            {/* Status Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={listing.status === 'approved' ? 'default' : 
                            listing.status === 'rejected' ? 'destructive' : 'secondary'}
                  >
                    {listing.status}
                  </Badge>
                  {listing.rejectionReason && (
                    <div className="ml-4">
                      <Label className="text-sm font-medium">Previous Rejection Reason:</Label>
                      <p className="text-sm text-muted-foreground mt-1">{listing.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="gap-2">
          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ThumbsDown className="h-4 w-4 mr-2" />}
                Reject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject Listing</DialogTitle>
                <DialogDescription>
                  Please provide a detailed reason for rejecting this listing. This will help the vendor understand what needs to be improved.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="reject-reason">Rejection Reason</Label>
                  <Textarea
                    id="reject-reason"
                    placeholder="e.g., The images are of poor quality, missing required information, inappropriate content..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                >
                  Confirm Rejection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ThumbsUp className="h-4 w-4 mr-2" />}
                Approve Listing
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onApprove()}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Now
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onApprove(12)}>
                <Clock className="h-4 w-4 mr-2" />
                Approve in 12 hours
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}