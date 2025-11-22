
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
import { MessageSquare, User, LogOut, Home, Compass, Calendar, PenTool, Briefcase, Users, Settings, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from './logo';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { markNotificationsAsRead } from '@/lib/services';
import { useAuth, logout } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationsPanel } from './notifications-panel';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserProfile, useVendorProfile, useVendorRequests, useRealtimeNotifications, useRealtimeChats } from '@/hooks/use-user-data';


export function AppHeader() {
  const { userId, role, isLoading: isAuthLoading } = useAuth();
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

  const isVendor = role === 'vendor';
  const links = isVendor ? vendorLinks : clientLinks;

  // React Query Hooks
  const { data: userProfile } = useUserProfile();
  const { data: vendorProfile } = useVendorProfile();
  const { data: vendorRequests } = useVendorRequests();
  const { data: notifications } = useRealtimeNotifications();
  const { data: chats } = useRealtimeChats();

  const router = useRouter();
  const pathname = usePathname();

  const pendingRequests = vendorRequests?.filter(q => q.status === 'pending').length || 0;
  const hasUnreadNotifications = notifications?.some(n => !n.read) || false;
  const hasUnreadMessages = chats?.some(chat => (chat.unreadCount?.[userId || ''] || 0) > 0) || false;

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
    if (isVendor) return vendorProfile?.avatar;
    return userProfile?.avatar;
  }

  const handleMarkNotificationsRead = () => {
    if (userId) {
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
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        <div className="flex items-center gap-6">
          <Link href={isVendor ? "/vendor/home" : "/client/home"} className="flex items-center gap-2 transition-transform hover:scale-105 duration-300">
            <Logo className="text-primary drop-shadow-sm" width={130} height={130} src="/logo1.png" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {links.map(({ href, label, ...props }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
                    isActive
                      ? 'text-primary bg-primary/10 font-semibold'
                      : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                  )}
                  {...props}
                >
                  {label}
                  {label === t.requests && pendingRequests > 0 && (
                    <Badge className="ml-2 h-5 w-5 shrink-0 justify-center rounded-full p-0 text-[10px] animate-pulse">
                      {pendingRequests}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex w-full items-center justify-end gap-2 md:gap-3">
          {!isAuthLoading && userId ? (
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
                      className="relative rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Bell className="h-5 w-5" />
                      {hasUnreadNotifications && (
                        <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0 border-white/20 shadow-xl" align="end" side="bottom">
                    <NotificationsPanel />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="hidden lg:block">
                <Link href={isVendor ? "/vendor/messages" : "/client/messages"}>
                  <Button variant="ghost" size="icon" aria-label="Messages" className="relative rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                    <MessageSquare className="h-5 w-5" />
                    {hasUnreadMessages && (
                      <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                  </Button>
                </Link>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all">
                    <Avatar className="h-9 w-9 border border-white/20">
                      <AvatarImage src={getAvatarUrl()} alt="User" className="object-cover" />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 border-white/20 shadow-xl bg-background/95 backdrop-blur-md" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{isVendor ? vendorProfile?.businessName : `${userProfile?.firstName} ${userProfile?.lastName}`}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userProfile?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                    <Link href={isVendor ? "/vendor/profile" : "/client/profile"}>
                      <User className="mr-2 h-4 w-4" />
                      {t.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                    <Link href={isVendor ? "/vendor/bookings" : "/client/bookings"}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {t.bookings}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-primary/10 focus:text-primary cursor-pointer">
                    <Link href={isVendor ? "/vendor/settings" : "/client/settings"}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t.settings}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:bg-red-50 focus:text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">{t.login}</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
