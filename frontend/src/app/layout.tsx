// In frontend/src/app/layout.tsx

// 1. This file is now a Server Component (no 'use client')

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { Providers } from "./provider"; // <-- 2. Import your new Providers component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 3. This metadata export will now work correctly
export const metadata: Metadata = {
  title: "CampFinder",
  description: "Discover and review campgrounds across North America.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* 4. Use the Providers component to wrap your layout structure */}
        <Providers>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
