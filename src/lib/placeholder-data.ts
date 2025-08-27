
import type { Service, QuoteRequest, Booking, Offer, ServiceOrOffer } from '@/lib/types';

// This file is now used for initial data seeding or as a fallback.
// In a real production app, this data would be managed by admins or vendors.

export const services: Service[] = [
  {
    id: 's1',
    type: 'service',
    vendorName: 'Timeless Snaps',
    vendorId: 'vendor123',
    vendorAvatar: 'https://i.pravatar.cc/150?u=timeless',
    title: 'Creative Wedding & Portrait Photography',
    description: 'Capturing your special moments with artistry and passion. Full-day coverage and printed albums.',
    category: 'Photography',
    rating: 5.0,
    reviewCount: 150,
    image: 'https://placehold.co/600x400.png',
  },
  {
    id: 's2',
    type: 'service',
    vendorName: 'Bloom & Petal',
    vendorId: 'vendor456',
    vendorAvatar: 'https://i.pravatar.cc/150?u=bloom',
    title: 'Stunning Floral Arrangements',
    description: 'Bespoke floral designs for bouquets, centerpieces, and venue decorations. All styles from classic to modern.',
    category: 'Decor & Floral',
    rating: 4.8,
    reviewCount: 98,
    image: 'https://placehold.co/600x400.png',
  },
];

export const offers: Offer[] = [
    {
        id: 'o1',
        type: 'offer',
        vendorName: 'Gourmet Catering Co.',
        vendorId: 'vendor789',
        vendorAvatar: 'https://i.pravatar.cc/150?u=gourmet',
        title: 'Exquisite Wedding & Event Catering',
        description: 'Unforgettable culinary experiences for weddings, corporate events, and private parties. Custom menus available.',
        category: 'Catering',
        rating: 4.9,
        reviewCount: 215,
        price: 75,
        availability: 'Mon-Sun, 8am-10pm',
        image: 'https://placehold.co/600x400.png',
    },
    {
        id: 'o2',
        type: 'offer',
        vendorName: 'Groove Masters DJ',
        vendorId: 'vendor101',
        vendorAvatar: 'https://i.pravatar.cc/150?u=groove',
        title: 'Pro DJ for Parties & Events',
        description: 'High-energy DJ services with professional sound and lighting to keep your guests dancing all night long.',
        category: 'Music & Entertainment',
        rating: 4.9,
        reviewCount: 180,
        price: 600,
        availability: 'Fri-Sun, 4pm-2am',
        image: 'https://placehold.co/600x400.png',
    }
];

export const servicesAndOffers: ServiceOrOffer[] = [...services, ...offers];


export const quoteRequests: QuoteRequest[] = [
  {
    id: 'qr1',
    clientName: 'Eve Adams',
    clientId: 'user456',
    vendorId: 'vendor123',
    clientAvatar: 'https://i.pravatar.cc/150?u=eve',
    serviceTitle: 'Creative Wedding & Portrait Photography',
    serviceId: 's1',
    message: 'I\'m planning a wedding for 150 guests and would love to see your portfolio and get a quote.',
    eventDate: '2024-10-26',
    status: 'pending',
    createdAt: new Date()
  },
];

export const bookings: Booking[] = [
    {
        id: 'b1',
        title: 'Final Tasting Session (Gourmet Catering)',
        with: 'Eve Adams',
        clientId: 'user456',
        vendorId: 'vendor789',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2),
        time: '10:00 AM'
    },
    {
        id: 'b2',
        title: 'Wedding Day Photoshoot',
        with: 'Frank Miller',
        clientId: 'user789',
        vendorId: 'vendor123',
        date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 5),
        time: '02:30 PM'
    },
];

// This is now legacy. Real chat data is in Firestore.
export const messages = []
