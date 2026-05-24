import type { User } from '@supabase/supabase-js';
import { INITIAL_STATE } from '../data/mockData';
import type {
  AppState,
  Bike,
  Booking,
  Coupon,
  NotificationItem,
  PaymentRecord,
  Review,
  Role,
  SubscriptionPlan,
  UserProfile,
} from '../types';
import { hasSupabaseConfig, supabase } from './supabase';

const PENDING_AUTH_STORAGE_KEY = 'k-bike-pending-auth-v1';

type DbProfile = {
  user_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  role: Role | null;
  wallet_balance: number | null;
  favorites: string[] | null;
  active_subscription_id: string | null;
};

type DbBike = {
  id: string;
  name: string;
  category: Bike['category'];
  lat: number;
  lng: number;
  battery: number;
  status: Bike['status'];
  location: string;
  image: string;
  price_per_minute: number;
  day_pass_price: number;
  terrain: string[] | null;
  range_km: number;
  rating: number;
  review_count: number;
  reviews: Review[] | null;
  featured: boolean | null;
  retro: boolean | null;
};

type DbBooking = {
  id: string;
  user_id: string;
  bike_id: string;
  bike_name: string;
  start: string;
  end: string;
  date: string;
  duration_min: number;
  amount: number;
  status: Booking['status'];
  pickup_point: string;
  drop_point: string;
  ride_mode: Booking['rideMode'];
};

type DbPayment = Omit<PaymentRecord, 'id'> & {
  id: string;
  user_id: string;
};

type DbCoupon = Coupon;
type DbSubscription = {
  id: string;
  name: string;
  monthly_price: number;
  perks: string[] | null;
  recommended: boolean | null;
};
type DbNotification = Omit<NotificationItem, 'id'> & {
  id: string;
  user_id: string;
};

type PendingAuthState = {
  role?: Role;
  name?: string;
};

function normalizePhone(value: string) {
  if (value.startsWith('+')) return value;
  const digits = value.replace(/\D/g, '');
  if (!digits) return value;
  return `+91${digits}`;
}

function getEmailRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/`;
}

function isRole(value: unknown): value is Role {
  return value === 'customer' || value === 'manager' || value === 'admin';
}

function readPendingAuthState(): PendingAuthState {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(PENDING_AUTH_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      role: isRole(parsed.role) ? parsed.role : undefined,
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
    };
  } catch {
    return {};
  }
}

function clearPendingAuthState() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PENDING_AUTH_STORAGE_KEY);
}

function profileFromDb(row: DbProfile | null | undefined, user: User, fallbackProfile: UserProfile): UserProfile {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  return {
    name: row?.name || (typeof metadata?.name === 'string' ? metadata.name : fallbackProfile.name),
    phone: row?.phone || user.phone || (typeof metadata?.phone === 'string' ? metadata.phone : fallbackProfile.phone),
    email: row?.email || user.email || fallbackProfile.email,
    role: row?.role || ((typeof metadata?.role === 'string' ? metadata.role : fallbackProfile.role) as Role),
    walletBalance: row?.wallet_balance ?? fallbackProfile.walletBalance,
    favorites: row?.favorites ?? fallbackProfile.favorites,
    activeSubscriptionId: row?.active_subscription_id ?? fallbackProfile.activeSubscriptionId,
  };
}

function bikeFromDb(row: DbBike): Bike {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    lat: row.lat,
    lng: row.lng,
    battery: row.battery,
    status: row.status,
    location: row.location,
    image: row.image,
    pricePerMinute: row.price_per_minute,
    dayPassPrice: row.day_pass_price,
    terrain: row.terrain ?? [],
    rangeKm: row.range_km,
    rating: row.rating,
    reviewCount: row.review_count,
    reviews: row.reviews ?? [],
    featured: row.featured ?? undefined,
    retro: row.retro ?? undefined,
  };
}

function bookingFromDb(row: DbBooking): Booking {
  return {
    id: row.id,
    bikeId: row.bike_id,
    bikeName: row.bike_name,
    start: row.start,
    end: row.end,
    date: row.date,
    durationMin: row.duration_min,
    amount: row.amount,
    status: row.status,
    pickupPoint: row.pickup_point,
    dropPoint: row.drop_point,
    rideMode: row.ride_mode,
  };
}

function subscriptionFromDb(row: DbSubscription): SubscriptionPlan {
  return {
    id: row.id,
    name: row.name,
    monthlyPrice: row.monthly_price,
    perks: row.perks ?? [],
    recommended: row.recommended ?? undefined,
  };
}

async function ensureProfile(user: User, fallbackProfile: UserProfile) {
  if (!supabase) return fallbackProfile;

  const pendingAuth = readPendingAuthState();
  const seededFallbackProfile: UserProfile = {
    ...fallbackProfile,
    name: pendingAuth.name || fallbackProfile.name,
    role: pendingAuth.role || fallbackProfile.role,
    email: user.email || fallbackProfile.email,
  };

  const { data: existing, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle<DbProfile>();
  if (existing) {
    clearPendingAuthState();
    return profileFromDb(existing, user, seededFallbackProfile);
  }

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const seedProfile: DbProfile = {
    user_id: user.id,
    name: typeof metadata?.name === 'string' ? metadata.name : seededFallbackProfile.name,
    phone: user.phone || (typeof metadata?.phone === 'string' ? metadata.phone : seededFallbackProfile.phone),
    email: user.email || seededFallbackProfile.email,
    role: (typeof metadata?.role === 'string' ? metadata.role : seededFallbackProfile.role) as Role,
    wallet_balance: seededFallbackProfile.walletBalance,
    favorites: seededFallbackProfile.favorites,
    active_subscription_id: seededFallbackProfile.activeSubscriptionId ?? null,
  };

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .upsert(seedProfile, { onConflict: 'user_id' })
    .select('*')
    .single<DbProfile>();

  if (insertError) throw insertError;
  clearPendingAuthState();
  return profileFromDb(created, user, fallbackProfile);
}

export function rememberPendingAuthState(payload: { role: Role; name?: string }) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PENDING_AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export async function signInWithGoogleSupabase(role: Role, name?: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add your Supabase URL and anon key to enable Google sign-in.');
  }

  rememberPendingAuthState({ role, name });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getEmailRedirectUrl(),
    },
  });

  if (error) {
    clearPendingAuthState();
    throw error;
  }

  return data;
}

export async function signInWithEmailPasswordSupabase(email: string, password: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add your Supabase URL and anon key to enable email sign-in.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signUpWithEmailPasswordSupabase(payload: {
  email: string;
  password: string;
  name: string;
  role: Role;
}) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add your Supabase URL and anon key to enable email sign-up.');
  }

  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      emailRedirectTo: getEmailRedirectUrl(),
      data: {
        name: payload.name,
        role: payload.role,
      },
    },
  });

  if (error) throw error;

  return {
    ...data,
    emailConfirmationRequired: !data.session,
  };
}

export async function getCurrentSupabaseUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function buildSupabaseState(user: User, previousState: AppState): Promise<AppState> {
  if (!supabase) return previousState;

  const profile = await ensureProfile(user, previousState.profile);

  const [bikesResult, bookingsResult, paymentsResult, couponsResult, subscriptionsResult, notificationsResult] =
    await Promise.all([
      supabase.from('bikes').select('*'),
      supabase.from('bookings').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('payments').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('coupons').select('*'),
      supabase.from('subscriptions').select('*'),
      supabase.from('notifications').select('*').eq('user_id', user.id).order('time', { ascending: false }),
    ]);

  return {
    ...previousState,
    session: {
      ...previousState.session,
      isAuthenticated: true,
      isLoading: false,
      userId: user.id,
    },
    profile,
    bikes:
      !bikesResult.error && bikesResult.data && bikesResult.data.length > 0
        ? (bikesResult.data as DbBike[]).map(bikeFromDb)
        : previousState.bikes,
    bookings:
      !bookingsResult.error && bookingsResult.data
        ? (bookingsResult.data as DbBooking[]).map(bookingFromDb)
        : previousState.bookings,
    payments:
      !paymentsResult.error && paymentsResult.data
        ? (paymentsResult.data as DbPayment[]).map(({ user_id: _userId, ...payment }) => payment)
        : previousState.payments,
    coupons:
      !couponsResult.error && couponsResult.data && couponsResult.data.length > 0
        ? (couponsResult.data as DbCoupon[])
        : previousState.coupons,
    subscriptions:
      !subscriptionsResult.error && subscriptionsResult.data && subscriptionsResult.data.length > 0
        ? (subscriptionsResult.data as DbSubscription[]).map(subscriptionFromDb)
        : previousState.subscriptions,
    notifications:
      !notificationsResult.error && notificationsResult.data
        ? (notificationsResult.data as DbNotification[]).map(({ user_id: _userId, ...notification }) => notification)
        : previousState.notifications,
  };
}

export async function persistProfilePatch(userId: string, patch: Partial<DbProfile>) {
  if (!supabase) return;
  const { error } = await supabase.from('profiles').upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function persistBikeUpdate(bike: Bike) {
  if (!supabase) return;
  const payload: DbBike = {
    id: bike.id,
    name: bike.name,
    category: bike.category,
    lat: bike.lat,
    lng: bike.lng,
    battery: bike.battery,
    status: bike.status,
    location: bike.location,
    image: bike.image,
    price_per_minute: bike.pricePerMinute,
    day_pass_price: bike.dayPassPrice,
    terrain: bike.terrain,
    range_km: bike.rangeKm,
    rating: bike.rating,
    review_count: bike.reviewCount,
    reviews: bike.reviews,
    featured: bike.featured ?? null,
    retro: bike.retro ?? null,
  };

  const { error } = await supabase.from('bikes').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteBike(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('bikes').delete().eq('id', id);
  if (error) throw error;
}

export async function persistBooking(userId: string, booking: Booking) {
  if (!supabase) return;
  const payload: DbBooking = {
    id: booking.id,
    user_id: userId,
    bike_id: booking.bikeId,
    bike_name: booking.bikeName,
    start: booking.start,
    end: booking.end,
    date: booking.date,
    amount: booking.amount,
    duration_min: booking.durationMin,
    status: booking.status,
    pickup_point: booking.pickupPoint,
    drop_point: booking.dropPoint,
    ride_mode: booking.rideMode,
  };
  const { error } = await supabase.from('bookings').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function updateBookingStatus(id: string, status: Booking['status']) {
  if (!supabase) return;
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function persistPayment(userId: string, payment: PaymentRecord) {
  if (!supabase) return;
  const { error } = await supabase.from('payments').upsert({ ...payment, user_id: userId }, { onConflict: 'id' });
  if (error) throw error;
}

export async function persistNotification(userId: string, notification: NotificationItem) {
  if (!supabase) return;
  const { error } = await supabase.from('notifications').upsert({ ...notification, user_id: userId }, { onConflict: 'id' });
  if (error) throw error;
}

export async function markSupabaseNotificationsRead(userId: string) {
  if (!supabase) return;
  const { error } = await supabase.from('notifications').update({ unread: false }).eq('user_id', userId);
  if (error) throw error;
}

export async function signOutSupabase() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function canUseSupabase() {
  return hasSupabaseConfig;
}

export async function hydrateStateIfSupabase(previousState: AppState) {
  if (!hasSupabaseConfig) {
    return { ...previousState, session: { ...previousState.session, isLoading: false } };
  }

  const user = await getCurrentSupabaseUser();
  if (!user) {
    return {
      ...previousState,
      session: {
        ...previousState.session,
        isLoading: false,
      },
    };
  }

  return buildSupabaseState(user, previousState);
}
