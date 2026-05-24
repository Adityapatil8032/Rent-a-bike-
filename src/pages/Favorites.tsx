import { ArrowLeft, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomerShell from '../components/CustomerShell';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/format';

export default function Favorites() {
  const navigate = useNavigate();
  const {
    state,
    bikes: { toggleFavorite },
  } = useAppContext();

  const savedBikes = state.bikes.filter((bike) => state.profile.favorites.includes(bike.id));

  return (
    <CustomerShell>
      <div className="space-y-4">
        <div className="grid grid-cols-[40px_1fr_40px] items-center">
          <button type="button" onClick={() => navigate('/home')} className="flex h-10 w-10 items-center justify-center rounded-full">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-center text-base font-bold text-[#121714]">Favourites</h1>
          <span />
        </div>

        <div className="space-y-3">
          {savedBikes.map((bike) => (
            <button
              key={bike.id}
              type="button"
              onClick={() => navigate(`/bikes/${bike.id}`)}
              className="premium-soft flex w-full items-center gap-3 p-3 text-left"
            >
              <img src={bike.image} alt={bike.name} className="h-20 w-20 rounded-[18px] object-cover" referrerPolicy="no-referrer" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold text-[#121714]">{bike.name}</p>
                <p className="mt-2 text-sm font-bold text-[#121714]">{formatCurrency(bike.dayPassPrice)} / day</p>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleFavorite(bike.id);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#1FA34A]"
              >
                <Heart size={17} className="fill-[#1FA34A]" />
              </button>
            </button>
          ))}
        </div>
      </div>
    </CustomerShell>
  );
}
