import type { Bike, BikeCategory, Booking } from '../types';

const CATEGORY_LABELS: Record<BikeCategory, string> = {
  mountain: 'Gear Bike',
  sports: 'Sports Bike',
  scooter: 'Scooter',
  retro: 'Cruiser',
  electric: 'EV Bike',
  commuter: 'Gear Bike',
};

const CATEGORY_DESCRIPTIONS: Record<BikeCategory, string> = {
  mountain:
    'A premium adventure-ready bike tuned for weekend climbs, rough roads, and longer terrain-focused escapes.',
  sports:
    'A performance-focused motorcycle built for fast city movement, sharp response, and a bold road presence.',
  scooter:
    'A lightweight urban ride designed for effortless commutes, quick errands, and all-weather practicality.',
  retro:
    'A timeless cruiser with relaxed ergonomics, rich road presence, and a comfortable ride for longer loops.',
  electric:
    'A quiet, tech-forward electric mobility option with instant torque, low running cost, and smooth city performance.',
  commuter:
    'A dependable everyday motorcycle built for balanced efficiency, accessible handling, and smart daily travel.',
};

const CATEGORY_SPECS: Record<BikeCategory, { engine: string; mileage: string; weight: string; group: string }> = {
  mountain: { engine: '249 cc', mileage: '28 kmpl', weight: '158 kg', group: 'Gear' },
  sports: { engine: '199.5 cc', mileage: '25 kmpl', weight: '155 kg', group: 'Sports' },
  scooter: { engine: '109.7 cc', mileage: '42 kmpl', weight: '106 kg', group: 'Scooter' },
  retro: { engine: '349 cc', mileage: '32 kmpl', weight: '195 kg', group: 'Cruiser' },
  electric: { engine: 'Electric', mileage: '80 km/charge', weight: '118 kg', group: 'Gear' },
  commuter: { engine: '149 cc', mileage: '48 kmpl', weight: '134 kg', group: 'Gear' },
};

export function getBikeCategoryLabel(category: BikeCategory) {
  return CATEGORY_LABELS[category];
}

export function getBikeDescription(bike: Bike) {
  return CATEGORY_DESCRIPTIONS[bike.category];
}

export function getBikeSpecs(bike: Bike) {
  return CATEGORY_SPECS[bike.category];
}

export function getBikeFilterGroup(category: BikeCategory) {
  switch (category) {
    case 'sports':
      return 'Sports';
    case 'retro':
      return 'Cruiser';
    case 'scooter':
      return 'Scooter';
    default:
      return 'Gear';
  }
}

export function getBookingTab(status: Booking['status']) {
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'upcoming';
}

export function getStatusLabel(status: Booking['status']) {
  if (status === 'active') return 'Ongoing';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getStatusClass(status: Booking['status']) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-700';
    case 'cancelled':
      return 'bg-rose-50 text-rose-600';
    case 'active':
      return 'bg-[#E8F6EC] text-[#14813B]';
    default:
      return 'bg-[#EDF6EE] text-[#1C8A43]';
  }
}
