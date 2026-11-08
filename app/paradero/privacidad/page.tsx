import type { Metadata } from "next";

import { ParaderoBanner, SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Privacidad · Paradero",
  description: "Qué hace Paradero con tu ubicación, tus paraderos guardados y tus reportes.",
};

const UPDATED = "8 de noviembre de 2026";

// Kept in step with src/content/privacy.ts in croma-labs/paradero. Every claim must match that app's code.
const SECTIONS = [
  { title: "No tienes cuenta", body: "Paradero no pide correo, teléfono, cédula ni nombre. No hay registro ni inicio de sesión." },
  {
    title: "Tu ubicación",
    body: "Solo la usamos con la app abierta y solo si nos das permiso. Antes de salir del teléfono la redondeamos a unos cien metros, y la enviamos a nuestro servidor únicamente para buscar los paraderos cercanos. No la guardamos ni la asociamos a ti.",
  },
  { title: "Lo que se queda en tu teléfono", body: "Tus paraderos y rutas guardados, sus apodos y tus preferencias de apariencia viven solo en tu teléfono. Si borras la app, se borran." },
  {
    title: "Reportes",
    body: "Si nos reportas un problema, el texto que escribas se publica en GitHub para que cualquiera pueda seguirlo. Antes de publicarlo ocultamos correos, teléfonos y números de documento. No guardamos quién lo envió. Para limitar el abuso, nuestro servidor cuenta por un rato cuántos reportes llegan desde una misma conexión, solo en memoria.",
  },
  { title: "Sin publicidad ni rastreo", body: "Paradero no tiene anuncios, no usa analítica de terceros y no vende ni comparte datos con nadie." },
  {
    title: "De dónde salen los datos",
    body: "Los horarios, las posiciones de los buses y las novedades vienen de los datos abiertos de TransMilenio, a través de Croma. Nuestro servidor los pide en tu nombre, así que TransMilenio no ve tu conexión. Como cualquier servicio en internet, nuestro proveedor de alojamiento puede registrar datos técnicos de las conexiones por un tiempo corto para operar y proteger el servicio.",
  },
  { title: "Código abierto", body: "Todo lo que dice esta página se puede comprobar en el código, publicado con licencia MIT en github.com/croma-labs/paradero." },
  { title: "Preguntas", body: "Escríbenos desde la app con «Reportar un problema o una idea», o abre un issue en github.com/croma-labs/paradero." },
];

export default function ParaderoPrivacy() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ParaderoBanner />
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-6 pt-16 pb-24">
        <p className="eyebrow">Paradero · Bien público digital de Croma</p>
        <h1 className="mt-4 bg-gradient-to-b from-foreground from-45% to-muted-foreground bg-clip-text pb-1 text-4xl font-semibold tracking-[-0.035em] text-balance text-transparent sm:text-5xl">
          Tu privacidad, en pocas palabras.
        </h1>
        <p className="mt-3 text-muted-foreground">Actualizada el {UPDATED}.</p>
        <div className="mt-12">
          {SECTIONS.map((s) => (
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
