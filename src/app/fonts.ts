import { Caveat, Cormorant_Garamond, Hanken_Grotesk } from "next/font/google";

export const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const text = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-text",
  display: "swap",
});

// Used only for guestbook entries, well below the fold.
export const script = Caveat({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-script",
  display: "swap",
  preload: false,
});

export const fontVariables = `${display.variable} ${text.variable} ${script.variable}`;
