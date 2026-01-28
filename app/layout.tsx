import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import Providers from "./providers";
import Navbar from "@/components/shared/Navbar";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jet",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SongRank",
  description:
    "Rank your favorite songs through pairwise battles with Whole-History Rating",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          <Navbar />
          <main className="bg-page min-h-screen pt-16">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
