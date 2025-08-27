'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { AppNotification } from "@/lib/types";
import { getNotifications, markNotificationsAsRead } from "@/lib/services";
import { Bell, Check, ShoppingCart, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

const iconMap = {
    "booking": <ShoppingCart className="h-5 w-5 text-primary" />,
    "quote": <User className="h-5 w-5 text-blue-500" />,
    "default": <Bell className="h-5 w-5 text-muted-foreground" />
}

export default function VendorNotificationsPage() {
    const { userId } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const isMobile = useIsMobile();

    useEffect(() => {
        if (!userId) return;

        setIsLoading(true);
        const unsubscribe = getNotifications(userId, (notifs) => {
            setNotifications(notifs);
            setIsLoading(false);
        });

        // Mark notifications as read when page loads
        markNotificationsAsRead(userId);

        return () => unsubscribe();
    }, [userId]);

    if (isMobile) {
        return (
            <div className="min-h-screen bg-background">
                {/* Mobile Header */}
                <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => router.back()}
                        className="h-8 w-8"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-semibold">Notifications</h1>
                </div>

                {/* Mobile Notifications List */}
                <div className="divide-y">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length > 0 ? (
                        notifications.map(notification => (
                            <div 
                                key={notification.id} 
                                className={cn(
                                    "flex items-start gap-3 p-4 transition-colors",
                                    !notification.read && "bg-primary/5"
                                )}
                            >
                                <div className="mt-1 p-2 rounded-full bg-muted">
                                    {notification.link?.includes('booking') 
                                        ? iconMap.booking 
                                        : notification.link?.includes('request') 
                                        ? iconMap.quote 
                                        : iconMap.default
                                    }
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-tight">{notification.message}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                    </p>
                                    {notification.link && (
                                        <Link 
                                            href={notification.link} 
                                            className="inline-block text-xs text-primary font-medium mt-2"
                                        >
                                            View Details →
                                        </Link>
                                    )}
                                </div>
                                {!notification.read && (
                                    <div className="h-2 w-2 bg-primary rounded-full mt-2" />
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                            <div className="p-4 rounded-full bg-muted mb-4">
                                <Bell className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                When you receive updates about your bookings, quotes, and client requests, they'll appear here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Desktop view (fallback to existing card layout)
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-card rounded-lg border shadow-sm">
                <div className="p-6 border-b">
                    <h1 className="text-2xl font-semibold">Notifications</h1>
                    <p className="text-muted-foreground mt-1">All your recent updates in one place.</p>
                </div>
                <ScrollArea className="h-[600px]">
                    <div className="divide-y">
                        {isLoading ? (
                            <div className="p-4 space-y-4">
                                {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full" />
                                ))}
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map(notification => (
                                <div 
                                    key={notification.id} 
                                    className={cn(
                                        "flex items-start gap-4 p-4",
                                        !notification.read && "bg-primary/5"
                                    )}
                                >
                                    <div className="mt-1">
                                        {notification.link?.includes('booking') 
                                            ? iconMap.booking 
                                            : notification.link?.includes('request') 
                                            ? iconMap.quote 
                                            : iconMap.default
                                        }
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">{notification.message}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                        </p>
                                        {notification.link && (
                                            <Link href={notification.link} className="text-xs text-blue-600 hover:underline">
                                                View Details
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground p-8">
                                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                <p>You have no notifications yet.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}