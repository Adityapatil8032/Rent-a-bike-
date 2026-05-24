import { useMemo, useState } from 'react';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Circle, MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import CustomerShell from '../components/CustomerShell';
import { useAppContext } from '../context/AppContext';
import { KOLHAPUR_CENTER } from '../data/mockData';
import { distanceInKm, formatCurrency } from '../utils/format';

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const greenPin = new L.DivIcon({
  className: '',
  html: `
    <div style="width:44px;height:44px;border-radius:22px;background:#ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 28px rgba(18,23,20,0.14);border:1px solid rgba(255,255,255,0.98)">
      <div style="width:26px;height:26px;border-radius:9999px;background:#1FA34A;display:flex;align-items:center;justify-content:center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="5.5" cy="17.5" r="2.5"></circle>
          <circle cx="18.5" cy="17.5" r="2.5"></circle>
          <path d="M15 6h3l3 7"></path>
          <path d="M6 17 3 9h7l5 8"></path>
        </svg>
      </div>
    </div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

export default function MapView() {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const [selectedBikeId, setSelectedBikeId] = useState<string | null>(state.bikes[0]?.id ?? null);

  const nearbyBikes = useMemo(
    () =>
      state.bikes
        .filter((bike) => bike.status === 'available')
        .map((bike) => ({
          bike,
          distance: distanceInKm({ lat: KOLHAPUR_CENTER[0], lng: KOLHAPUR_CENTER[1] }, { lat: bike.lat, lng: bike.lng }),
        }))
        .sort((a, b) => a.distance - b.distance),
    [state.bikes],
  );

  const selectedBike = nearbyBikes.find(({ bike }) => bike.id === selectedBikeId)?.bike || nearbyBikes[0]?.bike;
  const selectedDistance = nearbyBikes.find(({ bike }) => bike.id === selectedBike?.id)?.distance ?? 0;

  return (
    <CustomerShell bleed>
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <MapContainer center={KOLHAPUR_CENTER} zoom={14} className="h-full w-full" zoomControl={false}>
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {nearbyBikes.map(({ bike }) => (
              <Marker
                key={bike.id}
                position={[bike.lat, bike.lng]}
                icon={greenPin}
                eventHandlers={{ click: () => setSelectedBikeId(bike.id) }}
              />
            ))}
            <Circle center={KOLHAPUR_CENTER} radius={95} pathOptions={{ color: '#5B9EFF', fillColor: '#5B9EFF', fillOpacity: 0.22 }} />
          </MapContainer>
        </div>

        <div className="pointer-events-none absolute inset-0 z-[400] px-4 pt-4">
          <div className="grid grid-cols-[40px_1fr_40px] items-center">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-[0_10px_20px_rgba(18,23,20,0.08)]"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-center text-base font-bold text-[#121714]">Nearby Bikes</h1>
            <button type="button" className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-[0_10px_20px_rgba(18,23,20,0.08)]">
              <SlidersHorizontal size={18} />
            </button>
          </div>

          <div className="absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute inset-[-14px] rounded-full bg-[#5B9EFF]/15 animate-pulse"></div>
              <div className="absolute inset-[-6px] rounded-full bg-[#5B9EFF]/22"></div>
              <div className="relative h-12 w-12 rounded-full border-4 border-white bg-[#2F8DFF] shadow-[0_18px_30px_rgba(47,141,255,0.24)]"></div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-[500] rounded-t-[28px] bg-white/97 px-4 pb-24 pt-4 shadow-[0_-18px_36px_rgba(18,23,20,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#121714]">{nearbyBikes.length} Bikes Near You</h2>
              <p className="mt-1 text-xs text-slate-500">within 2 km</p>
            </div>
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EEF1EC] bg-white">
              <SlidersHorizontal size={18} />
            </button>
          </div>

          {selectedBike && (
            <div className="premium-soft flex items-center gap-3 p-3">
              <img src={selectedBike.image} alt={selectedBike.name} className="h-16 w-16 rounded-[14px] object-cover" referrerPolicy="no-referrer" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-[#121714]">{selectedBike.name}</p>
                <p className="mt-1 text-xs text-slate-500">{selectedDistance.toFixed(1)} km away</p>
                <p className="mt-2 text-sm font-bold text-[#121714]">{formatCurrency(selectedBike.dayPassPrice)} / day</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/bikes/${selectedBike.id}`)}
                className="rounded-full bg-[#1E8D3F] px-4 py-2 text-xs font-semibold text-white"
              >
                View
              </button>
            </div>
          )}
        </div>
      </div>
    </CustomerShell>
  );
}
