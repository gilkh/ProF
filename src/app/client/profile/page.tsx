
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Camera, Heart, KeyRound, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getUserProfile, createOrUpdateUserProfile } from '@/lib/services';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLanguage } from '@/hooks/use-language';


const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email(),
  phone: z.string().min(10, "Please enter a valid phone number"),
  avatar: z.string().optional(),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function ClientProfilePage() {
  const { toast } = useToast();
  const { userId, isLoading: isAuthLoading } = useAuth();
  const { language, translations } = useLanguage();
  const t = translations.clientProfile;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      avatar: '',
    },
  });

  useEffect(() => {
    async function fetchUser() {
      if (!userId) {
          if(!isAuthLoading) setIsLoading(false);
          return;
      };
      
      setIsLoading(true);
      try {
        let userProfile = await getUserProfile(userId);
        if (userProfile) {
            setUser(userProfile);
            form.reset({
                ...userProfile,
                avatar: userProfile.avatar || '',
            });
        }

      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        toast({
          title: t.errors.loadProfile.title,
          description: t.errors.loadProfile.description,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isAuthLoading, form, toast]);


  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!userId) return;
    try {
      await createOrUpdateUserProfile(userId, values);
      setUser(prev => prev ? { ...prev, ...values } as UserProfile : null);
      toast({
        title: t.updateSuccess.title,
        description: t.updateSuccess.description,
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
       toast({
        title: t.errors.updateProfile.title,
        description: t.errors.updateProfile.description,
        variant: "destructive",
      });
    }
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 256;
                const MAX_HEIGHT = 256;
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
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
        };
        reader.onerror = (error) => reject(error);
    });
  }

   const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
          toast({ title: t.errors.fileTooLarge.title, description: t.errors.fileTooLarge.description, variant: 'destructive' });
          return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          toast({ title: t.errors.invalidFileType.title, description: t.errors.invalidFileType.description, variant: 'destructive' });
          return;
      }

      try {
        const compressedDataUrl = await compressImage(file);
        form.setValue('avatar', compressedDataUrl, { shouldDirty: true });
        await form.handleSubmit(onSubmit)(); // Auto-save
      } catch (error) {
        console.error("Image processing failed", error);
        toast({ title: t.errors.imageProcessing.title, description: t.errors.imageProcessing.description, variant: 'destructive' });
      }
  }
  
  if (isLoading || isAuthLoading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex items-center gap-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div>
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                 <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
                    <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2 md:col-span-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
                </div>
            </CardContent>
        </Card>
    )
  }

  if (!user || !userId) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t.notFound.title}</CardTitle>
                <CardDescription>{t.notFound.description}</CardDescription>
            </CardHeader>
             <CardContent>
                <Link href="/login">
                    <Button>{translations.common.login}</Button>
                </Link>
            </CardContent>
        </Card>
    )
  }
  
  const avatarUrl = form.watch('avatar');

  return (
     <Card>
        <CardHeader>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                    <Input 
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        ref={avatarFileRef}
                        onChange={handleAvatarChange}
                        className="hidden" 
                    />
                    <Avatar className="h-24 w-24 border-2 border-primary">
                        <AvatarImage src={avatarUrl} alt={user?.firstName} data-ai-hint="user avatar" />
                        <AvatarFallback>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="icon" className="absolute -bottom-2 -right-2 rounded-full bg-background h-8 w-8" onClick={() => avatarFileRef.current?.click()}>
                        <Camera className="h-4 w-4"/>
                        <span className="sr-only">{t.changePhoto}</span>
                    </Button>
                </div>
                <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold">{form.getValues('firstName')} {form.getValues('lastName')}</h2>
                    <p className="text-muted-foreground">{t.memberSince} {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(language, {month: 'long', year: 'numeric'}) : 'this year'}</p>
                </div>
            </div>
            
            <div className="max-w-3xl">
              <h3 className="text-lg font-semibold mb-4">{t.accountDetails}</h3>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                       <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t.firstName}</FormLabel>
                                <FormControl>
                                    <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t.lastName}</FormLabel>
                                <FormControl>
                                    <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className="md:col-span-2">
                                    <FormLabel>{t.email}</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>{t.phone}</FormLabel>
                                    <FormControl>
                                        <Input type="tel" placeholder="(123) 456-7890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                       </div>
                      <div className="flex justify-between items-center gap-4 flex-wrap">
                            <div className="flex gap-2 flex-wrap">
                                <Link href="/client/saved">
                                    <Button variant="outline">
                                        <Heart className="mr-2 h-4 w-4" />
                                        {t.mySavedItems}
                                    </Button>
                                </Link>
                                 <ChangePasswordDialog userId={userId}>
                                    <Button variant="outline" className="ml-2">
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        {t.changePassword}
                                    </Button>
                                </ChangePasswordDialog>
                            </div>
                          <Button type="submit" disabled={form.formState.isSubmitting}>
                               {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              {translations.common.save}
                          </Button>
                      </div>
                  </form>
              </Form>
            </div>
             <div className="max-w-3xl pt-6 border-t">
                <h3 className="text-lg font-semibold text-destructive mb-4">{t.dangerZone.title}</h3>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">{t.dangerZone.deleteAccount}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t.dangerZone.areYouSure}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t.dangerZone.description}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{translations.common.cancel}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => toast({ title: translations.common.actionCancelled, description: "Account deletion is a placeholder."})}>{t.dangerZone.deleteAccount}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardContent>
    </Card>
  )
}
