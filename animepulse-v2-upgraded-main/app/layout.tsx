import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// AnimePulse brand fonts:
// Syne — bold, geometric, futuristic display font for headings & logo
// DM Sans — clean, readable, modern body font
const syne = Syne({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-syne',
  weight: ['400', '600', '700', '800'],
});
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-dm-sans',
  weight: ['400', '500', '600'],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://animepulse.online";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e85d04",
};

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "AnimePulse — Anime News, Trending & Reviews 2025",
    template: "%s | AnimePulse",
  },
  description: "AnimePulse is your #1 source for anime news, trending anime rankings, top 10 lists, and reviews. Updated daily with the latest from MyAnimeList, Crunchyroll, and Reddit.",
  keywords: [
    "anime news 2025", "trending anime 2025", "best anime 2025", "anime reviews",
    "top anime list", "new anime season 2025", "anime rankings", "watch anime",
    "anime streaming", "manga news", "jujutsu kaisen", "demon slayer",
    "one piece", "attack on titan", "solo leveling", "animepulse",
    "anime updates", "anime recommendations", "crunchyroll news",
    "myanimelist top anime", "seasonal anime 2025", "anime episodes",
    "new anime releases", "anime community", "top rated anime",
  ],
  authors: [{ name: "AnimePulse", url: APP_URL }],
  creator: "AnimePulse",
  publisher: "AnimePulse",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "AnimePulse",
    title: "AnimePulse — Anime News, Trending & Reviews 2025",
    description: "Your #1 source for anime news, trending rankings, top 10 lists, and reviews. Updated daily.",
    images: [{ url: `${APP_URL}/og-image.jpg`, width: 1200, height: 630, alt: "AnimePulse — Anime News & Rankings" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AnimePulse — Anime News, Trending & Reviews 2025",
    description: "Your #1 source for anime news, trending rankings, top 10 lists, and reviews. Updated daily.",
    site: "@AnimePulseHQ",
    images: [`${APP_URL}/og-image.jpg`],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  category: "entertainment",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AnimePulse",
  url: APP_URL,
  description: "Your #1 source for anime news, trending shows, top 10 lists, and reviews.",
  inLanguage: "en-US",
  potentialAction: {
    "@type": "SearchAction",
    target: `${APP_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: "AnimePulse",
    url: APP_URL,
    logo: { "@type": "ImageObject", url: `${APP_URL}/logo.png` },
    sameAs: [
      "https://t.me/AnimePulseChannel",
      "https://twitter.com/AnimePulseHQ",
    ],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home",     item: APP_URL },
    { "@type": "ListItem", position: 2, name: "News",     item: `${APP_URL}/news` },
    { "@type": "ListItem", position: 3, name: "Trending", item: `${APP_URL}/trending` },
    { "@type": "ListItem", position: 4, name: "Top 10",   item: `${APP_URL}/top-10` },
    { "@type": "ListItem", position: 5, name: "Reviews",  item: `${APP_URL}/reviews` },
  ],
};

// Article list schema for news page SEO boost
const newsMediaSchema = {
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  name: "AnimePulse",
  url: APP_URL,
  logo: { "@type": "ImageObject", url: `${APP_URL}/logo.png` },
  sameAs: ["https://twitter.com/AnimePulseHQ"],
  publishingPrinciples: `${APP_URL}/about-us`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://cdn.myanimelist.net" />
        <link rel="dns-prefetch" href="https://api.jikan.moe" />
        <link rel="dns-prefetch" href="https://www.reddit.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsMediaSchema) }} />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7944585824292210" crossOrigin="anonymous" />
        <meta name="google-adsense-account" content="ca-pub-7944585824292210" />
      </head>
      <body className={`${dmSans.variable} ${syne.variable} font-sans min-h-screen flex flex-col bg-[#080b14]`}>
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
