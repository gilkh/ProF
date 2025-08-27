
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Star, Loader2, ShieldCheck, ImagePlus, Gem } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getVendorProfile, createOrUpdateVendorProfile } from '@/lib/services';
import type { VendorProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { RequestUpgradeDialog } from '@/components/request-upgrade-dialog';


const profileFormSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  category: z.string().min(1, "Category is required"),
  tagline: z.string().min(1, "Tagline is required"),
  description: z.string().min(1, "Description is required"),
  email: z.string().email(),
  phone: z.string().min(10, "Please enter a valid phone number"),
  accountTier: z.string().min(1, "Account tier is required"),
});

// Mock Data - In a real app, this would be fetched from the DB
const mockPortfolio = [
    'https://placehold.co/600x400.png',
    'https://placehold.co/600x400.png',
    'https://placehold.co/600x400.png',
    'https://placehold.co/600x400.png',
];

const mockReviews = [
    { id: 1, author: 'Alice Johnson', rating: 5, comment: 'Absolutely stunning photos! Timeless Snaps captured our wedding day perfectly.'},
    { id: 2, author: 'Bob Williams', rating: 5, comment: 'Professional, creative, and a joy to work with. Highly recommended!'}
]

export default function VendorProfilePage() {
    const { toast } = useToast();
    const { userId: vendorId, isLoading: isAuthLoading } = useAuth();
    const [vendor, setVendor] = useState<VendorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            businessName: '',
            category: '',
            tagline: '',
            description: '',
            email: '',
            phone: '',
            accountTier: 'free',
        },
    });

    useEffect(() => {
        async function fetchVendor() {
            if (!vendorId) {
                if (!isAuthLoading) setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                let vendorProfile = await getVendorProfile(vendorId);
                if (vendorProfile) {
                    setVendor(vendorProfile);
                    form.reset(vendorProfile);
                }
            } catch (error) {
                console.error("Failed to fetch vendor profile:", error);
                toast({
                    title: "Error",
                    description: "Could not load your profile. Please try again later.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchVendor();
    }, [vendorId, isAuthLoading, form, toast]);


    async function onSubmit(values: z.infer<typeof profileFormSchema>) {
        if (!vendorId) return;
        try {
            await createOrUpdateVendorProfile(vendorId, values);
            setVendor(prev => prev ? { ...prev, ...values } : null);
            toast({
                title: "Profile Updated",
                description: "Your business information has been saved successfully.",
            });
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast({
                title: "Update Failed",
                description: "Could not save your changes. Please try again.",
                variant: "destructive",
            });
        }
    }
    
    if (isLoading || isAuthLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-8">
                     <div className="flex flex-col sm:flex-row items-start gap-6">
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <div className="flex-grow space-y-2">
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    </div>
                     <div className="space-y-6 max-w-4xl">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                        </div>
                        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-24 w-full" /></div>
                     </div>
                </CardContent>
            </Card>
        )
    }

    if (!vendor) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Not Found</CardTitle>
                <CardDescription>We couldn't load your profile data. You may need to log in.</CardDescription>
            </CardHeader>
             <CardContent>
                <Link href="/login">
                    <Button>Go to Login</Button>
                </Link>
            </CardContent>
        </Card>
    )
  }

  return (
     <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>My Vendor Profile</CardTitle>
                <CardDescription>This is how your profile appears to potential clients. Keep it up-to-date!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                    <div className="relative flex-shrink-0">
                        <Avatar className="h-32 w-32 border-4 border-primary/50">
                            <AvatarImage src={vendor?.avatar} alt={vendor?.businessName} data-ai-hint="company logo" />
                            <AvatarFallback>{vendor?.businessName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="icon" className="absolute -bottom-2 -right-2 rounded-full bg-background h-8 w-8">
                            <Camera className="h-4 w-4"/>
                            <span className="sr-only">Change logo</span>
                        </Button>
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        <h2 className="text-3xl font-bold">{vendor?.businessName}</h2>
                        <p className="text-muted-foreground">{vendor?.tagline}</p>
                        <div className="flex items-center justify-center sm:justify-start gap-4 mt-2">
                             <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="w-4 h-4 text-gold" />
                                <span className="font-bold text-base">5.0</span>
                                <span>(150 reviews)</span>
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
                            {vendor?.accountTier && (
                                <RequestUpgradeDialog vendor={vendor}>
                                   <Badge variant="outline" className="capitalize border-gold-dark bg-gold/10 text-gold-dark gap-1.5 pl-2 cursor-pointer hover:bg-gold/20">
                                        <Gem className="h-4 w-4" />
                                        {vendor.accountTier} Tier
                                    </Badge>
                                </RequestUpgradeDialog>
                            )}
                        </div>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="businessName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Business Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a category" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Catering">Catering</SelectItem>
                                                <SelectItem value="Photography">Photography</SelectItem>
                                                <SelectItem value="Decor & Floral">Decor & Floral</SelectItem>
                                                <SelectItem value="Music & Entertainment">Music & Entertainment</SelectItem>
                                                <SelectItem value="Venue">Venue</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="tagline"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tagline / Short Description</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Business Description</FormLabel>
                                    <FormControl><Textarea rows={6} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Public Email Address</FormLabel>
                                        <FormControl><Input type="email" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Public Phone Number</FormLabel>
                                        <FormControl><Input type="tel" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <Separator />
                          <div className="grid md:grid-cols-2 gap-6 items-end">
                            <FormField
                                control={form.control}
                                name="accountTier"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Tier</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a tier" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="free">Free</SelectItem>
                                                <SelectItem value="vip1">VIP 1</SelectItem>
                                                <SelectItem value="vip2">VIP 2</SelectItem>
                                                <SelectItem value="vip3">VIP 3</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button variant="outline" className="w-full md:w-auto justify-self-start">
                                <Gem className="mr-2 h-4 w-4" />
                                Manage Subscription
                            </Button>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
                               {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               Save All Changes
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
        
        <Card className="border-gold-dark/50">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Portfolio Gallery</CardTitle>
                        <CardDescription>Showcase your best work to attract clients.</CardDescription>
                    </div>
                     <Button variant="outline">
                        <ImagePlus className="mr-2 h-4 w-4" /> Add Photos
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mockPortfolio.map((src, index) => (
                        <div key={index} className="relative aspect-square overflow-hidden rounded-lg group">
                            <Image src={src} alt={`Portfolio image ${index + 1}`} layout="fill" className="object-cover transition-transform group-hover:scale-110" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <Card className="border-gold-dark/50">
            <CardHeader>
                <CardTitle>Client Reviews</CardTitle>
                <CardDescription>Here's what your past clients have to say.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 {mockReviews.map((review, index) => (
                    <div key={review.id}>
                        <div className="flex items-start gap-4">
                             <Avatar className="h-10 w-10">
                                <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{review.author}</p>
                                     <div className="flex items-center gap-0.5">
                                        {[...Array(review.rating)].map((_, i) => (
                                            <Star key={i} className="h-4 w-4 text-gold" />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-muted-foreground mt-1">"{review.comment}"</p>
                            </div>
                        </div>
                        {index < mockReviews.length -1 && <Separator className="mt-6" />}
                    </div>
                ))}
            </CardContent>
        </Card>
     </div>
  )
}
