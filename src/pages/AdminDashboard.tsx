import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import {
  BarChart3,
  Bike,
  IndianRupee,
  LogOut,
  PackagePlus,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { KOLHAPUR_CENTER, PICKUP_POINTS } from '../data/mockData';
import type { BikeCategory } from '../types';
import { formatCompactNumber, formatCurrency } from '../utils/format';

const getIcon = (status: string) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${
      status === 'maintenance' ? 'red' : status === 'in-use' ? 'blue' : 'green'
    }.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

export default function AdminDashboard() {
  const navigate = useNavigate();
  const {
    state,
    auth: { logout },
    bikes: { addBike, removeBike, updateBikeStatus },
  } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'inventory' | 'users'>('overview');
  const [form, setForm] = useState({
    id: '',
    name: '',
    category: 'commuter' as BikeCategory,
    price: '450',
    location: 'CBS Bus Stand Hub',
  });

  const totalRevenue = state.bookings
    .filter((booking) => booking.status === 'completed' || booking.status === 'active')
    .reduce((sum, booking) => sum + booking.amount, 0);
  const activeRides = state.bookings.filter((booking) => booking.status === 'active').length;
  const availableCount = state.bikes.filter((bike) => bike.status === 'available').length;
  const popularBike = [...state.bikes].sort((a, b) => b.reviewCount - a.reviewCount)[0];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAddBike = () => {
    if (!form.id.trim() || !form.name.trim()) return;

    addBike({
      id: form.id.trim(),
      name: form.name.trim(),
      category: form.category,
      lat: KOLHAPUR_CENTER[0],
      lng: KOLHAPUR_CENTER[1],
      battery: 100,
      status: 'available',
      location: form.location,
      image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
      pricePerMinute: 2,
      dayPassPrice: Number(form.price) || 450,
      terrain: ['city'],
      rangeKm: 55,
      rating: 4.3,
      reviewCount: 0,
      reviews: [],
    });

    setForm({
      id: '',
      name: '',
      category: 'commuter' as BikeCategory,
      price: '450',
      location: 'CBS Bus Stand Hub',
    });
  };

  const isAdmin = state.profile.role === 'admin';

  return (
    <div className="h-full bg-slate-100 flex flex-col">
      <div className="bg-slate-950 text-white px-6 py-4 shadow-md z-10 lg:px-8 lg:py-6">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 lg:text-3xl">
              <ShieldCheck className="text-emerald-400" />
              {isAdmin ? 'Admin Dashboard' : 'Manager Console'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">Role: {state.profile.role}</p>
          </div>
          <button onClick={handleLogout} className="p-2 bg-white/10 rounded-full shrink-0">
            <LogOut size={20} className="text-rose-400" />
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-4 lg:px-6">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard icon={<IndianRupee size={18} />} label="Revenue" value={formatCurrency(totalRevenue)} tone="emerald" />
          <MetricCard icon={<Bike size={18} />} label="Available Bikes" value={`${availableCount}`} tone="sky" />
          <MetricCard icon={<BarChart3 size={18} />} label="Active Rides" value={`${activeRides}`} tone="amber" />
          <MetricCard icon={<Users size={18} />} label="Popular Bike" value={popularBike?.name || 'N/A'} tone="rose" compact />
        </div>
      </div>

      <div className="flex bg-white border-b border-slate-200 overflow-x-auto hide-scrollbar px-2 lg:px-6">
        {[
          { key: 'overview', label: 'Analytics' },
          { key: 'map', label: 'Live Map' },
          { key: 'inventory', label: 'Inventory' },
          { key: 'users', label: 'Users' },
        ]
          .filter((tab) => isAdmin || tab.key !== 'users')
          .map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 ${
                activeTab === tab.key ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="mx-auto w-full max-w-[1280px] p-4 space-y-4 lg:p-6">
            <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900">Analytics Dashboard</h3>
              <div className="grid grid-cols-2 gap-3 mt-4 lg:grid-cols-4">
                <AnalyticsCard title="Total bookings" value={formatCompactNumber(state.bookings.length)} />
                <AnalyticsCard title="Revenue" value={formatCurrency(totalRevenue)} />
                <AnalyticsCard title="Popular bike" value={popularBike?.name || 'N/A'} />
                <AnalyticsCard title="Coupons live" value={`${state.coupons.filter((coupon) => coupon.active).length}`} />
              </div>
            </div>

            <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900">Push-ready notifications</h3>
              <div className="space-y-2 mt-3">
                {state.notifications.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-slate-50 p-3 border border-slate-200">
                    <p className="text-sm font-extrabold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="mx-auto grid h-full w-full max-w-[1280px] gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-6">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 shadow-sm min-h-[520px]">
              <MapContainer center={KOLHAPUR_CENTER} zoom={14} className="h-full w-full" zoomControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                {PICKUP_POINTS.map((zone) => (
                  <Circle
                    key={zone.name}
                    center={[zone.lat, zone.lng]}
                    radius={zone.radius}
                    pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.12 }}
                  />
                ))}
                {state.bikes.map((bike) => (
                  <Marker key={bike.id} position={[bike.lat, bike.lng]} icon={getIcon(bike.status)}>
                    <Popup>
                      <div className="text-center">
                        <h3 className="font-bold">{bike.name}</h3>
                        <p className="text-xs">{bike.location}</p>
                        <p className="text-xs uppercase font-bold mt-2">{bike.status}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] font-extrabold text-slate-500">Fleet Snapshot</p>
                <h3 className="mt-2 text-lg font-extrabold text-slate-900">Live bike distribution</h3>
                <div className="mt-4 space-y-3">
                  <MapInsight label="Available" value={state.bikes.filter((bike) => bike.status === 'available').length} tone="emerald" />
                  <MapInsight label="In use" value={state.bikes.filter((bike) => bike.status === 'in-use').length} tone="sky" />
                  <MapInsight label="Maintenance" value={state.bikes.filter((bike) => bike.status === 'maintenance').length} tone="rose" />
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.22em] font-extrabold text-slate-500">Pickup Hubs</p>
                <div className="mt-3 space-y-3">
                  {PICKUP_POINTS.map((zone) => (
                    <div key={zone.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm font-extrabold text-slate-900">{zone.name}</p>
                      <p className="text-xs text-slate-500 mt-1">Radius {zone.radius} m</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="mx-auto grid w-full max-w-[1280px] gap-4 p-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:p-6">
            <div className="bg-white rounded-[28px] border border-slate-200 p-4 shadow-sm h-fit">
              <div className="flex items-center gap-2 mb-4">
                <PackagePlus size={18} className="text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Bike Inventory Management</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.id} onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))} placeholder="Bike ID" className="rounded-2xl bg-slate-100 px-3 py-3 text-sm focus:outline-none" />
                <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Bike name" className="rounded-2xl bg-slate-100 px-3 py-3 text-sm focus:outline-none" />
                <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value as BikeCategory }))} className="rounded-2xl bg-slate-100 px-3 py-3 text-sm focus:outline-none">
                  <option value="commuter">Commuter</option>
                  <option value="mountain">Mountain</option>
                  <option value="sports">Sports</option>
                  <option value="scooter">Scooter</option>
                  <option value="electric">Electric</option>
                </select>
                <input value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} placeholder="Day price" className="rounded-2xl bg-slate-100 px-3 py-3 text-sm focus:outline-none" />
              </div>
              <input value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} placeholder="Pickup point" className="mt-3 w-full rounded-2xl bg-slate-100 px-3 py-3 text-sm focus:outline-none" />
              <button onClick={handleAddBike} className="mt-3 w-full rounded-2xl bg-emerald-600 text-white font-extrabold py-3">
                Add inventory bike
              </button>
            </div>

            <div className="space-y-3">
              {state.bikes.map((bike) => (
                <div key={bike.id} className="bg-white rounded-[24px] border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{bike.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{bike.id} - {bike.location}</p>
                    </div>
                    <span className="text-xs font-extrabold text-slate-600">{formatCurrency(bike.dayPassPrice)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(['available', 'in-use', 'maintenance'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateBikeStatus(bike.id, status)}
                        className={`px-3 py-2 rounded-xl text-xs font-extrabold ${
                          bike.status === status ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                    {isAdmin && (
                      <button onClick={() => removeBike(bike.id)} className="ml-auto px-3 py-2 rounded-xl text-xs font-extrabold bg-rose-50 text-rose-600">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && isAdmin && (
          <div className="mx-auto grid w-full max-w-[1280px] gap-3 p-4 lg:grid-cols-2 lg:p-6">
            {['Rohan Patil', 'Priya Desai', 'Amit Kadam', 'Sneha Joshi'].map((name, index) => (
              <div key={name} className="bg-white rounded-[24px] border border-slate-200 p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500 mt-1">User ID U-{900 + index} - Active rider</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700">active</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
  compact,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: 'emerald' | 'sky' | 'amber' | 'rose';
  compact?: boolean;
}) {
  const toneMap = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className={`rounded-3xl p-4 ${toneMap[tone]}`}>
      <div className="mb-3">{icon}</div>
      <p className="text-[11px] uppercase tracking-[0.2em] font-extrabold">{label}</p>
      <p className={`font-extrabold text-slate-900 mt-2 ${compact ? 'text-sm' : 'text-xl'}`}>{value}</p>
    </div>
  );
}

function AnalyticsCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
      <p className="text-xs font-bold text-slate-500">{title}</p>
      <p className="text-lg font-extrabold text-slate-900 mt-2">{value}</p>
    </div>
  );
}

function MapInsight({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'sky' | 'rose' }) {
  const toneMap = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    rose: 'bg-rose-50 text-rose-700',
  };

  return (
    <div className={`rounded-2xl p-3 ${toneMap[tone]}`}>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
