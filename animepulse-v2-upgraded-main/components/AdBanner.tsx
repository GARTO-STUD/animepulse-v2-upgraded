/**
 * components/AdBanner.tsx
 * AdSense-ready ad placeholder.
 * 
 * Usage:
 *   <AdBanner slot="XXXXXXXXXX" format="horizontal" className="my-6" />
 *   <AdBanner slot="XXXXXXXXXX" format="rectangle" sticky />
 *
 * In production:
 *   - Replace PLACEHOLDER with your actual AdSense publisher ID
 *   - Set NEXT_PUBLIC_ADSENSE_CLIENT in .env
 *   - Uncomment the <script> in layout.tsx and the ins element here
 */
'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
  slot?: string;
  format?: 'horizontal' | 'vertical' | 'rectangle' | 'auto';
  className?: string;
  sticky?: boolean;
  label?: string;
}

// Detect if AdSense is loaded and approved
declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdBanner({
  format = 'horizontal',
  className = '',
  sticky = false,
  label = 'Advertisement',
}: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  const sizeMap = {
    horizontal: { width: '100%', minHeight: '90px', aspect: '728/90' },
    rectangle:  { width: '300px', minHeight: '250px', aspect: '300/250' },
    vertical:   { width: '160px', minHeight: '600px', aspect: '160/600' },
    auto:       { width: '100%', minHeight: '100px', aspect: 'auto' },
  };

  const size = sizeMap[format];

  useEffect(() => {
    // Only push ads if AdSense is loaded and client is configured
    if (adsenseClient && typeof window !== 'undefined' && window.adsbygoogle) {
      try {
        window.adsbygoogle.push({});
      } catch { /**/ }
    }
  }, [adsenseClient]);

  // Placeholder shown when AdSense not configured or in development
  if (!adsenseClient) {
    return (
      <div
        className={`relative overflow-hidden ${sticky ? 'sticky top-20' : ''} ${className}`}
        style={{ width: size.width, minHeight: size.minHeight }}
        ref={adRef}
      >
        <div className="absolute inset-0 bg-[#0d1117] border border-dashed border-[#1a2235] rounded-xl flex flex-col items-center justify-center gap-2">
          <div className="text-xs text-[#8892a4]/50 font-medium uppercase tracking-widest">{label}</div>
          <div className="text-xs text-[#8892a4]/30">
            {format === 'horizontal' ? '728×90' : format === 'rectangle' ? '300×250' : format}
          </div>
        </div>
      </div>
    );
  }

  // Real AdSense unit
  return (
    <div
      className={`relative ${sticky ? 'sticky top-20' : ''} ${className}`}
      style={{ width: size.width }}
      ref={adRef}
    >
      <div className="text-xs text-[#8892a4]/40 text-center mb-1 uppercase tracking-widest">
        {label}
      </div>
      {/* 
        Uncomment and configure when AdSense is approved:
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adsenseClient}
          data-ad-slot={slot}
          data-ad-format={format === 'auto' ? 'auto' : undefined}
          data-full-width-responsive={format === 'auto' ? 'true' : undefined}
        />
      */}
      <div
        className="bg-[#0d1117] border border-dashed border-[#1a2235] rounded-xl flex items-center justify-center"
        style={{ minHeight: size.minHeight }}
      >
        <span className="text-xs text-[#8892a4]/30">Ad Space</span>
      </div>
    </div>
  );
}

/**
 * In-article affiliate link component.
 * Wraps relevant anchor text with affiliate tracking.
 */
export function AffiliateLink({
  href,
  children,
  type = 'other',
}: {
  href: string;
  children: React.ReactNode;
  type?: 'streaming' | 'merch' | 'manga' | 'other';
}) {
  const colors = {
    streaming: 'text-purple-400 hover:text-purple-300',
    merch:     'text-orange-400 hover:text-orange-300',
    manga:     'text-blue-400 hover:text-blue-300',
    other:     'text-[#e85d04] hover:text-[#f48c06]',
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`underline underline-offset-2 transition-colors ${colors[type]}`}
      data-affiliate-type={type}
    >
      {children}
    </a>
  );
}
