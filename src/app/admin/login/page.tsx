import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { signIn } from "@/lib/actions/admin";
import { currentAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Sign in" };

export default async function Login() {
  if (await currentAdmin()) redirect("/admin");
  const configured = (await (await db()).count("admin_users")) > 0;

  return (
    <main className="grid min-h-svh place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="eyebrow">Family sign-in</p>
        <h1 className="mt-4 font-serif text-5xl font-light">Welcome back</h1>
        <p className="mt-3 text-muted">Sign in to look after the memorial and read new tributes.</p>

        {configured ? (
          <ActionForm action={signIn} submit="Sign in" className="mt-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="field-label">Email</label>
                <input id="email" name="email" type="email" autoComplete="username" required className="input" />
              </div>
              <div>
                <label htmlFor="password" className="field-label">Password</label>
                <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
              </div>
            </div>
          </ActionForm>
        ) : (
          <p className="card mt-8 p-5 text-sm text-ink-soft">
            No administrator has been set up yet. Add <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> to the
            site's environment settings and restart it. The account is created automatically.
          </p>
        )}

        <p className="mt-10 text-sm">
          <Link href="/" className="text-muted underline underline-offset-4 hover:text-ink">
            ← Back to the memorial
          </Link>
        </p>
      </div>
    </main>
  );
}
