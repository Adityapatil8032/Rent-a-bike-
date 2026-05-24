import type { ReactNode } from 'react';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Copy,
  CreditCard,
  FileText,
  Gift,
  LogOut,
  ReceiptIndianRupee,
  Settings,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerShell from '../components/CustomerShell';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../utils/format';

type ProfileSection =
  | 'paymentMethods'
  | 'paymentHistory'
  | 'documents'
  | 'refer'
  | 'notifications'
  | 'support'
  | 'settings';

const MENU_ITEMS: Array<{
  id: ProfileSection;
  label: string;
  icon: typeof CreditCard;
}> = [
  { id: 'paymentMethods', label: 'Payment Methods', icon: CreditCard },
  { id: 'paymentHistory', label: 'Payment History', icon: ReceiptIndianRupee },
  { id: 'documents', label: 'My Documents', icon: FileText },
  { id: 'refer', label: 'Refer & Earn', icon: Gift },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'support', label: 'Help & Support', icon: CircleHelp },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const TOP_UP_AMOUNTS = [200, 500, 1000];

export default function Account() {
  const navigate = useNavigate();
  const {
    state,
    auth: { logout },
    assistant: { setAIProvider },
    billing: { addWalletFunds },
    notifications: { addNotification, markNotificationsRead },
  } = useAppContext();
  const [activeSection, setActiveSection] = useState<ProfileSection | null>(null);
  const [copied, setCopied] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const activePlan = useMemo(
    () => state.subscriptions.find((plan) => plan.id === state.profile.activeSubscriptionId),
    [state.profile.activeSubscriptionId, state.subscriptions],
  );
  const unreadCount = state.notifications.filter((item) => item.unread).length;
  const referralCode = `${state.profile.name.split(' ')[0].toUpperCase()}24`;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openSection = (section: ProfileSection) => {
    setActiveSection(section);
    if (section === 'notifications') {
      markNotificationsRead();
    }
  };

  const closeSection = () => setActiveSection(null);

  const handleSupportRequest = (kind: 'support' | 'booking') => {
    addNotification({
      title: kind === 'support' ? 'Support ticket created' : 'Booking specialist requested',
      body:
        kind === 'support'
          ? 'Our support team will contact you shortly through the app.'
          : 'A booking specialist will help you choose the right ride.',
      type: kind === 'support' ? 'support' : 'booking',
    });
    setActiveSection('notifications');
  };

  const handleCopyReferral = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralCode);
      }
      setCopied(true);
      addNotification({
        title: 'Referral code copied',
        body: `${referralCode} is ready to share with friends.`,
        type: 'offer',
      });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      addNotification({
        title: 'Copy unavailable',
        body: 'Clipboard access is blocked on this device right now.',
        type: 'system',
      });
    }
  };

  return (
    <CustomerShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-[#121714]">Profile</h1>
          <button type="button" onClick={() => openSection('settings')} className="flex h-10 w-10 items-center justify-center rounded-full">
            <Settings size={18} />
          </button>
        </div>

        <div className="premium-soft p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ECEFEB] text-[24px] font-bold text-slate-400">
              {state.profile.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[18px] font-semibold text-[#121714]">{state.profile.name}</p>
              <p className="mt-1 text-sm text-slate-500">{state.profile.phone}</p>
              <button type="button" className="mt-2 text-sm font-medium text-[#1FA34A]">
                View Profile
              </button>
            </div>
          </div>
        </div>

        <div className="premium-soft overflow-hidden">
          {MENU_ITEMS.map(({ id, label, icon: Icon }, index) => (
            <button
              key={label}
              type="button"
              onClick={() => openSection(id)}
              className={`flex w-full items-center justify-between px-4 py-4 text-left ${
                index !== MENU_ITEMS.length - 1 ? 'border-b border-[#EEF1EC]' : ''
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700">
                  <Icon size={17} />
                </span>
                <span className="text-sm font-medium text-[#121714]">{label}</span>
              </span>
              <ChevronRight size={17} className="text-slate-300" />
            </button>
          ))}

          <button type="button" onClick={handleLogout} className="flex w-full items-center justify-between px-4 py-4 text-left">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-rose-500">
                <LogOut size={17} />
              </span>
              <span className="text-sm font-medium text-rose-500">Logout</span>
            </span>
            <ChevronRight size={17} className="text-rose-200" />
          </button>
        </div>
      </div>

      {activeSection && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/28 px-3 pb-3">
          <div className="w-full max-w-[420px] rounded-[28px] bg-white p-4 shadow-[0_20px_40px_rgba(18,23,20,0.18)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#121714]">{sectionTitle(activeSection)}</h2>
              <button type="button" onClick={closeSection} className="text-sm font-medium text-slate-400">
                Close
              </button>
            </div>

            {activeSection === 'paymentMethods' && (
              <div className="space-y-4">
                <div className="rounded-[20px] bg-[#F8FAF8] p-4">
                  <p className="text-sm font-semibold text-[#121714]">Wallet Balance</p>
                  <p className="mt-2 text-xl font-bold text-[#1FA34A]">{formatCurrency(state.profile.walletBalance)}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {TOP_UP_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => addWalletFunds(amount)}
                      className="rounded-[16px] bg-[#EAF8EE] px-3 py-3 text-sm font-semibold text-[#121714]"
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'paymentHistory' && (
              <div className="space-y-3">
                {state.payments.map((payment) => (
                  <div key={payment.id} className="rounded-[18px] border border-[#EEF1EC] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#121714]">{payment.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{payment.date} via {payment.method}</p>
                      </div>
                      <p className="text-sm font-bold text-[#121714]">{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'documents' && (
              <div className="space-y-3">
                <DocumentRow icon={<ShieldCheck size={16} />} title="Driving License" status="Verified" tone="good" />
                <DocumentRow icon={<ShieldCheck size={16} />} title="Government ID" status="Verified" tone="good" />
                <DocumentRow icon={<FileText size={16} />} title="Address Proof" status="Upload pending" tone="pending" />
              </div>
            )}

            {activeSection === 'refer' && (
              <div className="space-y-4">
                <div className="rounded-[20px] bg-[#EAF8EE] p-4">
                  <p className="text-sm font-semibold text-[#121714]">Your referral code</p>
                  <p className="mt-2 text-2xl font-extrabold tracking-[0.1em] text-[#1FA34A]">{referralCode}</p>
                  <p className="mt-2 text-xs text-slate-500">Earn 150 wallet credit for each successful referral.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopyReferral()}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#1E8D3F] px-4 py-3 text-sm font-semibold text-white"
                >
                  <Copy size={15} />
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">{unreadCount} unread</p>
                  <button type="button" onClick={markNotificationsRead} className="text-xs font-medium text-[#1FA34A]">
                    Mark all read
                  </button>
                </div>
                {state.notifications.map((item) => (
                  <div key={item.id} className="rounded-[18px] border border-[#EEF1EC] p-3">
                    <p className="text-sm font-semibold text-[#121714]">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'support' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleSupportRequest('support')}
                  className="flex w-full items-center justify-between rounded-[18px] border border-[#EEF1EC] px-4 py-4 text-left"
                >
                  <span>
                    <span className="block text-sm font-semibold text-[#121714]">Contact Support</span>
                    <span className="mt-1 block text-xs text-slate-500">Create an in-app support request</span>
                  </span>
                  <ChevronRight size={17} className="text-slate-300" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSupportRequest('booking')}
                  className="flex w-full items-center justify-between rounded-[18px] border border-[#EEF1EC] px-4 py-4 text-left"
                >
                  <span>
                    <span className="block text-sm font-semibold text-[#121714]">Need Booking Help</span>
                    <span className="mt-1 block text-xs text-slate-500">Ask a specialist to help pick the right ride</span>
                  </span>
                  <ChevronRight size={17} className="text-slate-300" />
                </button>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">AI Provider</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(['local', 'gemini', 'openai'] as const).map((provider) => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => setAIProvider(provider)}
                        className={`rounded-[14px] px-3 py-3 text-xs font-medium capitalize ${
                          state.aiProvider === provider ? 'bg-[#EAF8EE] text-[#1FA34A]' : 'bg-[#F6F8F5] text-slate-500'
                        }`}
                      >
                        {provider}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-[18px] border border-[#EEF1EC] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#121714]">Push Notifications</p>
                      <p className="mt-1 text-xs text-slate-500">Receive booking reminders and offer alerts</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsEnabled((prev) => !prev)}
                      className={`relative h-7 w-12 rounded-full ${notificationsEnabled ? 'bg-[#1FA34A]' : 'bg-slate-200'}`}
                    >
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${notificationsEnabled ? 'left-6' : 'left-1'}`}></span>
                    </button>
                  </div>
                </div>
                <div className="rounded-[18px] bg-[#F8FAF8] p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#1FA34A]">
                      <Sparkles size={16} />
                    </span>
                    <p className="text-xs leading-5 text-slate-500">Active plan: {activePlan?.name || 'No active plan'}.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </CustomerShell>
  );
}

function sectionTitle(section: ProfileSection) {
  switch (section) {
    case 'paymentMethods':
      return 'Payment Methods';
    case 'paymentHistory':
      return 'Payment History';
    case 'documents':
      return 'My Documents';
    case 'refer':
      return 'Refer & Earn';
    case 'notifications':
      return 'Notifications';
    case 'support':
      return 'Help & Support';
    default:
      return 'Settings';
  }
}

function DocumentRow({
  icon,
  title,
  status,
  tone,
}: {
  icon: ReactNode;
  title: string;
  status: string;
  tone: 'good' | 'pending';
}) {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-[#EEF1EC] p-3">
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${tone === 'good' ? 'bg-[#EAF8EE] text-[#1FA34A]' : 'bg-amber-50 text-amber-600'}`}>
          {icon}
        </span>
        <p className="text-sm font-medium text-[#121714]">{title}</p>
      </div>
      <span className={`text-xs font-medium ${tone === 'good' ? 'text-[#1FA34A]' : 'text-amber-600'}`}>{status}</span>
    </div>
  );
}
