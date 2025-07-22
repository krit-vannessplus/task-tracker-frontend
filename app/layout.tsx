// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LiffGuard from "@/components/LiffGuard"; // <-- import your client guard
import Header from "@/components/header"; // Import your header component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Your App Title",
  description: "Your app description",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Wrap all pages in your LIFF guard */}
        <div className="min-h-screen flex flex-col bg-gray-100 space-y-4 pb-4">
          <Header /> {/* Include the header component */}
          <LiffGuard>{children}</LiffGuard>
        </div>
      </body>
    </html>
  );
}
