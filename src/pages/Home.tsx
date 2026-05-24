import { Bell, Bike, MapPin, Search, SlidersHorizontal, Tag, WalletCards } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerShell from '../components/CustomerShell';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/format';

const QUICK_ACTIONS = [
  { label: 'Near You', icon: MapPin, to: '/map' },
  { label: 'Bikes', icon: Bike, to: '/bikes' },
  { label: 'Offers', icon: Tag, to: '/bookings' },
  { label: 'Subscription', icon: WalletCards, to: '/profile' },
];

export default function Home() {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const featuredBike = state.bikes.find((bike) => bike.featured) || state.bikes[0];
  const popularBikes = state.bikes.filter((bike) => bike.status === 'available').slice(0, 2);

  return (
    <CustomerShell>
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-medium text-slate-500">Hello, Rider</p>
            <h1 className="mt-2 max-w-[250px] text-[26px] font-extrabold leading-[1.18] tracking-[-0.03em] text-[#121714]">
              Find the right ride
              <br />
              <span className="text-[#1E7E3C]">for every journey</span>
            </h1>
          </div>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EEF1EC] bg-white shadow-[0_10px_20px_rgba(15,20,17,0.04)]">
            <Bell size={18} className="text-slate-700" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/bikes')}
          className="premium-soft flex w-full items-center gap-3 px-4 py-4 text-left"
        >
          <Search size={17} className="text-slate-400" />
          <div className="flex-1 text-sm text-slate-400">Where are you going?</div>
          <SlidersHorizontal size={16} className="text-[#1FA34A]" />
        </button>

        <div className="grid grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ label, icon: Icon, to }) => (
            <Link key={label} to={to} className="premium-soft flex flex-col items-center gap-2 px-2 py-4 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#F3F7F3] text-[#1FA34A]">
                <Icon size={18} />
              </span>
              <span className="text-[10px] font-medium text-[#121714]">{label}</span>
            </Link>
          ))}
        </div>

        <div className="rounded-[24px] bg-[#EEF8F0] p-4 shadow-[0_16px_34px_rgba(31,163,74,0.08)]">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[#121714]">Weekend Offer</p>
              <p className="mt-2 text-[22px] font-extrabold leading-[1.15] text-[#121714]">Get up to 20% OFF</p>
              <p className="mt-2 text-sm text-slate-600">on all bike rentals</p>
              <button
                type="button"
                onClick={() => navigate(`/bikes/${featuredBike.id}`)}
                className="mt-4 rounded-[10px] bg-[#1FA34A] px-4 py-2 text-xs font-semibold text-white"
              >
                Explore Now
              </button>
            </div>
            <img
              src={featuredBike.image}
              alt={featuredBike.name}
              className="h-28 w-28 rounded-[18px] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#121714]">Popular Bikes</h2>
            <Link to="/bikes" className="text-sm font-medium text-[#1FA34A]">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {popularBikes.map((bike) => (
              <button
                key={bike.id}
                type="button"
                onClick={() => navigate(`/bikes/${bike.id}`)}
                className="premium-soft overflow-hidden text-left"
              >
                <img src={bike.image} alt={bike.name} className="h-28 w-full object-cover" referrerPolicy="no-referrer" />
                <div className="p-3">
                  <p className="line-clamp-2 text-[13px] font-semibold text-[#121714]">{bike.name}</p>
                  <p className="mt-3 text-[13px] font-bold text-[#121714]">{formatCurrency(bike.dayPassPrice)} / day</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
