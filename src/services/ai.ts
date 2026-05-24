import type { AIProvider, Bike, BikeRecommendation } from '../types';

const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-5.5';
const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash';

interface AIResponse {
  summary: string;
  followUps: string[];
}

function clampScore(score: number) {
  return Math.max(0, Math.min(score, 100));
}

function inferPreferences(query: string) {
  const lower = query.toLowerCase();
  const budgetMatch = lower.match(/(?:under|below|within)\s*(?:rs\.?|₹)?\s*(\d{2,5})/i);
  const budget = budgetMatch ? Number(budgetMatch[1]) : undefined;

  return {
    budget,
    likesMountain: lower.includes('mountain') || lower.includes('trail') || lower.includes('hill'),
    likesSports: lower.includes('sport'),
    likesScooter: lower.includes('scooter') || lower.includes('rain'),
    likesRetro: lower.includes('retro') || lower.includes('heritage'),
    likesCommute: lower.includes('office') || lower.includes('college') || lower.includes('commute'),
    wantsLongTrip: lower.includes('trip') || lower.includes('tour') || lower.includes('long'),
  };
}

export function recommendBikes(query: string, bikes: Bike[]): BikeRecommendation[] {
  const prefs = inferPreferences(query);

  return bikes
    .filter((bike) => bike.status === 'available')
    .map((bike) => {
      let score = bike.rating * 12;
      const reasons: string[] = [];

      if (prefs.budget && bike.dayPassPrice <= prefs.budget) {
        score += 22;
        reasons.push(`fits your Rs.${prefs.budget} budget`);
      } else if (prefs.budget && bike.dayPassPrice > prefs.budget) {
        score -= 18;
      }

      if (prefs.likesMountain && bike.category === 'mountain') {
        score += 28;
        reasons.push('built for mountain and trail riding');
      }
      if (prefs.likesSports && bike.category === 'sports') {
        score += 24;
        reasons.push('matches a sport-focused ride style');
      }
      if (prefs.likesScooter && bike.category === 'scooter') {
        score += 24;
        reasons.push('good choice for wet-weather city travel');
      }
      if (prefs.likesRetro && bike.category === 'retro') {
        score += 18;
        reasons.push('best suited for relaxed heritage routes');
      }
      if (prefs.likesCommute && ['electric', 'commuter', 'scooter'].includes(bike.category)) {
        score += 20;
        reasons.push('optimized for practical daily commuting');
      }
      if (prefs.wantsLongTrip && bike.rangeKm >= 60) {
        score += 16;
        reasons.push('has enough range for a longer trip');
      }
      if (bike.battery >= 80) {
        score += 8;
        reasons.push('starts with a strong battery');
      }

      return {
        bikeId: bike.id,
        score: clampScore(score),
        reason: reasons[0] ?? 'balanced option with strong ratings',
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

async function callOpenAI(prompt: string) {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key) throw new Error('Missing OpenAI API key');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions:
        'You are a bike rental concierge. Reply with short practical recommendations, pricing help, support guidance, and trip suggestions for a bike rental app in India.',
      input: prompt,
    }),
  });

  if (!response.ok) {
    throw new Error('OpenAI request failed');
  }

  const data = await response.json();
  return (data.output_text as string | undefined)?.trim() || 'No response received.';
}

async function callGemini(prompt: string) {
  const key = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  if (!key) throw new Error('Missing Gemini API key');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text:
                  'You are a bike rental concierge for an Indian mobility app. Keep answers concise, helpful, and action-oriented.\n\n' +
                  prompt,
              },
            ],
          },
        ],
      }),
    },
  );

  if (!response.ok) {
    throw new Error('Gemini request failed');
  }

  const data = await response.json();
  return (
    data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || '').join(' ').trim() ||
    'No response received.'
  );
}

export async function generateAssistantReply(
  provider: AIProvider,
  prompt: string,
  bikes: Bike[],
): Promise<AIResponse> {
  const ranked = recommendBikes(prompt, bikes);
  const topBike = bikes.find((bike) => bike.id === ranked[0]?.bikeId);

  const localSummary = topBike
    ? `${topBike.name} is the best match right now because it ${ranked[0].reason}, has a ${topBike.rating.toFixed(1)} rating, and costs Rs.${topBike.dayPassPrice} for a day pass.`
    : 'I could not find an available bike match right now, but I can still help with pricing, support, or trip planning.';

  if (provider === 'local') {
    return {
      summary: localSummary,
      followUps: [
        'Need the cheapest option instead?',
        'Want a rainy-day recommendation?',
        'Ask for a pickup point near your location.',
      ],
    };
  }

  const liveContext = [
    `User prompt: ${prompt}`,
    `Available bikes: ${bikes
      .filter((bike) => bike.status === 'available')
      .map((bike) => `${bike.name} (${bike.category}, Rs.${bike.dayPassPrice}/day, rating ${bike.rating})`)
      .join('; ')}`,
    `Local heuristic suggestion: ${localSummary}`,
    'Answer in under 120 words and include one best bike plus one cheaper fallback if relevant.',
  ].join('\n');

  const summary = provider === 'openai' ? await callOpenAI(liveContext) : await callGemini(liveContext);

  return {
    summary,
    followUps: [
      'Help me with booking steps',
      'Compare pricing plans',
      'Suggest a weekend route',
    ],
  };
}
