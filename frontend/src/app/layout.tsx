import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlacesFinder - AI-Powered Local Search",
  description: "Discover amazing places near you with our AI-powered search engine. Get personalized recommendations based on your location and preferences.",
  keywords: "places, search, local, AI, recommendations, restaurants, cafes, attractions",
  authors: [{ name: "PlacesFinder Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
