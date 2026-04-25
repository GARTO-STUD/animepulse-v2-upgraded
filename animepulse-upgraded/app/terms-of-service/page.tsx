import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | AnimePulse',
  description: 'Terms of Service for AnimePulse. Read our terms and conditions.',
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
        <p className="text-[#8892a4] mb-8">Last updated: March 2025</p>

        <div className="prose prose-invert max-w-none">
          <p className="text-[#8892a4] mb-6">
            Welcome to AnimePulse. By accessing or using our website, you agree to be bound 
            by these Terms of Service. Please read them carefully.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="text-[#8892a4] mb-6">
            By accessing this website, you warrant that you are at least 13 years old or have 
            parental/guardian consent to use our services. If you do not agree with any part 
            of these terms, please do not use our website.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Use License</h2>
          <p className="text-[#8892a4] mb-6">
            We grant you a limited, non-exclusive, non-transferable license to access and use 
            AnimePulse for personal, non-commercial purposes. You may not:
          </p>
          <ul className="list-disc list-inside text-[#8892a4] mb-6 space-y-2">
            <li>Reproduce, duplicate, copy, or resell any portion of the website</li>
            <li>Use the content for commercial purposes without written consent</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with other users&apos; use of the website</li>
            <li>Use automated systems to access the website (bots, crawlers, etc.)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. User Conduct</h2>
          <p className="text-[#8892a4] mb-6">
            When using AnimePulse, you agree to:
          </p>
          <ul className="list-disc list-inside text-[#8892a4] mb-6 space-y-2">
            <li>Use the website only for lawful purposes</li>
            <li>Not post or transmit harmful, offensive, or illegal content</li>
            <li>Respect the intellectual property rights of others</li>
            <li>Not attempt to damage or disrupt the website</li>
            <li>Not impersonate any person or entity</li>
          </ul>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Content and Copyright</h2>
          <p className="text-[#8892a4] mb-6">
            All content on AnimePulse, including text, graphics, logos, and images, is the 
            property of AnimePulse or its content suppliers. Anime images and information are 
            used under fair use for informational and educational purposes. We respect the 
            rights of anime creators and publishers.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Third-Party Links</h2>
          <p className="text-[#8892a4] mb-6">
            Our website may contain links to third-party websites. We are not responsible for 
            the content, privacy practices, or terms of any third-party sites. We provide these 
            links for your convenience only.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">6. Disclaimer of Warranties</h2>
          <p className="text-[#8892a4] mb-6">
            AnimePulse is provided &ldquo;as is&rdquo; without any warranties, express or implied. We do 
            not guarantee that the website will be uninterrupted, secure, or error-free. 
            Content is provided for informational purposes only.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">7. Limitation of Liability</h2>
          <p className="text-[#8892a4] mb-6">
            AnimePulse and its team shall not be liable for any damages arising from the use 
            or inability to use the website. This includes direct, indirect, incidental, punitive, 
            and consequential damages.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">8. Indemnification</h2>
          <p className="text-[#8892a4] mb-6">
            You agree to indemnify and hold harmless AnimePulse, its team, and affiliates from 
            any claims, damages, or expenses arising from your use of the website or violation 
            of these terms.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">9. Termination</h2>
          <p className="text-[#8892a4] mb-6">
            We reserve the right to terminate or suspend access to our website without prior 
            notice for conduct that we believe violates these Terms of Service or is harmful 
            to other users.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">10. Governing Law</h2>
          <p className="text-[#8892a4] mb-6">
            These Terms shall be governed by and construed in accordance with the laws, 
            without regard to its conflict of law provisions.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">11. Changes to Terms</h2>
          <p className="text-[#8892a4] mb-6">
            We reserve the right to modify these Terms of Service at any time. Changes will 
            be effective immediately upon posting. Continued use of the website constitutes 
            acceptance of modified terms.
          </p>

          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">12. Contact Information</h2>
          <p className="text-[#8892a4] mb-4">
            If you have questions about these Terms of Service, please contact us at:
            <br />
            <a href="mailto:legal@animepulse.com" className="text-indigo-400 hover:text-indigo-300">
              legal@animepulse.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
