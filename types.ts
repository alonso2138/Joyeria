
export interface JewelryItem {
  id: string;
  _id?: string; // For MongoDB compatibility
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: 'Anillo' | 'Collar' | 'Pulsera' | 'Pendiente' | 'Reloj';
  imageUrl: string;
  overlayAssetUrl: string;
  hashtags: string[];
  sku: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum EventType {
  VIEW = 'VIEW',
  TRYON_START = 'TRYON_START',
  TRYON_SUCCESS = 'TRYON_SUCCESS',
  CLICK_BUY = 'CLICK_BUY',
  CLICK_BOOK_APPOINTMENT = 'CLICK_BOOK_APPOINTMENT',
}

export interface AnalyticsEvent {
  type: EventType;
  jewelryId: string;
  sessionId: string;
  timestamp: string;
}

// FIX: Add missing AdminUserCredentials type to resolve import errors.
export interface AdminUserCredentials {
  email: string;
  password: string;
}
