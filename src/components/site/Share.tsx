"use client";

import { useState, type ReactNode } from "react";
import { copyText } from "@/lib/client";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";

/** A button that opens the "share this memorial" sheet. */
export function ShareButton({
  url,
  title,
  text,
  className = "link-line",
  children,
}: {
  url: string;
  title: string;
  text: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const message = `${text} ${url}`;

  const targets: { name: string; icon: IconName; href: string }[] = [
    { name: "WhatsApp", icon: "whatsapp", href: `https://wa.me/?text=${encodeURIComponent(message)}` },
    { name: "Facebook", icon: "facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: "X", icon: "x", href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    { name: "Email", icon: "mail", href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(message)}` },
  ];

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} labelledBy="share-title" size="sm">
        <div className="px-6 pb-8 pt-12 sm:px-10 sm:pb-10">
          <p className="eyebrow">Share</p>
          <h2 id="share-title" className="mt-3 font-serif text-3xl leading-tight">
            {title}
          </h2>
          <ul className="mt-7">
            {targets.map((target) => (
              <li key={target.name} className="border-t border-line">
                <a
                  href={target.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 py-4 transition-colors duration-300 hover:text-accent"
                >
                  <Icon name={target.icon} size={19} />
                  <span className="flex-1">{target.name}</span>
                  <Icon name="arrow-up-right" size={16} className="text-muted transition-transform duration-500 ease-calm group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </li>
            ))}
            <li className="border-y border-line">
              <button
                type="button"
                className="flex w-full items-center gap-4 py-4 text-left transition-colors duration-300 hover:text-accent"
                onClick={async () => {
                  if (await copyText(url)) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2400);
                  }
                }}
              >
                <Icon name={copied ? "check" : "link"} size={19} />
                <span className="flex-1" aria-live="polite">
                  {copied ? "Link copied" : "Copy link"}
                </span>
              </button>
            </li>
          </ul>
          <p className="mt-5 break-all text-xs text-muted">{url}</p>
        </div>
      </Modal>
    </>
  );
}

export function PrintButton({ className = "link-line", children }: { className?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {children}
    </button>
  );
}
