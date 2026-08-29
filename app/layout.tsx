import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cue-ai.vercel.app";

export const metadata: Metadata = {
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
    images: [
      {
        url: "/og-image.png", // Located at public/og-image.png
        width: 1200,
        height: 630,
        alt: "CueAI - Real-Time AI Teleprompter Overlay Preview",
      },
    ],
  },

  // Twitter / X Card
  twitter: {
    card: "summary_large_image",
    title: "CueAI — Real-Time AI Teleprompter for Virtual Interviews",
    description:
      "Undetectable transparent overlay supplying real-time interview cues powered by Whisper STT & LLMs.",
    images: ["/og-image.png"],
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
