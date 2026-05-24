import { FALLBACK_WEATHER } from '../data/mockData';
import type { Coordinate, WeatherSnapshot } from '../types';

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: 'Clear',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Cloudy',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  80: 'Rain showers',
  95: 'Thunderstorm',
};

function buildRecommendation(condition: string): WeatherSnapshot['recommendation'] {
  const lower = condition.toLowerCase();
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('storm')) {
    return 'Wet roads detected. Scooters and commuter bikes with shorter routes are the safest match today.';
  }
  if (lower.includes('clear')) {
    return 'Clear skies make this a good day for sports bikes or scenic heritage rides.';
  }
  if (lower.includes('cloud')) {
    return 'Cloud cover is ideal for comfort rides. Electric and mountain bikes are both good picks.';
  }
  return FALLBACK_WEATHER.recommendation;
}

function buildTone(condition: string): WeatherSnapshot['alertTone'] {
  const lower = condition.toLowerCase();
  if (lower.includes('rain') || lower.includes('storm')) return 'warning';
  if (lower.includes('clear')) return 'good';
  return 'info';
}

export async function getWeatherSnapshot(coords?: Coordinate): Promise<WeatherSnapshot> {
  if (!coords) return FALLBACK_WEATHER;

  try {
    const params = new URLSearchParams({
      latitude: coords.lat.toString(),
      longitude: coords.lng.toString(),
      current: 'temperature_2m,weather_code',
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Weather request failed');
    }

    const data = await response.json();
    const code = data?.current?.weather_code as number | undefined;
    const condition = WEATHER_CODE_LABELS[code ?? 3] ?? 'Cloudy';
    const temperatureC = Math.round(data?.current?.temperature_2m ?? FALLBACK_WEATHER.temperatureC);

    return {
      condition,
      temperatureC,
      recommendation: buildRecommendation(condition),
      alertTone: buildTone(condition),
    };
  } catch {
    return FALLBACK_WEATHER;
  }
}
