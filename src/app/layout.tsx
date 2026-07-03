import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationTransitionOverlay } from "@/components/layout/NavigationTransitionOverlay";
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
    icon: "/ATIconFInal.png",
    shortcut: "/ATIconFInal.png",
    apple: "/ATIconFInal.png",
  },
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
        <Suspense fallback={null}>
          <NavigationTransitionOverlay />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
