import type { Metadata } from "next";
import { ActionForm } from "@/components/admin/ActionForm";
import { AdminPage, Area, Input, Panel } from "@/components/admin/Shell";
import { changeEmail, changePassword, saveSettings } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/auth/session";
import { SECTION_KEYS, type SectionKey } from "@/lib/db/types";
import { siteUrl } from "@/lib/format";
import { getMemorial } from "@/lib/queries";

export const metadata: Metadata = { title: "Settings" };

const THEMES = [
  { key: "ivory", label: "Ivory", note: "Warm white, like good paper", paper: "#f6f2ea", ink: "#24211d" },
  { key: "stone", label: "Stone", note: "Cooler and quieter", paper: "#eeeeea", ink: "#1f2222" },
  { key: "evening", label: "Evening", note: "Dark and candle-lit", paper: "#1b1917", ink: "#efe9de" },
] as const;

const ACCENTS = [
  ["#7f5e40", "Umber"],
  ["#6b6f54", "Olive"],
  ["#8a5a4e", "Clay rose"],
  ["#4f6272", "Slate blue"],
  ["#5f6f66", "Sage"],
  ["#7a5c74", "Plum"],
] as const;

const SECTIONS: Record<SectionKey, string> = {
  story: "Life story",
  timeline: "Timeline",
  memories: "Memory wall",
  gallery: "Photographs",
  favorites: "Favourite things",
  media: "Video & audio",
  tributes: "Tributes & condolences",
  family: "Family",
  service: "Service information",
  candles: "Light a candle",
  guestbook: "Guestbook",
};

export default async function SettingsPage() {
  const [memorial, admin] = await Promise.all([getMemorial(), requireAdmin()]);
  const s = memorial.settings;
  const custom = !ACCENTS.some(([hex]) => hex === s.accent.toLowerCase());

  return (
    <AdminPage title="Settings" intro="How the memorial looks, what it includes, and how people can reach the family.">
      <ActionForm action={saveSettings} className="space-y-8">
        <Panel title="Appearance">
          <fieldset>
            <legend className="field-label">Theme</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {THEMES.map((theme) => (
                <label key={theme.key} className="flex cursor-pointer items-center gap-3 rounded border border-line p-3 has-[:checked]:border-ink">
                  <input type="radio" name="theme" value={theme.key} defaultChecked={s.theme === theme.key} className="sr-only" />
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line font-serif text-lg" style={{ background: theme.paper, color: theme.ink }} aria-hidden="true">
                    Aa
                  </span>
                  <span>
                    <span className="block font-medium">{theme.label}</span>
                    <span className="block text-xs text-muted">{theme.note}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="field-label">Accent colour</legend>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENTS.map(([hex, name]) => (
                <label key={hex} className="cursor-pointer rounded-full border-2 border-transparent p-0.5 has-[:checked]:border-ink has-[:focus-visible]:outline" title={name}>
                  <input type="radio" name="accent_choice" value={hex} defaultChecked={s.accent.toLowerCase() === hex} className="sr-only" />
                  <span className="block size-8 rounded-full" style={{ background: hex }} />
                  <span className="sr-only">{name}</span>
                </label>
              ))}
              <label className="ml-2 flex items-center gap-2 text-sm text-muted">
                <input type="radio" name="accent_choice" value="custom" defaultChecked={custom} className="size-4 accent-[var(--ink)]" />
                Custom
                <input type="color" name="accent_custom" defaultValue={s.accent} className="h-8 w-10 cursor-pointer rounded border border-line bg-transparent" aria-label="Custom accent colour" />
              </label>
            </div>
            <p className="mt-2 text-xs text-muted">Muted colours work best. The accent is used sparingly, for the family name, years and small details.</p>
          </fieldset>
        </Panel>

        <Panel title="Sections" hint="Untick anything you'd rather not include. Empty sections hide themselves.">
          <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {SECTION_KEYS.map((key) => (
              <label key={key} className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" name={`section_${key}`} defaultChecked={s.sections[key] !== false} className="size-4 accent-[var(--ink)]" />
                {SECTIONS[key]}
              </label>
            ))}
          </div>
        </Panel>

        <Panel title="When the memorial is shared" hint={`How the link appears on WhatsApp, Facebook and X. The preview image is made automatically from the portrait, name and dates. Current address: ${siteUrl()}`}>
          <div className="grid gap-4">
            <Input label="Title" name="share_title" defaultValue={s.share_title} maxLength={120} placeholder={`${memorial.epitaph} · ${memorial.full_name}`} hint="Leave empty to use the name automatically." />
            <Area label="Short description" name="share_description" defaultValue={s.share_description} maxLength={300} rows={2} />
          </div>
        </Panel>

        <Panel title="Contact the family" hint="Shown on the Privacy & contact page.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Signed as" name="contact_name" defaultValue={s.contact_name} maxLength={120} placeholder="The Okoro family" />
            <Input label="Email" name="contact_email" type="email" defaultValue={s.contact_email} maxLength={200} />
            <Input label="Phone (optional)" name="contact_phone" defaultValue={s.contact_phone} maxLength={40} />
          </div>
        </Panel>
      </ActionForm>

      <Panel title="Sign-in email" hint={`You currently sign in as ${admin.email}.`}>
        <ActionForm action={changeEmail} submit="Change email" resetOnSuccess>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="New email" name="email" id="new-email" type="email" autoComplete="email" required />
            <Input label="Current password" name="current" id="email-current" type="password" autoComplete="current-password" required />
          </div>
        </ActionForm>
      </Panel>

      <Panel title="Change password">
        <ActionForm action={changePassword} submit="Change password" resetOnSuccess>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Current password" name="current" type="password" autoComplete="current-password" required />
            <Input label="New password" name="next" type="password" autoComplete="new-password" required minLength={10} hint="At least 10 characters." />
          </div>
        </ActionForm>
      </Panel>
    </AdminPage>
  );
}
