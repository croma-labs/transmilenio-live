import Link from "next/link";

import { ParaderoBanner, SiteHeader } from "@/components/site-header";

export interface PrivacyCopy {
  lang: "es" | "en";
  eyebrow: string;
  title: string;
  updated: string;
  other: { label: string; href: string };
  sections: { title: string; body: string }[];
}

/**
 * Paradero's privacy policy. The words are kept in step with src/i18n in croma-labs/paradero,
 * and every claim must match that app's code.
 */
export function ParaderoPrivacy({ copy }: { copy: PrivacyCopy }) {
  return (
    <div lang={copy.lang} className="flex min-h-dvh flex-col">
      <ParaderoBanner />
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-6 pt-16 pb-24">
        <div className="flex items-baseline justify-between gap-4">
          <p className="eyebrow">{copy.eyebrow}</p>
          <Link href={copy.other.href} hrefLang={copy.lang === "es" ? "en" : "es"} className="eyebrow underline underline-offset-4">
            {copy.other.label}
          </Link>
        </div>
        <h1 className="mt-4 bg-gradient-to-b from-foreground from-45% to-muted-foreground bg-clip-text pb-1 text-4xl font-semibold tracking-[-0.035em] text-balance text-transparent sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-3 text-muted-foreground">{copy.updated}</p>
        <div className="mt-12">
          {copy.sections.map((s) => (
            <section key={s.title} className="border-t border-line py-6">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">{s.title}</h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
