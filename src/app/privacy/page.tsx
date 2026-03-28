import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Powered by Stewart",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-stewart-bg text-stewart-text">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-stewart-muted hover:text-stewart-text mb-8 inline-block">&larr; Back to Home</Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-stewart-muted mb-10">Last updated: March 28, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-stewart-muted">
          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">1. Who We Are</h2>
            <p>Powered by Stewart is a business communications platform operated by Get Thrifty Provo L.L.C. (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). We provide SMS messaging, email marketing, reputation management, and customer loyalty services to businesses and their customers.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect information in the following ways:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-stewart-text">Information you provide:</strong> Name, phone number, and email address when you interact with a business using our platform (e.g., placing a special order, joining a loyalty program, or providing feedback).</li>
              <li><strong className="text-stewart-text">Transaction data:</strong> Purchase amounts and order references for the purpose of loyalty point tracking, provided by the business you transacted with.</li>
              <li><strong className="text-stewart-text">Communication data:</strong> SMS messages you send and receive through our platform, including feedback ratings and responses.</li>
              <li><strong className="text-stewart-text">Business account data:</strong> Business owners who use our platform provide account credentials, business information, and configuration preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>To send order status updates, pickup reminders, and shipping notifications on behalf of the business you transacted with.</li>
              <li>To send post-purchase feedback requests and route your responses appropriately.</li>
              <li>To track and notify you of loyalty points earned and rewards available.</li>
              <li>To respond to questions you initiate via SMS about store hours, order status, or other inquiries.</li>
              <li>To provide businesses with aggregated analytics about customer satisfaction and loyalty program performance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">4. How We Share Your Information</h2>
            <p className="mb-3">We do not sell your personal information. We share data only as follows:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li><strong className="text-stewart-text">With the business you transacted with:</strong> Your name, contact information, feedback, and loyalty data are shared with the business that serves you.</li>
              <li><strong className="text-stewart-text">Service providers:</strong> We use Twilio for SMS delivery, Amazon Web Services for email delivery, and Supabase for data storage. These providers process data on our behalf under contractual obligations.</li>
              <li><strong className="text-stewart-text">Legal requirements:</strong> We may disclose information if required by law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">5. SMS Messaging</h2>
            <p className="mb-3">By providing your phone number to a business using our platform, you consent to receive SMS messages related to your transaction. Message types include:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Order status updates and pickup reminders</li>
              <li>Post-purchase feedback requests</li>
              <li>Loyalty program notifications (points earned, rewards available)</li>
              <li>Responses to customer-initiated inquiries</li>
            </ul>
            <p className="mt-3"><strong className="text-stewart-text">Opt-out:</strong> Reply STOP to any message to unsubscribe. Reply HELP for assistance. Message frequency varies. Message and data rates may apply.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">6. Data Retention</h2>
            <p>We retain your information for as long as necessary to provide services and fulfill the purposes described in this policy. Reputation request data is retained for analytics purposes. You may request deletion of your data by contacting us.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">7. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your information, including encrypted database connections, access controls, and audit logging.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">8. Your Rights</h2>
            <p>You may request access to, correction of, or deletion of your personal information by contacting us at the email below. If you are a California resident, you have additional rights under the CCPA.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-stewart-text mb-3">9. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, contact us at:</p>
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
