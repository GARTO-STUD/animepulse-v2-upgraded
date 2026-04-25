'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

const CONTACT_EMAIL = 'asac.spy10@gmail.com';

const subjects = [
  { value: 'general',     label: 'General Inquiry' },
  { value: 'feedback',    label: 'Feedback & Suggestions' },
  { value: 'partnership', label: 'Partnership & Collaboration' },
  { value: 'technical',   label: 'Technical Support' },
  { value: 'content',     label: 'Content Request' },
  { value: 'bug',         label: 'Report a Bug' },
];

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!formData.name || !formData.email || !formData.subject || !formData.message) return;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[AnimePulse] ' + formData.subject)}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`
    )}`;
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  return (
    <div className="min-h-screen">

      {/* Header */}
      <div className="bg-[#0d1117] border-b border-[#1a2235] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-black text-white mb-3">Contact Us</h1>
          <p className="text-[#8892a4] text-lg max-w-xl mx-auto">
            Have a question, suggestion, or collaboration idea? We&apos;d love to hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Sidebar info */}
          <div className="space-y-5">
            {[
              { title: 'General Inquiries',      desc: 'Questions about AnimePulse, feedback, and general correspondence.' },
              { title: 'Content Suggestions',    desc: 'Want us to cover a specific anime, event, or topic? Let us know.' },
              { title: 'Technical Issues',       desc: 'Experiencing a bug or broken feature? Report it and we\'ll investigate.' },
              { title: 'Partnerships',           desc: 'Interested in collaborating? We welcome partnership proposals.' },
            ].map(({ title, desc }) => (
              <div key={title} className="p-5 rounded-2xl border border-[#1a2235] bg-[#0d1117]">
                <h3 className="text-white font-bold text-sm mb-1">{title}</h3>
                <p className="text-[#8892a4] text-xs leading-relaxed">{desc}</p>
              </div>
            ))}

            <div className="bg-gradient-to-br from-[#e85d04]/10 to-transparent border border-[#e85d04]/20 rounded-2xl p-5">
              <p className="text-[#8892a4] text-xs leading-relaxed">
                We typically respond within <span className="text-white font-semibold">24–48 hours</span> on business days.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-[#0d1117] border border-[#1a2235] rounded-2xl p-8">
            <h2 className="text-white text-xl font-black mb-6">Send a Message</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div>
                <label className="block text-sm font-semibold text-[#8892a4] mb-2">Your Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#080b14] border border-[#1a2235] focus:border-[#e85d04]/50 rounded-xl text-white placeholder-[#8892a4] outline-none transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#8892a4] mb-2">Your Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-[#080b14] border border-[#1a2235] focus:border-[#e85d04]/50 rounded-xl text-white placeholder-[#8892a4] outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-[#8892a4] mb-2">Subject</label>
              <select
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-3 bg-[#080b14] border border-[#1a2235] focus:border-[#e85d04]/50 rounded-xl text-white outline-none transition-colors text-sm"
              >
                <option value="">Select a topic...</option>
                {subjects.map(s => (
                  <option key={s.value} value={s.label}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#8892a4] mb-2">Message</label>
              <textarea
                rows={6}
                placeholder="Tell us what's on your mind..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-3 bg-[#080b14] border border-[#1a2235] focus:border-[#e85d04]/50 rounded-xl text-white placeholder-[#8892a4] outline-none transition-colors resize-none text-sm"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#e85d04] hover:bg-[#f48c06] text-white font-bold rounded-xl transition-all glow-orange"
            >
              <Send className="w-4 h-4" />
              {sent ? 'Opening your email app...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
