import Link from "next/link";

export default function NotFound() {
  return (
    <main id="content" className="shell flex min-h-svh flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-6 text-title font-light leading-[1.02]">
        This page has <em className="text-accent">moved on</em>
      </h1>
      <p className="mt-6 max-w-sm text-ink-soft">The page you were looking for isn't here. The memorial itself is just a step away.</p>
      <Link href="/" className="btn btn-primary mt-10">
        Return to the memorial
      </Link>
    </main>
  );
}
