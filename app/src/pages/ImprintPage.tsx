import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { CookieConsentProvider } from '@/components/CookieConsent';

function ImprintContent() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto max-w-[740px] px-6 py-16">
        <a href="/" className="text-[13px] text-indigo-600 hover:text-indigo-800 mb-6 inline-block">&larr; Back to Home</a>
        <h1 className="text-[32px] font-extrabold text-gray-900 leading-tight">Imprint / Impressum</h1>
        <p className="text-[13px] text-gray-400 mt-2">Information required under § 5 TMG (Germany) and § 25 MedienG (Austria)</p>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-gray-700">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-[16px] font-bold text-gray-900">menukits</p>
            <p className="text-[14px] text-gray-600 mt-3">
              This is a digital menu platform. The legal entity responsible for this website and its content is:
            </p>
            <div className="mt-4 space-y-1.5 text-[14px] text-gray-700">
              <p><strong>Email:</strong> <a href="mailto:contact@menukits.eu" className="text-indigo-600 underline">contact@menukits.eu</a></p>
              <p><strong>Website:</strong> <a href="https://menukits.eu" className="text-indigo-600 underline">menukits.eu</a></p>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-[13px] text-amber-800 leading-relaxed">
                  <strong>Note:</strong> This is a template imprint. As the website operator, you are legally required (under German § 5 TMG) to provide your full name, physical address, and valid contact information. Please update this page with your actual details before going live. Failure to provide a valid imprint may result in legal penalties (Abmahnung).
                </p>
              </div>
            </div>
          </div>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">Responsible for Content (§ 18 Abs. 2 MStV)</h2>
            <p>Please update with your full name and address as the content-responsible person.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">EU Dispute Resolution</h2>
            <p>The European Commission provides a platform for online dispute resolution (OS): <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">https://ec.europa.eu/consumers/odr/</a></p>
            <p className="mt-2">We are not willing or obligated to participate in dispute resolution proceedings before a consumer arbitration board.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">Liability for Content</h2>
            <p>As a service provider, we are responsible for our own content on these pages in accordance with general legislation (§ 7 Abs. 1 TMG). However, we are not obliged to monitor transmitted or stored third-party information or to investigate circumstances that indicate illegal activity (§§ 8-10 TMG).</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">Liability for Links</h2>
            <p>Our website contains links to external third-party websites over whose content we have no influence. Therefore, we cannot assume any liability for these external contents. The respective provider or operator of the linked websites is always responsible for their content.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">Copyright</h2>
            <p>The content and works created by the site operators on these pages are subject to copyright law. Reproduction, editing, distribution, and any kind of exploitation outside the limits of copyright require the written consent of the respective author or creator.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">Data Protection</h2>
            <p>For information on how we handle personal data, please see our <a href="/privacy" className="text-indigo-600 underline">Privacy Policy</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function ImprintPage() {
  return (
    <LanguageProvider>
      <CookieConsentProvider>
        <ImprintContent />
      </CookieConsentProvider>
    </LanguageProvider>
  );
}
