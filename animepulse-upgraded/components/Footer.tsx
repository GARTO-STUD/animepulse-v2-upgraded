import Link from 'next/link';
import { Flame, Twitter, Youtube, Instagram } from 'lucide-react';

const links = {
  explore: [
    { name: 'Latest News',  href: '/news' },
    { name: 'Trending Anime', href: '/trending' },
    { name: 'Top 10 List',  href: '/top-10' },
    { name: 'Reviews',      href: '/reviews' },
    { name: 'Blog',         href: '/blog' },
  ],
  company: [
    { name: 'About Us',       href: '/about-us' },
    { name: 'Contact',        href: '/contact-us' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
    { name: 'Terms of Service', href: '/terms-of-service' },
  ],
};

const socials = [
  { icon: Twitter,   href: 'https://twitter.com/animepulse',   label: 'Twitter' },
  { icon: Youtube,   href: 'https://youtube.com/animepulse',   label: 'YouTube' },
  { icon: Instagram, href: 'https://instagram.com/animepulse', label: 'Instagram' },
];

export default function Footer() {
  return (
    <footer className="bg-[#080b14] border-t border-[#1a2235] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e85d04] to-[#f48c06] flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black text-white">Anime<span className="text-[#e85d04]">Pulse</span></span>
            </Link>
            <p className="text-[#8892a4] text-sm leading-relaxed max-w-sm mb-6">
              Your #1 source for anime news, trending shows, and honest reviews. Your trusted source for the latest anime news and reviews.
            </p>
            <div className="flex items-center gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-[#0d1117] border border-[#1a2235] flex items-center justify-center text-[#8892a4] hover:text-[#e85d04] hover:border-[#e85d04]/30 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Explore</h4>
            <ul className="space-y-2.5">
              {links.explore.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-[#8892a4] text-sm hover:text-[#e85d04] transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5">
              {links.company.map((l) => (
                <li key={l.name}>
                  <Link href={l.href} className="text-[#8892a4] text-sm hover:text-[#e85d04] transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#1a2235] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#8892a4] text-xs">
            © {new Date().getFullYear()} AnimePulse. All rights reserved.
          </p>
          
        </div>
      </div>
    </footer>
  );
}
