'use client';

/**
 * components/Header.tsx
 * Upgraded header with search functionality + Admin link (hidden from public nav)
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Menu, X, Search, Flame, Shield } from 'lucide-react';

const navLinks = [
  { name: 'Home',     href: '/' },
  { name: 'News',     href: '/news' },
  { name: 'Trending', href: '/trending' },
  { name: 'Anime',    href: '/anime' },
  { name: 'Reviews',  href: '/reviews' },
];

export default function Header() {
  const [open, setOpen]           = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminHover, setAdminHover] = useState(false);
  const pathname = usePathname();
  const router   = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }

  // Secret admin access: logo long-press or triple-click
  const logoClickCount = useRef(0);
  const logoClickTimer = useRef<ReturnType<typeof setTimeout>>();
  function handleLogoClick() {
    logoClickCount.current++;
    clearTimeout(logoClickTimer.current);
    if (logoClickCount.current >= 3) {
      logoClickCount.current = 0;
      router.push('/admin');
    } else {
      logoClickTimer.current = setTimeout(() => {
        logoClickCount.current = 0;
      }, 800);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#1a2235] bg-[#080b14]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2 group select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e85d04] to-[#f48c06] flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <span
                className="text-xl font-black tracking-tight text-white group-hover:text-[#f48c06] transition-colors"
                style={{ fontFamily: 'var(--font-syne)' }}
              >
                Anime<span className="text-[#e85d04]">Pulse</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#e85d04]/10 text-[#e85d04] border border-[#e85d04]/20'
                      : 'text-[#8892a4] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-green-400">LIVE</span>
            </div>

            {/* Search button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className={`p-2 rounded-lg transition-all ${
                searchOpen
                  ? 'bg-[#e85d04]/10 text-[#e85d04]'
                  : 'text-[#8892a4] hover:text-white hover:bg-white/5'
              }`}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Admin icon — subtle, visible only on hover */}
            <div
              className="relative hidden md:block"
              onMouseEnter={() => setAdminHover(true)}
              onMouseLeave={() => setAdminHover(false)}
            >
              <Link
                href="/admin"
                className={`p-2 rounded-lg transition-all ${
                  adminHover
                    ? 'text-[#e85d04] bg-[#e85d04]/10'
                    : 'text-[#1a2235] hover:text-[#8892a4]'
                }`}
                aria-label="Admin"
              >
                <Shield className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-[#8892a4] hover:text-white hover:bg-white/5 rounded-lg transition-all"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="pb-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892a4]" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search anime, news, reviews..."
                className="w-full bg-[#0d1117] border border-[#1a2235] focus:border-[#e85d04]/50 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder-[#8892a4] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8892a4] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        )}

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden pb-4 border-t border-[#1a2235] pt-3 space-y-1">
            {navLinks.map((link) => {
              const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#e85d04]/10 text-[#e85d04]'
                      : 'text-[#8892a4] hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.name}
                </Link>
              );
            })}
            {/* Admin link in mobile (subtle) */}
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs text-[#1a2235] hover:text-[#8892a4] transition-colors"
              onClick={() => setOpen(false)}
            >
              <Shield className="w-3 h-3" />
              Admin
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
