import { add, format, sub } from 'date-fns';
import type { Duration } from 'date-fns';
import type { EventTask, GenerateEventPlanInput, CostBreakdownItem } from './types';

// Comprehensive event types for Lebanon
export const eventTypes = [
    // Weddings & Celebrations
    'Lebanese Wedding', 'Christian Wedding', 'Muslim Wedding', 'Druze Wedding', 'Civil Wedding',
    'Engagement Party', 'Henna Night', 'Bachelor/Bachelorette Party', 'Wedding Anniversary',
    
    // Religious & Cultural Events
    'Baptism', 'First Communion', 'Confirmation', 'Bar/Bat Mitzvah', 'Eid al-Fitr Celebration',
    'Eid al-Adha Celebration', 'Christmas Celebration', 'Easter Celebration', 'Ramadan Iftar',
    'Mawlid al-Nabi', 'Ashura Commemoration',
    
    // Life Celebrations
    'Birthday Party', 'Sweet 16', '18th Birthday', 'Graduation Party', 'Baby Shower',
    'Gender Reveal', 'Newborn Welcoming (Aqiqah)', 'Retirement Party', 'Farewell Party',
    
    // Corporate & Professional
    'Corporate Conference', 'Product Launch', 'Company Anniversary', 'Team Building Event',
    'Business Networking Event', 'Award Ceremony', 'Seminar/Workshop', 'Trade Show',
    
    // Cultural & Community
    'Cultural Festival', 'Charity Gala', 'Fundraising Event', 'Art Exhibition Opening',
    'Book Launch', 'Fashion Show', 'Music Concert', 'Theater Performance',
    
    // Seasonal & Holiday
    'New Year\'s Eve Party', 'Valentine\'s Day Event', 'Mother\'s Day Celebration',
    'Father\'s Day Celebration', 'Independence Day Celebration', 'Martyrs\' Day Commemoration'
];

// Helper to create a deadline by subtracting a duration from the event date
const createDeadline = (eventDate: Date, duration: Duration) => {
  return format(sub(eventDate, duration), 'yyyy-MM-dd');
};

// Enhanced base tasks with Lebanese context
const baseTasks = (eventDate: Date, budget: number, guestCount: number, eventType: string) => {
  const isLargeEvent = guestCount > 150;
  const isWedding = eventType.toLowerCase().includes('wedding');
  const isCorporate = eventType.toLowerCase().includes('corporate') || eventType.toLowerCase().includes('conference');
  
  const tasks = [
    {
      task: 'Define event vision and objectives',
      deadline: createDeadline(eventDate, { months: isLargeEvent ? 8 : 6 }),
      estimatedCost: 0,
      description: 'Clearly outline the purpose, theme, and desired outcomes for your event'
    },
    {
      task: 'Set detailed budget breakdown',
      deadline: createDeadline(eventDate, { months: isLargeEvent ? 8 : 6 }),
      estimatedCost: 0,
      description: 'Allocate budget across venue (30%), catering (25%), entertainment (15%), decor (10%), and other services'
    },
    {
      task: 'Create comprehensive guest list',
      deadline: createDeadline(eventDate, { months: isLargeEvent ? 6 : 5 }),
      estimatedCost: 0,
      description: 'Consider family traditions, social obligations, and venue capacity when creating your list'
    },
    {
      task: 'Research and book venue',
      deadline: createDeadline(eventDate, { months: isLargeEvent ? 6 : 4 }),
      estimatedCost: budget * (isWedding ? 0.35 : 0.30),
      suggestedVendorCategory: 'Venues',
      description: 'Consider location accessibility, parking, indoor/outdoor options, and cultural requirements'
    },
    {
      task: 'Secure catering services',
      deadline: createDeadline(eventDate, { months: isLargeEvent ? 5 : 3 }),
      estimatedCost: budget * 0.25,
      suggestedVendorCategory: 'Catering & Sweets',
      description: 'Plan menu considering dietary restrictions, cultural preferences, and seasonal ingredients'
    }
  ];

  // Add invitation tasks based on event type
  if (isWedding) {
    tasks.push({
      task: 'Design and send save-the-dates',
      deadline: createDeadline(eventDate, { months: 4 }),
      estimatedCost: guestCount * 3,
      suggestedVendorCategory: 'Invitations & Printables',
      description: 'Send save-the-dates especially for destination guests or during busy seasons'
    });
    tasks.push({
      task: 'Design and send formal invitations',
      deadline: createDeadline(eventDate, { months: 2 }),
      estimatedCost: guestCount * 8,
      suggestedVendorCategory: 'Invitations & Printables',
      description: 'Include RSVP cards, venue details, dress code, and cultural considerations'
    });
  } else {
    tasks.push({
      task: 'Send invitations',
      deadline: createDeadline(eventDate, { weeks: isCorporate ? 6 : 4 }),
      estimatedCost: guestCount * (isCorporate ? 2 : 5),
      suggestedVendorCategory: 'Invitations & Printables',
      description: 'Include all necessary event details and RSVP information'
    });
  }

  // Add common final tasks
  tasks.push(
    {
      task: 'Plan menu and arrange tastings',
      deadline: createDeadline(eventDate, { months: 2 }),
      estimatedCost: 200,
      description: 'Schedule tastings with caterer and finalize menu based on guest preferences'
    },
    {
      task: 'Arrange transportation and accommodation',
      deadline: createDeadline(eventDate, { months: isLargeEvent ? 3 : 2 }),
      estimatedCost: budget * 0.05,
      suggestedVendorCategory: 'Transportation',
      description: 'Coordinate guest transportation and book accommodations for out-of-town guests'
    },
    {
      task: 'Finalize guest count and seating arrangements',
      deadline: createDeadline(eventDate, { weeks: 3 }),
      estimatedCost: 0,
      description: 'Confirm final headcount and create detailed seating chart considering family dynamics'
    },
    {
      task: 'Confirm all vendor details and timeline',
      deadline: createDeadline(eventDate, { weeks: 1 }),
      estimatedCost: 0,
      description: 'Final confirmation calls with all vendors, review contracts and delivery schedules'
    },
    {
      task: 'Prepare day-of emergency kit and timeline',
      deadline: createDeadline(eventDate, { days: 3 }),
      estimatedCost: 100,
      description: 'Create detailed timeline, emergency contacts list, and prepare backup plans'
    },
    {
      task: 'Final vendor payments and gratuities',
      deadline: createDeadline(eventDate, { days: 1 }),
      estimatedCost: budget * 0.15,
      description: 'Process final payments and prepare gratuity envelopes for service staff'
    },
    {
      task: 'Send thank-you notes and follow-up',
      deadline: format(add(eventDate, { weeks: 2 }), 'yyyy-MM-dd'),
      estimatedCost: guestCount * 2,
      description: 'Send personalized thank-you notes to guests and vendors, share photos if applicable'
    }
  );

  return tasks;
};

// Lebanese Wedding specific tasks
const lebanesWeddingTasks = (eventDate: Date, budget: number, guestCount: number, answers: Record<string, any>) => {
  const tasks = [];
  
  // Traditional elements
  if (answers['Traditional Zaffe Procession']) {
    tasks.push({
      task: 'Organize traditional Zaffe procession',
      deadline: createDeadline(eventDate, { months: 3 }),
      estimatedCost: budget * 0.08,
      suggestedVendorCategory: 'Entertainment',
      description: 'Coordinate traditional Lebanese wedding procession with musicians, dancers, and cultural elements'
    });
  }

  if (answers['Dabke Performance']) {
    tasks.push({
      task: 'Arrange Dabke performance and instruction',
      deadline: createDeadline(eventDate, { months: 2 }),
      estimatedCost: budget * 0.05,
      suggestedVendorCategory: 'Entertainment',
      description: 'Book professional Dabke performers and arrange for guest participation'
    });
  }

  if (answers['Traditional Lebanese Cuisine']) {
    tasks.push({
      task: 'Plan traditional Lebanese feast menu',
      deadline: createDeadline(eventDate, { months: 3 }),
      estimatedCost: 0, // Included in catering
      description: 'Include mezze, grilled meats, rice dishes, and traditional sweets like baklava and maamoul'
    });
  }

  if (answers['Live Arabic Music Band']) {
    tasks.push({
      task: 'Book live Arabic music band',
      deadline: createDeadline(eventDate, { months: 4 }),
      estimatedCost: budget * 0.12,
      suggestedVendorCategory: 'Entertainment',
      description: 'Secure popular Lebanese/Arabic band for live entertainment throughout the celebration'
    });
  }

  if (answers['Professional Photography & Videography']) {
    tasks.push({
      task: 'Book wedding photographer and videographer',
      deadline: createDeadline(eventDate, { months: 5 }),
      estimatedCost: budget * 0.15,
      suggestedVendorCategory: 'Photography & Videography',
      description: 'Secure experienced wedding photographers familiar with Lebanese traditions and customs'
    });
  }

  if (answers['Elaborate Floral Arrangements']) {
    tasks.push({
      task: 'Design elaborate floral arrangements',
      deadline: createDeadline(eventDate, { months: 2 }),
      estimatedCost: budget * 0.12,
      suggestedVendorCategory: 'Decoration',
      description: 'Plan stunning floral displays including bridal bouquet, centerpieces, and venue decorations'
    });
  }

  if (answers['Wedding Cake & Sweets Table']) {
    tasks.push({
      task: 'Order wedding cake and traditional sweets',
      deadline: createDeadline(eventDate, { weeks: 3 }),
      estimatedCost: budget * 0.06,
      suggestedVendorCategory: 'Catering & Sweets',
      description: 'Design custom wedding cake and arrange traditional Lebanese sweets display'
    });
  }

  if (answers['Bridal Beauty Services']) {
    tasks.push({
      task: 'Book bridal beauty services',
      deadline: createDeadline(eventDate, { months: 3 }),
      estimatedCost: budget * 0.04,
      suggestedVendorCategory: 'Beauty & Grooming',
      description: 'Schedule hair, makeup, and beauty treatments for bride and bridal party'
    });
  }

  // Essential wedding tasks
  tasks.push(
    {
      task: 'Shop for wedding attire and accessories',
      deadline: createDeadline(eventDate, { months: 4 }),
      estimatedCost: budget * 0.10,
      description: 'Purchase wedding dress, groom\'s attire, and accessories. Consider traditional elements if desired'
    },
    {
      task: 'Arrange pre-wedding celebrations (Henna night)',
      deadline: createDeadline(eventDate, { weeks: 2 }),
      estimatedCost: budget * 0.05,
      description: 'Plan intimate henna night celebration with close family and friends'
    },
    {
      task: 'Obtain marriage license and documentation',
      deadline: createDeadline(eventDate, { weeks: 4 }),
      estimatedCost: 100,
      description: 'Complete all legal requirements and religious documentation for marriage'
    },
    {
      task: 'Plan honeymoon and post-wedding arrangements',
      deadline: createDeadline(eventDate, { months: 2 }),
      estimatedCost: budget * 0.08,
      description: 'Book honeymoon destination and arrange post-wedding logistics'
    }
  );

  return tasks;
};

// Corporate event tasks
const corporateTasks = (eventDate: Date, budget: number, guestCount: number, answers: Record<string, any>) => {
  const tasks = [];

  if (answers['Keynote Speakers']) {
    tasks.push({
      task: 'Secure keynote speakers and presenters',
      deadline: createDeadline(eventDate, { months: 4 }),
      estimatedCost: budget * 0.20,
      description: 'Book industry experts and thought leaders relevant to your event theme'
    });
  }

  if (answers['Audio/Visual Equipment']) {
    tasks.push({
      task: 'Arrange professional A/V equipment',
      deadline: createDeadline(eventDate, { months: 2 }),
      estimatedCost: budget * 0.08,
      suggestedVendorCategory: 'Lighting & Sound',
      description: 'Ensure high-quality sound, lighting, and projection equipment for presentations'
    });
  }

  if (answers['Live Streaming Setup']) {
    tasks.push({
      task: 'Set up live streaming and recording',
      deadline: createDeadline(eventDate, { weeks: 3 }),
      estimatedCost: budget * 0.05,
      suggestedVendorCategory: 'Photography & Videography',
      description: 'Arrange professional live streaming for remote attendees and event recording'
    });
  }

  if (answers['Networking Reception']) {
    tasks.push({
      task: 'Plan networking reception and activities',
      deadline: createDeadline(eventDate, { months: 2 }),
      estimatedCost: budget * 0.15,
      description: 'Design networking opportunities, icebreaker activities, and reception logistics'
    });
  }

  if (answers['Corporate Branding & Signage']) {
    tasks.push({
      task: 'Design corporate branding and signage',
      deadline: createDeadline(eventDate, { weeks: 4 }),
      estimatedCost: budget * 0.06,
      suggestedVendorCategory: 'Decoration',
      description: 'Create branded materials, banners, signage, and promotional items'
    });
  }

  if (answers['Professional Photography']) {
    tasks.push({
      task: 'Hire corporate event photographer',
      deadline: createDeadline(eventDate, { months: 2 }),
      estimatedCost: budget * 0.07,
      suggestedVendorCategory: 'Photography & Videography',
      description: 'Document the event for marketing and corporate communications'
    });
  }

  // Essential corporate tasks
  tasks.push(
    {
      task: 'Develop event agenda and content',
      deadline: createDeadline(eventDate, { months: 3 }),
      estimatedCost: 0,
      description: 'Create detailed schedule, session topics, and speaker coordination'
    },
    {
      task: 'Set up registration and attendee management',
      deadline: createDeadline(eventDate, { months: 2 }),
      estimatedCost: 500,
      description: 'Create registration system, manage RSVPs, and prepare attendee materials'
    },
    {
      task: 'Coordinate security and logistics',
      deadline: createDeadline(eventDate, { weeks: 2 }),
      estimatedCost: budget * 0.04,
      suggestedVendorCategory: 'Security and Crowd Control',
      description: 'Arrange security, crowd control, and event day logistics management'
    }
  );

  return tasks;
};

// Birthday party tasks
const birthdayTasks = (eventDate: Date, budget: number, guestCount: number, answers: Record<string, any>) => {
  const tasks = [];
  const isChildParty = answers['Children\'s Birthday Party'];
  const isAdultParty = answers['Adult Birthday Party'];
  const isMilestone = answers['Milestone Birthday (18th, 21st, 30th, etc.)'];

  if (answers['Custom Birthday Cake']) {
    tasks.push({
      task: 'Order custom birthday cake',
      deadline: createDeadline(eventDate, { weeks: 2 }),
      estimatedCost: budget * (isMilestone ? 0.08 : 0.05),
      suggestedVendorCategory: 'Catering & Sweets',
      description: 'Design personalized birthday cake reflecting the celebrant\'s interests and theme'
    });
  }

  if (answers['Themed Decorations']) {
    tasks.push({
      task: 'Plan themed decorations and setup',
      deadline: createDeadline(eventDate, { weeks: 2 }),
      estimatedCost: budget * 0.12,
      suggestedVendorCategory: 'Decoration',
      description: 'Create cohesive theme with balloons, banners, table settings, and photo backdrops'
    });
  }

  if (answers['Entertainment & Activities']) {
    const entertainmentCost = isChildParty ? budget * 0.20 : budget * 0.15;
    tasks.push({
      task: 'Book entertainment and activities',
      deadline: createDeadline(eventDate, { weeks: 3 }),
      estimatedCost: entertainmentCost,
      suggestedVendorCategory: 'Entertainment',
      description: isChildParty 
        ? 'Arrange age-appropriate entertainment like clowns, magicians, or character appearances'
        : 'Book DJ, live music, or interactive entertainment suitable for adult celebration'
    });
  }

  if (answers['Professional Photography']) {
    tasks.push({
      task: 'Hire birthday party photographer',
      deadline: createDeadline(eventDate, { weeks: 3 }),
      estimatedCost: budget * 0.08,
      suggestedVendorCategory: 'Photography & Videography',
      description: 'Capture special moments and create lasting memories of the celebration'
    });
  }

  if (answers['Party Favors & Gifts']) {
    tasks.push({
      task: 'Prepare party favors and gift bags',
      deadline: createDeadline(eventDate, { weeks: 1 }),
      estimatedCost: guestCount * (isChildParty ? 8 : 5),
      description: 'Create memorable take-home gifts for guests'
    });
  }

  return tasks;
};

// Religious celebration tasks
const religiousCelebrationTasks = (eventDate: Date, budget: number, guestCount: number, answers: Record<string, any>, eventType: string) => {
  const tasks = [];
  const isEid = eventType.toLowerCase().includes('eid');
  const isChristmas = eventType.toLowerCase().includes('christmas');
  const isBaptism = eventType.toLowerCase().includes('baptism');

  if (answers['Traditional Religious Decorations']) {
    tasks.push({
      task: 'Arrange traditional religious decorations',
      deadline: createDeadline(eventDate, { weeks: 2 }),
      estimatedCost: budget * 0.10,
      suggestedVendorCategory: 'Decoration',
      description: 'Create appropriate religious and cultural decorative elements'
    });
  }

  if (answers['Traditional Cuisine']) {
    tasks.push({
      task: 'Plan traditional religious feast',
      deadline: createDeadline(eventDate, { weeks: 3 }),
      estimatedCost: 0, // Included in catering
      description: 'Prepare traditional dishes appropriate for the religious celebration'
    });
  }

  if (answers['Religious Ceremony Coordination']) {
    tasks.push({
      task: 'Coordinate religious ceremony details',
      deadline: createDeadline(eventDate, { weeks: 4 }),
      estimatedCost: 200,
      description: 'Work with religious leaders to plan ceremony logistics and requirements'
    });
  }

  if (answers['Community Involvement']) {
    tasks.push({
      task: 'Organize community participation',
      deadline: createDeadline(eventDate, { weeks: 3 }),
      estimatedCost: budget * 0.05,
      description: 'Coordinate with community members and religious organizations'
    });
  }

  return tasks;
};

// Enhanced question mapping with deeper, more relevant questions
const questionMap: Record<string, { id: string, question: string, options: string[], multiSelect?: boolean }[]> = {
  'Lebanese Wedding': [
    { 
      id: 'traditions', 
      question: 'Which Lebanese wedding traditions would you like to include?', 
      options: ['Traditional Zaffe Procession', 'Dabke Performance', 'Traditional Lebanese Cuisine', 'Henna Night Celebration'],
      multiSelect: true
    },
    { 
      id: 'entertainment', 
      question: 'What type of entertainment do you prefer?', 
      options: ['Live Arabic Music Band', 'DJ with Mixed Music', 'Traditional Folk Performers', 'Modern Band'],
      multiSelect: true
    },
    { 
      id: 'services', 
      question: 'Which professional services do you need?', 
      options: ['Professional Photography & Videography', 'Elaborate Floral Arrangements', 'Wedding Cake & Sweets Table', 'Bridal Beauty Services'],
      multiSelect: true
    },
    { 
      id: 'scale', 
      question: 'What is the scale of your wedding?', 
      options: ['Intimate Family Gathering (50-100 guests)', 'Traditional Lebanese Wedding (200-400 guests)', 'Grand Celebration (400+ guests)']
    }
  ],
  
  'Corporate Conference': [
    { 
      id: 'content', 
      question: 'What will your conference include?', 
      options: ['Keynote Speakers', 'Panel Discussions', 'Workshops & Breakout Sessions', 'Networking Reception'],
      multiSelect: true
    },
    { 
      id: 'technology', 
      question: 'What technical requirements do you have?', 
      options: ['Audio/Visual Equipment', 'Live Streaming Setup', 'Interactive Presentation Tools', 'Translation Services'],
      multiSelect: true
    },
    { 
      id: 'branding', 
      question: 'What branding and documentation do you need?', 
      options: ['Corporate Branding & Signage', 'Professional Photography', 'Event Recording', 'Marketing Materials'],
      multiSelect: true
    }
  ],

  'Birthday': [
    { 
      id: 'type', 
      question: 'What type of birthday celebration is this?', 
      options: ['Children\'s Birthday Party', 'Adult Birthday Party', 'Milestone Birthday (18th, 21st, 30th, etc.)', 'Surprise Party']
    },
    { 
      id: 'essentials', 
      question: 'What are the party essentials?', 
      options: ['Custom Birthday Cake', 'Themed Decorations', 'Entertainment & Activities', 'Professional Photography'],
      multiSelect: true
    },
    { 
      id: 'extras', 
      question: 'What additional elements would you like?', 
      options: ['Party Favors & Gifts', 'Live Music or DJ', 'Catered Meal', 'Photo Booth'],
      multiSelect: true
    }
  ],

  'Eid al-Fitr Celebration': [
    { 
      id: 'traditions', 
      question: 'Which Eid traditions will you include?', 
      options: ['Traditional Religious Decorations', 'Traditional Cuisine', 'Community Involvement', 'Gift Exchange'],
      multiSelect: true
    },
    { 
      id: 'activities', 
      question: 'What activities will you organize?', 
      options: ['Children\'s Entertainment', 'Traditional Music', 'Community Prayer', 'Charity Activities'],
      multiSelect: true
    }
  ],

  'Christmas Celebration': [
    { 
      id: 'traditions', 
      question: 'Which Christmas traditions will you include?', 
      options: ['Traditional Religious Decorations', 'Traditional Cuisine', 'Religious Ceremony Coordination', 'Gift Exchange'],
      multiSelect: true
    },
    { 
      id: 'entertainment', 
      question: 'What entertainment will you provide?', 
      options: ['Christmas Carols', 'Children\'s Activities', 'Traditional Music', 'Santa Claus Appearance'],
      multiSelect: true
    }
  ],

  'Baptism': [
    { 
      id: 'ceremony', 
      question: 'What aspects of the baptism will you organize?', 
      options: ['Religious Ceremony Coordination', 'Traditional Religious Decorations', 'Traditional Cuisine', 'Professional Photography'],
      multiSelect: true
    },
    { 
      id: 'celebration', 
      question: 'How will you celebrate after the ceremony?', 
      options: ['Family Reception', 'Community Gathering', 'Traditional Sweets', 'Keepsake Gifts'],
      multiSelect: true
    }
  ]
};

// Enhanced function to get questions for event type
export function getQuestionsForEventType(eventType: string): { id: string, question: string, options: string[], multiSelect?: boolean }[] {
  // Direct match first
  if (questionMap[eventType]) {
    return questionMap[eventType];
  }

  // Fuzzy matching for similar event types
  for (const key in questionMap) {
    if (eventType.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(eventType.toLowerCase())) {
      return questionMap[key];
    }
  }

  // Default questions for unmatched event types
  return [
    { 
      id: 'general', 
      question: 'What services do you need for your event?', 
      options: ['Professional Photography', 'Entertainment', 'Catering Services', 'Decorations'],
      multiSelect: true
    },
    { 
      id: 'scale', 
      question: 'What is the scale of your event?', 
      options: ['Intimate Gathering (Under 50 guests)', 'Medium Event (50-150 guests)', 'Large Event (150+ guests)']
    }
  ];
}

// Calculate enhanced costs based on guest count and event type
const calculateEnhancedCosts = (
  baseCost: number, 
  guestCount: number, 
  eventType: string, 
  category?: string
): { estimatedCost: number; recommendedCost: number } => {
  const isWedding = eventType.toLowerCase().includes('wedding');
  const isCorporate = eventType.toLowerCase().includes('corporate') || eventType.toLowerCase().includes('conference');
  const isLargeEvent = guestCount > 150;
  
  let guestMultiplier = 1;
  let qualityMultiplier = 1;
  
  // Guest count adjustments
  if (guestCount <= 50) {
    guestMultiplier = 0.8;
  } else if (guestCount <= 100) {
    guestMultiplier = 1.0;
  } else if (guestCount <= 200) {
    guestMultiplier = 1.3;
  } else {
    guestMultiplier = 1.6;
  }
  
  // Event type adjustments
  if (isWedding) {
    qualityMultiplier = 1.4; // Weddings typically require higher quality
  } else if (isCorporate) {
    qualityMultiplier = 1.2; // Corporate events need professional quality
  }
  
  // Category-specific adjustments
  if (category) {
    switch (category) {
      case 'Venues':
        guestMultiplier *= isLargeEvent ? 1.2 : 1.0;
        break;
      case 'Catering & Sweets':
        guestMultiplier *= 1.1; // Food scales more directly with guests
        break;
      case 'Photography & Videography':
        guestMultiplier = Math.min(guestMultiplier, 1.3); // Photography doesn't scale as much
        break;
      case 'Entertainment':
        guestMultiplier *= isLargeEvent ? 1.15 : 1.0;
        break;
    }
  }
  
  const estimatedCost = Math.round(baseCost * guestMultiplier);
  const recommendedCost = Math.round(baseCost * guestMultiplier * qualityMultiplier);
  
  return { estimatedCost, recommendedCost };
};

// Generate cost breakdown by category
export const generateCostBreakdown = (
  budget: number, 
  guestCount: number, 
  eventType: string
): CostBreakdownItem[] => {
  const isWedding = eventType.toLowerCase().includes('wedding');
  const isCorporate = eventType.toLowerCase().includes('corporate') || eventType.toLowerCase().includes('conference');
  
  const baseBreakdown = [
    {
      category: 'Venues',
      percentage: isWedding ? 35 : isCorporate ? 25 : 30,
      description: 'Event venue rental, setup, and basic amenities'
    },
    {
      category: 'Catering & Sweets',
      percentage: 25,
      description: 'Food, beverages, and dessert services'
    },
    {
      category: 'Entertainment',
      percentage: isWedding ? 15 : isCorporate ? 20 : 18,
      description: 'Music, performers, and entertainment activities'
    },
    {
      category: 'Photography & Videography',
      percentage: isWedding ? 12 : isCorporate ? 8 : 10,
      description: 'Professional photography and videography services'
    },
    {
      category: 'Decoration',
      percentage: isWedding ? 10 : 8,
      description: 'Floral arrangements, centerpieces, and decorative elements'
    },
    {
      category: 'Transportation',
      percentage: 3,
      description: 'Guest transportation and logistics'
    }
  ];
  
  // Add remaining percentage to miscellaneous
  const totalPercentage = baseBreakdown.reduce((sum, item) => sum + item.percentage, 0);
  if (totalPercentage < 100) {
    baseBreakdown.push({
      category: 'Miscellaneous',
      percentage: 100 - totalPercentage,
      description: 'Invitations, favors, emergency fund, and other expenses'
    });
  }
  
  return baseBreakdown.map(item => {
    const baseCost = (budget * item.percentage) / 100;
    const { estimatedCost, recommendedCost } = calculateEnhancedCosts(
      baseCost, 
      guestCount, 
      eventType, 
      item.category
    );
    
    return {
      ...item,
      estimatedCost,
      recommendedCost
    };
  });
};

// Enhanced timeline generation with better logic
export const generateTimeline = (input: GenerateEventPlanInput) => {
  const { eventType, eventDate, budget, guestCount, answers } = input;
  const date = new Date(eventDate);

  let tasks: Omit<EventTask, 'id' | 'completed'>[] = baseTasks(date, budget, guestCount, eventType);

  // Add event-specific tasks based on type
  if (eventType.toLowerCase().includes('wedding')) {
    tasks = [...tasks, ...lebanesWeddingTasks(date, budget, guestCount, answers)];
  } else if (eventType.toLowerCase().includes('corporate') || eventType.toLowerCase().includes('conference')) {
    tasks = [...tasks, ...corporateTasks(date, budget, guestCount, answers)];
  } else if (eventType.toLowerCase().includes('birthday')) {
    tasks = [...tasks, ...birthdayTasks(date, budget, guestCount, answers)];
  } else if (eventType.toLowerCase().includes('eid') || eventType.toLowerCase().includes('christmas') || eventType.toLowerCase().includes('baptism')) {
    tasks = [...tasks, ...religiousCelebrationTasks(date, budget, guestCount, answers, eventType)];
  }

  // Enhance costs for all tasks
  const enhancedTasks = tasks.map(task => {
    const { estimatedCost, recommendedCost } = calculateEnhancedCosts(
      task.estimatedCost,
      guestCount,
      eventType,
      task.suggestedVendorCategory
    );
    
    return {
      ...task,
      estimatedCost,
      recommendedCost
    };
  });

  // Sort tasks by deadline and add unique IDs
  const sortedTasks = enhancedTasks
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .map((task, index) => ({
      ...task,
      id: `task-${Date.now()}-${index}`,
      completed: false,
    }));

  // Generate cost breakdown
  const costBreakdown = generateCostBreakdown(budget, guestCount, eventType);

  return { 
    tasks: sortedTasks,
    costBreakdown 
  };
};