import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { INITIAL_STATE } from '../data/mockData';
import {
  buildSupabaseState,
  canUseSupabase,
  deleteBike,
  hydrateStateIfSupabase,
  markSupabaseNotificationsRead,
  persistBikeUpdate,
  persistBooking,
  persistNotification,
  persistPayment,
  persistProfilePatch,
  signInWithEmailPasswordSupabase,
  signInWithGoogleSupabase,
  signOutSupabase,
  signUpWithEmailPasswordSupabase,
  updateBookingStatus,
} from '../services/supabaseApp';
import { supabase } from '../services/supabase';
import type {
  AIProvider,
  AppState,
  Bike,
  Booking,
  NotificationItem,
  Review,
  Role,
  SubscriptionPlan,
} from '../types';

const STORAGE_KEY = 'k-bike-smart-state-v3';
const LOCAL_AUTH_STORAGE_KEY = 'k-bike-local-auth-users-v1';

interface AppContextValue {
  state: AppState;
  auth: {
    logout: () => void;
    signInWithGoogle: (payload: { role: Role; name?: string }) => Promise<void>;
    signInWithEmail: (payload: { email: string; password: string }) => Promise<void>;
    signUpWithEmail: (payload: { name: string; email: string; password: string; role: Role }) => Promise<{ emailConfirmationRequired: boolean }>;
    usesSupabase: boolean;
  };
  assistant: {
    setAIProvider: (provider: AIProvider) => void;
  };
  bikes: {
    toggleFavorite: (bikeId: string) => void;
    addReview: (bikeId: string, review: Omit<Review, 'id' | 'createdAt'>) => void;
    updateBikeStatus: (bikeId: string, status: Bike['status']) => void;
    addBike: (bike: Bike) => void;
    removeBike: (bikeId: string) => void;
  };
  bookings: {
    cancelBooking: (bookingId: string) => void;
    addBooking: (booking: Booking) => void;
  };
  billing: {
    subscribeToPlan: (plan: SubscriptionPlan['id']) => void;
    addWalletFunds: (amount: number) => void;
  };
  notifications: {
    addNotification: (notification: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => void;
    markNotificationsRead: () => void;
  };
}

const AppContext = createContext<AppContextValue | null>(null);
const usesSupabase = canUseSupabase();

type LocalAuthAccount = {
  email: string;
  password: string;
  name: string;
  role: Role;
};

function readInitialState(): AppState {
  if (typeof window === 'undefined') return INITIAL_STATE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    return { ...INITIAL_STATE, ...JSON.parse(raw) } as AppState;
  } catch {
    return INITIAL_STATE;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function readLocalAuthAccounts() {
  if (typeof window === 'undefined') return [] as LocalAuthAccount[];

  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LocalAuthAccount[]) : [];
  } catch {
    return [];
  }
}

function writeLocalAuthAccounts(accounts: LocalAuthAccount[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_AUTH_STORAGE_KEY, JSON.stringify(accounts));
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(readInitialState);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    let mounted = true;

    void hydrateStateIfSupabase(readInitialState()).then((nextState) => {
      if (mounted) {
        setState(nextState);
      }
    });

    if (!supabase) return () => {
      mounted = false;
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        setState((prev) => ({
          ...INITIAL_STATE,
          aiProvider: prev.aiProvider,
          session: {
            isAuthenticated: false,
            isLoading: false,
          },
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        session: {
          ...prev.session,
          isAuthenticated: true,
          isLoading: true,
          userId: session.user.id,
        },
      }));

      setTimeout(() => {
        void buildSupabaseState(session.user, readInitialState()).then((nextState) => {
          if (mounted) {
            setState((prev) => ({
              ...nextState,
              aiProvider: prev.aiProvider,
            }));
          }
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(({
    role,
    phone,
    email,
    name,
    userId,
  }: {
    role: Role;
    phone: string;
    email?: string;
    name?: string;
    userId?: string;
  }) => {
    setState((prev) => ({
      ...prev,
      session: {
        ...prev.session,
        isAuthenticated: true,
        isLoading: false,
        userId,
      },
      profile: {
        ...prev.profile,
        role,
        phone,
        email: email || prev.profile.email,
        name: name || prev.profile.name,
      },
    }));
  }, []);

  const logout = useCallback(() => {
    if (usesSupabase) {
      void signOutSupabase();
      return;
    }

    setState((prev) => ({
      ...INITIAL_STATE,
      aiProvider: prev.aiProvider,
      session: {
        isAuthenticated: false,
        isLoading: false,
      },
    }));
  }, []);

  const signInWithGoogle = useCallback(async ({ role, name }: { role: Role; name?: string }) => {
    if (usesSupabase) {
      await signInWithGoogleSupabase(role, name);
      return;
    }

    throw new Error('Google sign-in requires Supabase configuration and an enabled Google provider.');
  }, []);

  const signInWithEmail = useCallback(async ({ email, password }: { email: string; password: string }) => {
    if (usesSupabase) {
      await signInWithEmailPasswordSupabase(normalizeEmail(email), password);
      return;
    }

    const account = readLocalAuthAccounts().find(
      (candidate) => candidate.email === normalizeEmail(email) && candidate.password === password,
    );

    if (!account) {
      throw new Error('Invalid email or password.');
    }

    login({
      role: account.role,
      phone: INITIAL_STATE.profile.phone,
      email: account.email,
      name: account.name,
      userId: `local:${account.email}`,
    });
  }, [login]);

  const signUpWithEmail = useCallback(async ({
    name,
    email,
    password,
    role,
  }: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => {
    const normalizedEmail = normalizeEmail(email);

    if (usesSupabase) {
      const result = await signUpWithEmailPasswordSupabase({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role,
      });

      return {
        emailConfirmationRequired: result.emailConfirmationRequired,
      };
    }

    const accounts = readLocalAuthAccounts();
    if (accounts.some((candidate) => candidate.email === normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    writeLocalAuthAccounts([
      {
        email: normalizedEmail,
        password,
        name: name.trim(),
        role,
      },
      ...accounts,
    ]);

    login({
      role,
      phone: INITIAL_STATE.profile.phone,
      email: normalizedEmail,
      name: name.trim(),
      userId: `local:${normalizedEmail}`,
    });

    return {
      emailConfirmationRequired: false,
    };
  }, [login]);

  const setAIProvider = useCallback((provider: AIProvider) => {
    setState((prev) => ({ ...prev, aiProvider: provider }));
  }, []);

  const toggleFavorite = useCallback((bikeId: string) => {
    setState((prev) => {
      const nextFavorites = prev.profile.favorites.includes(bikeId)
        ? prev.profile.favorites.filter((id) => id !== bikeId)
        : [...prev.profile.favorites, bikeId];

      if (usesSupabase && prev.session.userId) {
        void persistProfilePatch(prev.session.userId, { favorites: nextFavorites });
      }

      return {
        ...prev,
        profile: {
          ...prev.profile,
          favorites: nextFavorites,
        },
      };
    });
  }, []);

  const cancelBooking = useCallback((bookingId: string) => {
    setState((prev) => {
      const nextNotifications = [
        {
          id: `N-${Date.now()}`,
          title: 'Booking cancelled',
          body: `Booking ${bookingId} has been cancelled successfully.`,
          time: 'Just now',
          type: 'booking' as const,
          unread: true,
        },
        ...prev.notifications,
      ];

      if (usesSupabase) {
        void updateBookingStatus(bookingId, 'cancelled');
        if (prev.session.userId) {
          void persistNotification(prev.session.userId, nextNotifications[0]);
        }
      }

      return {
        ...prev,
        bookings: prev.bookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking,
        ),
        notifications: nextNotifications,
      };
    });
  }, []);

  const addReview = useCallback((bikeId: string, review: Omit<Review, 'id' | 'createdAt'>) => {
    setState((prev) => {
      const nextBikes = prev.bikes.map((bike) => {
        if (bike.id !== bikeId) return bike;

        const nextReviews = [
          {
            ...review,
            id: `RV-${Date.now()}`,
            createdAt: 'Just now',
          },
          ...bike.reviews,
        ];

        const total = nextReviews.reduce((sum, item) => sum + item.rating, 0);

        return {
          ...bike,
          reviews: nextReviews,
          reviewCount: nextReviews.length,
          rating: total / nextReviews.length,
        };
      });

      if (usesSupabase) {
        const updatedBike = nextBikes.find((bike) => bike.id === bikeId);
        if (updatedBike) {
          void persistBikeUpdate(updatedBike);
        }
      }

      return {
        ...prev,
        bikes: nextBikes,
      };
    });
  }, []);

  const updateBikeStatus = useCallback((bikeId: string, status: Bike['status']) => {
    setState((prev) => {
      const nextBikes = prev.bikes.map((bike) => (bike.id === bikeId ? { ...bike, status } : bike));
      if (usesSupabase) {
        const updatedBike = nextBikes.find((bike) => bike.id === bikeId);
        if (updatedBike) void persistBikeUpdate(updatedBike);
      }
      return {
        ...prev,
        bikes: nextBikes,
      };
    });
  }, []);

  const addBike = useCallback((bike: Bike) => {
    setState((prev) => {
      const nextBikes = prev.bikes.some((existingBike) => existingBike.id === bike.id) ? prev.bikes : [bike, ...prev.bikes];
      if (usesSupabase) {
        void persistBikeUpdate(bike);
      }
      return {
        ...prev,
        bikes: nextBikes,
      };
    });
  }, []);

  const removeBike = useCallback((bikeId: string) => {
    setState((prev) => {
      if (usesSupabase) {
        void deleteBike(bikeId);
      }
      return {
        ...prev,
        bikes: prev.bikes.filter((bike) => bike.id !== bikeId),
      };
    });
  }, []);

  const addNotification = useCallback((notification: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => {
    setState((prev) => {
      const nextNotification = {
        ...notification,
        id: `N-${Date.now()}`,
        time: 'Just now',
        unread: true,
      };

      if (usesSupabase && prev.session.userId) {
        void persistNotification(prev.session.userId, nextNotification);
      }

      return {
        ...prev,
        notifications: [nextNotification, ...prev.notifications],
      };
    });
  }, []);

  const subscribeToPlan = useCallback((plan: SubscriptionPlan['id']) => {
    setState((prev) => {
      if (usesSupabase && prev.session.userId) {
        void persistProfilePatch(prev.session.userId, { active_subscription_id: plan });
      }

      return {
        ...prev,
        profile: {
          ...prev.profile,
          activeSubscriptionId: plan,
        },
      };
    });
  }, []);

  const addWalletFunds = useCallback((amount: number) => {
    setState((prev) => {
      const payment = {
        id: `P-${Date.now()}`,
        date: 'Today',
        label: 'Wallet top-up',
        amount,
        method: 'UPI',
        status: 'paid' as const,
      };

      if (usesSupabase && prev.session.userId) {
        void persistProfilePatch(prev.session.userId, {
          wallet_balance: prev.profile.walletBalance + amount,
        });
        void persistPayment(prev.session.userId, payment);
      }

      return {
        ...prev,
        profile: {
          ...prev.profile,
          walletBalance: prev.profile.walletBalance + amount,
        },
        payments: [payment, ...prev.payments],
      };
    });
  }, []);

  const markNotificationsRead = useCallback(() => {
    setState((prev) => {
      if (usesSupabase && prev.session.userId) {
        void markSupabaseNotificationsRead(prev.session.userId);
      }

      return {
        ...prev,
        notifications: prev.notifications.map((item) => ({ ...item, unread: false })),
      };
    });
  }, []);

  const addBooking = useCallback((booking: Booking) => {
    setState((prev) => {
      const nextBookings = prev.bookings.some((existingBooking) => existingBooking.id === booking.id)
        ? prev.bookings
        : [booking, ...prev.bookings];

      if (usesSupabase && prev.session.userId) {
        void persistBooking(prev.session.userId, booking);
      }

      return {
        ...prev,
        bookings: nextBookings,
      };
    });
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    state,
    auth: {
      logout,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      usesSupabase,
    },
    assistant: {
      setAIProvider,
    },
    bikes: {
      toggleFavorite,
      addReview,
      updateBikeStatus,
      addBike,
      removeBike,
    },
    bookings: {
      cancelBooking,
      addBooking,
    },
    billing: {
      subscribeToPlan,
      addWalletFunds,
    },
    notifications: {
      addNotification,
      markNotificationsRead,
    },
  }), [
    state,
    logout,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    setAIProvider,
    toggleFavorite,
    addReview,
    updateBikeStatus,
    addBike,
    removeBike,
    cancelBooking,
    addBooking,
    subscribeToPlan,
    addWalletFunds,
    addNotification,
    markNotificationsRead,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used inside AppProvider');
  }
  return context;
}
