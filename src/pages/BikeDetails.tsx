import type { ReactNode } from 'react';
import { ArrowLeft, Heart, Star, Zap, Gauge, Weight, Bike } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CustomerShell from '../components/CustomerShell';
import { useAppContext } from '../context/AppContext';
import type { Booking } from '../types';
import { formatCurrency } from '../utils/format';
import { getBikeCategoryLabel, getBikeDescription, getBikeSpecs } from '../utils/bikeDisplay';

export default function BikeDetails() {
  const navigate = useNavigate();
  const { bikeId } = useParams();
  const {
    state,
    bikes: { toggleFavorite },
    bookings: { addBooking },
  } = useAppContext();

  const bike = useMemo(() => state.bikes.find((item) => item.id === bikeId) || state.bikes[0], [bikeId, state.bikes]);
  const favorite = state.profile.favorites.includes(bike.id);
  const specs = getBikeSpecs(bike);

  const handleBookNow = () => {
    const booking: Booking = {
      id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      bikeId: bike.id,
      bikeName: bike.name,
      start: 'Tomorrow, 9:00 AM',
      end: 'Tomorrow, 6:00 PM',
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      durationMin: 540,
      amount: bike.dayPassPrice,
      status: 'upcoming',
      pickupPoint: bike.location,
      dropPoint: bike.location,
      rideMode: 'eco',
    };

    addBooking(booking);
    navigate('/bookings');
  };

  return (
    <CustomerShell withNav={false}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full">
            <ArrowLeft size={18} />
          </button>
          <button type="button" onClick={() => toggleFavorite(bike.id)} className="flex h-10 w-10 items-center justify-center rounded-full">
            <Heart size={18} className={favorite ? 'fill-[#1FA34A] text-[#1FA34A]' : 'text-slate-500'} />
          </button>
        </div>

        <div className="rounded-[28px] bg-white px-4 py-2">
          <img src={bike.image} alt={bike.name} className="mx-auto h-72 w-full object-contain" referrerPolicy="no-referrer" />
        </div>

        <div>
          <h1 className="text-[21px] font-bold text-[#121714]">{bike.name}</h1>
          <p className="mt-1 text-sm text-slate-500">{getBikeCategoryLabel(bike.category)}</p>
          <div className="mt-2 flex items-center gap-1 text-sm text-slate-500">
            <Star size={14} className="fill-[#FDBA31] text-[#FDBA31]" />
            <span>4.6 ({bike.reviewCount} reviews)</span>
          </div>
          <p className="mt-4 text-[30px] font-extrabold text-[#1FA34A]">{formatCurrency(bike.dayPassPrice)} / day</p>
        </div>

        <div className="grid grid-cols-4 gap-3 border-t border-b border-[#EEF1EC] py-4">
          <SpecItem icon={<Zap size={16} />} value={specs.engine} label="Engine" />
          <SpecItem icon={<Gauge size={16} />} value={specs.mileage} label="Mileage" />
          <SpecItem icon={<Weight size={16} />} value={specs.weight} label="Weight" />
          <SpecItem icon={<Bike size={16} />} value={specs.group} label="Category" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#121714]">Description</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">{getBikeDescription(bike)}</p>
          <button type="button" className="mt-3 text-sm font-medium text-[#1FA34A]">
            View more
          </button>
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-[#FCFDFC] via-[#FCFDFC] to-transparent px-4 pb-5 pt-5">
        <button
          type="button"
          onClick={handleBookNow}
          className="w-full rounded-[14px] bg-[#1E8D3F] px-5 py-4 text-base font-semibold text-white"
        >
          Book Now
        </button>
      </div>
    </CustomerShell>
  );
}

function SpecItem({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center text-slate-600">{icon}</div>
      <p className="mt-3 text-sm font-semibold text-[#121714]">{value}</p>
      <p className="mt-1 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
