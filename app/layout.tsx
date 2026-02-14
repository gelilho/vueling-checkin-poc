import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import NavToggle from "@/components/NavToggle";

export const metadata: Metadata = {
  title: "Vueling Invisible Check-In",
  description: "What if check-in just disappeared? AI-powered invisible check-in for Vueling.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} antialiased bg-white min-h-screen`}>
        <div className="mx-auto max-w-xl min-h-screen flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-vueling-yellow rounded-lg flex items-center justify-center">
                <span className="text-vueling-dark font-bold text-sm">V</span>
              </div>
              <span className="font-semibold text-vueling-dark text-lg tracking-tight">vueling</span>
            </div>
            <NavToggle />
          </header>

          {/* Main content */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
