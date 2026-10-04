import type { ReactNode } from "react";

// Templates remount on every navigation, so each page fades gently in.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
