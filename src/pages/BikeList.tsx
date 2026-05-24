import { ArrowLeft, Heart, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerShell from '../components/CustomerShell';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/format';
import { getBikeCategoryLabel, getBikeFilterGroup } from '../utils/bikeDisplay';

const FILTERS = ['All', 'Sports', 'Cruiser', 'Scooter', 'Gear'] as const;

export default function BikeList() {
  const navigate = useNavigate();
  const {
    state,
    bikes: { toggleFavorite },
  } = useAppContext();
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>('All');

  const bikes = useMemo(() => {
    if (activeFilter === 'All') return state.bikes;
    return state.bikes.filter((bike) => getBikeFilterGroup(bike.category) === activeFilter);
  }, [activeFilter, state.bikes]);

  return (
    <CustomerShell>
      <div className="space-y-4">
        <div className="grid grid-cols-[40px_1fr_40px] items-center">
          <button type="button" onClick={() => navigate('/home')} className="flex h-10 w-10 items-center justify-center rounded-full">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-center text-base font-bold text-[#121714]">Bikes</h1>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full">
            <Search size={18} />
          </button>
        </div>

        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                activeFilter === filter
                  ? 'border-[#9DD9AE] bg-[#F4FBF5] text-[#1FA34A]'
                  : 'border-[#ECEFEC] bg-white text-slate-500'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {bikes.map((bike) => {
            const favorite = state.profile.favorites.includes(bike.id);

            return (
              <button
                key={bike.id}
                type="button"
                onClick={() => navigate(`/bikes/${bike.id}`)}
                className="premium-soft flex w-full items-center gap-3 p-3 text-left"
              >
                <img src={bike.image} alt={bike.name} className="h-20 w-20 rounded-[18px] object-cover" referrerPolicy="no-referrer" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px] font-semibold text-[#121714]">{bike.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{getBikeCategoryLabel(bike.category)}</p>
                  <p className="mt-2 text-sm font-bold text-[#121714]">{formatCurrency(bike.dayPassPrice)} / day</p>
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleFavorite(bike.id);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400"
                >
                  <Heart size={17} className={favorite ? 'fill-[#1FA34A] text-[#1FA34A]' : ''} />
                </button>
              </button>
            );
          })}
        </div>
      </div>
    </CustomerShell>
  );
}
