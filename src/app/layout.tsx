import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coop Tracker",
  description: "Track internship applications against a canonical job list"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
