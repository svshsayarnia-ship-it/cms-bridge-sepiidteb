import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import "./ui-audit.css";
import { JsonLd } from "./components/JsonLd";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { SmartAssistant } from "./components/SmartAssistant";
import { siteOrigin } from "./lib/site-url";
import { getStorefrontCategories } from "./lib/storefront-categories";
import { getSitePresentation } from "./lib/site-presentation";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: "فروشگاه تخصصی محصولات زیبایی و تزریقی | Sepiid Beauty",
    template: "%s | Sepiid Beauty",
  },
  description:
    "مرجع انتخاب و استعلام فیلر، اسکین‌بوستر، بوتولینوم و کوکتل‌های تخصصی همراه با راهنمای خرید، بررسی اصالت و پشتیبانی انسانی.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sepiid Beauty | انتخاب آگاهانه محصولات حرفه‌ای زیبایی",
    description:
      "فروشگاه و مجله تخصصی محصولات زیبایی؛ همراه با مسیر بررسی اصالت و خرید حرفه‌ای.",
    locale: "fa_IR",
    type: "website",
    siteName: "Sepiid Beauty",
    images: ["/images/drive/hero-rejuvenation.webp"],
  },
  icons: {
    icon: "/images/sepiid-logo.webp",
    shortcut: "/images/sepiid-logo.webp",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, presentation] = await Promise.all([
    getStorefrontCategories(),
    getSitePresentation(),
  ]);

  return (
    <html lang="fa" dir="rtl">
      <body>
        <SiteHeader categories={categories} presentation={presentation.header} />
        {children}
        <SiteFooter presentation={{ ...presentation.footer, brandTagline: presentation.header.brandTagline }} />
       { <SmartAssistant /> }
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "OnlineStore",
            name: "Sepiid Beauty",
            alternateName: "سپید بیوتی",
            url: siteOrigin,
            telephone: "+989037251266",
            areaServed: "IR",
            description:
              "مرجع انتخاب و استعلام محصولات حرفه‌ای زیبایی با اطلاعات شفاف و مسیر بررسی اصالت.",
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+989037251266",
              contactType: "customer support",
              availableLanguage: ["fa"],
            },
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Sepiid Beauty",
            url: siteOrigin,
          }}
        />
      </body>
    </html>
  );
}
