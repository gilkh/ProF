
'use client';
import { ServiceCard } from '@/components/service-card';
import { OfferCard } from '@/components/offer-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { ManageServiceDialog } from '@/components/manage-service-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';
import type { ServiceOrOffer, Service, Offer } from '@/lib/types';
import { getServicesAndOffers, deleteServiceOrOffer } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';

export default function ManageServicesPage() {
    const { userId, isLoading: isAuthLoading } = useAuth();
    const [myListings, setMyListings] = useState<ServiceOrOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchListings = async () => {
        if (!userId) {
            if (!isAuthLoading) setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const allItems = await getServicesAndOffers(userId);
            setMyListings(allItems);
        } catch (error) {
            console.error("Failed to load listings", error);
            toast({ title: "Error", description: "Could not load your listings.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        fetchListings();
    }, [userId, isAuthLoading]);

    const myOffers = myListings.filter(item => item.type === 'offer') as Offer[];
    const myServices = myListings.filter(item => item.type === 'service') as Service[];

    const pageIsLoading = isLoading || isAuthLoading;

    const handleDelete = async (item: ServiceOrOffer) => {
        try {
            await deleteServiceOrOffer(item.id, item.type);
            setMyListings(prev => prev.filter(l => l.id !== item.id));
            toast({ title: "Listing Deleted", description: `"${item.title}" has been removed.`});
        } catch (error) {
            console.error("Failed to delete listing", error);
            toast({ title: "Error", description: "Failed to delete the listing.", variant: "destructive"});
        }
    }

    const renderCardWithDelete = (item: ServiceOrOffer) => {
        const card = item.type === 'offer' 
            ? <OfferCard offer={item} role="vendor" onListingUpdate={fetchListings}/> 
            : <ServiceCard service={item} role="vendor" onListingUpdate={fetchListings} />;

        return (
            <div key={item.id} className="relative group">
                {card}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete your listing for <span className="font-semibold">"{item.title}"</span>. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        )
    }

    const renderSkeletons = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-xl" />)}
            <Card className="flex items-center justify-center border-dashed border-2 h-full min-h-96">
                <ManageServiceDialog onListingUpdate={fetchListings}>
                    <Button variant="outline" className="text-lg p-8">
                        <PlusCircle className="mr-4 h-8 w-8" />
                        Add New Service/Offer
                    </Button>
                </ManageServiceDialog>
            </Card>
        </div>
    );

  return (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
            <div>
                <CardTitle>Manage Your Services & Offers</CardTitle>
                <CardDescription>Add, edit, or remove your services and special offers.</CardDescription>
            </div>
            <ManageServiceDialog onListingUpdate={fetchListings}>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New
                </Button>
            </ManageServiceDialog>
            </div>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="offers">
                <TabsList className="mb-4">
                    <TabsTrigger value="offers">Offers ({myOffers.length})</TabsTrigger>
                    <TabsTrigger value="services">Services ({myServices.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="offers">
                    {pageIsLoading ? renderSkeletons() : (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myOffers.map((offer) => renderCardWithDelete(offer))}
                             <Card className="flex items-center justify-center border-dashed border-2 h-full min-h-96">
                                <ManageServiceDialog onListingUpdate={fetchListings}>
                                    <Button variant="outline" className="text-lg p-8">
                                        <PlusCircle className="mr-4 h-8 w-8" />
                                        Add New Offer
                                    </Button>
                                </ManageServiceDialog>
                            </Card>
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="services">
                    {pageIsLoading ? renderSkeletons() : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myServices.map((service) => renderCardWithDelete(service))}
                            <Card className="flex items-center justify-center border-dashed border-2 h-full min-h-96">
                                <ManageServiceDialog onListingUpdate={fetchListings}>
                                    <Button variant="outline" className="text-lg p-8">
                                        <PlusCircle className="mr-4 h-8 w-8" />
                                        Add New Service
                                    </Button>
                                </ManageServiceDialog>
                            </Card>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </CardContent>
    </Card>
  );
}
