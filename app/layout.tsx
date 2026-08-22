import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import "./ui-audit.css";
import "./category-hovers.css";
import { catalogProducts } from "./catalog";
import { JsonLd } from "./components/JsonLd";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { SmartAssistant } from "./components/SmartAssistant";
import { siteOrigin } from "./lib/site-url";
import {
  merchantOrganizationId,
  merchantReturnPolicy,
} from "./lib/merchant-policy";
import { getStorefrontCategories } from "./lib/storefront-categories";
import { getSitePresentation } from "./lib/site-presentation";
import { isPublicStaticProduct, toPublicProduct } from "./lib/public-product";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: {
    default: "فروشگاه محصولات زیبایی | سپید بیوتی",
    template: "%s | Sepiid Beauty",
  },
  description:
    "فیلر، بوتاکس، مزوژل و محصولات حرفه‌ای زیبایی را با نام، حجم، قیمت و راه خرید روشن ببینید.",
  alternates: {
    canonical: "/",
  },
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  openGraph: {
    title: "سپید بیوتی | محصولات زیبایی با اطلاعات روشن",
    description:
      "محصولات زیبایی، مشخصات بسته و راهنمای ساده برای خریدی روشن‌تر.",
    locale: "fa_IR",
    type: "website",
    url: "/",
    siteName: "Sepiid Beauty",
    images: [
      {
        url: "/images/drive/hero-rejuvenation.webp",
        alt: "Sepiid Beauty؛ فروشگاه تخصصی محصولات زیبایی",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "سپید بیوتی | محصولات زیبایی با اطلاعات روشن",
    description:
      "فروشگاه محصولات زیبایی همراه با مشخصات بسته، قیمت روز و راهنمای خرید.",
    images: ["/images/drive/hero-rejuvenation.webp"],
  },
  icons: {
    icon: "/images/sepiid-logo.webp",
    shortcut: "/images/sepiid-logo.webp",
  },
};

const headerProducts = catalogProducts
  .filter(isPublicStaticProduct)
  .map(toPublicProduct);

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
        <SiteHeader
          categories={categories}
          products={headerProducts}
          presentation={presentation.header}
        />
        {children}
        <SiteFooter presentation={{ ...presentation.footer, brandTagline: presentation.header.brandTagline }} />
       { <SmartAssistant /> }
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "OnlineStore",
            "@id": merchantOrganizationId,
            name: "Sepiid Beauty",
            alternateName: "سپید بیوتی",
            url: siteOrigin,
            logo: `${siteOrigin}/images/sepiid-logo.webp`,
            image: `${siteOrigin}/images/drive/hero-rejuvenation.webp`,
            telephone: "+989037251266",
            areaServed: "IR",
            description:
              "فروشگاه محصولات زیبایی با اطلاعات روشن درباره مدل، بسته و راه خرید.",
            hasMerchantReturnPolicy: merchantReturnPolicy,
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
            inLanguage: "fa-IR",
          }}
        />
      </body>
    </html>
  );
}
