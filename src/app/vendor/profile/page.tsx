

'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Star, Loader2, ShieldCheck, ImagePlus, Gem, Trash2, User, MapPin, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getVendorProfile, createOrUpdateVendorProfile, getReviewsForVendor, getUserProfile, createOrUpdateUserProfile, getPhoneNumberReveals } from '@/lib/services';
import type { VendorProfile, Review, UserProfile, ServiceCategory, Location } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { RequestUpgradeDialog } from '@/components/request-upgrade-dialog';
import { locations } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const profileFormSchema = z.object({
  // From VendorProfile
  businessName: z.string().min(1, "Business name is required"),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(1, "Location is required"),
  tagline: z.string().min(1, "Tagline is required"),
  description: z.string().min(1, "Description is required"),
  portfolio: z.array(z.string()).optional(),
  avatar: z.string().optional(),
  
  // From UserProfile
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email(),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

const categories: ServiceCategory[] = ['Venues', 'Catering & Sweets', 'Entertainment', 'Lighting & Sound', 'Photography & Videography', 'Decoration', 'Beauty & Grooming', 'Transportation', 'Invitations & Printables', 'Rentals & Furniture', 'Security and Crowd Control'];

function PhoneRevealsStat({ vendorId }: { vendorId: string }) {
    const [count, setCount] = useState<number | null>(null);
    const [timePeriod, setTimePeriod] = useState<'30days' | 'all'>('30days');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getPhoneNumberReveals(vendorId, timePeriod)
            .then(setCount)
            .finally(() => setIsLoading(false));
    }, [vendorId, timePeriod]);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Phone Number Reveals</CardTitle>
                <div className="flex items-center gap-2">
                    <Label htmlFor="time-period-toggle" className="text-xs text-muted-foreground">Last 30 Days</Label>
                    <Switch
                        id="time-period-toggle"
                        checked={timePeriod === 'all'}
                        onCheckedChange={(checked) => setTimePeriod(checked ? 'all' : '30days')}
                    />
                     <Label htmlFor="time-period-toggle" className="text-xs text-muted-foreground">All Time</Label>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                    <div className="text-2xl font-bold flex items-center gap-2">
                         <Eye className="h-6 w-6 text-muted-foreground" />
                        {count ?? 0}
                    </div>
                )}
                <p className="text-xs text-muted-foreground">
                   {timePeriod === '30days' ? 'Reveals in the last 30 days' : 'Total reveals of all time'}
                </p>
            </CardContent>
        </Card>
    );
}

export default function VendorProfilePage() {
    const { toast } = useToast();
    const { userId: vendorId, isLoading: isAuthLoading } = useAuth();
    const [vendor, setVendor] = useState<VendorProfile | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);
    const portfolioFileRef = useRef<HTMLInputElement>(null);
    const avatarFileRef = useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof profileFormSchema>>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            businessName: '',
            category: '',
            location: '',
            tagline: '',
            description: '',
            portfolio: [],
            avatar: '',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
        },
    });

    useEffect(() => {
        async function fetchVendorData() {
            if (!vendorId) {
                if (!isAuthLoading) setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setIsLoadingReviews(true);

            try {
                const [vendorProfile, userProfile, vendorReviews] = await Promise.all([
                    getVendorProfile(vendorId),
                    getUserProfile(vendorId),
                    getReviewsForVendor(vendorId),
                ]);

                if (vendorProfile && userProfile) {
                    setVendor(vendorProfile);
                    setUser(userProfile);
                    form.reset({
                        ...vendorProfile,
                        ...userProfile,
                    });
                }
                setReviews(vendorReviews);

            } catch (error) {
                console.error("Failed to fetch vendor data:", error);
                toast({
                    title: "Error",
                    description: "Could not load your profile data. Please try again later.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
                setIsLoadingReviews(false);
            }
        }
        fetchVendorData();
    }, [vendorId, isAuthLoading, form, toast]);


    async function onSubmit(values: z.infer<typeof profileFormSchema>) {
        if (!vendorId) return;
        try {
            // Separate data for each profile
            const vendorData: Partial<VendorProfile> = {
                businessName: values.businessName,
                category: values.category as ServiceCategory,
                location: values.location as Location,
                tagline: values.tagline,
                description: values.description,
                portfolio: values.portfolio,
                avatar: values.avatar,
            };
            const userData: Partial<UserProfile> = {
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                phone: values.phone,
            }

            await Promise.all([
                createOrUpdateVendorProfile(vendorId, vendorData),
                createOrUpdateUserProfile(vendorId, userData)
            ]);
            
            // Update local state
            setVendor(prev => prev ? { ...prev, ...vendorData } as VendorProfile : null);
            setUser(prev => prev ? { ...prev, ...userData} : null);

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

    const compressImage = (file: File, isAvatar: boolean): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = isAvatar ? 256 : 1024;
                    const MAX_HEIGHT = isAvatar ? 256 : 1024;
                    let width = img.width;
                    let height = img.height;
    
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject('Could not get canvas context');
    
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', isAvatar ? 0.95 : 0.9));
                };
            };
            reader.onerror = (error) => reject(error);
        });
    }

     const handlePortfolioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        form.control.getFieldState('portfolio').isSubmitting = true;

        const compressedImages: string[] = [];
        for (const file of Array.from(files)) {
            if (file.size > MAX_FILE_SIZE) {
                toast({ title: 'File too large', description: `${file.name} is over 5MB.`, variant: 'destructive' });
                continue;
            }
            if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                toast({ title: 'Invalid file type', description: `${file.name} is not a valid image type.`, variant: 'destructive' });
                continue;
            }
            try {
                const compressedDataUrl = await compressImage(file, false);
                compressedImages.push(compressedDataUrl);
            } catch (error) {
                console.error("Image processing failed", error);
                toast({ title: 'Image Error', description: `Could not process ${file.name}.`, variant: 'destructive' });
            }
        }
        
        const currentPortfolio = form.getValues('portfolio') || [];
        form.setValue('portfolio', [...currentPortfolio, ...compressedImages], { shouldDirty: true });
        form.control.getFieldState('portfolio').isSubmitting = false;
        
        // Auto-save after upload
        await form.handleSubmit(onSubmit)();
    }
    
     const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            toast({ title: 'File too large', description: `Image must be less than 5MB.`, variant: 'destructive' });
            return;
        }
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            toast({ title: 'Invalid file type', description: 'Please select a JPG, PNG, or WEBP image.', variant: 'destructive' });
            return;
        }

        try {
            const compressedDataUrl = await compressImage(file, true);
            form.setValue('avatar', compressedDataUrl, { shouldDirty: true });
            await form.handleSubmit(onSubmit)(); // Auto-save
        } catch (error) {
            console.error("Avatar processing failed", error);
            toast({ title: 'Image Error', description: 'Could not process the image.', variant: 'destructive' });
        }
    }
    
    const handleRemovePortfolioImage = async (index: number) => {
        const currentPortfolio = form.getValues('portfolio') || [];
        const updatedPortfolio = currentPortfolio.filter((_, i) => i !== index);
        form.setValue('portfolio', updatedPortfolio, { shouldDirty: true });
        await form.handleSubmit(onSubmit)();
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

    if (!vendor || !user) {
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

  const portfolioImages = form.watch('portfolio') || [];
  const avatarUrl = form.watch('avatar');

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
                         <Input 
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            ref={avatarFileRef}
                            onChange={handleAvatarUpload}
                            className="hidden" 
                        />
                        <Avatar className="h-32 w-32 border-4 border-primary/50">
                            <AvatarImage src={avatarUrl} alt={vendor?.businessName} />
                            <AvatarFallback>{vendor?.businessName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="icon" className="absolute -bottom-2 -right-2 rounded-full bg-background h-8 w-8" onClick={() => avatarFileRef.current?.click()}>
                            <Camera className="h-4 w-4"/>
                            <span className="sr-only">Change logo</span>
                        </Button>
                    </div>
                    <div className="flex-grow text-center sm:text-left">
                        <h2 className="text-3xl font-bold">{form.watch('businessName')}</h2>
                        <p className="text-muted-foreground">{form.watch('tagline')}</p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2">
                             <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Star className="w-4 h-4 text-gold" />
                                <span className="font-bold text-base">{(vendor.rating || 0).toFixed(1)}</span>
                                <span>({vendor.reviewCount || 0} reviews)</span>
                            </div>
                             <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4" />
                                <span className="font-medium text-base">{vendor.location}</span>
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
                             {vendor.accountTier && (
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

                <div className="grid md:grid-cols-2 gap-6">
                    <PhoneRevealsStat vendorId={vendorId} />
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
                        <h3 className="text-xl font-semibold border-b pb-2">Business Details</h3>
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
                                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
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
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Primary Location</FormLabel>
                                         <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a location" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
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

                        <h3 className="text-xl font-semibold border-b pb-2 pt-4">Contact Details</h3>
                         <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Owner First Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Owner Last Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contact Email Address</FormLabel>
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
                                        <FormLabel>Contact Phone Number</FormLabel>
                                        <FormControl><Input type="tel" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex justify-end pt-4">
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
                     <Button variant="outline" onClick={() => portfolioFileRef.current?.click()} disabled={form.control.getFieldState('portfolio').isSubmitting}>
                        <ImagePlus className="mr-2 h-4 w-4" /> Add Photos
                    </Button>
                    <Input 
                        type="file" 
                        ref={portfolioFileRef} 
                        className="hidden" 
                        multiple 
                        accept="image/*"
                        onChange={handlePortfolioUpload}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {portfolioImages.length > 0 ? (
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {portfolioImages.map((src, index) => (
                            <div key={index} className="relative aspect-square overflow-hidden rounded-lg group">
                                <Image src={src} alt={`Portfolio image ${index + 1}`} layout="fill" className="object-cover" />
                                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemovePortfolioImage(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No portfolio images have been added yet.</p>
                        <Button variant="link" onClick={() => portfolioFileRef.current?.click()}>Upload your first photo</Button>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="border-gold-dark/50">
            <CardHeader>
                <CardTitle>Client Reviews</CardTitle>
                <CardDescription>Here's what your past clients have to say.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 {isLoadingReviews ? (
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
                     <p className="text-center text-muted-foreground py-8">You have no reviews yet.</p>
                )}
            </CardContent>
        </Card>
     </div>
  )
}
