import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { FaqList } from "../../components/FaqList";
import { ArrowIcon } from "../../components/Icons";
import { JsonLd } from "../../components/JsonLd";
import { ProductCard } from "../../components/ProductCard";
import {
  ProductVariantExperience,
} from "../../components/ProductVariantExperience";
import type { ProductExperienceProduct } from "../../components/ProductVariantExperience";
import { getGroupForCategory } from "../../catalog";
import {
  getProduct,
  products,
} from "../../data";
import type { Product } from "../../data";
import { getStorefrontProducts } from "../../lib/storefront-catalog";
import { siteOrigin } from "../../lib/site-url";
import type { CmsProduct } from "../../lib/cms-types";
import { buildSeoMetadata } from "../../lib/seo";
import {
  getCompactBrandLabel,
  getEnglishBrandLabel,
  toPublicCopy,
} from "../../lib/public-copy";
import {
  isVerifiedPublicProductImage,
  preparePublicImageProduct,
} from "../../lib/public-product-image";
import { buildProductStructuredData } from "../../lib/product-structured-data";
import {
  getProductBySlug as getCmsProductBySlug,
  WooCommerceError,
} from "../../lib/woocommerce";

export const revalidate = 300;

const priceFormatter = new Intl.NumberFormat("fa-IR");
type ProductPricing = {
  label: string;
  note: string;
};

type ProductSearchParams = {
  variant?: string | string[];
};

function getRequestedVariantId(searchParams: ProductSearchParams) {
  const value = searchParams.variant;
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function formatTomanPrice(value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return `${priceFormatter.format(numeric)} تومان`;
}
function plainText(html: string) {
  return toPublicCopy(html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim());
}

const internalCmsCopyTerms =
  /سازنده|تولید(?:شده)? توسط|کشور|شرکت|اصالت|تاریخ انقضا|بچ|پلمب|منبع|بررسی|پزشک|تزریق|کلینیک|پروتکل|درمان|Medytox|Caregen|Dongkook|BioPlus|Masoondarou|Professional Derma|Wockhardt|Daehan|Spad Pharmed/iu;

function getPublicSummary(value: string) {
  return (plainText(value)
    .split(/(?<=[.!؟؛])\s+/u)
    .find((sentence) =>
      sentence.length > 20 && !internalCmsCopyTerms.test(sentence),
    ) ?? "").trim();
}

const getLiveProduct = cache(async (
  slug: string,
): Promise<CmsProduct | null> => {
  try {
    return await getCmsProductBySlug(slug, {
      requestTimeoutMs: 5_000,
      requestMaxAttempts: 1,
    });
  } catch (error) {
    if (error instanceof WooCommerceError) {
      return null;
    }

    throw error;
  }
});

function getLiveProductPricing(
  cmsProduct: CmsProduct | null,
): ProductPricing | null {
  if (!cmsProduct) {
    return null;
  }

  if (cmsProduct.stockStatus === "outofstock") {
    return {
      label: "ناموجود",
      note: "این محصول در حال حاضر ناموجود است.",
    };
  }

  const salePrice = formatTomanPrice(cmsProduct.salePrice);

  const regularPrice = formatTomanPrice(
    cmsProduct.regularPrice || cmsProduct.price,
  );

  const livePrice = salePrice || regularPrice;

  if (!livePrice) {
    return null;
  }

  return {
    label: livePrice,
    note:
      salePrice && regularPrice
        ? `قیمت عادی: ${regularPrice}`
        : "قیمت ثبت‌شده در سایت",
  };
}

function getLiveProductImage(
  cmsProduct: CmsProduct | null,
): { src: string; alt: string } | null {
  if (!cmsProduct) {
    return null;
  }

  const image = cmsProduct.images?.find((candidate) =>
    isVerifiedPublicProductImage({
      src: candidate.src,
      alt: candidate.alt,
      verified: true,
    }),
  );

  if (!image?.src) {
    return null;
  }

  return {
    src: image.src,
    alt: image.alt || cmsProduct.name || "",
  };
}
function isPublicCmsProduct(
  cmsProduct: CmsProduct | null,
): cmsProduct is CmsProduct {
  return Boolean(
    cmsProduct &&
      cmsProduct.status === "publish" &&
      cmsProduct.catalogVisibility !== "hidden",
  );
}
function buildCmsOnlyProduct(
  cmsProduct: CmsProduct,
  fallback?: Product,
): Product {
  const category = cmsProduct.categories?.[0];
  const image = getLiveProductImage(cmsProduct);

  const summary =
    getPublicSummary(
      cmsProduct.shortDescription ||
        cmsProduct.description ||
        "",
    ) ||
    getPublicSummary(fallback?.summary || "");

  return {
    slug: cmsProduct.slug,
    nameFa:
      cmsProduct.name ||
      fallback?.nameFa ||
      cmsProduct.slug,
    nameEn: fallback?.nameEn ?? "",
    brand:
      getEnglishBrandLabel(
        cmsProduct.brands?.[0]?.name ||
          fallback?.brand ||
          "",
      ) || fallback?.brand || "",
    category:
      category?.slug ||
      fallback?.category ||
      "products",
    categoryTitle:
      category?.name ||
      fallback?.categoryTitle ||
      "محصولات",
    group: fallback?.group,
    groupTitle: fallback?.groupTitle,
    badge:
      cmsProduct.featured
        ? "منتخب"
        : fallback?.badge,
    image:
      image?.src ||
      fallback?.image ||
      "/images/editorial-detail.webp",
    imageAlt:
      image?.alt ||
      fallback?.imageAlt ||
      `تصویر ${cmsProduct.name}`,
    imageVerified:
      Boolean(image?.src) ||
      Boolean(fallback?.imageVerified),
    position:
      fallback?.position || "center",
    volume: fallback?.volume,
    priceToman: fallback?.priceToman,
    priceNote: fallback?.priceNote,
    summary,
    shortBenefit:
      fallback?.shortBenefit || summary,
    audience:
      fallback?.audience ||
      "پزشکان و کلینیک‌ها",
    features: fallback?.features ?? [],
    specs:
      fallback?.specs?.length
        ? fallback.specs
        : cmsProduct.sku
          ? [["SKU", cmsProduct.sku]]
          : [],
    checks:
      fallback?.checks ?? [
        "نام محصول، بسته‌بندی، تاریخ و بچ‌کد پیش از مصرف بررسی شود.",
      ],
    faq: fallback?.faq ?? [],
    publishedInCatalog:
      fallback?.publishedInCatalog,
    variants: fallback?.variants,
  };
}

const blockedFaqTerms = /اصالت|تطبیق|سازنده|منبع|تأیید|تایید|رسمی|پلمب|بچ|تاریخ|مجوز|قطعی|بررسی/u;
const usefulFaqTerms = /چند|حجم|میل|مدل|قیمت|جعبه|بسته|سرنگ|ویال|محتویات/u;

function getCustomerFaqs(product: Product) {
  return product.faq
    .filter(
      ({ question, answer }) =>
        usefulFaqTerms.test(question) &&
        !blockedFaqTerms.test(question) &&
        !blockedFaqTerms.test(answer),
    )
    .map(({ question, answer }) => ({
      question,
      answer: (answer.split(/(?<=[.!؟؛])\s+/u)[0] ?? answer).trim(),
    }))
    .slice(0, 3);
}

const publicSpecLabels = new Set([
  "مدل",
  "مدل‌های موجود",
  "حجم",
  "حجم یا واحد مشاهده‌شده",
  "حجم‌های موجود",
  "حجم کل",
  "حجم هر سرنگ",
  "حجم هر ویال",
  "تعداد",
  "تعداد ست",
  "تعداد جعبه",
  "تعداد و حجم",
  "محتویات",
  "بسته",
  "بسته رایج",
  "شکل بسته",
  "شکل محصول",
  "سرنگ",
  "ویال",
  "قدرت",
  "غلظت درج‌شده",
  "ترکیبات فعال اعلام‌شده",
  "واحد قیمت",
]);

function getPublicSpecs(specs: Product["specs"]) {
  return specs.flatMap(([label, value]) => {
    const cleanValue = toPublicCopy(value)
      .replace(
        /(?:؛|،)?\s*(?:گزارش(?:\s+برخی\s+آگهی‌ها|\s+بازار)?|طبق\s+فهرست\s+موجودی|فهرست\s+بازار).*$/u,
        "",
      )
      .trim();

    return publicSpecLabels.has(label) && cleanValue
      ? [[label, cleanValue] as [string, string]]
      : [];
  });
}

function getProductExperience(
  product: Product,
): ProductExperienceProduct {
  return {
    nameFa: product.nameFa,
    nameEn: product.nameEn,
    brand: getCompactBrandLabel(product.brand),
    categoryTitle: product.categoryTitle,
    image: product.image,
    imageAlt: product.imageAlt,
    volume: product.volume,
    priceToman: product.priceToman,
    priceNote: product.priceNote,
    summary: getPublicSummary(product.summary),
    specs: getPublicSpecs(product.specs),
    variants: product.variants?.map((variant) => ({
      id: variant.id,
      label: variant.label,
      nameFa: variant.nameFa,
      nameEn: variant.nameEn,
      image: variant.image,
      imageAlt: variant.imageAlt,
      imageVerified: variant.imageVerified,
      volume: variant.volume,
      summary: getPublicSummary(variant.summary),
      specs: getPublicSpecs(variant.specs),
      priceToman: variant.priceToman,
      priceNote: variant.priceNote,
    })),
  };
}

function getProductSeoTitle(
  product: Product,
  explicitTitle?: string,
) {
  const cleanExplicitTitle = explicitTitle
    ?.trim()
    .replace(/\s*\|\s*(?:Sepiid Beauty|سپید بیوتی)\s*$/iu, "")
    .trim();

  if (
    cleanExplicitTitle &&
    /خرید/u.test(cleanExplicitTitle) &&
    /قیمت/u.test(cleanExplicitTitle)
  ) {
    return cleanExplicitTitle;
  }

  const primaryVariant = product.variants?.[0];
  const nameFa = primaryVariant?.nameFa?.trim() || product.nameFa.trim();
  const nameEn = (
    primaryVariant?.nameEn?.trim() ||
    product.nameEn.trim() ||
    getCompactBrandLabel(product.brand)
  )
    .replace(/[®™]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  return nameEn
    ? `خرید ${nameFa} | قیمت ${nameEn} و مشخصات`
    : `خرید ${nameFa} | قیمت و مشخصات`;
}

function getSchemaPrice(
  cmsProduct: CmsProduct | null,
): string | null {
  if (!cmsProduct) {
    return null;
  }

  const rawPrice =
    cmsProduct.salePrice ||
    cmsProduct.regularPrice ||
    cmsProduct.price;

  const tomanPrice = Number(rawPrice);

  if (!Number.isFinite(tomanPrice) || tomanPrice <= 0) {
    return null;
  }

  return String(Math.round(tomanPrice * 10));
}

function getSchemaAvailability(
  cmsProduct: CmsProduct | null,
): string {
  if (!cmsProduct) {
    return "https://schema.org/PreOrder";
  }

  if (cmsProduct.stockStatus === "outofstock") {
    return "https://schema.org/OutOfStock";
  }

  if (cmsProduct.stockStatus === "onbackorder") {
    return "https://schema.org/BackOrder";
  }

  return "https://schema.org/InStock";
}

export function generateStaticParams() {
  return products.flatMap((product) =>
    preparePublicImageProduct(product)
      ? [{ slug: product.slug }]
      : [],
  );
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const staticProduct = getProduct(slug);
  const cmsProduct = await getLiveProduct(slug);

  if (
    !isPublicCmsProduct(cmsProduct) &&
    !staticProduct?.publishedInCatalog
  ) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const liveProduct = isPublicCmsProduct(cmsProduct)
    ? cmsProduct
    : null;

  const rawProduct =
    liveProduct
      ? buildCmsOnlyProduct(
          liveProduct,
          staticProduct ?? undefined,
        )
      : staticProduct;

  const product = rawProduct
    ? preparePublicImageProduct(rawProduct)
    : null;

  if (!product) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const liveImage = getLiveProductImage(liveProduct);
  const title = getProductSeoTitle(product, liveProduct?.seoTitle);

  const description =
    getPublicSummary(
      liveProduct?.shortDescription ||
        liveProduct?.description ||
        "",
    ) ||
    getPublicSummary(product.summary) ||
    `${product.nameFa}؛ مشاهده مشخصات بسته و استعلام قیمت.`;

  const image =
    liveImage?.src ||
    product.image;

  return buildSeoMetadata({
    title,
    description,
    path: `/product/${product.slug}`,
    image,
    imageAlt:
      liveImage?.alt || product.imageAlt,
  });
}
export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ProductSearchParams>;
}) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  const staticProduct = getProduct(slug);
  const cmsProduct = await getLiveProduct(slug);

  if (
    !isPublicCmsProduct(cmsProduct) &&
    !staticProduct?.publishedInCatalog
  ) {
    notFound();
  }

  const liveProduct = isPublicCmsProduct(cmsProduct)
    ? cmsProduct
    : null;

  const rawProduct =
    liveProduct
      ? buildCmsOnlyProduct(
          liveProduct,
          staticProduct ?? undefined,
        )
      : staticProduct;

  const product = rawProduct
    ? preparePublicImageProduct(rawProduct)
    : null;

  if (!product) {
    notFound();
  }

  const requestedVariantId = getRequestedVariantId(resolvedSearchParams);
  const initialVariantId = product.variants?.some(
    (variant) => variant.id === requestedVariantId,
  )
    ? requestedVariantId
    : product.variants?.[0]?.id;

  const storefrontProducts =
    await getStorefrontProducts();

  const related = storefrontProducts
    .filter(
      (item) =>
        item.category === product.category &&
        item.slug !== product.slug,
    )
    .slice(0, 3);
  const group = getGroupForCategory(product.category);
  const customerFaqs = getCustomerFaqs(product);
  const productExperience = getProductExperience(product);

  const livePricing = getLiveProductPricing(liveProduct);
  const liveImage = getLiveProductImage(liveProduct);

  const schemaDescription =
    getPublicSummary(product.summary) || product.nameFa;
  const schemaPrice = getSchemaPrice(liveProduct);
  const schemaAvailability = getSchemaAvailability(liveProduct);
  const image = liveImage?.src || product.image;
  const productStructuredData = buildProductStructuredData({
    product,
    siteOrigin,
    brandName: getCompactBrandLabel(product.brand),
    description: schemaDescription,
    image,
    liveSku: liveProduct?.sku || undefined,
    schemaPrice,
    schemaAvailability,
  });

  return (
    <main id="main-content">
      <div className="sb-shell">
        <Breadcrumbs
          items={[
            { label: "فروشگاه", href: "/shop" },
            ...(group
              ? [{ label: group.title, href: `/shop/group/${group.slug}` }]
              : []),
            { label: product.categoryTitle, href: `/shop/${product.category}` },
            { label: product.nameFa },
          ]}
        />
      </div>

      <ProductVariantExperience
        product={productExperience}
        liveImage={liveImage}
        livePricing={livePricing}
        liveShortDescription=""
        liveDescription=""
        initialVariantId={initialVariantId}
      />

      {customerFaqs.length > 0 && (
        <section className="sb-section sb-product-faq" id="questions">
          <div className="sb-shell sb-faq-section__grid">
            <div>
              <h2>سؤال‌های رایج</h2>
            </div>
            <FaqList items={customerFaqs} />
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="sb-section sb-related-products">
          <div className="sb-shell">
            <div className="sb-section-head">
              <div>
                <h2>محصولات دیگر این دسته</h2>
              </div>
              <Link className="sb-text-link" href={`/shop/${product.category}`}>
                مشاهده دسته
                <ArrowIcon />
              </Link>
            </div>
            <div className="sb-product-grid sb-product-grid--three">
              {related.map((item) => (
                <ProductCard product={item} key={item.slug} />
              ))}
            </div>
          </div>
        </section>
      )}

      <JsonLd data={productStructuredData} />
      {customerFaqs.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: customerFaqs.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
      )}
    </main>
  );
}
