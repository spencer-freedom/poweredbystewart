import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | Powered by Stewart",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stewart-bg text-stewart-text">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-stewart-muted hover:text-stewart-text mb-8 inline-block">&larr; Back to Home</Link>

        <h1 className="text-3xl font-bold mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-stewart-muted mb-10">Last updated: March 28, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-stewart-muted">
          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">1. Agreement to Terms</h2>
            <p>By accessing or using the Powered by Stewart platform and related services (&ldquo;Services&rdquo;), operated by Get Thrifty Provo L.L.C. (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to be bound by these Terms &amp; Conditions. If you do not agree, do not use the Services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">2. Description of Services</h2>
            <p>Powered by Stewart provides business communications tools including:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
              <li>SMS and voice communications via Twilio</li>
              <li>Email marketing campaigns via Amazon SES</li>
              <li>Customer reputation management and feedback collection</li>
              <li>Points-based customer loyalty programs</li>
              <li>Business analytics dashboards</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">3. SMS Terms</h2>
            <p className="mb-3">By providing your phone number to a business using our platform, you consent to receive text messages as described below:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-stewart-text">Message types:</strong> Order updates, pickup reminders, feedback requests, loyalty notifications, and responses to your inquiries.</li>
              <li><strong className="text-stewart-text">Frequency:</strong> Message frequency varies based on your interactions with the business.</li>
              <li><strong className="text-stewart-text">Opt-out:</strong> Text STOP to any message to stop receiving messages. You will receive a confirmation message and no further messages will be sent.</li>
              <li><strong className="text-stewart-text">Help:</strong> Text HELP to any message for assistance.</li>
              <li><strong className="text-stewart-text">Costs:</strong> Message and data rates may apply depending on your mobile carrier plan.</li>
              <li><strong className="text-stewart-text">Carriers:</strong> Supported carriers include AT&amp;T, T-Mobile, Verizon, and other major US carriers. Carriers are not liable for delayed or undelivered messages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">4. Business Account Terms</h2>
            <p>If you are a business using our platform:</p>
            <ul className="list-disc list-inside space-y-2 ml-2 mt-3">
              <li>You are responsible for obtaining proper consent from your customers before sending messages through our platform.</li>
              <li>You must comply with all applicable laws including the Telephone Consumer Protection Act (TCPA), CAN-SPAM Act, and state privacy regulations.</li>
              <li>You must not use the Services to send unsolicited messages, spam, or content that is illegal, harmful, or deceptive.</li>
              <li>You are responsible for the accuracy of customer data you provide to the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">5. Loyalty Program Terms</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Points are earned based on qualifying purchases as defined by each participating business.</li>
              <li>Points have no cash value and cannot be transferred between customers or businesses.</li>
              <li>Rewards are issued as store credit and are subject to expiration as defined by the issuing business.</li>
              <li>We reserve the right to adjust point balances in cases of fraud, system errors, or returned purchases.</li>
              <li>Participating businesses may modify their loyalty program terms with reasonable notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">6. Intellectual Property</h2>
            <p>The Services, including all software, design, text, and other content, are owned by Get Thrifty Provo L.L.C. and are protected by copyright and other intellectual property laws. You may not copy, modify, distribute, or reverse-engineer any part of the Services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, we are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Services. Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">8. Disclaimer of Warranties</h2>
            <p>The Services are provided &ldquo;as is&rdquo; without warranties of any kind, express or implied. We do not guarantee that messages will be delivered, that the Services will be uninterrupted, or that loyalty points or rewards will be available at all times.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">9. Modifications</h2>
            <p>We may update these Terms at any time by posting the revised version on this page. Your continued use of the Services after changes constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">10. Governing Law</h2>
            <p>These Terms are governed by the laws of the State of Utah. Any disputes shall be resolved in the courts of Utah County, Utah.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">11. Contact Us</h2>
            <p>If you have questions about these Terms, contact us at:</p>
            <p className="mt-2">Get Thrifty Provo L.L.C.<br />Email: manager@getthriftyprovo.com</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-stewart-border">
          <Link href="/" className="text-sm text-stewart-muted hover:text-stewart-text">&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
