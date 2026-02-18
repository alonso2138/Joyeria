
export interface JewelryItem {
  id: string;
  _id?: string; // For MongoDB compatibility
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: 'Anillo' | 'Collar' | 'Gargantilla' | 'Pulsera' | 'Pendiente' | 'Reloj' | 'Bolso' | 'Camiseta' | 'Camisa';
  imageUrl: string;
  overlayAssetUrl: string;
  hashtags: string[];
  sku: string;
  isFeatured: boolean;
  catalogId?: string;
  aiModel?: 'gemini-2.5-flash-image';
  options?: Record<string, string>;
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

// Datos para personalizar una joya
export interface CustomJewelOptions {
  pieceType: string;
  material: string;
  measurements?: string;
  engraving?: string;
  stonesOrColors?: string; // Piedras o colores dominantes elegidos
  description?: string; // Notas o contexto adicional
}

export interface GeneratedJewelResult {
  imageBase64: string;
  promptUsed: string;
  options: CustomJewelOptions;
}

export interface CustomRequestPayload extends CustomJewelOptions {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  optionsJson: string;
  imageBase64?: string;
  details?: string;
}

export interface CustomRequest extends CustomRequestPayload {
  id: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  apiKey: string;
  allowedDomains: string[];
  isActive: boolean;
  ownerEmail?: string;
  plan: 'free' | 'basic' | 'premium';
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}
