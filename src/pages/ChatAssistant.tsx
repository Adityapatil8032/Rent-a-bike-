import { ArrowLeft, Bot, EllipsisVertical, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerShell from '../components/CustomerShell';
import { useAppContext } from '../context/AppContext';
import { generateAssistantReply, recommendBikes } from '../services/ai';
import { formatCurrency } from '../utils/format';

const SUGGESTED_PROMPTS = [
  'I want bike for mountain trip under 1000',
  'Best for long ride',
  'Scooter options',
  'Under 700',
];

export default function ChatAssistant() {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const [input, setInput] = useState('I want bike for mountain trip under 1000');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      role: 'assistant' as const,
      text: 'Great! For a mountain trip under 1000/day, I recommend these bikes:',
      recommendations: state.bikes.filter((bike) => bike.status === 'available').slice(0, 3).map((bike) => bike.id),
    },
  ]);

  const bikeMap = useMemo(() => Object.fromEntries(state.bikes.map((bike) => [bike.id, bike])), [state.bikes]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const prompt = text.trim();

    setMessages((prev) => [...prev, { id: `m-${Date.now()}`, role: 'user', text: prompt }]);
    setInput('');
    setLoading(true);

    try {
      const reply = await generateAssistantReply(state.aiProvider, prompt, state.bikes);
      const recommendations = recommendBikes(prompt, state.bikes).map((item) => item.bikeId);
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}-assistant`,
          role: 'assistant',
          text: reply.summary,
          recommendations,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}-assistant`,
          role: 'assistant',
          text: error instanceof Error ? error.message : 'The AI assistant is unavailable right now.',
          recommendations: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerShell>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col">
        <div className="grid grid-cols-[40px_1fr_40px] items-center">
          <button type="button" onClick={() => navigate('/home')} className="flex h-10 w-10 items-center justify-center rounded-full">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1FA34A] text-white">
              <Bot size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#121714]">AI Ride Assistant</h1>
              <p className="text-xs text-[#1FA34A]">Online</p>
            </div>
          </div>
          <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full">
            <EllipsisVertical size={18} />
          </button>
        </div>

        <div className="mt-4 flex flex-1 flex-col rounded-[26px] bg-white px-3 py-4 shadow-[0_12px_28px_rgba(15,20,17,0.05)]">
          <div className="hide-scrollbar flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-[18px] px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-[#E8F8EB] text-[#17351F]'
                    : 'bg-[#FAFBFA] text-slate-600 shadow-[0_8px_18px_rgba(15,20,17,0.04)]'
                }`}>
                  <p className="text-sm leading-7">{message.text}</p>
                  {message.recommendations && message.recommendations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.recommendations.slice(0, 3).map((bikeId) => {
                        const bike = bikeMap[bikeId];
                        if (!bike) return null;
                        return (
                          <div key={bike.id} className="flex items-center gap-3 rounded-[16px] bg-white p-2.5">
                            <img src={bike.image} alt={bike.name} className="h-12 w-12 rounded-[12px] object-cover" referrerPolicy="no-referrer" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#121714]">{bike.name}</p>
                              <p className="mt-1 text-sm font-semibold text-[#121714]">{formatCurrency(bike.dayPassPrice)} / day</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-[18px] bg-[#FAFBFA] px-4 py-3 text-sm text-slate-500">Thinking of the best rides for you...</div>
              </div>
            )}
          </div>

          <div className="hide-scrollbar mt-4 flex gap-2 overflow-x-auto">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void sendMessage(prompt)}
                className="whitespace-nowrap rounded-full border border-[#ECEFEC] bg-[#FBFCFB] px-4 py-2 text-xs font-medium text-slate-600"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type a message..."
              className="h-12 flex-1 rounded-full border border-[#ECEFEC] bg-[#FBFCFB] px-4 text-sm text-slate-700 outline-none"
            />
            <button
              type="button"
              onClick={() => void sendMessage(input)}
              disabled={loading}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1FA34A] text-white disabled:opacity-60"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}
