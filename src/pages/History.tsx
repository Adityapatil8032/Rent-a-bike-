import { ArrowLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomerShell from '../components/CustomerShell';
import { useAppContext } from '../context/AppContext';
import type { Booking } from '../types';
import { formatCurrency } from '../utils/format';
import { getBookingTab, getStatusClass, getStatusLabel } from '../utils/bikeDisplay';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
] as const;

export default function History() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    state,
    bookings: { addBooking, cancelBooking },
  } = useAppContext();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('upcoming');

  useEffect(() => {
    const incomingRide = location.state?.newRide as Booking | undefined;
    if (!incomingRide) return;
    addBooking(incomingRide);
    window.history.replaceState({}, document.title);
  }, [addBooking, location.state]);

  const bikesById = useMemo(() => Object.fromEntries(state.bikes.map((bike) => [bike.id, bike])), [state.bikes]);
  const bookings = state.bookings.filter((booking) => getBookingTab(booking.status) === activeTab);

  return (
    <CustomerShell>
      <div className="space-y-4">
        <div className="grid grid-cols-[40px_1fr_40px] items-center">
          <button type="button" onClick={() => navigate('/home')} className="flex h-10 w-10 items-center justify-center rounded-full">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-center text-base font-bold text-[#121714]">My Bookings</h1>
          <span />
        </div>

        <div className="premium-soft flex gap-2 p-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-[12px] px-3 py-3 text-xs font-medium ${
                activeTab === tab.id ? 'bg-[#F1FAF3] text-[#1FA34A] shadow-[0_8px_16px_rgba(31,163,74,0.06)]' : 'text-slate-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {bookings.map((booking) => {
            const bike = bikesById[booking.bikeId];
            return (
              <div key={booking.id} className="premium-soft p-4">
                <div className="flex gap-3">
                  <img src={bike?.image || state.bikes[0]?.image} alt={booking.bikeName} className="h-16 w-16 rounded-[14px] object-cover" referrerPolicy="no-referrer" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[16px] font-semibold text-[#121714]">{booking.bikeName}</p>
                        <p className="mt-2 text-xs text-slate-500">{booking.date}</p>
                        <p className="mt-1 text-xs text-slate-500">{booking.start.replace('Today, ', '')}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${getStatusClass(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                      <span>{Math.max(1, Math.round(booking.durationMin / 60))} Day</span>
                      <span className="font-bold text-[#1E8D3F]">{formatCurrency(booking.amount)}</span>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/bikes/${booking.bikeId}`)}
                        className="flex-1 rounded-[12px] border border-[#E9EDE9] px-4 py-2.5 text-xs font-medium text-slate-600"
                      >
                        View Details
                      </button>
                      {booking.status === 'upcoming' && (
                        <button
                          type="button"
                          onClick={() => cancelBooking(booking.id)}
                          className="flex-1 rounded-[12px] border border-[#FFDCDC] px-4 py-2.5 text-xs font-medium text-rose-500"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CustomerShell>
  );
}
