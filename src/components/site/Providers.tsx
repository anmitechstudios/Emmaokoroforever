"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { TributeProvider } from "./TributeDialog";

export function Providers({ shortName, children }: { shortName: string; children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <TributeProvider shortName={shortName}>{children}</TributeProvider>
    </MotionConfig>
  );
}
