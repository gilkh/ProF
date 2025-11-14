

export type ServiceType = 'service' | 'offer';
export type ServiceCategory = 'Venues' | 'Catering & Sweets' | 'Entertainment' | 'Lighting & Sound' | 'Photography & Videography' | 'Decoration' | 'Beauty & Grooming' | 'Transportation' | 'Invitations & Printables' | 'Rentals & Furniture' | 'Security and Crowd Control';
export type Location = 'Beirut' | 'Mount Lebanon' | 'North Lebanon' | 'South Lebanon' | 'Nabatieh' | 'Beqaa' | 'Baalbek-Hermel' | 'Akkar';
export type EventType = 'Wedding' | 'Birthday Party' | 'Corporate Event' | 'Baby Shower' | 'Graduation' | 'Anniversary' | 'Engagement' | 'Bridal Shower' | 'Holiday Party' | 'Conference' | 'Product Launch' | 'Charity Event' | 'Reunion' | 'Retirement Party' | 'Housewarming' | 'Other';

export const locations: Location[] = ['Beirut', 'Mount Lebanon', 'North Lebanon', 'South Lebanon', 'Nabatieh', 'Beqaa', 'Baalbek-Hermel', 'Akkar'];

export const eventTypes: EventType[] = ['Wedding', 'Birthday Party', 'Corporate Event', 'Baby Shower', 'Graduation', 'Anniversary', 'Engagement', 'Bridal Shower', 'Holiday Party', 'Conference', 'Product Launch', 'Charity Event', 'Reunion', 'Retirement Party', 'Housewarming', 'Other'];

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  status: 'pending' | 'approved' | 'rejected';
  isThumbnail?: boolean;
  // Optional category label used for portfolio galleries (e.g., Weddings)
  category?: string;
}

export interface ServiceInclusions {
  // Venues
  hasParking?: boolean;
  hasValet?: boolean;
  hasOnSiteCatering?: boolean;
  isOutdoors?: boolean;
  hasPool?: boolean;

  // Catering & Sweets
  offersTastings?: boolean;
  servesAlcohol?: boolean;
  hasVeganOptions?: boolean;
  hasGlutenFreeOptions?: boolean;

  // Entertainment
  providesOwnSoundSystem?: boolean;
  providesOwnLighting?: boolean;

  // Photography & Videography
  offersDroneFootage?: boolean;
  offersSameDayEdit?: boolean;

  // Decoration
  providesSetup?: boolean;
  providesCleanup?: boolean;

  // Beauty & Grooming
  travelsToClient?: boolean;
  offersTrials?: boolean;

  [key: string]: boolean | undefined;
}


export interface BaseService {
  id: string;
  type: ServiceType;
  vendorId: string;
  vendorName: string;
  vendorAvatar?: string;
  vendorVerification?: 'none' | 'verified' | 'trusted';
  title: string;
  description: string;
  category: ServiceCategory;
  rating: number;
  reviewCount: number;
  image: string;
  media?: MediaItem[];
  inclusions?: ServiceInclusions;
  location: Location;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  eventTypes?: EventType[] | 'any';
}

export interface Service extends BaseService {
  type: 'service';
  price?: never; // Services don't have a fixed price, they require a quote
  availableDates?: never;
}

export interface Offer extends BaseService {
    type: 'offer';
    price: number; // Offers have a fixed price
    availableDates?: string[]; // Array of available date strings "yyyy-MM-dd"
}

export type ServiceOrOffer = Service | Offer;


export interface QuoteRequest {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  vendorId: string;
  serviceId: string;
  serviceTitle: string;
  message: string;
  eventDate: string;
  guestCount: number;
  phone: string;
  status: 'pending' | 'responded' | 'approved' | 'declined';
  createdAt: any; // Allow for server timestamp
  quotePrice?: number;
  quoteResponse?: string;
  lineItems?: LineItem[];
}

export interface Booking {
  id: string;
  title: string;
  with: string;
  clientId: string;
  vendorId: string;
  date: Date;
  time: string;
  serviceId: string; // The ID of the service or offer that was booked
  serviceType: ServiceType;
  // Category distinguishes meetings (appointments) from standard service/offer bookings
  category?: 'appointment' | 'booking';
}

export interface ChatMessage {
  id:string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar: string;
  verification?: 'none' | 'verified' | 'trusted';
}

export interface Chat {
  id: string;
  participantIds: string[];
  participants: ChatParticipant[];
  lastMessage: string;
  lastMessageSenderId: string;
  lastMessageTimestamp: Date;
  unreadCount?: { [key: string]: number };
}

// Reports
export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  chatId?: string;
  comment?: string | null;
  createdAt: Date;
}


export interface EventTask {
  id: string;
  task: string;
  deadline: string;
  estimatedCost: number;
  recommendedCost?: number;
  actualCost?: number;
  completed: boolean;
  suggestedVendorCategory?: string;
  description?: string;
  assignedVendor?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface GenerateEventPlanInput {
  eventType: string;
  eventDate: string;
  guestCount: number;
  budget: number;
  answers: Record<string, string | boolean | string[]>;
}

export interface CostBreakdownItem {
  category: string;
  estimatedCost: number;
  recommendedCost: number;
  actualCost?: number;
  percentage: number;
  description: string;
}

export interface SavedTimeline {
    id: string;
    name: string;
    tasks: EventTask[];
    lastModified: string;
    initialBudget: number;
    costBreakdown?: CostBreakdownItem[];
}

// Firestore-specific types
export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: Date;
    savedItemIds?: string[];
    status: 'active' | 'disabled';
    avatar?: string;
    emailVerified: boolean;
    fcmTokens?: string[];
    provider?: string;
    hasUnreadNotifications?: boolean;
    settings?: {
        autoScrollImages?: boolean;
    };
}

export interface VendorProfile {
    id: string;
    businessName: string;
    category: ServiceCategory;
    tagline: string;
    description: string;
    email: string;
    phone: string;
    ownerId: string;
    accountTier: 'free' | 'vip1' | 'vip2' | 'vip3';
    createdAt: Date;
    portfolio?: MediaItem[];
    status: 'active' | 'disabled';
    rating: number;
    reviewCount: number;
    avatar?: string;
    verification?: 'none' | 'verified' | 'trusted';
    location: Location;
    totalPhoneReveals?: number;
}

export interface PhoneReveal {
    id: string;
    revealedAt: Date;
    clientId?: string; // Optional: To track which client revealed it
}


export interface VendorCode {
    id: string;
    code: string;
    isUsed: boolean;
    createdAt: Date;
    usedBy?: string; // vendorId
    usedAt?: Date;
}

export interface LineItem {
  description: string;
  price: number;
}

export interface ForwardedItem {
  isForwarded: true;
  isQuoteRequest: boolean;
  isQuoteResponse: boolean;
  title: string;
  image?: string;
  vendorName: string;
  price?: number;
  userMessage: string;
  itemId?: string;
  itemType?: ServiceType;
  // Quote request specific fields
  eventDate?: string;
  guestCount?: number;
  phone?: string;
  // Quote response specific fields
  lineItems?: LineItem[];
  total?: number;
  quoteRequestId?: string;
}

// Meeting scheduling types
export type MeetingType = 'in_person' | 'call';
export type MeetingProposalStatus = 'pending' | 'accepted' | 'declined';

export interface MeetingProposal {
  id: string;
  chatId: string;
  proposerId: string;
  recipientId: string;
  type: MeetingType;
  dateTime: string; // ISO string
  agenda?: string;
  status: MeetingProposalStatus;
  round: number; // 1-based round count for negotiation
  previousProposalId?: string;
  respondedBy?: string;
  createdAt: Date | any;
  updatedAt: Date | any;
}

export interface MeetingProposalMessage {
  isMeetingProposal: true;
  proposalId: string;
  type: MeetingType;
  dateTime: string;
  agenda?: string;
  status: MeetingProposalStatus;
  round: number;
  proposerId: string;
  recipientId: string;
}

export interface MeetingStatusMessage {
  isMeetingStatus: true;
  proposalId: string;
  status: MeetingProposalStatus;
  reason?: string;
}

// Portfolio mention message for chat
export interface PortfolioMentionMessage {
  isPortfolioMention: true;
  vendorId: string;
  vendorName: string;
  media: {
    url: string;
    type: 'image' | 'video';
    category?: string;
  };
  caption?: string;
}


export interface UpgradeRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  currentTier: VendorProfile['accountTier'];
  phone: string;
  requestedAt: Date;
  status: 'pending' | 'contacted';
}

export interface VendorInquiry {
  id: string;
  firstName: string;
  lastName: string;
  businessName: string;
  phone: string;
  message: string;
  createdAt: Date;
  status: 'pending' | 'contacted';
}

export interface VendorAnalyticsData {
    month: string;
    quotes: number;
    bookings: number;
}

export interface PlatformAnalytics {
    totalUsers: number;
    totalVendors: number;
    totalBookings: number;
    userSignups: { period: string; Clients: number; Vendors: number }[];
}

export interface Review {
    id: string;
    bookingId: string;
    vendorId: string;
    clientId: string;
    clientName: string;
    clientAvatar?: string;
    serviceId: string;
    rating: number;
    comment: string;
    createdAt: Date;
}

export interface AppNotification {
    id: string;
    userId: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: Date;
}

export interface SponsoredBanner {
  id: string;
  image: string;
  vendorId: string;
  vendorName: string;
  title?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

// Question Template Types
export type QuestionType = 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean';

export interface QuestionOption {
    id: string;
    label: string;
    value: string;
}

export interface TemplateQuestion {
    id: string;
    question: string;
    type: QuestionType;
    required: boolean;
    options?: QuestionOption[]; // For select/multiselect questions
    placeholder?: string;
    helpText?: string;
}

export interface QuestionTemplate {
    id: string;
    vendorId: string;
    title: string;
    description: string;
    questions: TemplateQuestion[];
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    usageCount: number;
}

export interface QuestionResponse {
    questionId: string;
    answer: string | number | boolean | string[];
}

export interface TemplateResponse {
    id: string;
    templateId: string;
    chatId: string;
    clientId: string;
    vendorId: string;
    responses: QuestionResponse[];
    submittedAt: Date;
    status: 'pending' | 'submitted' | 'viewed';
}

export interface QuestionTemplateMessage {
    isQuestionTemplate: true;
    templateId: string;
    templateTitle: string;
    vendorId: string;
    vendorName: string;
    questions: TemplateQuestion[];
    responseId?: string; // Set when client submits response
}

// Availability Management Types
export interface TimeSlot {
    // Core slot identity
    id?: string;
    // Common discrete slot fields used in calendar UI
    startTime?: string; // Format: "HH:mm" (e.g., "09:00")
    endTime?: string;   // Format: "HH:mm" (e.g., "17:00")
    price?: number;
    // Availability flags
    isAvailable?: boolean;
    taken?: boolean; // Vendor-marked as taken/unavailable (without a booking)
    // Capacity controls
    maxBookings?: number; // For services that can handle multiple bookings per slot
    currentBookings?: number;
}

export interface DayAvailability {
    // Date key (optional since we often store by keyed map)
    date?: string; // Format: "yyyy-MM-dd"
    // Legacy flags used elsewhere in the app
    isFullyBooked?: boolean;
    isAvailable?: boolean; // Vendor can mark entire day as unavailable
    // Current calendar implementation flags/fields
    fullyBooked?: boolean;
    // Per-day mode: 'slots' for discrete slots, 'normal' for free/busy ranges
    mode?: 'slots' | 'normal';
    // Discrete slots
    timeSlots?: TimeSlot[];
    // Normal time ranges
    freeTimes?: { startTime: string; endTime: string }[];
    busyTimes?: { startTime: string; endTime: string }[];
    // Notes
    notes?: string; // Optional notes for the day
}

export interface ServiceAvailability {
    serviceId: string;
    serviceTitle: string;
    serviceType: ServiceType;
    // Visibility and activation
    isVisible: boolean; // Toggle visibility to users
    isActive: boolean;  // Whether accepting bookings
    // Discrete slots defaults
    defaultTimeSlots: TimeSlot[]; // Default time slots for this service
    // Overrides
    customAvailability: DayAvailability[]; // Custom availability overrides (list)
    // Map-based availability used by calendar & services
    dates?: Record<string, DayAvailability>;
    visible?: boolean; // Mirror of isVisible used by calendar code
    advanceBookingDays: number; // How many days in advance bookings are allowed
    bufferTime: number; // Minutes between bookings
    maxDailyBookings?: number; // Maximum bookings per day for this service
}

export interface VendorAvailability {
    id: string;
    vendorId: string;
    // List-based availability
    serviceAvailabilities: ServiceAvailability[];
    // Map-based availability used by calendar & services
    services?: Record<string, ServiceAvailability>;
    globalSettings: {
        timezone: string;
        workingDays: number[]; // 0-6 (Sunday-Saturday)
        defaultWorkingHours: {
            start: string; // "HH:mm"
            end: string;   // "HH:mm"
        };
        holidayDates: string[]; // Array of "yyyy-MM-dd" dates
        emergencyContact?: string;
    };
    lastUpdated: Date;
}

export interface AvailabilitySlot {
    // Flexible shape to support both legacy and current consumers
    date?: string;
    timeSlot?: TimeSlot;
    // Flat fields used by booking dialogs
    startTime?: string;
    endTime?: string;
    available?: boolean;
    price?: number;
    serviceId?: string;
    isBookable?: boolean;
    conflictReason?: string; // Why it's not bookable if applicable
}
