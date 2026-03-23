import type { Metadata } from "next";
import { Inter, Manrope, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { GoeyToaster } from "@/components/ui/goey-toaster";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spiel Vault",
  description: "Centralized spiel management for teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        inter.variable,
        manrope.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-full">
        <ThemeProvider>
          {children}
          <GoeyToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
