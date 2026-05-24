import { useState } from 'react';
import { LoaderCircle, Mic, Send } from 'lucide-react';
import { generateAssistantReply } from '../services/ai';
import { useAppContext } from '../context/AppContext';
import type { Bike } from '../types';

interface Props {
  bikes: Bike[];
  onBikeFocus?: (bikeId: string) => void;
}

const DEFAULT_PROMPT = 'I want bike for mountain trip under Rs.1000';

export default function AIConcierge({ bikes, onBikeFocus }: Props) {
  const {
    state,
  } = useAppContext();
  const [query, setQuery] = useState(DEFAULT_PROMPT);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async (text = query) => {
    setLoading(true);
    try {
      const result = await generateAssistantReply(state.aiProvider, text, bikes);
      setResponse(result.summary);
      const bestBike = bikes.find((bike) => result.summary.includes(bike.name)) || bikes[0];
      if (bestBike) onBikeFocus?.(bestBike.id);
    } catch (error) {
      setResponse(error instanceof Error ? error.message : 'The AI assistant is unavailable right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 rounded-[26px] border border-[#dfe3d7] bg-white/88 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask for the best bike, support, or trip idea"
            className="w-full bg-transparent text-sm text-[#213124] placeholder:text-[#78857a] focus:outline-none"
          />
        </div>
        <button
          type="button"
          className="w-16 rounded-[24px] border border-[#dfe3d7] bg-white/88 text-[#203022] flex items-center justify-center"
        >
          <Mic size={18} />
        </button>
      </div>

      <div className="rounded-[28px] bg-[#132716] px-4 py-4 text-white shadow-[0_10px_24px_rgba(19,39,22,0.18)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#b9c9b5] font-extrabold">AI assistant</p>
            <p className="text-sm text-white/78 mt-1 truncate">Booking help, pricing, support, and trip suggestions</p>
          </div>
          <button
            type="button"
            onClick={() => void handleAsk()}
            disabled={loading}
            className="w-11 h-11 rounded-[18px] bg-white text-[#132716] flex items-center justify-center font-extrabold disabled:opacity-60"
          >
            {loading ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      <div className="rounded-[30px] border border-[#dfe3d7] bg-[#f7f8f4] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#6f7f71] font-extrabold">Latest reply</p>
        <p className="text-[15px] leading-8 text-[#2b382c] mt-3">
          {response || 'Ask something like "I want bike for mountain trip under Rs.1000" to get a cleaner recommendation.'}
        </p>
      </div>
    </div>
  );
}
