import type { Metadata } from "next";

import { ParaderoPrivacy } from "@/components/paradero-privacy";

export const metadata: Metadata = {
  title: "Privacy · Paradero",
  description: "What Paradero does with your location, your saved stops and your reports.",
  alternates: { canonical: "/paradero/privacy", languages: { es: "/paradero/privacidad", en: "/paradero/privacy" } },
};

export default function ParaderoPrivacyEnglish() {
  return (
    <ParaderoPrivacy
      copy={{
        lang: "en",
        eyebrow: "Paradero · A digital public good by Croma",
        title: "Your privacy, in a few words.",
        updated: "Updated November 8, 2026.",
        other: { label: "Español", href: "/paradero/privacidad" },
        sections: [
          { title: "You don't have an account", body: "Paradero doesn't ask for your email, phone, ID or name. There is no sign-up or sign-in." },
          {
            title: "Your location",
            body: "We only use it while the app is open and only with your permission. Before it leaves your phone we round it to about a hundred meters, and we send it to our server only to find nearby stops. We don't store it or link it to you.",
          },
          {
            title: "What stays on your phone",
            body: "Your saved stops and routes, their nicknames and your appearance and language settings live only on your phone. If you delete the app, they are deleted.",
          },
          {
            title: "Reports",
            body: "If you report a problem, the text you write is published on GitHub so anyone can follow it. Before publishing we hide emails, phone numbers and ID numbers. We don't store who sent it. To limit abuse, our server briefly counts how many reports come from the same connection, in memory only.",
          },
          { title: "No ads or tracking", body: "Paradero has no ads, uses no third-party analytics and never sells or shares data with anyone." },
          {
            title: "Where the data comes from",
            body: "Schedules, bus positions and service notices come from TransMilenio's open data, through Croma. Our server requests them on your behalf, so TransMilenio doesn't see your connection. Like any internet service, our hosting provider may log technical connection data for a short time to run and protect the service.",
          },
          { title: "Open source", body: "Everything on this page can be checked in the code, published under the MIT license at github.com/croma-labs/paradero." },
          { title: "Questions", body: "Write to us from the app with “Report a problem or an idea”, or open an issue at github.com/croma-labs/paradero." },
        ],
      }}
    />
  );
}
