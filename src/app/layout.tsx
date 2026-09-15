import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationTransitionOverlay } from "@/components/layout/NavigationTransitionOverlay";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HRIS",
  description: "Track leave, absences, and attendance.",
  icons: {
    icon: [
      { url: "/hris-logo.svg", type: "image/svg+xml" },
      { url: "/hris-logo.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/hris-logo.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HRIS",
    // "black-translucent" draws the page *under* the status bar, so the sticky header
    // sits beneath the clock and the page reads as taller than the screen. "default"
    // makes iOS reserve that strip instead.
    statusBarStyle: "default",
  },
  other: {
    // Next emits the standardized `mobile-web-app-capable`. Older iOS versions only
    // honour Apple's prefixed name, so both are sent.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#07111f",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // Lets the existing env(safe-area-inset-*) padding reach under the notch and
  // home indicator once the app runs without browser chrome.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full bg-[#07111f] antialiased`}
    >
      <body className="min-h-full bg-[#07111f] text-slate-100 flex flex-col overflow-x-hidden">
        <ServiceWorkerRegistrar />
        <Suspense fallback={null}>
          <NavigationTransitionOverlay />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
