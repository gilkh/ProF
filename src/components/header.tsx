

'use client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageSquare, User, LogOut, Menu, Home, Compass, Calendar, PenTool, Briefcase, Users, Settings, Bell, FileText } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
import { getVendorQuoteRequests, getUserProfile, getVendorProfile, getChatsForUser, getNotifications, markNotificationsAsRead } from '@/lib/services';
import { useAuth, logout } from '@/hooks/use-auth';
import type { UserProfile, VendorProfile, Chat, AppNotification } from '@/lib/types';
import { useLanguage } from '@/hooks/use-language';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationsPanel } from './notifications-panel';
import { useIsMobile } from '@/hooks/use-mobile';


export function AppHeader() {
  const { userId, role, isLoading } = useAuth();
  const { translations } = useLanguage();
  const t = translations.nav;
  const isMobile = useIsMobile();
  
    const clientLinks = [
        { href: '/client/home', label: t.home, icon: Home },
        { href: '/client/explore', label: t.explore, icon: Compass },
        { href: '/client/bookings', label: t.bookings, icon: Calendar },
        { href: '/client/event-planner', label: t.planner, icon: PenTool },
        { href: '/client/messages', label: t.messages, icon: MessageSquare, 'data-testid': 'messages-link-desktop' },
    ];

    const vendorLinks = [
        { href: '/vendor/home', label: t.home, icon: Home },
        { href: '/vendor/manage-services', label: t.services, icon: Briefcase },
        { href: '/vendor/client-requests', label: t.requests, icon: Users, 'data-testid': 'requests-link-desktop' },
        { href: '/vendor/bookings', label: t.bookings, icon: Calendar },
        { href: '/vendor/messages', label: t.messages, icon: MessageSquare, 'data-testid': 'messages-link-desktop' },
    ];

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [pendingRequests, setPendingRequests] = useState(0);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  
  const isVendor = role === 'vendor';
  const links = isVendor ? vendorLinks : clientLinks;

  useEffect(() => {
    async function fetchData() {
        if (!userId) return;

        if (isVendor) {
            getVendorQuoteRequests(userId).then(requests => {
                setPendingRequests(requests.filter(q => q.status === 'pending').length);
            });
            getVendorProfile(userId).then(setVendorProfile);
        }
        
        getUserProfile(userId).then(setUserProfile);
    }
    fetchData();
  }, [userId, isVendor]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = getChatsForUser(userId, (chats: Chat[]) => {
      const anyUnread = chats.some(chat => (chat.unreadCount?.[userId] || 0) > 0);
      setHasUnreadMessages(anyUnread);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
      if(!userId) return;
      const unsubscribe = getNotifications(userId, (notifications) => {
          const anyUnread = notifications.some(n => !n.read);
          setHasUnreadNotifications(anyUnread);
      });
      return () => unsubscribe();
  }, [userId]);


  const handleLogout = () => {
    logout();
    router.push('/login');
  };
  
  const getInitials = () => {
    if (isVendor && vendorProfile?.businessName) {
        return vendorProfile.businessName.substring(0, 2).toUpperCase();
    }
    if (userProfile?.firstName && userProfile?.lastName) {
        return `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  }

  const getAvatarUrl = () => {
      if(isVendor) return vendorProfile?.avatar;
      return userProfile?.avatar;
  }

  const handleMarkNotificationsRead = () => {
      if(userId) {
          markNotificationsAsRead(userId);
      }
  }
  
  const BellButton = () => (
    <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
      <Bell className="h-6 w-6" />
      {hasUnreadNotifications && (
        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
        </span>
      )}
    </Button>
  );

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-6">
        <Link href={isVendor ? "/vendor/home" : "/client/home"} className="flex items-center gap-2 font-semibold text-lg">
            <Logo className="text-primary" width={140} height={140} src="/logo1.png" />
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4">
            {links.map(({ href, label, ...props }) => (
            <Link
                key={href}
                href={href}
                className={cn(
                'flex items-center gap-2 text-lg font-medium transition-colors hover:text-primary',
                pathname === href ? 'text-primary' : 'text-muted-foreground'
                )}
                {...props}
            >
                {label}
                 {label === t.requests && pendingRequests > 0 && (
                    <Badge className="h-5 w-5 shrink-0 justify-center rounded-full p-1 text-xs">
                        {pendingRequests}
                    </Badge>
                )}
            </Link>
            ))}
        </nav>
      </div>

      <div className="flex w-full items-center justify-end gap-1 md:gap-2 lg:gap-4">
        {!isLoading && userId ? (
        <>
            <div className="lg:hidden">
              <Link href={isVendor ? "/vendor/notifications" : "/client/notifications"} onClick={handleMarkNotificationsRead}>
                <BellButton />
              </Link>
            </div>
            <div className="hidden lg:block">
              <Popover onOpenChange={(open) => open && handleMarkNotificationsRead()}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    aria-label="Notifications" 
                    className="relative"
                  >
                    <Bell className="h-6 w-6" />
                    {hasUnreadNotifications && (
                      <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end" side="bottom">
                  <NotificationsPanel />
                </PopoverContent>
              </Popover>
            </div>

            <div className="hidden lg:block">
              <Link href={isVendor ? "/vendor/messages" : "/client/messages"}>
                  <Button variant="ghost" size="icon" aria-label="Messages" className="relative">
                      <MessageSquare className="h-6 w-6" />
                      {hasUnreadMessages && (
                        <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      )}
                  </Button>
              </Link>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                    <AvatarImage src={getAvatarUrl()} alt="User" />
                    <AvatarFallback>
                        {getInitials()}
                    </AvatarFallback>
                    </Avatar>
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{isVendor ? vendorProfile?.businessName : `${userProfile?.firstName} ${userProfile?.lastName}`}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        {userProfile?.email}
                    </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href={isVendor ? "/vendor/profile" : "/client/profile"}>{t.profile}</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href={isVendor ? "/vendor/bookings" : "/client/bookings"}>{t.bookings}</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href={isVendor ? "/vendor/settings" : "/client/settings"}>{t.settings}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.logout}
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
        ) : (
            <Link href="/login">
                <Button>{t.login}</Button>
            </Link>
        )}
      </div>
    </header>
  );
}
