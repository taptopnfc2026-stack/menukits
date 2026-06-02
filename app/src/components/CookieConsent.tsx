import { useState, useEffect } from 'react';
import { Shield, X, Trash2 } from 'lucide-react';

type ConsentLevel = 'essential' | 'all' | 'none';
interface CookieConsentData {
  consented: boolean;
  level: ConsentLevel;
  timestamp: number;
}

const STORAGE_KEY = 'menukits-cookie-consent';

function getStoredConsent(): CookieConsentData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data: CookieConsentData = JSON.parse(raw);
      if (data.consented && Date.now() - data.timestamp < 365 * 24 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch { /* ignore */ }
  return null;
}

function storeConsent(level: ConsentLevel) {
  const data: CookieConsentData = {
    consented: true,
    level,
    timestamp: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

/** Check if a given consent level implies at least the required level */
function hasConsent(stored: ConsentLevel, required: ConsentLevel): boolean {
  if (required === 'essential') return stored !== 'none';
  if (required === 'all') return stored === 'all';
  return true;
}

// Create context to share consent state
import { createContext, useContext } from 'react';

interface ConsentContextValue {
  consent: CookieConsentData | null;
  hasConsent: (level: ConsentLevel) => boolean;
  showSettings: () => void;
}

export const ConsentContext = createContext<ConsentContextValue>({
  consent: null,
  hasConsent: () => false,
  showSettings: () => {},
});

export function useConsent() {
  return useContext(ConsentContext);
}

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsentData | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      // Small delay to avoid CLS on initial render
      const timer = setTimeout(() => setShowBanner(true), 800);
      setConsent({ consented: false, level: 'essential', timestamp: Date.now() });
      return () => clearTimeout(timer);
    }
    setConsent(stored);
  }, []);

  const handleAcceptAll = () => {
    storeConsent('all');
    const data = { consented: true, level: 'all' as ConsentLevel, timestamp: Date.now() };
    setConsent(data);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleAcceptEssential = () => {
    storeConsent('essential');
    const data = { consented: true, level: 'essential' as ConsentLevel, timestamp: Date.now() };
    setConsent(data);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleReject = () => {
    storeConsent('none');
    const data = { consented: true, level: 'none' as ConsentLevel, timestamp: Date.now() };
    setConsent(data);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleClearAllData = () => {
    try {
      // Clear all known localStorage keys
      const keys = [
        'menukits-menus',
        'menukits-checklist',
        'menukits-ui-lang',
        'menukits-cookie-consent',
      ];
      keys.forEach((key) => localStorage.removeItem(key));
      // Reset consent state to trigger re-consent
      setConsent(null);
      setShowSettings(false);
      // Show banner after clearing
      setTimeout(() => setShowBanner(true), 500);
    } catch { /* ignore */ }
  };

  const checkConsent = (level: ConsentLevel): boolean => {
    if (!consent) return false;
    return hasConsent(consent.level, level);
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  return (
    <ConsentContext.Provider
      value={{
        consent,
        hasConsent: checkConsent,
        showSettings: openSettings,
      }}
    >
      {children}

      {/* Consent Banner */}
      {showBanner && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-up p-4"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
        >
          <div className="mx-auto max-w-[460px] rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <Shield className="h-5 w-5 shrink-0 mt-0.5 text-indigo-600" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-bold text-gray-900">Cookie Consent</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
                    We use local storage to save your preferences and menu data. No personal data is collected or shared with third parties.
                    By clicking &ldquo;Accept All&rdquo;, you consent to the use of essential technical storage.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[13px] font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptEssential}
                  className="flex-1 rounded-xl border border-gray-800 py-2.5 text-[13px] font-medium text-gray-800 hover:bg-gray-50 transition-colors"
                >
                  Essentials Only
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-[13px] font-semibold text-white hover:bg-indigo-700 transition-colors shadow-md"
                >
                  Accept All
                </button>
              </div>
              <div className="mt-3 flex gap-4 text-[11px]">
                <a href="/privacy" className="text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors">
                  Privacy Policy
                </a>
                <a href="/cookies" className="text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors">
                  Cookie Policy
                </a>
                <a href="/imprint" className="text-gray-400 underline underline-offset-2 hover:text-gray-600 transition-colors">
                  Imprint
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal */}
      {showSettings && consent && (
        <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <div className="relative w-full max-w-[460px] animate-slide-up rounded-t-3xl bg-white sm:rounded-3xl sm:m-4">
            <div className="flex items-center justify-between pt-3 pb-1 px-6">
              <div className="flex justify-center grow">
                <div className="h-1 w-10 rounded-full bg-gray-300" />
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="absolute right-4 top-4 rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 pb-6 pt-3">
              <h3 className="text-[18px] font-bold text-gray-900 mb-1">Cookie Settings</h3>
              <p className="text-[13px] text-gray-500 mb-5 leading-relaxed">
                We use local storage for essential functionality only. No tracking cookies, analytics, or advertising cookies are used.
              </p>

              <div className="space-y-4">
                {/* Essential */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900">Essential Storage</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      Required for the website to function. Stores your language preference, menu data, and cart items.
                    </p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    <div className="h-6 w-10 rounded-full bg-indigo-600 flex items-center px-0.5 cursor-default">
                      <div className="h-5 w-5 rounded-full bg-white ml-auto" />
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900">Analytics & Tracking</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      We do not use Google Analytics or any third-party analytics tools. No tracking data is collected.
                    </p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    <div className="h-6 w-10 rounded-full bg-gray-200 flex items-center px-0.5 cursor-default">
                      <div className="h-5 w-5 rounded-full bg-white" />
                    </div>
                  </div>
                </div>

                {/* Marketing */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900">Marketing & Advertising</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">
                      We do not use any advertising or marketing cookies. Your data is never sold to third parties.
                    </p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    <div className="h-6 w-10 rounded-full bg-gray-200 flex items-center px-0.5 cursor-default">
                      <div className="h-5 w-5 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* GDPR Right to Erasure — clear all stored data */}
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-[12px] text-gray-400 mb-2 leading-relaxed">
                  Under GDPR Article 17, you have the right to request deletion of all locally stored data. Click below to clear all data stored in your browser.
                </p>
                <button
                  onClick={handleClearAllData}
                  className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All Local Data
                </button>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={handleReject}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[13px] font-medium text-gray-500 hover:bg-gray-50"
                >
                  Reject All
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 rounded-xl bg-black py-2.5 text-[13px] font-semibold text-white hover:bg-gray-800"
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConsentContext.Provider>
  );
}
