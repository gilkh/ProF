'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { createNewUser, signInWithGoogle } from '@/lib/services';
import { Camera, Loader2, User, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const countryCodes = [
    { value: '+961', label: 'LB (+961)' },
    { value: '+1', label: 'USA (+1)' },
    { value: '+44', label: 'UK (+44)' },
    { value: '+33', label: 'FR (+33)' },
    { value: '+971', label: 'UAE (+971)' },
];

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.657-3.356-11.303-7.918l-6.573,4.817C9.656,39.663,16.318,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,34.551,44,29.865,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
    );
}

function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

const signupFormSchema = z.object({
  accountType: z.enum(['client', 'vendor'], {
    required_error: "You need to select an account type.",
  }),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  countryCode: z.string(),
  phone: z.string().min(1, "Phone number is required"),
  businessName: z.string().optional(),
  vendorCode: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string(),
  avatar: z.string().optional(),
}).refine(data => {
    if (data.accountType === 'vendor') {
        return !!data.businessName && data.businessName.length > 0;
    }
    return true;
}, {
    message: "Business name is required for vendors",
    path: ["businessName"],
}).refine(data => {
    if (data.accountType === 'vendor') {
        return !!data.vendorCode && data.vendorCode.length > 0;
    }
    return true;
}, {
    message: "A registration code is required for vendors",
    path: ["vendorCode"],
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType?: 'client' | 'vendor';
}

export function SignupModal({ isOpen, onClose, userType = 'client' }: SignupModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [isSocialLoading, setIsSocialLoading] = useState<false | 'google'>(false);
  
  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      accountType: userType,
      firstName: '',
      lastName: '',
      countryCode: '+961',
      phone: '',
      businessName: '',
      vendorCode: '',
      email: '',
      password: '',
      confirmPassword: '',
      avatar: '',
    },
  });

  const accountType = form.watch('accountType');
  const firstName = form.watch('firstName');
  const lastName = form.watch('lastName');
  const businessName = form.watch('businessName');

  const onSocialLoginSuccess = (role: 'client' | 'vendor' | 'admin') => {
    toast({
        title: 'Sign Up Successful!',
        description: `Welcome! Redirecting to your dashboard...`,
    });
    onClose();
    if (role === 'client') {
        router.push('/client/home');
    } else if (role === 'vendor') {
        router.push('/vendor/home');
    }
  };

  const handleSocialLogin = async (provider: 'google') => {
    setIsSocialLoading(provider);
    try {
        const result = await signInWithGoogle();
        if (result.success) {
          localStorage.setItem('userId', result.userId);
          localStorage.setItem('role', result.role);
          setCookie('role', result.role, 7);
          setCookie('userId', result.userId, 7);
          onSocialLoginSuccess(result.role);
        } else {
            toast({ title: 'Sign Up Failed', description: result.message, variant: 'destructive' });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign-up.';
        toast({ title: 'Sign Up Failed', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsSocialLoading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof signupFormSchema>) {
    form.clearErrors();
    
    const completePhoneNumber = `${values.countryCode}${values.phone}`;
    
    try {
        const result = await createNewUser({...values, phone: completePhoneNumber});

        if (result.success) {
            toast({
                title: "Account Created! Please Verify Your Email",
                description: "We've sent a verification link to your email address. Please check your inbox to continue.",
                duration: 10000,
            });
            onClose();
            router.push('/login'); 
        }
    } catch(error) {
        console.error("Signup failed", error);
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred. Please try again.";
        toast({
            title: "Sign-up Failed",
            description: errorMessage,
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
  };
  
  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
          toast({ title: 'File too large', description: 'Image must be less than 5MB.', variant: 'destructive' });
          return;
      }
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          toast({ title: 'Invalid file type', description: 'Please select a JPG, PNG, or WEBP image.', variant: 'destructive' });
          return;
      }

      try {
        const compressedDataUrl = await compressImage(file);
        setAvatarPreview(compressedDataUrl);
        form.setValue('avatar', compressedDataUrl);
      } catch (error) {
        console.error("Image processing failed", error);
        toast({ title: 'Image Error', description: 'Could not process the image.', variant: 'destructive' });
      }
  };

  const getInitials = () => {
    if (accountType === 'vendor' && businessName) {
        return businessName.substring(0, 2).toUpperCase();
    }
    if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return 'U';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        <CardHeader className="text-center relative">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
          <CardDescription>
            Join thousands of event planners and vendors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Sign Up */}
          <Button 
            variant="outline" 
            className="w-full h-12 text-base" 
            onClick={() => handleSocialLogin('google')}
            disabled={isSocialLoading === 'google'}
          >
            {isSocialLoading === 'google' ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon className="mr-2 h-5 w-5" />
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          {/* Signup Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Account Type */}
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">I want to...</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                          <RadioGroupItem value="client" id="client" />
                          <Label htmlFor="client" className="cursor-pointer font-medium">Plan Events</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                          <RadioGroupItem value="vendor" id="vendor" />
                          <Label htmlFor="vendor" className="cursor-pointer font-medium">Offer Services</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Avatar Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarPreview || undefined} />
                    <AvatarFallback className="text-lg">
                      {avatarPreview ? null : <User className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8"
                    onClick={() => avatarFileRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    ref={avatarFileRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES.join(',')}
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Upload a profile picture (optional)
                </p>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Vendor-specific fields */}
              {accountType === 'vendor' && (
                <>
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Business Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vendorCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Registration Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your vendor code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Phone */}
              <div className="grid grid-cols-3 gap-2">
                <FormField
                  control={form.control}
                  name="countryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countryCodes.map((country) => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full h-12 text-base" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}