import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import "./ui-audit.css";
import "./category-hovers.css";
import "./category-commerce-hero.css";
import "./product-visual.css";
import "./account-responsive.css";
import { catalogProducts } from "./catalog";
import { JsonLd } from "./components/JsonLd";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeaderServer } from "./components/SiteHeaderServer";
import { SmartAssistant } from "./components/SmartAssistant";
import { isApprovedInventorySlug } from "./current-inventory";
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
    default: "فروشگاه تخصصی محصولات زیبایی و تزریقی | Sepiid Beauty",
    template: "%s | Sepiid Beauty",
  },
  description:
    "مرجع انتخاب و استعلام فیلر، اسکین‌بوستر، بوتولینوم و کوکتل‌های تخصصی همراه با راهنمای خرید، بررسی اصالت و پشتیبانی انسانی.",
  alternates: {
    canonical: "/",
  },
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  openGraph: {
    title: "Sepiid Beauty | انتخاب آگاهانه محصولات حرفه‌ای زیبایی",
    description:
      "فروشگاه و مجله تخصصی محصولات زیبایی؛ همراه با مسیر بررسی اصالت و خرید حرفه‌ای.",
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
    title: "Sepiid Beauty | انتخاب آگاهانه محصولات حرفه‌ای زیبایی",
    description:
      "فروشگاه و مجله تخصصی محصولات زیبایی همراه با راهنمای خرید و بررسی اصالت.",
    images: ["/images/drive/hero-rejuvenation.webp"],
  },
  icons: {
    icon: "/images/sepiid-logo.webp",
    shortcut: "/images/sepiid-logo.webp",
  },
};

const approvedCatalogProducts = catalogProducts.filter((product) =>
  isApprovedInventorySlug(product.slug),
);

// `data.ts` intentionally exports the same catalog array by reference. Keep
// that shared public array aligned with the approved inventory as well, so
// legacy entries cannot reappear in related-product cards or other static
// discovery surfaces while their migration data remains defined in catalog.ts.
catalogProducts.splice(
  0,
  catalogProducts.length,
  ...approvedCatalogProducts,
);

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
        <SiteHeaderServer
          categories={categories}
          products={headerProducts}
          presentation={presentation.header}
        />
        {children}
        <SiteFooter
          presentation={{
            ...presentation.footer,
            brandTagline: presentation.header.brandTagline,
          }}
        />
        <SmartAssistant />
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
              "مرجع انتخاب و استعلام محصولات حرفه‌ای زیبایی با اطلاعات شفاف و مسیر بررسی اصالت.",
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
