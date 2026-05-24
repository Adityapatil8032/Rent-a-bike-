import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bike, KeyRound, Mail, MapPin, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import type { Role } from '../types';

const FEATURE_SLIDES = [
  {
    icon: <Sparkles className="text-emerald-400" size={32} />,
    title: 'AI Booking Concierge',
    desc: 'Ask for mountain, sports, scooter, or budget options and get an instant ride recommendation.',
  },
  {
    icon: <MapPin className="text-cyan-400" size={32} />,
    title: 'Live Maps & GPS',
    desc: 'Track nearby bikes, pickup hubs, your current location, and active ride movement in one flow.',
  },
  {
    icon: <Bike className="text-amber-400" size={32} />,
    title: 'Smart Memberships',
    desc: 'Subscriptions, coupons, reviews, push alerts, and weather-aware trip suggestions come built in.',
  },
];

const ROLE_COPY: Record<Role, { title: string; helper: string }> = {
  customer: {
    title: 'Customer Access',
    helper: 'Book bikes, track trips, save favorites, and manage payments.',
  },
  manager: {
    title: 'Manager Access',
    helper: 'Monitor operations, fleet movement, and live booking status.',
  },
  admin: {
    title: 'Admin Access',
    helper: 'Control analytics, inventory, coupons, and platform-wide operations.',
  },
};

type AuthMode = 'signin' | 'signup';
type FeedbackState = { type: 'error' | 'success'; text: string } | null;

export default function Login({ blockedRole }: { blockedRole?: Role }) {
  const navigate = useNavigate();
  const {
    auth: { signInWithEmail, signInWithGoogle, signUpWithEmail, usesSupabase },
  } = useAppContext();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [slideIndex, setSlideIndex] = useState(0);
  const [role, setRole] = useState<Role>(blockedRole === 'manager' || blockedRole === 'admin' ? blockedRole : 'customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % FEATURE_SLIDES.length);
    }, 4500);
    return () => clearInterval(slideTimer);
  }, []);

  const handleEmailSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      await signInWithEmail({
        email: email.trim(),
        password,
      });
      navigate('/');
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to sign in.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSignUp = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setFeedback({
        type: 'error',
        text: 'Enter your name to create the account.',
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({
        type: 'error',
        text: 'Passwords do not match.',
      });
      return;
    }

    setFeedback(null);
    setSubmitting(true);

    try {
      const result = await signUpWithEmail({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      if (result.emailConfirmationRequired) {
        setFeedback({
          type: 'success',
          text: 'Account created. Check your email to confirm the address, then sign in.',
        });
        setMode('signin');
        setPassword('');
        setConfirmPassword('');
        return;
      }

      navigate('/');
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create the account.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFeedback(null);
    setSubmitting(true);

    try {
      await signInWithGoogle({
        role,
        name: name.trim() || undefined,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to continue with Google.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-soft"></div>
      <div
        className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[50%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-soft"
        style={{ animationDelay: '1.5s' }}
      ></div>

      <div className="relative z-10 h-full min-h-screen px-6 py-6 lg:px-10 lg:py-8">
        <div className="mx-auto flex h-full w-full max-w-[1320px] flex-col justify-between lg:grid lg:grid-cols-[minmax(0,1.08fr)_440px] lg:gap-10">
          <div className="flex items-center justify-between pt-4 lg:col-span-2 lg:pt-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                <Bike size={18} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold tracking-wider uppercase text-emerald-400">K-Bike</h2>
                <p className="text-[9px] text-emerald-500/80 font-bold uppercase tracking-widest leading-none">Smart Transit</p>
              </div>
            </div>
            <div className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-300">Google + Email Access</span>
            </div>
          </div>

          <div className="hidden lg:flex flex-col justify-center">
            <div className="max-w-[620px]">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-emerald-300">Responsive Commute Platform</p>
              <h1 className="mt-5 text-5xl font-black leading-[1.05] text-white">
                Rent, unlock, and manage rides on mobile and desktop.
              </h1>
              <p className="mt-5 max-w-[540px] text-base leading-7 text-slate-300">
                A single dashboard for AI-assisted booking, live maps, subscriptions, GPS tracking, and rider support across every screen size.
              </p>
            </div>

            <div className="mt-10 grid gap-4 xl:grid-cols-3">
              {FEATURE_SLIDES.map((feature, index) => (
                <button
                  key={feature.title}
                  type="button"
                  onClick={() => setSlideIndex(index)}
                  className={`rounded-[30px] border p-5 text-left backdrop-blur-sm transition-colors ${
                    slideIndex === index
                      ? 'border-emerald-400/40 bg-white/12 shadow-[0_16px_40px_rgba(16,185,129,0.12)]'
                      : 'border-white/10 bg-white/6'
                  }`}
                >
                  <div className="mb-4 inline-flex rounded-2xl border border-white/10 bg-slate-950/50 p-3">{feature.icon}</div>
                  <h3 className="text-lg font-extrabold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{feature.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-6 lg:py-0">
            <div className="relative mb-6 lg:hidden">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', duration: 1.2 }}
                className="w-24 h-24 bg-gradient-to-b from-emerald-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-emerald-500/40 relative shadow-inner animate-float"
              >
                <Bike size={44} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              </motion.div>
            </div>

            <div className="w-full max-w-xs h-36 flex flex-col items-center text-center px-4 relative mb-4 lg:hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slideIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <div className="mb-2 p-2 bg-white/5 rounded-xl border border-white/10">{FEATURE_SLIDES[slideIndex].icon}</div>
                  <h3 className="text-lg font-bold text-white mb-1">{FEATURE_SLIDES[slideIndex].title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-[280px]">{FEATURE_SLIDES[slideIndex].desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex gap-2 mb-8 lg:hidden">
              {FEATURE_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSlideIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${slideIndex === idx ? 'w-6 bg-emerald-400' : 'w-1.5 bg-slate-700'}`}
                />
              ))}
            </div>

            <div className="w-full max-w-xs glass-panel-dark p-6 rounded-3xl shadow-xl space-y-5 lg:max-w-[440px] lg:p-7 lg:rounded-[34px]">
              <div className="flex rounded-2xl border border-slate-800 bg-slate-950/60 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setFeedback(null);
                  }}
                  className={`flex-1 rounded-[14px] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${
                    mode === 'signin' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setFeedback(null);
                  }}
                  className={`flex-1 rounded-[14px] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${
                    mode === 'signup' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Choose Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['customer', 'manager', 'admin'] as Role[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRole(option)}
                      className={`rounded-2xl border px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${
                        role === option
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900/70 text-slate-300 border-slate-800'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-3">
                  <p className="text-xs font-bold text-white">{ROLE_COPY[role].title}</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{ROLE_COPY[role].helper}</p>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    {mode === 'signup'
                      ? 'This role is saved when the account is created.'
                      : 'Existing accounts keep their saved role. The selector is used for first-time Google sign-in.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-white/12 disabled:opacity-60 flex items-center justify-center gap-3"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {!usesSupabase && (
                <p className="text-[10px] text-amber-300/80 leading-relaxed">
                  Google sign-in needs Supabase auth to be configured in this project.
                </p>
              )}

              <div className="flex items-center gap-3 text-slate-500">
                <div className="h-px flex-1 bg-slate-800"></div>
                <span className="text-[10px] font-bold uppercase tracking-[0.28em]">or</span>
                <div className="h-px flex-1 bg-slate-800"></div>
              </div>

              {mode === 'signin' ? (
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <Field
                    label="Email Address"
                    icon={<Mail size={15} className="text-slate-500" />}
                    input={
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="block w-full bg-transparent text-white focus:outline-none text-sm"
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    }
                  />

                  <Field
                    label="Password"
                    icon={<KeyRound size={15} className="text-slate-500" />}
                    input={
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="block w-full bg-transparent text-white focus:outline-none text-sm"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                      />
                    }
                  />

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/35 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? 'Signing In...' : 'Sign In with Email'}
                    <ArrowRight size={14} />
                  </motion.button>
                </form>
              ) : (
                <form onSubmit={handleEmailSignUp} className="space-y-4">
                  <Field
                    label="Full Name"
                    icon={<UserRound size={15} className="text-slate-500" />}
                    input={
                      <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="block w-full bg-transparent text-white focus:outline-none text-sm"
                        placeholder="Your name"
                        autoComplete="name"
                        required
                      />
                    }
                  />

                  <Field
                    label="Email Address"
                    icon={<Mail size={15} className="text-slate-500" />}
                    input={
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="block w-full bg-transparent text-white focus:outline-none text-sm"
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    }
                  />

                  <Field
                    label="Password"
                    icon={<KeyRound size={15} className="text-slate-500" />}
                    input={
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="block w-full bg-transparent text-white focus:outline-none text-sm"
                        placeholder="Create a password"
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    }
                  />

                  <Field
                    label="Confirm Password"
                    icon={<KeyRound size={15} className="text-slate-500" />}
                    input={
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        className="block w-full bg-transparent text-white focus:outline-none text-sm"
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    }
                  />

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/35 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? 'Creating Account...' : 'Create with Email'}
                    <ArrowRight size={14} />
                  </motion.button>
                </form>
              )}

              {feedback && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-[11px] leading-relaxed ${
                    feedback.type === 'error'
                      ? 'border-rose-400/30 bg-rose-500/10 text-rose-100'
                      : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                  }`}
                >
                  {feedback.text}
                </div>
              )}
            </div>
          </div>

          <div className="text-center pb-4 lg:col-span-2 lg:pb-0 lg:text-left">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Kolhapur Smart City Commute Project</p>
            <p className="text-[8px] text-slate-600 font-semibold tracking-widest mt-1">Google sign-in and email/password access for customer, manager, and admin roles</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  input,
}: {
  label: string;
  icon: ReactNode;
  input: ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</label>
      <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-3 focus-within:border-emerald-500/60 focus-within:ring-2 focus-within:ring-emerald-500/20">
        {icon}
        {input}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.73-.07-1.43-.18-2.09H12v3.96h5.4a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.96-4.34 2.96-7.42Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.45l-3.24-2.52c-.9.6-2.05.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.06v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.88A5.98 5.98 0 0 1 6.1 12c0-.65.11-1.27.31-1.88V7.53H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.47l3.35-2.59Z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.5 3.83 1.48l2.87-2.87C16.96 2.98 14.7 2 12 2A10 10 0 0 0 3.06 7.53l3.35 2.59C7.2 7.74 9.4 5.98 12 5.98Z" />
    </svg>
  );
}
