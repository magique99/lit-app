import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lit App",
  description: "Platformă literară",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">

        <body
          className={`
            ${geistSans.variable}
            ${geistMono.variable}
            ${playfair.variable}
            antialiased
          `}
        >
         {/* NAVBAR */}
         <Navbar />

         {/* PAGE CONTENT */}
         <main>
           {children}
         </main>

         {/* FOOTER */}
         <Footer />

       </body>
    </html>
  );
}