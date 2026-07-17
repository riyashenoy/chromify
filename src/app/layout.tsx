import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import {
  Archivo_Black,
  Bebas_Neue,
  Chakra_Petch,
  Michroma,
  Orbitron,
  Press_Start_2P,
  Righteous,
  Space_Grotesk,
  Syne,
  Unbounded,
  Yellowtail,
} from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const michroma = Michroma({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-michroma",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-unbounded",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-orbitron",
  display: "swap",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
  display: "swap",
});

const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-chakra-petch",
  display: "swap",
});

const righteous = Righteous({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-righteous",
  display: "swap",
});

const yellowtail = Yellowtail({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-yellowtail",
  display: "swap",
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-press-start",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://chromify.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Chromify — Sterling chrome from any shape",
    template: "%s · Chromify",
  },
  description:
    "Drop a PNG or SVG and cast it in sterling chrome. A browser-native creative tool by Riya Shenoy.",
  applicationName: "Chromify",
  authors: [{ name: "Riya Shenoy", url: "https://riyashenoy.com" }],
  creator: "Riya Shenoy",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Chromify",
    title: "Chromify — Sterling chrome from any shape",
    description:
      "Drop a PNG or SVG and cast it in sterling chrome. Local preview, live controls, transparent PNG export.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chromify — Sterling chrome from any shape",
    description:
      "Drop a PNG or SVG and cast it in sterling chrome. Built by Riya Shenoy.",
  },
  icons: {
    icon: [{ url: "/icons/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#14161b",
  width: "device-width",
  initialScale: 1,
};

const fontVariables = [
  spaceGrotesk.variable,
  michroma.variable,
  syne.variable,
  unbounded.variable,
  bebasNeue.variable,
  orbitron.variable,
  archivoBlack.variable,
  chakraPetch.variable,
  righteous.variable,
  yellowtail.variable,
  pressStart.variable,
].join(" ");

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  );
}
