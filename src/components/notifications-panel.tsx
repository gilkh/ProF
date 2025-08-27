
'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { AppNotification } from "@/lib/types";
import { getNotifications } from "@/lib/services";
import { Bell, Check, ShoppingCart, User, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";

const iconMap = {
    "booking": <ShoppingCart className="h-5 w-5 text-primary" />,
    "quote": <User className="h-5 w-5 text-blue-500" />,
    "default": <Bell className="h-5 w-5 text-muted-foreground" />
}

export function NotificationsPanel() {
    const { userId, role } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        setIsLoading(true);
        const unsubscribe = getNotifications(userId, (notifs) => {
            setNotifications(notifs.slice(0, 10)); // Show only latest 10 in popup
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const isVendor = role === 'vendor';

    return (
        <div className="w-80">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <Link 
                    href={isVendor ? "/vendor/notifications" : "/client/notifications"}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                    View all <ExternalLink className="h-3 w-3" />
                </Link>
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-[400px]">
                <div className="flex flex-col">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3 w-3/4" />
                                        <Skeleton className="h-2 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length > 0 ? (
                        notifications.map(notification => (
                            <div 
                                key={notification.id} 
                                className={cn(
                                    "flex items-start gap-3 p-4 border-b hover:bg-muted/50 transition-colors",
                                    !notification.read && "bg-primary/5"
                                )}
                            >
                                <div className="mt-1 p-1.5 rounded-full bg-muted">
                                    {notification.link?.includes('booking') 
                                        ? iconMap.booking 
                                        : notification.link?.includes('request') 
                                        ? iconMap.quote 
                                        : iconMap.default
                                    }
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <p className="text-sm font-medium leading-tight line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                                    </p>
                                    {notification.link && (
                                        <Link 
                                            href={notification.link} 
                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                                        >
                                            View Details
                                        </Link>
                                    )}
                                </div>
                                {!notification.read && (
                                    <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="p-3 rounded-full bg-muted mb-3">
                                <Bell className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium mb-1">No notifications yet</p>
                            <p className="text-xs text-muted-foreground">
                                You'll see updates about your activity here
                            </p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="p-3 border-t bg-muted/30">
                    <Link 
                        href={isVendor ? "/vendor/notifications" : "/client/notifications"}
                        className="block w-full"
                    >
                        <Button variant="ghost" size="sm" className="w-full text-xs">
                            View All Notifications
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
