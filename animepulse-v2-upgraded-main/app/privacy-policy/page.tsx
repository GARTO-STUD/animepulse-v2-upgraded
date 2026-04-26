import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | AnimePulse',
  description: 'Privacy Policy for AnimePulse. Learn how we protect your data.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-[#8892a4] mb-8">Last updated: March 2025</p>

        <div className="prose prose-invert max-w-none">
          <p className="text-[#8892a4] mb-6">
            At AnimePulse, we take your privacy seriously. This Privacy Policy explains how we 
            collect, use, and protect your personal information when you use our website.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
          <p className="text-[#8892a4] mb-4">We may collect the following types of information:</p>
          <ul className="list-disc list-inside text-[#8892a4] mb-6 space-y-2">
            <li><strong>Personal Information:</strong> Email address when you subscribe to our newsletter</li>
            <li><strong>Usage Data:</strong> Pages visited, time spent on site, browser type</li>
            <li><strong>Cookies:</strong> Used for analytics and improving user experience</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-[#8892a4] mb-6 space-y-2">
            <li>To send you newsletters and updates (if subscribed)</li>
            <li>To analyze website traffic and improve our content</li>
            <li>To personalize your experience on our platform</li>
            <li>To respond to your inquiries and feedback</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Data Protection</h2>
          <p className="text-[#8892a4] mb-6">
            We implement appropriate security measures to protect your personal information 
            from unauthorized access, alteration, disclosure, or destruction. However, no 
            method of transmission over the internet is 100% secure.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Third-Party Services</h2>
          <p className="text-[#8892a4] mb-6">
            We may use third-party services such as Google Analytics to understand website 
            usage. These services may collect information as governed by their own privacy policies.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Your Rights</h2>
          <p className="text-[#8892a4] mb-4">You have the right to:</p>
          <ul className="list-disc list-inside text-[#8892a4] mb-6 space-y-2">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal data</li>
            <li>Unsubscribe from our newsletter at any time</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Children&apos;s Privacy</h2>
          <p className="text-[#8892a4] mb-6">
            Our website is not intended for children under 13. We do not knowingly collect 
            personal information from children under 13.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Changes to This Policy</h2>
          <p className="text-[#8892a4] mb-6">
            We may update our Privacy Policy from time to time. We will notify you of any 
            changes by posting the new Privacy Policy on this page.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Contact Us</h2>
          <p className="text-[#8892a4] mb-4">
            If you have any questions about this Privacy Policy, please contact us at:
            <br />
            <a href="mailto:privacy@animepulse.com" className="text-indigo-400 hover:text-indigo-300">
              privacy@animepulse.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
