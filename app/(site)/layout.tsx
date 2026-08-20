import type { Metadata } from "next";
import { Gabarito, Public_Sans } from "next/font/google";
import "./globals.css";

const gabarito = Gabarito({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-gabarito",
});

const publicSans = Public_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-public-sans",
});

export const metadata: Metadata = {
  title: "Balm",
  description: "Patient Feedback Engine",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${gabarito.variable} ${publicSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-milk text-cocoa">{children}</body>
    </html>
  );
}
