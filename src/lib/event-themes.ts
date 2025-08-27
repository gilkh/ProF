import { EventTask } from './types';

export interface EventTheme {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradient: string;
  emoji: string;
  celebrationEmojis: string[];
  taskIcon: string;
  completedIcon: string;
  backgroundPattern?: string;
  cardStyle: string;
  buttonStyle: string;
  progressBarStyle: string;
  headerStyle: string;
  celebrationMessage: string;
  motivationalMessages: string[];
  taskCompletionMessages: string[];
}

export const eventThemes: Record<string, EventTheme> = {
  // Wedding themes
  'wedding': {
    name: 'Wedding',
    primaryColor: 'rgb(244, 63, 94)', // rose-500
    secondaryColor: 'rgb(251, 207, 232)', // pink-200
    accentColor: 'rgb(190, 18, 60)', // rose-700
    gradient: 'linear-gradient(135deg, rgb(244, 63, 94) 0%, rgb(251, 207, 232) 100%)',
    emoji: '💒',
    celebrationEmojis: ['💕', '👰', '🤵', '💐', '🎊', '✨', '💒', '���'],
    taskIcon: '💍',
    completedIcon: '💖',
    cardStyle: 'border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 shadow-rose-100',
    buttonStyle: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200',
    progressBarStyle: 'bg-rose-500',
    headerStyle: 'text-rose-700 bg-gradient-to-r from-rose-100 to-pink-100',
    celebrationMessage: 'Your dream wedding is coming together beautifully! 💕',
    motivationalMessages: [
      'Every detail brings you closer to your perfect day! 💒',
      'Love is in the details - you\'re doing amazing! 💕',
      'Your wedding story is being written one task at a time! ✨'
    ],
    taskCompletionMessages: [
      'Another step closer to "I do"! 💍',
      'Wedding magic is happening! ✨',
      'Love wins again! 💖'
    ]
  },

  'anniversary': {
    name: 'Anniversary',
    primaryColor: 'rgb(168, 85, 247)', // purple-500
    secondaryColor: 'rgb(221, 214, 254)', // purple-200
    accentColor: 'rgb(124, 58, 237)', // purple-600
    gradient: 'linear-gradient(135deg, rgb(168, 85, 247) 0%, rgb(221, 214, 254) 100%)',
    emoji: '💜',
    celebrationEmojis: ['💜', '💕', '🥂', '🌹', '✨', '💫', '🎊', '💝'],
    taskIcon: '💜',
    completedIcon: '💕',
    cardStyle: 'border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 shadow-purple-100',
    buttonStyle: 'bg-purple-500 hover:bg-purple-600 text-white shadow-purple-200',
    progressBarStyle: 'bg-purple-500',
    headerStyle: 'text-purple-700 bg-gradient-to-r from-purple-100 to-violet-100',
    celebrationMessage: 'Celebrating your beautiful journey together! 💜',
    motivationalMessages: [
      'Every year together deserves a perfect celebration! 💜',
      'Your love story continues to inspire! ✨',
      'Making memories that will last forever! 💕'
    ],
    taskCompletionMessages: [
      'Another milestone in your love story! 💜',
      'Celebrating love, one task at a time! 💕',
      'Your anniversary will be unforgettable! ✨'
    ]
  },

  'birthday': {
    name: 'Birthday',
    primaryColor: 'rgb(34, 197, 94)', // green-500
    secondaryColor: 'rgb(187, 247, 208)', // green-200
    accentColor: 'rgb(22, 163, 74)', // green-600
    gradient: 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(187, 247, 208) 100%)',
    emoji: '🎂',
    celebrationEmojis: ['🎂', '🎉', '🎈', '🎁', '🥳', '✨', '🎊', '🌟'],
    taskIcon: '🎈',
    completedIcon: '🎉',
    cardStyle: 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-green-100',
    buttonStyle: 'bg-green-500 hover:bg-green-600 text-white shadow-green-200',
    progressBarStyle: 'bg-green-500',
    headerStyle: 'text-green-700 bg-gradient-to-r from-green-100 to-emerald-100',
    celebrationMessage: 'Making this birthday absolutely spectacular! 🎂',
    motivationalMessages: [
      'Every birthday deserves to be celebrated in style! 🎉',
      'Creating magical moments for the special day! ✨',
      'This birthday party will be unforgettable! 🥳'
    ],
    taskCompletionMessages: [
      'Party planning perfection! 🎉',
      'Birthday magic is happening! ✨',
      'One step closer to the best birthday ever! 🎂'
    ]
  },

  'graduation': {
    name: 'Graduation',
    primaryColor: 'rgb(59, 130, 246)', // blue-500
    secondaryColor: 'rgb(191, 219, 254)', // blue-200
    accentColor: 'rgb(37, 99, 235)', // blue-600
    gradient: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(191, 219, 254) 100%)',
    emoji: '🎓',
    celebrationEmojis: ['🎓', '📚', '🏆', '🎉', '✨', '🌟', '🎊', '👨‍🎓'],
    taskIcon: '📚',
    completedIcon: '🏆',
    cardStyle: 'border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50 shadow-blue-100',
    buttonStyle: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200',
    progressBarStyle: 'bg-blue-500',
    headerStyle: 'text-blue-700 bg-gradient-to-r from-blue-100 to-sky-100',
    celebrationMessage: 'Celebrating this incredible achievement! 🎓',
    motivationalMessages: [
      'Success deserves to be celebrated properly! 🏆',
      'Your hard work is paying off! ✨',
      'This milestone calls for an amazing celebration! 🎉'
    ],
    taskCompletionMessages: [
      'Academic excellence in action! 🎓',
      'Success is being planned perfectly! 🏆',
      'Your achievement celebration is taking shape! ✨'
    ]
  },

  'baby_shower': {
    name: 'Baby Shower',
    primaryColor: 'rgb(251, 146, 60)', // orange-400
    secondaryColor: 'rgb(254, 215, 170)', // orange-200
    accentColor: 'rgb(234, 88, 12)', // orange-600
    gradient: 'linear-gradient(135deg, rgb(251, 146, 60) 0%, rgb(254, 215, 170) 100%)',
    emoji: '👶',
    celebrationEmojis: ['👶', '🍼', '🎀', '💕', '✨', '🎊', '🧸', '👣'],
    taskIcon: '🍼',
    completedIcon: '💕',
    cardStyle: 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-orange-100',
    buttonStyle: 'bg-orange-400 hover:bg-orange-500 text-white shadow-orange-200',
    progressBarStyle: 'bg-orange-400',
    headerStyle: 'text-orange-700 bg-gradient-to-r from-orange-100 to-amber-100',
    celebrationMessage: 'Welcoming the little one with so much love! 👶',
    motivationalMessages: [
      'Creating the perfect welcome for baby! 👶',
      'Every detail filled with love and joy! 💕',
      'This celebration will be absolutely precious! ✨'
    ],
    taskCompletionMessages: [
      'Baby shower magic is happening! 👶',
      'Spreading love and joy! 💕',
      'Perfect preparations for the little one! ✨'
    ]
  },

  'corporate': {
    name: 'Corporate',
    primaryColor: 'rgb(71, 85, 105)', // slate-600
    secondaryColor: 'rgb(203, 213, 225)', // slate-300
    accentColor: 'rgb(51, 65, 85)', // slate-700
    gradient: 'linear-gradient(135deg, rgb(71, 85, 105) 0%, rgb(203, 213, 225) 100%)',
    emoji: '🏢',
    celebrationEmojis: ['🏢', '📊', '🎯', '💼', '✨', '🏆', '🎊', '📈'],
    taskIcon: '📋',
    completedIcon: '✅',
    cardStyle: 'border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 shadow-slate-100',
    buttonStyle: 'bg-slate-600 hover:bg-slate-700 text-white shadow-slate-200',
    progressBarStyle: 'bg-slate-600',
    headerStyle: 'text-slate-700 bg-gradient-to-r from-slate-100 to-gray-100',
    celebrationMessage: 'Professional excellence in every detail! 🏢',
    motivationalMessages: [
      'Creating impactful business experiences! 🎯',
      'Professional success is being crafted! 💼',
      'Excellence in corporate event planning! 🏆'
    ],
    taskCompletionMessages: [
      'Professional milestone achieved! ✅',
      'Business excellence in action! 🎯',
      'Corporate success is taking shape! 📈'
    ]
  },

  'religious': {
    name: 'Religious',
    primaryColor: 'rgb(147, 51, 234)', // violet-600
    secondaryColor: 'rgb(196, 181, 253)', // violet-300
    accentColor: 'rgb(124, 58, 237)', // violet-700
    gradient: 'linear-gradient(135deg, rgb(147, 51, 234) 0%, rgb(196, 181, 253) 100%)',
    emoji: '🙏',
    celebrationEmojis: ['🙏', '✨', '💫', '🕊️', '💒', '🌟', '💜', '🎊'],
    taskIcon: '🙏',
    completedIcon: '✨',
    cardStyle: 'border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 shadow-violet-100',
    buttonStyle: 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200',
    progressBarStyle: 'bg-violet-600',
    headerStyle: 'text-violet-700 bg-gradient-to-r from-violet-100 to-purple-100',
    celebrationMessage: 'Blessed moments being planned with care! 🙏',
    motivationalMessages: [
      'Creating sacred and meaningful celebrations! 🙏',
      'Every detail blessed with intention! ✨',
      'Spiritual joy is being carefully planned! 💫'
    ],
    taskCompletionMessages: [
      'Blessed progress! 🙏',
      'Sacred planning in motion! ✨',
      'Spiritual celebration taking shape! 💫'
    ]
  },

  'default': {
    name: 'Celebration',
    primaryColor: 'rgb(99, 102, 241)', // indigo-500
    secondaryColor: 'rgb(199, 210, 254)', // indigo-200
    accentColor: 'rgb(79, 70, 229)', // indigo-600
    gradient: 'linear-gradient(135deg, rgb(99, 102, 241) 0%, rgb(199, 210, 254) 100%)',
    emoji: '🎉',
    celebrationEmojis: ['🎉', '✨', '🎊', '🌟', '💫', '🎈', '🥳', '🎁'],
    taskIcon: '✨',
    completedIcon: '🎉',
    cardStyle: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-indigo-100',
    buttonStyle: 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-200',
    progressBarStyle: 'bg-indigo-500',
    headerStyle: 'text-indigo-700 bg-gradient-to-r from-indigo-100 to-blue-100',
    celebrationMessage: 'Your special event is coming together beautifully! 🎉',
    motivationalMessages: [
      'Every celebration deserves perfect planning! 🎉',
      'Creating magical moments, one task at a time! ✨',
      'Your event will be absolutely unforgettable! 🌟'
    ],
    taskCompletionMessages: [
      'Celebration magic happening! 🎉',
      'Perfect planning in progress! ✨',
      'Your event is taking beautiful shape! 🌟'
    ]
  }
};

export function getEventTheme(eventType: string): EventTheme {
  const lowerEventType = eventType.toLowerCase();
  
  // Wedding variations
  if (lowerEventType.includes('wedding')) {
    return eventThemes.wedding;
  }
  
  // Anniversary variations
  if (lowerEventType.includes('anniversary')) {
    return eventThemes.anniversary;
  }
  
  // Birthday variations
  if (lowerEventType.includes('birthday') || lowerEventType.includes('sweet 16') || lowerEventType.includes('18th')) {
    return eventThemes.birthday;
  }
  
  // Graduation variations
  if (lowerEventType.includes('graduation')) {
    return eventThemes.graduation;
  }
  
  // Baby shower variations
  if (lowerEventType.includes('baby shower') || lowerEventType.includes('gender reveal') || lowerEventType.includes('newborn')) {
    return eventThemes.baby_shower;
  }
  
  // Corporate variations
  if (lowerEventType.includes('corporate') || lowerEventType.includes('conference') || 
      lowerEventType.includes('business') || lowerEventType.includes('company') ||
      lowerEventType.includes('seminar') || lowerEventType.includes('workshop')) {
    return eventThemes.corporate;
  }
  
  // Religious variations
  if (lowerEventType.includes('baptism') || lowerEventType.includes('communion') || 
      lowerEventType.includes('confirmation') || lowerEventType.includes('eid') ||
      lowerEventType.includes('christmas') || lowerEventType.includes('easter') ||
      lowerEventType.includes('ramadan') || lowerEventType.includes('religious')) {
    return eventThemes.religious;
  }
  
  return eventThemes.default;
}

export function getRandomCelebrationEmoji(theme: EventTheme): string {
  return theme.celebrationEmojis[Math.floor(Math.random() * theme.celebrationEmojis.length)];
}

export function getRandomMotivationalMessage(theme: EventTheme): string {
  return theme.motivationalMessages[Math.floor(Math.random() * theme.motivationalMessages.length)];
}

export function getRandomTaskCompletionMessage(theme: EventTheme): string {
  return theme.taskCompletionMessages[Math.floor(Math.random() * theme.taskCompletionMessages.length)];
}

export function getTaskPriorityStyle(task: EventTask, theme: EventTheme): string {
  const deadline = new Date(task.deadline);
  const now = new Date();
  const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilDeadline < 0) {
    return 'border-l-4 border-red-500 bg-red-50';
  } else if (daysUntilDeadline <= 7) {
    return 'border-l-4 border-yellow-500 bg-yellow-50';
  } else if (daysUntilDeadline <= 30) {
    return `border-l-4 border-orange-400 bg-orange-50`;
  } else {
    return `border-l-4 border-${theme.primaryColor.includes('244') ? 'rose' : theme.primaryColor.includes('168') ? 'purple' : theme.primaryColor.includes('34') ? 'green' : theme.primaryColor.includes('59') ? 'blue' : theme.primaryColor.includes('251') ? 'orange' : theme.primaryColor.includes('71') ? 'slate' : theme.primaryColor.includes('147') ? 'violet' : 'indigo'}-300 bg-${theme.primaryColor.includes('244') ? 'rose' : theme.primaryColor.includes('168') ? 'purple' : theme.primaryColor.includes('34') ? 'green' : theme.primaryColor.includes('59') ? 'blue' : theme.primaryColor.includes('251') ? 'orange' : theme.primaryColor.includes('71') ? 'slate' : theme.primaryColor.includes('147') ? 'violet' : 'indigo'}-25`;
  }
}

export function generateConfetti(theme: EventTheme): void {
  // Create confetti effect using the theme's celebration emojis
  const confettiCount = 50;
  const container = document.body;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.innerHTML = getRandomCelebrationEmoji(theme);
    confetti.style.position = 'fixed';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = '-10px';
    confetti.style.fontSize = Math.random() * 20 + 15 + 'px';
    confetti.style.zIndex = '9999';
    confetti.style.pointerEvents = 'none';
    confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s linear forwards`;
    
    container.appendChild(confetti);
    
    setTimeout(() => {
      container.removeChild(confetti);
    }, 5000);
  }
}

// Add CSS animation for confetti
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes confetti-fall {
      0% {
        transform: translateY(-10px) rotate(0deg);
        opacity: 1;
      }
      100% {
        transform: translateY(100vh) rotate(360deg);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}