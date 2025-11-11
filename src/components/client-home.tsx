
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceCard } from './service-card';
import { OfferCard } from './offer-card';
import Link from 'next/link';
import { Calendar, Compass, Heart, PartyPopper } from 'lucide-react';
import { useEffect, useState, useMemo, memo } from 'react';
import type { Booking, ServiceOrOffer, UserProfile } from '@/lib/types';
import { getBookingsForUser, getSavedItems, getServicesAndOffers, getUserProfile } from '@/lib/services';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/hooks/use-auth';


const MemoizedOfferCard = memo(OfferCard);
const MemoizedServiceCard = memo(ServiceCard);

const StatCard = memo(({ title, value, icon: Icon, linkHref, linkText, isLoading }: { title: string, value: string | number, icon: React.ElementType, linkHref: string, linkText: string, isLoading: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
            {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
        {isLoading ? <Skeleton className="h-8 w-1/4 mt-1" /> : <div className="text-2xl font-bold">{value}</div>}
        <Link href={linkHref}>
            <p className="text-xs text-muted-foreground underline hover:text-primary">
                {linkText}
            </p>
        </Link>
        </CardContent>
    </Card>
));
StatCard.displayName = 'StatCard';


export function ClientHome() {
    const { userId, isLoading: isAuthLoading } = useAuth();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
    const [savedItemsCount, setSavedItemsCount] = useState(0);
    const [featuredItems, setFeaturedItems] = useState<ServiceOrOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Debug instrumentation state
    const [notifDebug, setNotifDebug] = useState<{
        platform?: string;
        isNative?: boolean;
        hasCapacitor?: boolean;
        plugins?: string[];
        permission?: any;
        token?: string;
        tokenError?: string;
        backendUpdate?: string;
        listeners?: string[];
        steps: string[];
    }>({ steps: [] });

    useEffect(() => {
        async function loadDashboardData() {
            if (!userId) {
                if (!isAuthLoading) setIsLoading(false);
                return;
            };

            setIsLoading(true);
            try {
                // Fetch data in parallel for better performance
                const [userProfile, bookings, saved, featured] = await Promise.all([
                    getUserProfile(userId),
                    getBookingsForUser(userId),
                    getSavedItems(userId, true), // Only fetch count
                    getServicesAndOffers(undefined, 4), // Fetch 4 featured items
                ]);
                
                setUser(userProfile)
                setUpcomingBookings(bookings.filter(b => b.date >= new Date()));
                setSavedItemsCount(Array.isArray(saved) ? saved.length : 0);
                setFeaturedItems(featured);

            } catch (error) {
                console.error("Failed to load client dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadDashboardData();
    }, [userId, isAuthLoading]);

    // Notification debug: run as soon as client home mounts with a user
    useEffect(() => {
        let unsubWeb: any = null;
        async function runNotificationDiag() {
            if (!userId) return;
            const steps: string[] = [];
            try {
                const hasCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
                const platform = hasCapacitor ? ((window as any).Capacitor.getPlatform?.() || (window as any).Capacitor.platform || 'unknown') : 'web';
                const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
                const plugins = hasCapacitor ? Object.keys(((window as any).Capacitor.Plugins) || {}) : [];
                steps.push(`[env] platform=${platform} isNative=${isNative} hasCapacitor=${hasCapacitor} plugins=${plugins.join(',')}`);
                setNotifDebug(d => ({ ...d, platform, isNative, hasCapacitor, plugins, steps: [...steps] }));

                // Web permission check (even in WebView this API may exist)
                if (typeof Notification !== 'undefined') {
                    try {
                        const perm = await Notification.requestPermission();
                        steps.push(`[perm] Notification.requestPermission -> ${perm}`);
                        setNotifDebug(d => ({ ...d, permission: perm, steps: [...steps] }));
                    } catch (e: any) {
                        steps.push(`[perm] Notification.requestPermission error: ${e?.message || String(e)}`);
                        setNotifDebug(d => ({ ...d, steps: [...steps] }));
                    }
                }

                // Attach foreground listeners to surface incoming payloads
                try {
                    const listeners: string[] = [];
                    const cap = (window as any).Capacitor;
                    const FM = cap?.Plugins?.FirebaseMessaging;
                    const PN = cap?.Plugins?.PushNotifications;
                    if (FM?.addListener) {
                        FM.addListener('messageReceived', (payload: any) => {
                            setNotifDebug(d => ({ ...d, steps: [...d.steps, `[recv:FM] ${JSON.stringify(payload)}`] }));
                        });
                        FM.addListener('tokenReceived', (e: any) => {
                            setNotifDebug(d => ({ ...d, steps: [...d.steps, `[token:FM] ${e?.token}`], token: e?.token }));
                        });
                        listeners.push('FirebaseMessaging.messageReceived', 'FirebaseMessaging.tokenReceived');
                    }
                    if (PN?.addListener) {
                        PN.addListener('pushNotificationReceived', (n: any) => {
                            setNotifDebug(d => ({ ...d, steps: [...d.steps, `[recv:PN] ${JSON.stringify(n)}`] }));
                        });
                        PN.addListener('registration', (t: any) => {
                            setNotifDebug(d => ({ ...d, steps: [...d.steps, `[token:PN] ${t?.value}`], token: t?.value }));
                        });
                        PN.addListener('registrationError', (err: any) => {
                            setNotifDebug(d => ({ ...d, steps: [...d.steps, `[err:PN] ${JSON.stringify(err)}`], tokenError: JSON.stringify(err) }));
                        });
                        listeners.push('PushNotifications.pushNotificationReceived', 'PushNotifications.registration', 'PushNotifications.registrationError');
                    }
                    setNotifDebug(d => ({ ...d, listeners, steps: [...d.steps, `[listeners] attached: ${listeners.join(', ') || 'none'}`] }));
                } catch (e: any) {
                    steps.push(`[listeners] error: ${e?.message || String(e)}`);
                    setNotifDebug(d => ({ ...d, steps: [...steps] }));
                }

                // Trigger the app's initialization flow (uses web or native depending on platform)
                try {
                    const { initializeNotifications } = await import('@/lib/notifications');
                    steps.push('[init] initializeNotifications(...) start');
                    setNotifDebug(d => ({ ...d, steps: [...steps] }));
                    await initializeNotifications(userId);
                    steps.push('[init] initializeNotifications(...) done');
                    setNotifDebug(d => ({ ...d, steps: [...steps] }));
                } catch (e: any) {
                    steps.push(`[init] initializeNotifications error: ${e?.message || String(e)}`);
                    setNotifDebug(d => ({ ...d, steps: [...steps], tokenError: e?.message || String(e) }));
                }
            } catch (e: any) {
                steps.push(`[fatal] ${e?.message || String(e)}`);
                setNotifDebug(d => ({ ...d, steps: [...steps] }));
            }
        }
        runNotificationDiag();
        return () => {
            try { if (unsubWeb) unsubWeb(); } catch {}
        };
    }, [userId]);
    
    const { specialOffers, featuredServices } = useMemo(() => ({
        specialOffers: featuredItems.filter(i => i.type === 'offer').slice(0, 2),
        featuredServices: featuredItems.filter(i => i.type === 'service').slice(0, 2)
    }), [featuredItems]);

    const pageIsLoading = isLoading || isAuthLoading;

    return (
        <div className="space-y-8">
            {/* DEBUG PANEL: visible diagnostics for push notifications on mobile APK */}
            {userId && (
                <Card className="border-red-500 border-2 bg-red-50">
                    <CardHeader>
                        <CardTitle>Push Diagnostics (Temporary)</CardTitle>
                        <CardDescription>Visible only during troubleshooting. Reinstall APK and log in to see live status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs break-words space-y-1">
                            <div><b>User:</b> {userId}</div>
                            <div><b>Platform:</b> {notifDebug.platform} | <b>isNative:</b> {String(notifDebug.isNative)} | <b>hasCapacitor:</b> {String(notifDebug.hasCapacitor)}</div>
                            <div><b>Plugins:</b> {(notifDebug.plugins || []).join(', ') || 'none'}</div>
                            <div><b>Permission:</b> {String(notifDebug.permission ?? 'unknown')}</div>
                            <div><b>Token:</b> {notifDebug.token || 'none'}</div>
                            {notifDebug.tokenError && <div className="text-red-600"><b>Token Error:</b> {notifDebug.tokenError}</div>}
                            {notifDebug.backendUpdate && <div><b>Backend:</b> {notifDebug.backendUpdate}</div>}
                            <div><b>Listeners:</b> {(notifDebug.listeners || []).join(', ') || 'none'}</div>
                            <div className="mt-2"><b>Steps:</b></div>
                            <ol className="list-decimal ml-5 space-y-1 max-h-64 overflow-auto">
                                {(notifDebug.steps || []).map((s, i) => (
                                    <li key={i}>{s}</li>
                                ))}
                            </ol>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <Button size="sm" onClick={() => {
                                setNotifDebug({ steps: [] });
                                // re-run
                                const evt = new Event('click');
                                // trigger useEffect by transient state change
                                setTimeout(() => setNotifDebug(d => ({ ...d })), 0);
                            }}>Clear</Button>
                            <Button size="sm" onClick={async () => {
                                try {
                                    const { initializeNotifications } = await import('@/lib/notifications');
                                    setNotifDebug(d => ({ ...d, steps: [...d.steps, '[manual] initializeNotifications triggered'] }));
                                    await initializeNotifications(userId!);
                                    setNotifDebug(d => ({ ...d, steps: [...d.steps, '[manual] initializeNotifications done'] }));
                                } catch (e: any) {
                                    setNotifDebug(d => ({ ...d, steps: [...d.steps, `[manual] error: ${e?.message || String(e)}`] }));
                                }
                            }}>Retry Registration</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-3xl font-bold">
                                {pageIsLoading ? <Skeleton className="h-9 w-64" /> : `Welcome back, ${user?.firstName || 'User'}!`}
                            </CardTitle>
                            <CardDescription className="mt-2 text-lg">Let's start planning your next amazing event.</CardDescription>
                        </div>
                        <Link href="/client/event-planner">
                            <Button size="lg" className="w-full md:w-auto">
                                <PartyPopper className="mr-2" />
                                Open Event Planner
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard 
                    title="Upcoming Bookings"
                    value={upcomingBookings.length}
                    icon={Calendar}
                    linkHref="/client/bookings"
                    linkText="View your calendar"
                    isLoading={pageIsLoading}
                />
                 <StatCard 
                    title="Saved Items"
                    value={savedItemsCount}
                    icon={Heart}
                    linkHref="/client/saved"
                    linkText="View your favorites"
                    isLoading={pageIsLoading}
                />
                <StatCard 
                    title="Explore Services"
                    value="50+"
                    icon={Compass}
                    linkHref="/client/explore"
                    linkText="Find vendors for any need"
                    isLoading={pageIsLoading}
                />
            </div>
            
             <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Special Offers</h2>
                    <p className="text-muted-foreground">Don't miss these limited-time deals.</p>
                </div>
                 {pageIsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-96 w-full rounded-xl" />
                        <Skeleton className="h-96 w-full rounded-xl" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {specialOffers.map((item) =>
                            <MemoizedOfferCard key={item.id} offer={item} role="client" />
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Featured Services</h2>
                    <p className="text-muted-foreground">Top-rated professionals to make your event unforgettable.</p>
                </div>
                 {pageIsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-96 w-full rounded-xl" />
                        <Skeleton className="h-96 w-full rounded-xl" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {featuredServices.map((item) =>
                            <MemoizedServiceCard key={item.id} service={item} role="client" />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
