import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { CookieConsentProvider } from '@/components/CookieConsent';

function CookiePolicyContent() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto max-w-[740px] px-6 py-16">
        <a href="/" className="text-[13px] text-indigo-600 hover:text-indigo-800 mb-6 inline-block">&larr; Back to Home</a>
        <h1 className="text-[32px] font-extrabold text-gray-900 leading-tight">Cookie Policy</h1>
        <p className="text-[13px] text-gray-400 mt-2">Last updated: June 2026</p>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-gray-700">
          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">1. What Are Cookies?</h2>
            <p>Cookies are small text files stored on your device by websites you visit. They can be used to remember preferences, enable functionality, or track user behavior.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">2. Our Use of Cookies & Local Storage</h2>
            <p><strong>We do not use HTTP cookies or tracking cookies.</strong> menukits does not employ any third-party tracking, analytics, or advertising cookies.</p>
            <p className="mt-2">We use <strong>browser localStorage</strong> (not cookies) for the following essential purposes only:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Language Preference</strong>: Remembering your preferred interface language.</li>
              <li><strong>Menu Data</strong>: Storing menu configurations created by restaurant operators.</li>
              <li><strong>Cart Items</strong>: Temporarily storing your order while browsing the menu.</li>
              <li><strong>Cookie Consent</strong>: Remembering your consent preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">3. Categories of Storage Used</h2>
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-[15px] font-bold text-gray-900">Essential Storage</p>
                <p className="text-[13px] text-gray-600 mt-1">Required for the basic functionality of the digital menu. Without this storage, the menu display, language preferences, and ordering features would not work. These are exempt from consent requirements under the ePrivacy Directive.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-[15px] font-bold text-gray-900">Analytics & Tracking — <span className="text-green-600">Not Used</span></p>
                <p className="text-[13px] text-gray-600 mt-1">We do not use Google Analytics, Facebook Pixel, Hotjar, or any other analytics or tracking services that would set cookies or collect personal data.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-[15px] font-bold text-gray-900">Marketing & Advertising — <span className="text-green-600">Not Used</span></p>
                <p className="text-[13px] text-gray-600 mt-1">We do not use any advertising cookies, retargeting pixels, or marketing trackers. Your browsing behavior is never tracked across websites.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">4. Third-Party Services</h2>
            <p>Our Service does not integrate any third-party services that set cookies. All fonts are self-hosted, and no external CDN resources that could track users are loaded.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">5. How to Control Storage</h2>
            <p>You can control and delete localStorage data at any time:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Browser Settings</strong>: Clear your browser&apos;s site data/cache to remove all stored data.</li>
              <li><strong>For Chrome</strong>: Settings &rarr; Privacy and Security &rarr; Site Settings &rarr; View permissions and data stored across sites.</li>
              <li><strong>For Firefox</strong>: Preferences &rarr; Privacy & Security &rarr; Cookies and Site Data &rarr; Manage Data.</li>
              <li><strong>For Safari</strong>: Preferences &rarr; Privacy &rarr; Manage Website Data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">6. Cookie Declaration</h2>
            <p>This website uses <strong>zero cookies</strong>. All client-side storage is done via the Web Storage API (localStorage), which operates differently from HTTP cookies and is not transmitted to our servers with each request.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">7. Changes to This Policy</h2>
            <p>We may update this Cookie Policy from time to time. Any changes will be posted on this page.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">8. Contact</h2>
            <p>For questions about this Cookie Policy: <a href="mailto:legal@menukits.eu" className="text-indigo-600 underline">legal@menukits.eu</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function CookiePolicyPage() {
  return (
    <LanguageProvider>
      <CookieConsentProvider>
        <CookiePolicyContent />
      </CookieConsentProvider>
    </LanguageProvider>
  );
}
