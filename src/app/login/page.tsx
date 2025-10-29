
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Briefcase, CalendarCheck, FileText, Search, ShieldCheck, Sparkles, Loader2, PartyPopper, Heart, Star, Users, Calendar, Camera, Music, Utensils, MapPin, ArrowRight, Play, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signInUser, signInWithGoogle, getLoginButtonSettings } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import { useAuth, logout } from '@/hooks/use-auth';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { VendorInquiryDialog } from '@/components/vendor-inquiry-dialog';
import { useLanguage } from '@/hooks/use-language';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SignupModal } from '@/components/signup-modal';

function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

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


function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 dark:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-center w-14 h-14 mb-4 text-primary bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{description}</p>
            </div>
        </div>
    )
}

function StatCard({ icon, number, label }: { icon: React.ReactNode, number: string, label: string }) {
    return (
        <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 text-primary bg-primary/10 rounded-xl">
                {icon}
            </div>
            <div className="text-2xl font-bold text-white mb-1">{number}</div>
            <div className="text-white/80 text-sm">{label}</div>
        </div>
    )
}

function EventTypeCard({ icon, title, description, gradient }: { icon: React.ReactNode, title: string, description: string, gradient: string }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${gradient} group cursor-pointer hover:scale-105 transition-all duration-300`}>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-center w-12 h-12 mb-4 bg-white/20 rounded-xl backdrop-blur-sm">
                    {icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{title}</h3>
                <p className="text-white/90 text-sm">{description}</p>
            </div>
        </div>
    )
}

const eventTypes = [
    { 
        icon: <Heart className="w-6 h-6" />, 
        title: 'Weddings', 
        description: 'Create your perfect day with our wedding specialists',
        gradient: 'bg-gradient-to-br from-rose-400 to-pink-600'
    },
    { 
        icon: <PartyPopper className="w-6 h-6" />, 
        title: 'Birthdays', 
        description: 'Celebrate life with unforgettable birthday parties',
        gradient: 'bg-gradient-to-br from-purple-400 to-indigo-600'
    },
    { 
        icon: <Briefcase className="w-6 h-6" />, 
        title: 'Corporate', 
        description: 'Professional events that make lasting impressions',
        gradient: 'bg-gradient-to-br from-blue-400 to-cyan-600'
    },
    { 
        icon: <Star className="w-6 h-6" />, 
        title: 'Special Events', 
        description: 'Any occasion, perfectly planned and executed',
        gradient: 'bg-gradient-to-br from-amber-400 to-orange-600'
    }
];

const categories = [
    { name: 'Venues', image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=2070&auto=format&fit=crop', hint: 'wedding reception', icon: <MapPin className="w-5 h-5" /> },
    { name: 'Catering', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop', hint: 'catering food', icon: <Utensils className="w-5 h-5" /> },
    { name: 'Entertainment', image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=2070&auto=format&fit=crop', hint: 'DJ party', icon: <Music className="w-5 h-5" /> },
    { name: 'Photography', image: '/Event-Photography.jpg', hint: 'birthday photography', icon: <Camera className="w-5 h-5" /> },
    { name: 'Decoration', image: 'https://images.unsplash.com/photo-1522158637959-30385a09e0da?q=80&w=2070&auto=format&fit=crop', hint: 'wedding decor', icon: <Sparkles className="w-5 h-5" /> }
]

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<false | 'google'>(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [userType, setUserType] = useState<'client' | 'vendor'>('client');
  const [clientLoginEnabled, setClientLoginEnabled] = useState(true);
  const [vendorLoginEnabled, setVendorLoginEnabled] = useState(true);
  const { toast } = useToast();
  const { translations } = useLanguage();
  const t = translations.loginPage;
  const { userId, role, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && userId) {
      if (role === 'client') {
        router.replace('/client/home');
      } else if (role === 'vendor') {
        router.replace('/vendor/home');
      } else if (role === 'admin') {
        router.replace('/admin/home');
      }
    }
  }, [authLoading, userId, role, router]);

  useEffect(() => {
    loadLoginButtonSettings();
  }, []);

  const loadLoginButtonSettings = async () => {
    try {
      const settings = await getLoginButtonSettings();
      setClientLoginEnabled(settings.clientLoginEnabled);
      setVendorLoginEnabled(settings.vendorLoginEnabled);
    } catch (error) {
      console.error('Failed to load login button settings:', error);
      // Keep default values (true) if loading fails
    }
  };

  useEffect(() => {
    // Add scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const onSocialLoginSuccess = (role: 'client' | 'vendor' | 'admin') => {
      toast({
          title: 'Sign In Successful!',
          description: `Welcome! Redirecting to your dashboard...`,
      });
      if (role === 'client') {
          router.push('/client/home');
      } else if (role === 'vendor') {
          router.push('/vendor/home');
      } else if (role === 'admin') {
          router.push('/admin/home');
      }
  };

  const handleSocialLogin = async (provider: 'google') => {
      setIsSocialLoading(provider);
      logout();
      try {
          const result = await signInWithGoogle();
          if (result.success) {
            localStorage.setItem('userId', result.userId);
            localStorage.setItem('role', result.role);
            setCookie('role', result.role, 7);
            setCookie('userId', result.userId, 7);
            onSocialLoginSuccess(result.role);
          } else {
              toast({ title: 'Sign In Failed', description: result.message, variant: 'destructive' });
          }
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign-in.';
          toast({ title: 'Sign In Failed', description: errorMessage, variant: 'destructive' });
      } finally {
          setIsSocialLoading(false);
      }
  }


  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    // Clear any previous session
    logout();

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        const result = await signInUser(email, password);

        if (result.success) {
            // Save user info to localStorage to simulate a session
            localStorage.setItem('userId', result.userId);
            localStorage.setItem('role', result.role);
            // Set cookie for middleware
            setCookie('role', result.role, 7);
            setCookie('userId', result.userId, 7);
            onSocialLoginSuccess(result.role);
        } else {
             toast({
                title: 'Sign In Failed',
                description: result.message || 'No account found with that email or password. Please check your credentials or sign up.',
                variant: 'destructive',
            });
        }

    } catch (error) {
        console.error("Login failed:", error);
        const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign-in. Please try again.';
        toast({
            title: 'Sign In Failed',
            description: errorMessage,
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-background overflow-x-hidden">
      {/* Hero Section - Mobile First */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-white">
        {/* Background with multiple layers for depth */}
        <div className="absolute inset-0 z-0">
          <Image 
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2070&auto=format&fit=crop" 
              alt="Joyful event celebration" 
              fill
              className="object-cover"
              data-ai-hint="event celebration"
              priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
        </div>
        
        {/* Floating elements for visual interest */}
        <div className="absolute inset-0 z-10 overflow-hidden">
          <div className="absolute top-20 left-10 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-16 w-1 h-1 bg-white/40 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-20 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-20 container mx-auto px-6 text-center">
          {/* Logo and Brand */}
          <div className="flex flex-col items-center mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Logo className="text-white drop-shadow-lg" />
            </div>
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
              ✨ Lebanon's Premier Event Platform
            </Badge>
          </div>

          {/* Main Headline */}
          <div className="mb-8 animate-fade-in-up delay-300">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Turn Your <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Dreams</span><br className="sm:hidden" /> Into Reality
            </h2>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              From intimate gatherings to grand celebrations, we connect you with Lebanon's finest event professionals
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-12 animate-fade-in-up delay-500">
            <StatCard icon={<Users className="w-5 h-5" />} number="500+" label="Vendors" />
            <StatCard icon={<Calendar className="w-5 h-5" />} number="2K+" label="Events" />
            <StatCard icon={<Star className="w-5 h-5" />} number="4.9" label="Rating" />
          </div>

          {/* CTA Buttons */}
          <div className="space-y-6 animate-fade-in-up delay-700">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg" 
                disabled={!clientLoginEnabled}
                className={`w-full sm:w-auto text-lg h-14 px-8 shadow-2xl transition-all duration-300 group ${
                  clientLoginEnabled 
                    ? 'bg-primary hover:bg-primary/90 hover:shadow-primary/25' 
                    : 'bg-gray-400 cursor-not-allowed opacity-50'
                }`}
                onClick={() => {
                  if (clientLoginEnabled) {
                    setUserType('client');
                    setShowLoginForm(true);
                  }
                }}
              >
                <Calendar className={`w-5 h-5 mr-2 transition-transform ${clientLoginEnabled ? 'group-hover:scale-110' : ''}`} />
                Client Login
                <ArrowRight className={`w-4 h-4 ml-2 transition-transform ${clientLoginEnabled ? 'group-hover:translate-x-1' : ''}`} />
              </Button>
              <VendorInquiryDialog>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className={`w-full sm:w-auto text-lg h-14 px-8 backdrop-blur-sm transition-all duration-300 group ${
                    (!clientLoginEnabled && !vendorLoginEnabled)
                      ? 'bg-primary hover:bg-primary/90 text-white border-primary shadow-2xl hover:shadow-primary/25'
                      : 'bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary'
                  }`}
                >
                  <Briefcase className={`w-5 h-5 mr-2 transition-transform group-hover:scale-110`} />
                  Join as Vendor
                </Button>
              </VendorInquiryDialog>
              <Button 
                size="lg" 
                variant="outline" 
                disabled={!vendorLoginEnabled}
                className={`w-full sm:w-auto text-lg h-14 px-8 backdrop-blur-sm transition-all duration-300 group ${
                  vendorLoginEnabled 
                    ? 'bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary' 
                    : 'bg-gray-400/20 border-gray-400/30 text-gray-400 cursor-not-allowed opacity-50'
                }`}
                onClick={() => {
                  if (vendorLoginEnabled) {
                    setUserType('vendor');
                    setShowLoginForm(true);
                  }
                }}
              >
                <Briefcase className={`w-5 h-5 mr-2 transition-transform ${vendorLoginEnabled ? 'group-hover:scale-110' : ''}`} />
                Vendor Login
              </Button>
            </div>
            <div className="flex justify-center animate-fade-in-up delay-800">
              <p className="text-white/80 text-base font-medium">
                New to Farhetkoun? Choose your path above to get started
              </p>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-white/60" />
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">What's Your Celebration?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Every moment deserves to be special. Choose your event type and let us make it extraordinary.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-on-scroll">
            {eventTypes.map((event, index) => (
              <EventTypeCard key={index} {...event} />
            ))}
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="py-16 sm:py-20 bg-muted/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              From venues to vendors, we've got every aspect of your event covered.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 animate-on-scroll">
            {categories.map((category, index) => (
              <div key={index} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl aspect-square mb-3 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Image 
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    data-ai-hint={category.hint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="flex items-center gap-2 text-white">
                      {category.icon}
                      <span className="font-semibold text-sm">{category.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose Farhetkoun?</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg leading-relaxed">
              We're not just another event platform. We're your dedicated partner in creating unforgettable experiences.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 animate-on-scroll">
            <FeatureCard 
                icon={<Sparkles className="w-7 h-7" />}
                title="AI-Powered Planning"
                description="Smart recommendations and automated timeline generation to make planning effortless"
            />
            <FeatureCard 
                icon={<Search className="w-7 h-7" />}
                title="Curated Marketplace"
                description="Handpicked vendors and venues, all verified for quality and reliability"
            />
            <FeatureCard 
                icon={<ShieldCheck className="w-7 h-7" />}
                title="Secure & Trusted"
                description="Protected payments, verified reviews, and guaranteed service quality"
            />
            <FeatureCard 
                icon={<FileText className="w-7 h-7" />}
                title="Smart Quoting"
                description="Get instant quotes and compare prices from multiple vendors effortlessly"
            />
            <FeatureCard 
                icon={<CalendarCheck className="w-7 h-7" />}
                title="Seamless Booking"
                description="Book services, manage timelines, and coordinate everything in one place"
            />
            <FeatureCard 
                icon={<Heart className="w-7 h-7" />}
                title="Personal Touch"
                description="Dedicated support team to ensure your event is exactly as you envisioned"
            />
          </div>
        </div>
      </section>

      {/* Login/Signup Modal */}
      {showLoginForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl animate-scale-in">
            <CardHeader className="text-center relative">
              <button 
                onClick={() => setShowLoginForm(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
              <CardTitle className="text-2xl font-bold">
                {userType === 'vendor' ? 'Join as Vendor' : 'Welcome Back'}
              </CardTitle>
              <CardDescription>
                {userType === 'vendor' 
                  ? 'Start growing your event business with us' 
                  : 'Sign in to plan your perfect event'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Type Selection */}
              {!userType && (
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">I want to...</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
                      onClick={() => setUserType('client')}
                    >
                      <Calendar className="w-6 h-6" />
                      <span className="text-sm font-medium">Plan Event</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
                      onClick={() => setUserType('vendor')}
                    >
                      <Briefcase className="w-6 h-6" />
                      <span className="text-sm font-medium">Offer Services</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Login Form */}
              {userType && (
                <>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" placeholder="your@email.com" required />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <Input id="password" name="password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full h-12" disabled={isLoading || !!isSocialLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={() => handleSocialLogin('google')} 
                    disabled={!!isSocialLoading}
                    className="w-full h-12"
                  >
                    {isSocialLoading === 'google' ? 
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                      <GoogleIcon className="mr-2 h-5 w-5" />
                    }
                    Google
                  </Button>

                  <div className="text-center text-sm">
                    Don't have an account?{' '}
                    <button 
                      onClick={() => {
                        setShowLoginForm(false);
                        setShowSignupForm(true);
                      }}
                      className="underline font-semibold text-primary hover:text-primary/80"
                    >
                      Sign up now
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Signup Modal */}
      <SignupModal 
        isOpen={showSignupForm} 
        onClose={() => setShowSignupForm(false)}
        userType={userType}
      />

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Lebanon's premier event planning platform, connecting you with the best vendors and venues.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Clients</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Plan Event</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Browse Vendors</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Get Quotes</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Vendors</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Join Platform</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Manage Services</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} Farhetkoun. All rights reserved. Made with ❤️ in Lebanon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
