import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import "./ui-audit.css";
import "./category-hovers.css";
import "./category-commerce-hero.css";
import "./product-visual.css";
import "./account-responsive.css";
import "./uiux-critical-fixes.css";
import "./global-contact-bar.css";
import { catalogCategories, catalogProducts } from "./catalog";
import { AiReferralTracker } from "./components/AiReferralTracker";
import { ProductCardVariantIntentBridge } from "./components/ProductCardVariantIntentBridge";
import { GoogleAnalytics } from "./components/GoogleAnalytics";
import { PostHogTracker } from "./components/PostHogTracker";
import { GlobalContactBar } from "./components/GlobalContactBar";
import { JsonLd } from "./components/JsonLd";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeaderServer } from "./components/SiteHeaderServer";
import { DeferredSmartAssistant } from "./components/DeferredSmartAssistant";
import { isApprovedInventorySlug } from "./current-inventory";
import { siteOrigin } from "./lib/site-url";
import {
  merchantOrganizationId,
  merchantReturnPolicy,
} from "./lib/merchant-policy";
import { DEFAULT_SITE_PRESENTATION } from "./lib/site-presentation";
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

// The global shell must never wait on WordPress. These category labels/images
// and the editorial shell presentation are complete checked-in fallbacks. Live
// commerce/product data keeps its own snapshot-backed paths, while CMS writes
// can continue to invalidate and refresh the page-specific data caches.
const headerCategories = catalogCategories.map((category) => ({
  ...category,
  wooId: null,
  live: false,
}));
const shellPresentation = DEFAULT_SITE_PRESENTATION;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <GoogleAnalytics />
        <PostHogTracker />
        <AiReferralTracker />
        <ProductCardVariantIntentBridge />
        <Script async src="https://news.google.com/swg/js/v1/publisher.js" strategy="afterInteractive" />
        <SiteHeaderServer
          categories={headerCategories}
          products={headerProducts}
          presentation={shellPresentation.header}
        />
        <GlobalContactBar />
        {children}
        <SiteFooter
          presentation={{
            ...shellPresentation.footer,
            brandTagline: shellPresentation.header.brandTagline,
          }}
        />
        <DeferredSmartAssistant />
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
            telephone: "+982128422578",
            areaServed: "IR",
            description:
              "مرجع انتخاب و استعلام محصولات حرفه‌ای زیبایی با اطلاعات شفاف و مسیر بررسی اصالت.",
            hasMerchantReturnPolicy: merchantReturnPolicy,
            contactPoint: [
              {
                "@type": "ContactPoint",
                telephone: "+982128422578",
                contactType: "office customer support",
                availableLanguage: ["fa"],
              },
              {
                "@type": "ContactPoint",
                telephone: "+989037251266",
                contactType: "mobile customer support",
                availableLanguage: ["fa"],
              },
            ],
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${siteOrigin}/#website`,
            name: "Sepiid Beauty",
            alternateName: "سپید بیوتی",
            url: siteOrigin,
            inLanguage: "fa-IR",
            publisher: { "@id": merchantOrganizationId },
          }}
        />
      </body>
    </html>
  );
}
