import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { CookieConsentProvider } from '@/components/CookieConsent';

function TermsContent() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="mx-auto max-w-[740px] px-6 py-16">
        <a href="/" className="text-[13px] text-indigo-600 hover:text-indigo-800 mb-6 inline-block">&larr; Back to Home</a>
        <h1 className="text-[32px] font-extrabold text-gray-900 leading-tight">Terms of Service</h1>
        <p className="text-[13px] text-gray-400 mt-2">Last updated: June 2026</p>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-gray-700">
          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using menukits (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">2. Service Description</h2>
            <p>menukits provides a digital menu platform that allows restaurants to create, manage, and display interactive menus to their customers. Customers can browse menus, filter dishes by dietary preferences and allergens, and place orders.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">3. User Responsibilities</h2>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>You agree to use the Service in compliance with all applicable laws and regulations.</li>
              <li>You are responsible for verifying allergen and dietary information directly with the restaurant.</li>
              <li>You must not attempt to disrupt, hack, or misuse the Service in any way.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">4. Allergen Disclaimer</h2>
            <p><strong>IMPORTANT:</strong> While we strive to display accurate allergen and dietary information, we cannot guarantee its accuracy. The allergen and dietary information shown is provided by the restaurant. If you have severe allergies or dietary restrictions, please confirm directly with the restaurant staff before placing your order.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">5. Intellectual Property</h2>
            <p>All content, including menu items, images, descriptions, and logos, are the property of their respective owners (the restaurants). The menukits platform, its code, design, and branding are protected by intellectual property laws.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">6. Limitation of Liability</h2>
            <p>To the maximum extent permitted by applicable law, menukits shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to allergic reactions, incorrect orders, or service interruptions.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">7. Third-Party Links</h2>
            <p>The Service may contain links to third-party websites (such as social media profiles or Google Maps). We are not responsible for the content or privacy practices of these external sites.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">8. Modifications to Service</h2>
            <p>We reserve the right to modify, suspend, or discontinue the Service at any time, with or without notice. We shall not be liable for any such modifications.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">9. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of Germany. Any disputes shall be subject to the exclusive jurisdiction of the courts in Berlin, Germany.</p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">10. Contact</h2>
            <p>For questions about these Terms, please contact us at: <a href="mailto:legal@menukits.eu" className="text-indigo-600 underline">legal@menukits.eu</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function TermsOfServicePage() {
  return (
    <LanguageProvider>
      <CookieConsentProvider>
        <TermsContent />
      </CookieConsentProvider>
    </LanguageProvider>
  );
}
