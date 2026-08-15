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
import { getBrandPageForLabel } from "../../content-architecture";
import {
  getProduct,
  products,
} from "../../data";
import type { Product } from "../../data";
import { getStorefrontProducts } from "../../lib/storefront-catalog";
import { siteOrigin } from "../../lib/site-url";
import { merchantReturnPolicyReference } from "../../lib/merchant-policy";
import type { CmsProduct } from "../../lib/cms-types";
import { buildSeoMetadata } from "../../lib/seo";
import {
  isPublicCmsProduct,
  isPublicImageSrc,
  isPublicStaticProduct,
} from "../../lib/public-product";
import {
  getCompactBrandLabel,
  getEnglishBrandLabel,
  toPublicCopy,
} from "../../lib/public-copy";
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
  fallback?: Product | null,
): { src: string; alt: string } | null {
  if (fallback?.imageVerified === true && isPublicImageSrc(fallback.image)) {
    return {
      src: fallback.image,
      alt: fallback.imageAlt || cmsProduct?.name || fallback.nameFa || "",
    };
  }

  if (!cmsProduct) {
    return null;
  }

  const image = cmsProduct.images?.find((item) => isPublicImageSrc(item.src));

  if (!image?.src) {
    return null;
  }

  return {
    src: image.src,
    alt: image.alt || cmsProduct.name || "",
  };
}
function buildCmsOnlyProduct(
  cmsProduct: CmsProduct,
  fallback?: Product,
): Product {
  const category = cmsProduct.categories?.[0];
  const image = getLiveProductImage(cmsProduct, fallback);

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
    imageKind:
      image?.src
        ? "official"
        : fallback?.imageKind,
    imageApproved:
      Boolean(image?.src) ||
      Boolean(fallback?.imageApproved),
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
    imageKind: product.imageKind,
    volume: product.volume,
    priceToman: product.priceToman,
    priceNote: product.priceNote,
    summary: getPublicSummary(product.summary),
    specs: getPublicSpecs(product.specs),
    variants: product.variants
      ?.filter(
        (variant) =>
          (variant.imageVerified === true ||
            (variant.imageKind === "editorial-family" &&
              variant.imageApproved === true)) &&
          isPublicImageSrc(variant.image),
      )
      .map((variant) => ({
      id: variant.id,
      label: variant.label,
      nameFa: variant.nameFa,
      nameEn: variant.nameEn,
      image: variant.image,
      imageAlt: variant.imageAlt,
      imageVerified: variant.imageVerified,
      imageKind: variant.imageKind,
      volume: variant.volume,
      summary: getPublicSummary(variant.summary),
      specs: getPublicSpecs(variant.specs),
      priceToman: variant.priceToman,
      priceNote: variant.priceNote,
      })),
  };
}

function getSchemaPrice(
  cmsProduct: CmsProduct | null,
  staticPriceToman?: number,
): string | null {
  const rawPrice = cmsProduct
    ? cmsProduct.salePrice ||
      cmsProduct.regularPrice ||
      cmsProduct.price
    : staticPriceToman;

  const tomanPrice = cmsProduct
    ? Number(rawPrice)
    : Number(staticPriceToman);

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

function buildTransactionalProductTitle(
  product: Product,
  staticProduct: Product | undefined,
  liveProduct: CmsProduct | null,
  variantId?: string,
): string {
  const primaryVariant =
    product.variants?.find((variant) => variant.id === variantId) ??
    product.variants?.[0];
  const titleFa = (
    primaryVariant?.nameFa ||
    staticProduct?.nameFa ||
    liveProduct?.name ||
    product.nameFa
  )
    .replace(/\s+/g, " ")
    .trim();
  const titleEn = (
    primaryVariant?.nameEn ||
    liveProduct?.name ||
    staticProduct?.nameEn ||
    product.nameEn ||
    titleFa
  )
    .replace(/\s+/g, " ")
    .trim();

  return `خرید ${titleFa} | قیمت ${titleEn} و مشخصات | سپید بیوتی`;
}

export function generateStaticParams() {
  return products
    .filter(
      (product) => isPublicStaticProduct(product),
    )
    .map((product) => ({ slug: product.slug }));
}
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string | string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const variantParam = await searchParams;
  const variantId = Array.isArray(variantParam.variant)
    ? variantParam.variant[0]
    : variantParam.variant;

  const staticProduct = getProduct(slug);
  const cmsProduct = await getLiveProduct(slug);

  if (
    !isPublicCmsProduct(cmsProduct) &&
    !isPublicStaticProduct(staticProduct)
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

 const product =
  liveProduct
    ? buildCmsOnlyProduct(
        liveProduct,
        staticProduct ?? undefined,
      )
    : staticProduct;

  if (!product) {
    return {};
  }

  const liveImage = getLiveProductImage(liveProduct, staticProduct ?? undefined);

  const title = buildTransactionalProductTitle(
    product,
    staticProduct,
    liveProduct,
    variantId,
  );

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

  const metadata = buildSeoMetadata({
    title,
    description,
    path: `/product/${product.slug}`,
    image,
    imageAlt:
      liveImage?.alt || product.imageAlt,
  });

  return {
    ...metadata,
    title: { absolute: title },
  };
}
export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string | string[] }>;
}) {
 const { slug } = await params;
 const variantParam = await searchParams;
 const initialVariantId = Array.isArray(variantParam.variant)
   ? variantParam.variant[0]
   : variantParam.variant;

const staticProduct = getProduct(slug);
const cmsProduct = await getLiveProduct(slug);

if (
  !isPublicCmsProduct(cmsProduct) &&
  !isPublicStaticProduct(staticProduct)
) {
  notFound();
}

const liveProduct = isPublicCmsProduct(cmsProduct)
  ? cmsProduct
  : null;

const product =
  liveProduct
    ? buildCmsOnlyProduct(
        liveProduct,
        staticProduct ?? undefined,
      )
    : staticProduct;

if (!product) {
  notFound();
}

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
  const compactBrand = getCompactBrandLabel(product.brand);
  const brandPage = getBrandPageForLabel(compactBrand);
  const brandProductCount = brandPage
    ? storefrontProducts.filter(
        (item) =>
          brandPage.matchers.includes(
            getCompactBrandLabel(item.brand),
          ),
      ).length
    : 0;
  const brandHref =
    brandPage &&
    brandPage.indexable &&
    brandProductCount >= brandPage.minProductCount
      ? `/brands/${brandPage.slug}`
      : undefined;

const livePricing = getLiveProductPricing(liveProduct);
const liveImage = getLiveProductImage(liveProduct, staticProduct ?? undefined);

const schemaDescription =
  getPublicSummary(product.summary) || product.nameFa;
const schemaPrice = getSchemaPrice(
  liveProduct,
  product.priceToman,
);

const schemaAvailability =
  getSchemaAvailability(liveProduct);
const image = liveImage?.src || product.image;
const variants = productExperience.variants ?? [];
const productGroupId = `${siteOrigin}/product/${product.slug}#product-group`;
const absoluteImage = (value: string) =>
  value.startsWith("http") ? value : `${siteOrigin}${value}`;
const variantSchemas = variants
  .filter((variant) => variant.priceToman > 0)
  .map((variant) => {
  const variantUrl = `${siteOrigin}/product/${product.slug}?variant=${encodeURIComponent(variant.id)}`;
  const variantPrice =
    variant.priceToman > 0
      ? String(Math.round(variant.priceToman * 10))
      : null;

  return {
    "@type": "Product",
    "@id": `${variantUrl}#product`,
    name: variant.nameFa,
    alternateName: variant.nameEn,
    url: variantUrl,
    sku: `${product.slug}-${variant.id}`,
    image: absoluteImage(variant.image),
    description: variant.summary || variant.nameFa,
    isVariantOf: { "@id": productGroupId },
    ...(variantPrice
      ? {
          offers: {
            "@type": "Offer",
            url: variantUrl,
            price: variantPrice,
            priceCurrency: "IRR",
            availability: schemaAvailability,
            itemCondition: "https://schema.org/NewCondition",
            ...merchantReturnPolicyReference,
          },
        }
      : {}),
  };
  });
const hasProductOffer = Boolean(
  schemaPrice || variantSchemas.length > 0,
);
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
        brandHref={brandHref}
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

      {variants.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ProductGroup",
            "@id": productGroupId,
            name: product.nameFa,
            description: schemaDescription,
            url: `${siteOrigin}/product/${product.slug}`,
            productGroupID: product.slug,
            variesBy: ["https://schema.org/model"],
            brand: {
              "@type": "Brand",
              name: getCompactBrandLabel(product.brand),
            },
            hasVariant: variantSchemas,
          }}
        />
      )}
      {hasProductOffer && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.nameFa,
            alternateName: product.nameEn,
            brand: {
              "@type": "Brand",
              name: getCompactBrandLabel(product.brand),
            },
            description: schemaDescription,
            image: absoluteImage(image),
            url: `${siteOrigin}/product/${product.slug}`,
            sku: liveProduct?.sku || product.slug,
            ...(schemaPrice
              ? {
                  offers: {
                    "@type": "Offer",
                    url: `${siteOrigin}/product/${product.slug}`,
                    price: schemaPrice,
                    priceCurrency: "IRR",
                    availability: schemaAvailability,
                    itemCondition: "https://schema.org/NewCondition",
                    ...merchantReturnPolicyReference,
                  },
                }
              : {}),
          }}
        />
      )}
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
