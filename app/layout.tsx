import type { Metadata } from "next";
import "./globals.css";

// Dynamic site URL resolution for local, Vercel preview, and production builds
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://cue-ai.vercel.app");

export const metadata: Metadata = {
  // CRITICAL: metadataBase allows opengraph-image.tsx to build an absolute URL
  metadataBase: new URL(siteUrl),
  title: {
    default: "CueAI — Real-Time AI Teleprompter for Virtual Interviews",
    template: "%s | CueAI",
  },
  description:
    "CueAI listens live during video calls and renders instant, tailored responses on a transparent, screen-share-invisible overlay.",
  keywords: [
    "AI Teleprompter",
    "Virtual Interview Assistant",
    "Real-time Speech Recognition",
    "Screen Share Invisible Overlay",
    "Whisper STT",
    "CueAI",
  ],
  authors: [{ name: "Maaz Zafar", url: "https://github.com/maazzafar1234" }],
  creator: "Maaz Zafar",

  // Open Graph / Facebook / LinkedIn / Discord
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "CueAI — Real-Time AI Teleprompter for Virtual Interviews",
    description:
      "Listen live during video calls and get instant, tailored answers on a transparent overlay. Completely undetected and screen-share safe.",
    siteName: "CueAI",
    // NOTE: Do NOT add `images: [...]` here.
    // app/opengraph-image.tsx automatically generates and attaches the dynamic OG image tags!
  },

  // Twitter / X Card
  twitter: {
    card: "summary_large_image",
    title: "CueAI — Real-Time AI Teleprompter for Virtual Interviews",
    description:
      "Undetectable transparent overlay supplying real-time interview cues powered by Whisper STT & LLMs.",
    // NOTE: app/opengraph-image.tsx handles Twitter images automatically as well
  },

  // Robots indexing
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#030712] text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
