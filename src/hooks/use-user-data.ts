import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getUserProfile,
    getVendorProfile,
    getBookingsForUser,
    getSavedItems,
    getServicesAndOffers,
    getSponsoredBanners,
    getTopVendors,
    getVendorQuoteRequests,
    getChatsForUser,
    getNotifications,
    getUserSettings
} from '@/lib/services';
import { useAuth } from './use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect } from 'react';

// Keys for cache invalidation
export const QUERY_KEYS = {
    userProfile: (userId: string) => ['userProfile', userId],
    vendorProfile: (userId: string) => ['vendorProfile', userId],
    bookings: (userId: string) => ['bookings', userId],
    savedItems: (userId: string) => ['savedItems', userId],
    featuredItems: ['featuredItems'],
    banners: ['banners'],
    topVendors: ['topVendors'],
    vendorRequests: (vendorId: string) => ['vendorRequests', vendorId],
    notifications: (userId: string) => ['notifications', userId],
    chats: (userId: string) => ['chats', userId],
    userSettings: (userId: string) => ['userSettings', userId],
    servicesAndOffers: ['servicesAndOffers'],
};

export function useUserProfile() {
    const { userId } = useAuth();
    return useQuery({
        queryKey: QUERY_KEYS.userProfile(userId || ''),
        queryFn: () => getUserProfile(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useServicesAndOffers() {
    return useQuery({
        queryKey: QUERY_KEYS.servicesAndOffers,
        queryFn: () => getServicesAndOffers(undefined, { includePending: false }),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useUserSettings() {
    const { userId } = useAuth();
    return useQuery({
        queryKey: QUERY_KEYS.userSettings(userId || ''),
        queryFn: () => getUserSettings(userId!),
        enabled: !!userId,
    });
}

export function useVendorProfile() {
    const { userId, role } = useAuth();
    const isVendor = role === 'vendor';
    return useQuery({
        queryKey: QUERY_KEYS.vendorProfile(userId || ''),
        queryFn: () => getVendorProfile(userId!),
        enabled: !!userId && isVendor,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useUserBookings() {
    const { userId } = useAuth();
    return useQuery({
        queryKey: QUERY_KEYS.bookings(userId || ''),
        queryFn: () => getBookingsForUser(userId!),
        enabled: !!userId,
    });
}

export function useSavedItemsCount() {
    const { userId } = useAuth();
    return useQuery({
        queryKey: QUERY_KEYS.savedItems(userId || ''),
        queryFn: async () => {
            const items = await getSavedItems(userId!, true);
            return Array.isArray(items) ? items.length : 0;
        },
        enabled: !!userId,
    });
}

export function useFeaturedItems() {
    return useQuery({
        queryKey: QUERY_KEYS.featuredItems,
        queryFn: () => getServicesAndOffers(undefined, { count: 4 }),
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

export function useBanners() {
    return useQuery({
        queryKey: QUERY_KEYS.banners,
        queryFn: () => getSponsoredBanners(),
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

export function useTopVendors() {
    return useQuery({
        queryKey: QUERY_KEYS.topVendors,
        queryFn: () => getTopVendors({ count: 12 }),
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

export function useVendorRequests() {
    const { userId, role } = useAuth();
    const isVendor = role === 'vendor';
    return useQuery({
        queryKey: QUERY_KEYS.vendorRequests(userId || ''),
        queryFn: () => getVendorQuoteRequests(userId!),
        enabled: !!userId && isVendor,
    });
}

// Real-time hooks using Firestore listeners + React Query cache
export function useRealtimeNotifications() {
    const { userId } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = getNotifications(userId, (notifications) => {
            queryClient.setQueryData(QUERY_KEYS.notifications(userId), notifications);
        });

        return () => unsubscribe();
    }, [userId, queryClient]);

    return useQuery({
        queryKey: QUERY_KEYS.notifications(userId || ''),
        queryFn: () => new Promise<any[]>((resolve) => {
            // Initial fetch if needed, but listener handles updates
            const unsub = getNotifications(userId!, (data) => {
                unsub();
                resolve(data);
            });
        }),
        enabled: !!userId,
        staleTime: Infinity, // Data is kept fresh by listener
    });
}

export function useRealtimeChats() {
    const { userId } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId) return;

        const unsubscribe = getChatsForUser(userId, (chats) => {
            queryClient.setQueryData(QUERY_KEYS.chats(userId), chats);
        });

        return () => unsubscribe();
    }, [userId, queryClient]);

    return useQuery({
        queryKey: QUERY_KEYS.chats(userId || ''),
        queryFn: () => new Promise<any[]>((resolve) => {
            const unsub = getChatsForUser(userId!, (data) => {
                unsub();
                resolve(data);
            });
        }),
        enabled: !!userId,
        staleTime: Infinity,
    });
}
