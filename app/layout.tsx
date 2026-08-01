import type { Metadata } from "next";
import "@fontsource-variable/estedad";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import { JsonLd } from "./components/JsonLd";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";

export const metadata: Metadata = {
  metadataBase: new URL("https://sepiid-beauty-home.svshsayarnia.chatgpt.site"),
  title: {
    default: "فروشگاه تخصصی محصولات زیبایی و تزریقی | Sepiid Beauty",
    template: "%s | Sepiid Beauty",
  },
  description:
    "مرجع انتخاب و استعلام فیلر، اسکین‌بوستر، بوتولینوم و کوکتل‌های تخصصی همراه با راهنمای خرید، بررسی اصالت و پشتیبانی انسانی.",
  other: {
    "codex-preview": "development",
  },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "OnlineStore",
            name: "Sepiid Beauty",
            alternateName: "سپید بیوتی",
            url: "https://sepiid-beauty-home.svshsayarnia.chatgpt.site",
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
            url: "https://sepiid-beauty-home.svshsayarnia.chatgpt.site",
          }}
        />
      </body>
    </html>
  );
}
