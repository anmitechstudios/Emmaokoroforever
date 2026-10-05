import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fontVariables } from "@/app/fonts";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: { default: "Memorial dashboard", template: "%s · Memorial dashboard" },
  robots: { index: false, follow: false },
};

// The dashboard always uses the light theme, whatever the memorial itself uses.
export default function AdminRoot({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="text-[0.9375rem] leading-relaxed">{children}</body>
    </html>
  );
}
