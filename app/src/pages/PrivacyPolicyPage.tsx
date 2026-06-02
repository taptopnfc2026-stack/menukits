import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { CookieConsentProvider, ConsentContext } from '@/components/CookieConsent';

function PrivacyContent() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto max-w-[740px] px-6 py-16">
        <a href="/" className="text-[13px] text-indigo-600 hover:text-indigo-800 mb-6 inline-block">&larr; Back to Home</a>
        <h1 className="text-[32px] font-extrabold text-gray-900 leading-tight">Privacy Policy</h1>
        <p className="text-[13px] text-gray-400 mt-2">Last updated: June 2026</p>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-gray-700">
          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">1. Introduction</h2>
            <p>This Privacy Policy explains how menukits (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and protects your information when you use our digital menu service, accessible at this website (&ldquo;the Service&rdquo;).</p>
            <p className="mt-2">We are committed to protecting your privacy and ensuring compliance with the General Data Protection Regulation (GDPR) (EU) 2016/679 and applicable national data protection laws.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">2. Data Controller</h2>
            <p>The data controller responsible for processing your personal data is the restaurant operator using this Service. For specific data controller information, please refer to the Imprint page of the respective restaurant.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">3. What Data We Collect</h2>
            <p>We collect <strong>minimal</strong> data. Specifically:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Local Storage Data</strong>: Your language preferences, menu browsing history, and shopping cart items are stored locally in your browser&apos;s localStorage.</li>
              <li><strong>Menu Content</strong>: Menu items, descriptions, prices, and images are loaded from our servers to display the restaurant menu.</li>
              <li><strong>No Personal Identification</strong>: We do not collect your name, email address, IP address (beyond standard server logs), phone number, or physical address.</li>
              <li><strong>No Cookies</strong>: We do not use HTTP cookies or tracking cookies.</li>
              <li><strong>No Third-Party Analytics</strong>: We do not use Google Analytics, Facebook Pixel, or any other third-party tracking services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">4. Legal Basis for Processing</h2>
            <p>Our processing of data is based on:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Legitimate Interest (Art. 6(1)(f) GDPR)</strong>: Technical storage necessary for the functioning of the digital menu service.</li>
              <li><strong>Consent (Art. 6(1)(a) GDPR)</strong>: Where applicable, you will be asked for consent before any non-essential data processing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">5. Data Storage and Retention</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>All preference data is stored <strong>exclusively in your browser&apos;s localStorage</strong> and never transmitted to our servers.</li>
              <li>Data is retained until you clear your browser data or use our &ldquo;Clear Local Data&rdquo; function.</li>
              <li>No data is stored on our servers beyond the menu content you are viewing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">6. Your Rights Under GDPR</h2>
            <p>As a data subject in the EU/EEA, you have the following rights:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Right of Access (Art. 15)</strong>: Request access to your personal data.</li>
              <li><strong>Right to Rectification (Art. 16)</strong>: Correct inaccurate personal data.</li>
              <li><strong>Right to Erasure (Art. 17)</strong>: Request deletion of your data (&ldquo;Right to be forgotten&rdquo;).</li>
              <li><strong>Right to Restrict Processing (Art. 18)</strong>: Limit how your data is used.</li>
              <li><strong>Right to Data Portability (Art. 20)</strong>: Receive your data in a structured format.</li>
              <li><strong>Right to Object (Art. 21)</strong>: Object to processing based on legitimate interest.</li>
              <li><strong>Right to Withdraw Consent (Art. 7(3))</strong>: Withdraw previously given consent at any time.</li>
              <li><strong>Right to Lodge a Complaint (Art. 77)</strong>: File a complaint with a supervisory authority.</li>
            </ul>
            <p className="mt-2">To exercise these rights, please contact the restaurant operator via the information provided in the Imprint. Since we store data exclusively in your browser, you can also exercise these rights by clearing your browser&apos;s localStorage directly.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">7. International Data Transfers</h2>
            <p>All personal data is stored locally in your browser. No personal data is transferred outside the EU/EEA. Menu content is served from servers located within the European Union.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">8. Children&apos;s Privacy</h2>
            <p>Our Service is not directed at children under the age of 16. We do not knowingly collect personal data from children.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">10. Contact</h2>
            <p>For any questions regarding this Privacy Policy or to exercise your data protection rights, please contact the restaurant operator. Contact details can be found on the Imprint page.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">11. Supervisory Authority</h2>
            <p>If you believe that your data protection rights have been violated, you have the right to lodge a complaint with the competent data protection supervisory authority in your EU member state.</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <LanguageProvider>
      <CookieConsentProvider>
        <PrivacyContent />
      </CookieConsentProvider>
    </LanguageProvider>
  );
}
