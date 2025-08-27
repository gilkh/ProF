

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Calendar, MessageSquare, PenTool, Briefcase, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useEffect, useState } from 'react';
import { getVendorQuoteRequests } from '@/lib/services';
import { useAuth } from '@/hooks/use-auth';
import type { Chat } from '@/lib/types';
import { getChatsForUser } from '@/lib/services';
import { useLanguage } from '@/hooks/use-language';


export function BottomNavBar() {
  const pathname = usePathname();
  const { userId, role } = useAuth();
  const { translations } = useLanguage();
  const t = translations.nav;

  const [pendingRequests, setPendingRequests] = useState(0);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const isVendor = role === 'vendor';
  
    const clientLinks = [
        { href: '/client/home', label: t.home, icon: Home },
        { href: '/client/explore', label: t.explore, icon: Compass },
        { href: '/client/bookings', label: t.bookings, icon: Calendar },
        { href: '/client/event-planner', label: t.planner, icon: PenTool },
    ];

    const vendorLinks = [
        { href: '/vendor/home', label: t.home, icon: Home },
        { href: '/vendor/manage-services', label: t.services, icon: Briefcase },
        { href: '/vendor/client-requests', label: t.requests, icon: Users, 'data-testid': 'requests-link' },
        { href: '/vendor/bookings', label: t.bookings, icon: Calendar },
    ];

  useEffect(() => {
    if (isVendor && userId) {
      getVendorQuoteRequests(userId).then(requests => {
        setPendingRequests(requests.filter(q => q.status === 'pending').length);
      })
    }
  }, [isVendor, userId]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = getChatsForUser(userId, (chats: Chat[]) => {
      const anyUnread = chats.some(chat => (chat.unreadCount?.[userId] || 0) > 0);
      setHasUnreadMessages(anyUnread);
    });

    return () => unsubscribe();
  }, [userId]);


  const links = isVendor ? vendorLinks : clientLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t z-50 lg:hidden">
      <div className="flex justify-around items-center h-full">
        {links.map(({ href, label, icon: Icon, ...props }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full gap-1 text-xs transition-colors hover:text-primary',
              pathname === href ? 'text-primary' : 'text-muted-foreground'
            )}
            {...props}
          >
            <div className="relative">
                <Icon className="h-6 w-6" />
                {label === t.requests && pendingRequests > 0 && (
                    <Badge className="absolute -top-1 -right-2 h-4 w-4 shrink-0 justify-center rounded-full p-1 text-[10px]">
                        {pendingRequests}
                    </Badge>
                )}
                 {label === t.messages && hasUnreadMessages && (
                    <span className="absolute top-0 right-0 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                 )}
            </div>
            <span className="text-[10px]">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
