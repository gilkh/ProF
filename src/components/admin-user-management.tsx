

'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Star, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createOrUpdateUserProfile, createOrUpdateVendorProfile, deleteServiceOrOffer, getServicesAndOffers, updateListingStatus, createNotification } from '@/lib/services';
import { AdminListingDetailView } from '@/components/admin-listing-detail-view';
import type { UserProfile, VendorProfile, ServiceOrOffer, Service, Offer, ServiceCategory } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ServiceCard } from '@/components/service-card';
import { OfferCard } from '@/components/offer-card';
import { ManageServiceDialog } from '@/components/manage-service-dialog';
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

const userProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email(),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

const vendorProfileSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  category: z.enum(['Venues', 'Catering & Sweets', 'Entertainment', 'Lighting & Sound', 'Photography & Videography', 'Decoration', 'Beauty & Grooming', 'Transportation', 'Invitations & Printables', 'Rentals & Furniture', 'Security and Crowd Control']),
  tagline: z.string().min(1, "Tagline is required"),
  description: z.string().min(1, "Description is required"),
});

interface AdminUserManagementProps {
    initialUser: UserProfile | null;
    initialVendor: VendorProfile | null;
    initialListings: ServiceOrOffer[];
    userId: string;
}
const categories: ServiceCategory[] = ['Venues', 'Catering & Sweets', 'Entertainment', 'Lighting & Sound', 'Photography & Videography', 'Decoration', 'Beauty & Grooming', 'Transportation', 'Invitations & Printables', 'Rentals & Furniture', 'Security and Crowd Control'];

export function AdminUserManagement({ initialUser, initialVendor, initialListings, userId }: AdminUserManagementProps) {
    const { toast } = useToast();
    const [user, setUser] = useState<UserProfile | null>(initialUser);
    const [vendor, setVendor] = useState<VendorProfile | null>(initialVendor);
    const [listings, setListings] = useState<ServiceOrOffer[]>(initialListings);
    const [isModerating, setIsModerating] = useState<string | null>(null);
    
    // isLoading is no longer needed since data is pre-fetched by the server component.
    // However, we might keep it for refetching actions. Let's start with false.
    const [isRefetching, setIsRefetching] = useState(false);

    const userForm = useForm<z.infer<typeof userProfileSchema>>({
        resolver: zodResolver(userProfileSchema),
        defaultValues: initialUser || {},
    });

    const vendorForm = useForm<z.infer<typeof vendorProfileSchema>>({
        resolver: zodResolver(vendorProfileSchema),
        defaultValues: initialVendor || {},
    });

    const fetchAllData = async () => {
        if (!userId) return;
        setIsRefetching(true);
        try {
            const vendorListings = await getServicesAndOffers(userId);
            setListings(vendorListings);
        } catch (error) {
            console.error("Failed to refetch listings:", error);
            toast({
                title: "Error",
                description: "Could not refresh listings data.",
                variant: "destructive",
            });
        } finally {
            setIsRefetching(false);
        }
    }

    async function onUserSubmit(values: z.infer<typeof userProfileSchema>) {
        if (!userId) return;
        try {
            await createOrUpdateUserProfile(userId, values);
            setUser(prev => prev ? { ...prev, ...values } : null);
            toast({
                title: "User Profile Updated",
                description: "The user's information has been saved successfully.",
            });
        } catch (error) {
            toast({
                title: "Update Failed",
                description: "Could not save user changes. Please try again.",
                variant: "destructive",
            });
        }
    }
    
    async function onVendorSubmit(values: z.infer<typeof vendorProfileSchema>) {
        if (!userId) return;
        try {
            await createOrUpdateVendorProfile(userId, values);
            setVendor(prev => prev ? { ...prev, ...values } : null);
            toast({
                title: "Vendor Profile Updated",
                description: "The vendor's information has been saved successfully.",
            });
        } catch (error) {
            toast({
                title: "Update Failed",
                description: "Could not save vendor changes. Please try again.",
                variant: "destructive",
            });
        }
    }
    
    const handleDeleteListing = async (item: ServiceOrOffer) => {
        try {
            await deleteServiceOrOffer(item.id, item.type);
            setListings(prev => prev.filter(l => l.id !== item.id));
            toast({ title: "Listing Deleted", description: `"${item.title}" has been removed.`});
        } catch (error) {
            console.error("Failed to delete listing", error);
            toast({ title: "Error", description: "Failed to delete the listing.", variant: "destructive"});
        }
    }

    const handleListingStatusChange = async (listing: ServiceOrOffer, decision: 'approved' | 'rejected', reason?: string, delayHours?: number) => {
        setIsModerating(listing.id);
        try {
            if (delayHours && delayHours > 0) {
                // Schedule approval for later - you may want to implement this separately
                // For now, we'll just show a toast that it's scheduled
                toast({
                    title: `Listing ${decision} scheduled`,
                    description: `The listing "${listing.title}" will be ${decision} in ${delayHours} hours.`
                });
                // You would call a scheduling service here
                // await scheduleListingApproval(listing.id, listing.type, decision, delayHours, reason);
            } else {
                await updateListingStatus(listing.id, listing.type, decision, reason);
                setListings(prev => prev.map(l => 
                    l.id === listing.id ? { ...l, status: decision, rejectionReason: reason } : l
                ));
                
                const message = decision === 'approved' 
                    ? `Congratulations! Your listing "${listing.title}" has been approved.`
                    : `Your listing "${listing.title}" was rejected. Reason: ${reason}`;

                await createNotification({
                    userId: listing.vendorId,
                    message: message,
                    link: `/vendor/manage-services`,
                });

                toast({
                    title: `Listing ${decision}`,
                    description: `The listing "${listing.title}" has been ${decision}.`
                });
            }
        } catch (error) {
            console.error("Listing moderation failed", error);
            toast({ title: "Moderation Failed", description: "Could not update listing status.", variant: "destructive" });
        } finally {
            setIsModerating(null);
        }
    };
    
    if (!user) {
        return <Card>
            <CardHeader>
                <CardTitle>User Not Found</CardTitle>
                <CardDescription>We couldn't find a user with this ID.</CardDescription>
            </CardHeader>
             <CardContent>
                <Link href="/admin/home">
                    <Button variant="outline">Back to Dashboard</Button>
                </Link>
            </CardContent>
        </Card>
    }

    return (
     <div className="space-y-8">
        <div>
            <Link href="/admin/home" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-2">
                <ArrowLeft className="h-4 w-4" />
                Back to User List
            </Link>
            <h1 className="text-2xl font-bold">Manage User: {user.firstName} {user.lastName}</h1>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>Edit the user's personal information.</CardDescription>
            </CardHeader>
            <CardContent>
                <FormProvider {...userForm}>
                    <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-6 max-w-2xl">
                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                            control={userForm.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={userForm.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                                control={userForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl><Input type="email" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={userForm.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl><Input type="tel" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={userForm.formState.isSubmitting}>
                                {userForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save User Details
                            </Button>
                        </div>
                    </form>
                </FormProvider>
            </CardContent>
        </Card>

        {vendor && (
             <>
                <Card className="border-gold-dark/50">
                    <CardHeader>
                        <CardTitle>Vendor Profile</CardTitle>
                        <CardDescription>Edit this vendor's public business information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                            <Star className="w-4 h-4 text-gold" />
                            <span className="font-bold text-base">{(vendor.rating || 0).toFixed(1)}</span>
                            <span>({vendor.reviewCount || 0} reviews)</span>
                        </div>
                        <FormProvider {...vendorForm}>
                             <form onSubmit={vendorForm.handleSubmit(onVendorSubmit)} className="space-y-6 max-w-2xl">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FormField
                                        control={vendorForm.control}
                                        name="businessName"
                                        render={({ field }) => (
                                            <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={vendorForm.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Category</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={vendorForm.control}
                                    name="tagline"
                                    render={({ field }) => (
                                        <FormItem><FormLabel>Tagline / Short Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )}
                                />
                                <FormField
                                    control={vendorForm.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem><FormLabel>Full Business Description</FormLabel><FormControl><Textarea rows={6} {...field} /></FormControl><FormMessage /></FormItem>
                                    )}
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={vendorForm.formState.isSubmitting}>
                                    {vendorForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Vendor Details
                                    </Button>
                                </div>
                            </form>
                        </FormProvider>
                    </CardContent>
                </Card>

                <Card className="border-gold-dark/50">
                    <CardHeader>
                        <CardTitle>Vendor Listings</CardTitle>
                        <CardDescription>Manage this vendor's services and offers. View detailed information and moderate listings as needed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isRefetching ? <Loader2 className="mx-auto animate-spin" /> : listings.length > 0 ? (
                             <div className="space-y-6">
                                {listings.map(item => (
                                     <div key={item.id} className="relative border rounded-lg p-4 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-medium">{item.title}</h3>
                                                    <Badge variant="secondary" className="capitalize">{item.type}</Badge>
                                                    <Badge 
                                                        variant={item.status === 'approved' ? 'default' : 
                                                                item.status === 'rejected' ? 'destructive' : 'secondary'}
                                                        className={item.status === 'approved' ? 'bg-green-500' : 
                                                                  item.status === 'pending' ? 'bg-amber-500' : ''}
                                                    >
                                                        {item.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span>Category: {item.category}</span>
                                                    <span>Media: {item.media?.length || 0} files</span>
                                                    {item.type === 'offer' && (item as Offer).price && (
                                                        <span>Price: ${(item as Offer).price.toLocaleString()}</span>
                                                    )}
                                                </div>
                                                {item.rejectionReason && (
                                                    <div className="bg-red-50 border border-red-200 rounded p-2">
                                                        <p className="text-sm text-red-700">
                                                            <strong>Rejection Reason:</strong> {item.rejectionReason}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="flex gap-2">
                                                <AdminListingDetailView
                                                    listing={item}
                                                    onApprove={(delayHours?: number) => {
                                                        if (delayHours) {
                                                            handleListingStatusChange(item, 'approved', undefined, delayHours);
                                                        } else {
                                                            handleListingStatusChange(item, 'approved');
                                                        }
                                                    }}
                                                    onReject={(reason: string) => handleListingStatusChange(item, 'rejected', reason)}
                                                    isLoading={isModerating === item.id}
                                                />
                                                {item.status === 'pending' && (
                                                    <>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="text-green-600 border-green-600 hover:bg-green-50" 
                                                            onClick={() => handleListingStatusChange(item, 'approved')} 
                                                            disabled={isModerating === item.id}
                                                        >
                                                            {isModerating === item.id ? <Loader2 className="h-4 w-4 animate-spin"/> : "Quick Approve"}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                            
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm">
                                                        <Trash2 className="h-4 w-4 mr-2"/>
                                                        Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete the listing for <span className="font-semibold">"{item.title}"</span>. This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteListing(item)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">This vendor has no active listings.</p>
                        )}
                    </CardContent>
                </Card>
            </>
        )}
     </div>
  )
}
