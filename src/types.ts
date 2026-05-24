export type Role = 'customer' | 'manager' | 'admin';

export type BikeStatus = 'available' | 'in-use' | 'maintenance' | 'reserved';
export type BikeCategory = 'mountain' | 'sports' | 'scooter' | 'retro' | 'electric' | 'commuter';
export type RideMode = 'eco' | 'boost' | 'fitness';
export type AIProvider = 'local' | 'gemini' | 'openai';

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Bike {
  id: string;
  name: string;
  category: BikeCategory;
  lat: number;
  lng: number;
  battery: number;
  status: BikeStatus;
  location: string;
  image: string;
  pricePerMinute: number;
  dayPassPrice: number;
  terrain: string[];
  rangeKm: number;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  featured?: boolean;
  retro?: boolean;
}

export interface Booking {
  id: string;
  bikeId: string;
  bikeName: string;
  start: string;
  end: string;
  date: string;
  durationMin: number;
  amount: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  pickupPoint: string;
  dropPoint: string;
  rideMode: RideMode;
}

export interface PaymentRecord {
  id: string;
  date: string;
  label: string;
  amount: number;
  method: string;
  status: 'paid' | 'refunded' | 'pending';
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'flat' | 'percent';
  value: number;
  minSpend: number;
  active: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  perks: string[];
  recommended?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'booking' | 'offer' | 'support' | 'system';
  unread: boolean;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  role: Role;
  walletBalance: number;
  favorites: string[];
  activeSubscriptionId?: string;
}

export interface SessionState {
  isAuthenticated: boolean;
  isLoading?: boolean;
  userId?: string;
}

export interface WeatherSnapshot {
  condition: string;
  temperatureC: number;
  recommendation: string;
  alertTone: 'good' | 'warning' | 'info';
}

export interface AppState {
  session: SessionState;
  profile: UserProfile;
  bikes: Bike[];
  bookings: Booking[];
  payments: PaymentRecord[];
  coupons: Coupon[];
  subscriptions: SubscriptionPlan[];
  notifications: NotificationItem[];
  aiProvider: AIProvider;
}

export interface BikeRecommendation {
  bikeId: string;
  score: number;
  reason: string;
}
