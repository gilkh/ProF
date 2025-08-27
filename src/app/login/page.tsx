
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Briefcase, CalendarCheck, FileText, Search, ShieldCheck, Sparkles, Loader2, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { signInUser, signInWithGoogle } from '@/lib/services';
import { useToast } from '@/hooks/use-toast';
import { logout } from '@/hooks/use-auth';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { VendorInquiryDialog } from '@/components/vendor-inquiry-dialog';
import { useLanguage } from '@/hooks/use-language';
import { Separator } from '@/components/ui/separator';

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
        <div className="flex flex-col items-center p-6 text-center bg-card rounded-xl shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center justify-center w-16 h-16 mb-4 text-primary bg-primary/10 rounded-full">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    )
}

const categories = [
    { name: 'Venues', image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=2070&auto=format&fit=crop', hint: 'wedding reception'},
    { name: 'Catering & Sweets', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1974&auto=format&fit=crop', hint: 'catering food'},
    { name: 'Entertainment', image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=2070&auto=format&fit=crop', hint: 'DJ party'},
    { name: 'Lighting & Sound', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop', hint: 'concert stage'},
    { name: 'Photography & Videography', image: 'https://images.unsplash.com/photo-1504196658116-b9a55a850f39?q=80&w=2070&auto=format&fit=crop', hint: 'birthday photography'},
    { name: 'Decoration', image: 'https://images.unsplash.com/photo-1522158637959-30385a09e0da?q=80&w=2070&auto=format&fit=crop', hint: 'wedding decor'},
    { name: 'Beauty & Grooming', image: 'https://images.unsplash.com/photo-1632329583196-9d3635f35e98?q=80&w=2070&auto=format&fit=crop', hint: 'makeup artist'},
    { name: 'Transportation', image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop', hint: 'luxury car'},
    { name: 'Invitations & Printables', image: 'https://images.unsplash.com/photo-1535986934571-6c2d1b4a6212?q=80&w=1974&auto=format&fit=crop', hint: 'wedding invitation'},
    { name: 'Rentals & Furniture', image: 'https://images.unsplash.com/photo-1594026112273-094239854128?q=80&w=2070&auto=format&fit=crop', hint: 'event furniture'},
    { name: 'Security and Crowd Control', image: 'https://images.unsplash.com/photo-1569012871812-f38ee64cd54c?q=80&w=2070&auto=format&fit=crop', hint: 'security guard'}
]

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<false | 'google'>(false);
  const { toast } = useToast();
  const { translations } = useLanguage();
  const t = translations.loginPage;

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
    <div className="w-full bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] sm:h-[80vh] flex items-center justify-center text-white">
        <Image 
            src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2070&auto=format&fit=crop" 
            alt="Joyful event celebration" 
            fill
            className="z-0 object-cover"
            data-ai-hint="event celebration"
            priority
        />
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div className="relative z-20 container mx-auto px-4 text-center">
            <div className="flex justify-center items-center gap-4 mb-6">
                <Logo className="h-16 w-16" />
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter">
                    {t.mainTitle}
                </h1>
            </div>
          <p className="max-w-3xl mx-auto mt-4 text-lg md:text-xl text-white/90">
            {t.subtitle}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" className="text-lg h-12 px-8 w-full sm:w-auto" onClick={() => document.getElementById('login-section')?.scrollIntoView({ behavior: 'smooth' })}>
                {t.planYourEvent}
            </Button>
            <VendorInquiryDialog>
                <Button size="lg" variant="outline" className="text-lg h-12 px-8 bg-transparent border-white text-white hover:bg-white hover:text-primary w-full sm:w-auto">
                    {t.becomeAVendor}
                </Button>
            </VendorInquiryDialog>
          </div>
        </div>
      </section>

      {/* Categories Showcase Section */}
        <section className="py-20 sm:py-24 bg-muted/50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold">{t.findEverything}</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                        {t.findEverythingSubtitle}
                    </p>
                </div>
            </div>
            <div 
                className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-200px),transparent_100%)]"
            >
                <ul className="flex items-center justify-center md:justify-start [&_li]:mx-4 [&_img]:max-w-none animate-infinite-scroll hover:[animation-play-state:paused]">
                    {categories.map((category, index) => (
                        <li key={`${category.name}-${index}`}>
                            <div className="relative overflow-hidden rounded-2xl w-72 h-96 group">
                                <Image 
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    data-ai-hint={category.hint}
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-300"></div>
                                <h3 className="absolute bottom-4 left-4 text-2xl font-bold text-white drop-shadow-md">{category.name}</h3>
                            </div>
                        </li>
                    ))}
                </ul>
                 <ul className="flex items-center justify-center md:justify-start [&_li]:mx-4 [&_img]:max-w-none animate-infinite-scroll hover:[animation-play-state:paused]" aria-hidden="true">
                    {categories.map((category, index) => (
                        <li key={`${category.name}-clone-${index}`}>
                             <div className="relative overflow-hidden rounded-2xl w-72 h-96 group">
                                <Image 
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    data-ai-hint={category.hint}
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-300"></div>
                                <h3 className="absolute bottom-4 left-4 text-2xl font-bold text-white drop-shadow-md">{category.name}</h3>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 sm:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">{t.whyChoose}</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              {t.whyChooseSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
                icon={<Sparkles className="w-8 h-8" />}
                title={t.features.aiPlanner.title}
                description={t.features.aiPlanner.description}
            />
            <FeatureCard 
                icon={<Search className="w-8 h-8" />}
                title={t.features.marketplace.title}
                description={t.features.marketplace.description}
            />
             <FeatureCard 
                icon={<Briefcase className="w-8 h-8" />}
                title={t.features.showcase.title}
                description={t.features.showcase.description}
            />
            <FeatureCard 
                icon={<FileText className="w-8 h-8" />}
                title={t.features.quoting.title}
                description={t.features.quoting.description}
            />
            <FeatureCard 
                icon={<CalendarCheck className="w-8 h-8" />}
                title={t.features.booking.title}
                description={t.features.booking.description}
            />
            <FeatureCard 
                icon={<ShieldCheck className="w-8 h-8" />}
                title={t.features.verified.title}
                description={t.features.verified.description}
            />
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section id="login-section" className="py-20 sm:py-24 bg-muted/50">
        <div className="container mx-auto px-4">
           <Card className="w-full max-w-md mx-auto shadow-2xl">
                <CardHeader className="text-center p-4 sm:p-6">
                    <CardTitle className="text-2xl font-bold">{t.signinTitle}</CardTitle>
                    <CardDescription>{t.signinSubtitle}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                    <form onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t.emailLabel}</Label>
                                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">{t.passwordLabel}</Label>
                                    <Link href="/forgot-password" passHref>
                                        <span className="text-sm text-primary hover:underline cursor-pointer">
                                            Forgot password?
                                        </span>
                                    </Link>
                                </div>
                                <Input id="password" name="password" type="password" required />
                            </div>
                        </div>
                        <div className="mt-6">
                            <Button type="submit" className="w-full" disabled={isLoading || !!isSocialLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t.signinButton}
                            </Button>
                        </div>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Button variant="outline" onClick={() => handleSocialLogin('google')} disabled={!!isSocialLoading}>
                             {isSocialLoading === 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-5 w-5" />}
                            Google
                        </Button>
                    </div>

                    <div className="mt-6 text-center text-sm">
                        {t.noAccount}{' '}
                        <Link href="/signup" className="underline font-semibold text-primary hover:text-primary/80">
                            {t.signupNow}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
      </section>

       {/* Footer */}
       <footer className="py-8 bg-background border-t">
            <div className="container mx-auto px-4 text-center text-muted-foreground">
                <p>{t.footer.replace('{year}', new Date().getFullYear().toString())}</p>
            </div>
       </footer>
    </div>
  );
}
