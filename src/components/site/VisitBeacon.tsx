"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Tells the server a page has been opened. Sends the path and nothing else. */
export function VisitBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {
      // Counting is best-effort.
    });
  }, [pathname]);

  return null;
}
