import { Link, useLocation } from 'react-router-dom';
import { Bot, Heart, House, ReceiptText, User } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/bookings', label: 'Bookings', icon: ReceiptText },
  { to: '/chat', label: 'Chat', icon: Bot, emphasized: true },
  { to: '/favorites', label: 'Favourites', icon: Heart },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function Navigation() {
  const { pathname } = useLocation();

  if (pathname === '/' || pathname === '/admin' || pathname.startsWith('/ride') || pathname.startsWith('/scan') || pathname.startsWith('/bikes/')) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 pb-4">
      <div className="mx-auto w-full max-w-[420px] px-4">
        <div className="pointer-events-auto rounded-[24px] border border-white/95 bg-white/96 px-2 py-2 shadow-nav backdrop-blur-xl">
          <div className="grid grid-cols-5 items-end">
            {NAV_ITEMS.map(({ to, label, icon: Icon, emphasized }) => {
              const active = pathname === to || (to === '/home' && (pathname === '/map' || pathname === '/bikes'));

              return (
                <Link
                  key={to}
                  to={to}
                  className={clsx(
                    'flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium transition-all duration-200',
                    emphasized ? 'translate-y-[-12px]' : '',
                    active && !emphasized ? 'text-[#1FA34A]' : !emphasized ? 'text-slate-400' : 'text-[#1FA34A]',
                  )}
                >
                  <span
                    className={clsx(
                      'flex items-center justify-center rounded-full transition-all',
                      emphasized
                        ? 'h-12 w-12 bg-[#1FA34A] text-white shadow-[0_14px_24px_rgba(31,163,74,0.26)]'
                        : active
                          ? 'h-8 w-8 text-[#1FA34A]'
                          : 'h-8 w-8',
                    )}
                  >
                    <Icon size={emphasized ? 20 : 18} strokeWidth={2.2} />
                  </span>
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
