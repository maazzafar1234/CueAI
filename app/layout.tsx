import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://cueai-gold.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "CueAI — Real-Time AI Teleprompter for Virtual Interviews",
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

  // Open Graph / Facebook / LinkedIn / WhatsApp / Discord
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    title: "CueAI — Real-Time AI Teleprompter for Virtual Interviews",
    description:
      "CueAI listens live during video calls and renders instant, tailored responses on a transparent, screen-share-invisible overlay.",
    siteName: "CueAI",
    images: [
      {
        url: `${siteUrl}/og-image1.png`, // Explicitly pointing to og-image1.png
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "CueAI Teleprompter Preview",
      },
    ],
  },

  // Twitter / X Card
  twitter: {
    card: "summary_large_image",
    title: "CueAI — Real-Time AI Teleprompter for Virtual Interviews",
    description:
      "CueAI listens live during video calls and renders instant, tailored responses on a transparent overlay.",
    images: [`${siteUrl}/og-image1.png`],
  },

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
