import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/motion";

/** The numbered heading that opens each room of the exhibition. */
export function SectionHeader({
  number,
  eyebrow,
  title,
  children,
  align = "left",
  action,
}: {
  number?: string;
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  const centered = align === "center";
  return (
    <header className={`flex flex-col gap-8 ${centered ? "items-center text-center" : "lg:flex-row lg:items-end lg:justify-between"}`}>
      <div className={centered ? "max-w-3xl" : "max-w-3xl"}>
        <Reveal>
          <p className="eyebrow flex items-center gap-4">
            {number && <span className="tabular-nums text-accent">{number}</span>}
            {number && <span className="h-px w-8 bg-line" aria-hidden="true" />}
            {eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-6 text-title font-light leading-[1.02]">{title}</h2>
        </Reveal>
        {children && (
          <Reveal delay={0.16}>
            <div className={`mt-6 max-w-xl text-ink-soft ${centered ? "mx-auto" : ""}`}>{children}</div>
          </Reveal>
        )}
      </div>
      {action && (
        <Reveal delay={0.2} className="no-print shrink-0">
          {action}
        </Reveal>
      )}
    </header>
  );
}
