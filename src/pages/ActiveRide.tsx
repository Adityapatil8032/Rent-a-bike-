import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Circle, MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import {
  Battery,
  Clock,
  Leaf,
  MapPin,
  Navigation,
  ShieldCheck,
  SignalHigh,
  Zap,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { PICKUP_POINTS } from '../data/mockData';
import type { RideMode } from '../types';
import { formatCurrency } from '../utils/format';

const ROUTE_POINTS: [number, number][] = [
  [16.6946, 74.223],
  [16.6938, 74.2205],
  [16.693, 74.2185],
  [16.6922, 74.2162],
  [16.6912, 74.214],
  [16.69, 74.212],
];

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function ActiveRide() {
  const navigate = useNavigate();
  const routeState = useLocation().state || {};
  const {
    state,
    notifications: { addNotification },
  } = useAppContext();

  const bikeId = routeState.selectedBikeId || 'B-201';
  const rideMode = (routeState.rideMode || 'eco') as RideMode;
  const bike = state.bikes.find((item) => item.id === bikeId) || state.bikes[0];

  const [time, setTime] = useState(0);
  const [cost, setCost] = useState(0);
  const [battery, setBattery] = useState(routeState.selectedBikeBattery || bike?.battery || 75);
  const [gpsAccuracy, setGpsAccuracy] = useState('High');
  const [currentCoordinateIndex, setCurrentCoordinateIndex] = useState(0);
  const [trail, setTrail] = useState<[number, number][]>([ROUTE_POINTS[0]]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => prev + 1);
      setCost((prev) => prev + ((rideMode === 'boost' ? 3 : rideMode === 'fitness' ? 1 : 1.8) / 60));

      setBattery((prev) => {
        const drain = rideMode === 'boost' ? 0.25 : rideMode === 'fitness' ? 0.03 : 0.12;
        return Math.max(prev - drain, 0);
      });

      if (Math.random() > 0.85) {
        setGpsAccuracy(Math.random() > 0.6 ? 'High' : 'Medium');
      }
    }, 1000);

    const coordinateTimer = setInterval(() => {
      setCurrentCoordinateIndex((prev) => {
        const nextIndex = Math.min(prev + 1, ROUTE_POINTS.length - 1);
        setTrail((prevTrail) => {
          if (prevTrail.length - 1 >= nextIndex) return prevTrail;
          return [...prevTrail, ROUTE_POINTS[nextIndex]];
        });
        return nextIndex;
      });
    }, 6000);

    return () => {
      clearInterval(timer);
      clearInterval(coordinateTimer);
    };
  }, [rideMode]);

  const inParkingZone = currentCoordinateIndex === 0 || currentCoordinateIndex === ROUTE_POINTS.length - 1;
  const currentCoords = ROUTE_POINTS[currentCoordinateIndex];
  const ecoImpact = rideMode === 'eco' ? `${(time * 0.18).toFixed(1)}g CO2 saved` : rideMode === 'boost' ? 'High-output commute mode' : `${(time * 0.15).toFixed(1)} kcal burned`;

  const handleEndRide = () => {
    if (!inParkingZone || !bike) {
      alert('Please park in a designated pickup zone before ending the ride.');
      return;
    }

    addNotification({
      title: 'Ride completed',
      body: `${bike.name} was returned successfully. Receipt added to your history.`,
      type: 'booking',
    });

    navigate('/history', {
      state: {
        newRide: {
          id: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
          bikeId: bike.id,
          bikeName: bike.name,
          start: 'Today',
          end: 'Just now',
          date: new Date().toISOString().slice(0, 10),
          durationMin: Math.max(1, Math.ceil(time / 60)),
          amount: Math.max(5, Math.round(cost)),
          status: 'completed',
          pickupPoint: bike.location,
          dropPoint: 'Rankala Lake Hub',
          rideMode,
        },
      },
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col relative bg-slate-950 text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <MapContainer center={ROUTE_POINTS[0]} zoom={15} className="h-full w-full" zoomControl={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {PICKUP_POINTS.map((zone) => (
            <Circle
              key={zone.name}
              center={[zone.lat, zone.lng]}
              radius={zone.radius}
              pathOptions={{ color: inParkingZone ? '#10b981' : '#f97316', fillColor: '#10b981', fillOpacity: 0.12 }}
            />
          ))}

          <Polyline positions={trail} pathOptions={{ color: rideMode === 'boost' ? '#6366f1' : rideMode === 'fitness' ? '#f59e0b' : '#10b981', weight: 5 }} />
          <Marker position={currentCoords} icon={userIcon} />
        </MapContainer>
      </div>

      <div className="absolute inset-0 z-20 p-4 lg:p-6 pointer-events-none">
        <div className="mx-auto flex h-full w-full max-w-[1280px] flex-col justify-between lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-full border border-slate-800 flex items-center gap-2 pointer-events-auto">
                <SignalHigh size={12} className={gpsAccuracy === 'High' ? 'text-emerald-400' : 'text-amber-400'} />
                <span className="text-[10px] font-extrabold text-slate-300">GPS {gpsAccuracy}</span>
              </div>
              <div className="bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-full border border-slate-800 flex items-center gap-2 pointer-events-auto">
                <Battery size={13} className="text-emerald-400" />
                <span className="text-[10px] font-extrabold text-slate-200">{Math.round(battery)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:max-w-[520px]">
              <MetricBox icon={<Clock size={18} />} title="Duration" value={formatTime(time)} />
              <MetricBox icon={<Zap size={18} />} title="Est. cost" value={formatCurrency(cost)} />
              <MetricBox icon={<Leaf size={18} />} title="Ride impact" value={ecoImpact} compact />
              <MetricBox icon={<MapPin size={18} />} title="Bike" value={bike?.name || bikeId} compact />
            </div>
          </div>

          <div className="hidden lg:flex lg:flex-col lg:justify-end lg:pb-2">
            <div className="pointer-events-auto rounded-[30px] border border-slate-800 bg-slate-950/94 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-md">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.22em]">GPS Tracking</span>
              <h3 className="text-2xl font-extrabold text-white mt-2">{bike?.name || bikeId}</h3>
              <p className="text-sm text-slate-400 mt-2">Watch the live route, check battery and accuracy, then end the ride from a pickup hub.</p>

              <div className={`mt-5 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm font-bold ${
                inParkingZone ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
              }`}>
                <Navigation size={14} />
                {inParkingZone ? 'Bike is inside a safe return zone' : 'Ride to a pickup hub before locking the bike'}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <RideInfo label="Current stop" value={inParkingZone ? 'Pickup hub' : 'In transit'} />
                <RideInfo label="Ride mode" value={rideMode} />
                <RideInfo label="Route points" value={`${trail.length}/${ROUTE_POINTS.length}`} />
                <RideInfo label="Battery left" value={`${Math.round(battery)}%`} />
              </div>

              <button
                onClick={handleEndRide}
                className={`mt-6 w-full py-4 rounded-2xl font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${
                  inParkingZone ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}
              >
                <ShieldCheck size={16} />
                Lock Bike & End Ride
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 bg-slate-950 rounded-t-[32px] border-t border-slate-800 p-5 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] lg:hidden">
        <div className="flex justify-between items-center mb-4 gap-3">
          <div>
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.22em]">GPS Tracking</span>
            <h3 className="text-lg font-extrabold text-white mt-1">{bike?.name || bikeId}</h3>
          </div>

          <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold ${
            inParkingZone ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
          }`}>
            <Navigation size={12} />
            {inParkingZone ? 'Safe return zone' : 'Ride to pickup hub'}
          </div>
        </div>

        <button
          onClick={handleEndRide}
          className={`w-full py-4 rounded-2xl font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${
            inParkingZone ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
          }`}
        >
          <ShieldCheck size={16} />
          Lock Bike & End Ride
        </button>
      </div>
    </div>
  );
}

function MetricBox({
  icon,
  title,
  value,
  compact,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-lg p-3.5 border border-slate-800/80 flex items-center gap-3 pointer-events-auto">
      <div className="p-2.5 rounded-xl text-emerald-400 border border-emerald-500/30 bg-emerald-500/10">{icon}</div>
      <div>
        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{title}</p>
        <p className={`${compact ? 'text-xs' : 'text-lg'} font-extrabold text-white leading-none mt-1`}>{value}</p>
      </div>
    </div>
  );
}

function RideInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-extrabold text-white capitalize">{value}</p>
    </div>
  );
}
