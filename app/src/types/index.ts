export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  tag?: string;
  isBestSeller?: boolean;
  allergens: string[];
  dietaryTags: string[];
  isVisible: boolean;
  /** AI-generated translations keyed by language code (e.g. { zh: '烤三文鱼', fr: 'Saumon Grillé' }) */
  translations?: Record<string, { name?: string; description?: string }>;
}

export interface Section {
  id: string;
  name: string;
  dishes: Dish[];
  isExpanded: boolean;
  /** AI-generated section name translation keyed by language code */
  translations?: Record<string, string>;
}

export interface Menu {
  id: string;
  title: string;
  sections: Section[];
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

/* Opening hours per day of week */
export interface DayHours {
  day: string;       // e.g. "Monday", "Domingo"
  open?: string;     // e.g. "09:00"
  close?: string;    // e.g. "23:00"
  closed?: boolean;  // true if closed all day
}

/* Social media links */
export interface SocialLinks {
  instagram?: string;   // e.g. "menukits" (handle)
  facebook?: string;
  tiktok?: string;
  twitterX?: string;     // X / Twitter
  youtube?: string;
  whatsapp?: string;
  website?: string;      // full URL
  googleBusinessProfile?: string;
  tripAdvisor?: string;
  bookingLink?: string;
}

/* Promotion banner shown above menus */
export interface Promotion {
  id: string;
  title: string;           // e.g. "Happy Hour", "Summer Special"
  description: string;     // short description text
  type: 'special' | 'event' | 'seasonal' | 'custom';
  bgColor: string;         // hex color for banner background
  textColor: string;       // hex color for text
  isActive: boolean;       // toggle visibility
  emoji?: string;          // optional icon/emoji
}

/* Restaurant contact & info embedded in menu */
export interface RestaurantInfo {
  name?: string;
  googleBusinessName?: string;
  description?: string;
  coverImage?: string;
  logoImage?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  currency?: string;           // e.g. "EUR", "USD", "CNY"
  hours?: DayHours[];          // weekly opening hours
  socialLinks?: SocialLinks;
  onlineLinks?: string[];
  languages?: string[];
  promotions?: Promotion[];
}

export interface Menu {
  id: string;
  title: string;
  sections: Section[];
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  /* Embedded restaurant info — populated from settings page */
  restaurantInfo?: RestaurantInfo;
}
