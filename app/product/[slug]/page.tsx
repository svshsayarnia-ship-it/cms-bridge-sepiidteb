import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
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
  getProductCutoutSrc,
  hasLocalProductCutout,
} from "../../lib/product-image";
import {
  getCompactBrandLabel,
  getEnglishBrandLabel,
  toPublicCopy,
} from "../../lib/public-copy";
import { fillerCopyOverrides } from "../../lib/filler-copy";
import { getStorefrontProductSnapshots } from "../../lib/storefront-product-snapshots";
import {
  getRuntimeStorefrontProduct,
} from "../../lib/storefront-runtime-cache";

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

const genericCmsProductCopy =
  /(?:در گروه .* قرار می‌گیرد|برای مقایسه فنی، بررسی بسته‌بندی|به فروشگاه همگام‌سازی شده|اطلاعات بسته و موجودی قبل از سفارش کنترل می‌شود)/u;

function hasUsableCmsEditorialCopy(cmsProduct: CmsProduct | null) {
  const copy = plainText(
    cmsProduct?.shortDescription || cmsProduct?.description || "",
  );

  return copy.length >= 120 && !genericCmsProductCopy.test(copy);
}

function getPreferredProductSummary(
  cmsProduct: CmsProduct,
  fallback?: Product,
) {
  const cmsSummary = getPublicSummary(
    cmsProduct.shortDescription || cmsProduct.description || "",
  );
  const fallbackSummary = getPublicSummary(fallback?.summary || "");

  if (!fallbackSummary || hasUsableCmsEditorialCopy(cmsProduct)) {
    return cmsSummary || fallbackSummary;
  }

  return fallbackSummary;
}

function getPreferredProductMetaDescription(
  cmsProduct: CmsProduct | null,
  fallback?: Product,
) {
  const cmsDescription = plainText(cmsProduct?.metaDescription || "");

  if (
    cmsDescription.length >= 90 &&
    !genericCmsProductCopy.test(cmsDescription)
  ) {
    return cmsDescription;
  }

  return getPublicSummary(fallback?.summary || "") || cmsDescription;
}

function storefrontSlugCandidates(slug: string) {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return [];

  const candidates = [cleanSlug];
  const withoutDuplicateSuffix = cleanSlug.replace(/-\d+$/, "");

  if (withoutDuplicateSuffix !== cleanSlug) {
    candidates.push(withoutDuplicateSuffix);
  } else {
    // WordPress appends a numeric suffix when a product's original slug is
    // already occupied. The public product URL stays canonical, while CMS can
    // safely expose the actual WooCommerce slug (for example `product-2`).
    for (let suffix = 2; suffix <= 9; suffix += 1) {
      candidates.push(`${cleanSlug}-${suffix}`);
    }
  }

  return candidates;
}

function latestProduct(products: CmsProduct[]) {
  return products.reduce<CmsProduct | null>((latest, product) => {
    if (!latest) return product;

    const latestModified = Date.parse(latest.dateModifiedGmt || "");
    const productModified = Date.parse(product.dateModifiedGmt || "");

    if (
      Number.isFinite(productModified) &&
      (!Number.isFinite(latestModified) || productModified > latestModified)
    ) {
      return product;
    }

    return latest;
  }, null);
}

const getLiveProduct = cache(async (
  slug: string,
): Promise<CmsProduct | null> => {
  const slugCandidates = storefrontSlugCandidates(slug);

  const runtimeProduct = latestProduct(
    (await Promise.all(
      slugCandidates.map((candidate) => getRuntimeStorefrontProduct(candidate)),
    )).filter((product): product is CmsProduct => Boolean(product)),
  );
  if (runtimeProduct) {
    console.info("[storefront-product] runtime product resolved", {
      requestedSlug: slug,
      resolvedSlug: runtimeProduct.slug,
      dateModifiedGmt: runtimeProduct.dateModifiedGmt,
    });
    return runtimeProduct;
  }

  const snapshots = await getStorefrontProductSnapshots();
  const snapshot = latestProduct(
    slugCandidates
      .map((candidate) => snapshots[candidate])
      .filter((product): product is CmsProduct => Boolean(product)),
  );
  if (snapshot) {
    console.info("[storefront-product] snapshot product resolved", {
      requestedSlug: slug,
      resolvedSlug: snapshot.slug,
      dateModifiedGmt: snapshot.dateModifiedGmt,
    });
    return snapshot;
  }

  // Public product pages never fetch WooCommerce on demand. A CMS mutation
  // writes and verifies its storefront snapshot before revalidating routes;
  // if that snapshot is unavailable, the checked-in catalogue remains the
  // safe fallback. This keeps crawler and customer TTFB independent of a
  // slow WordPress origin.
  return null;
});

function isUsableLiveProduct(
  cmsProduct: CmsProduct | null,
  staticProduct: Product | null | undefined,
) {
  return Boolean(
    cmsProduct &&
      cmsProduct.status === "publish" &&
      cmsProduct.catalogVisibility !== "hidden" &&
      (isPublicCmsProduct(cmsProduct) || isPublicStaticProduct(staticProduct)),
  );
}

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
  const image = cmsProduct?.images?.find((item) => isPublicImageSrc(item.src));

  if (image?.src) {
    return {
      src: image.src,
      alt: image.alt || cmsProduct?.name || fallback?.nameFa || "",
    };
  }

  if (fallback?.imageVerified === true && isPublicImageSrc(fallback.image)) {
    return {
      src: fallback.image,
      alt: fallback.imageAlt || cmsProduct?.name || fallback.nameFa || "",
    };
  }

  return null;
}
function buildCmsOnlyProduct(
  cmsProduct: CmsProduct,
  fallback?: Product,
): Product {
  const category = cmsProduct.categories?.[0];
  const image = getLiveProductImage(cmsProduct, fallback);

  const summary = getPreferredProductSummary(cmsProduct, fallback);

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
const usefulFaqTerms = /چند|حجم|میل|سی‌سی|مدل|قیمت|جعبه|بسته|سرنگ|ویال|محتویات|واحد|کدام|تفاوت|چطور|کاربرد/u;

function getCustomerFaqs(product: Product) {
  return product.faq
    .filter(
      ({ question }) =>
        usefulFaqTerms.test(question) && !blockedFaqTerms.test(question),
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
  cmsProduct: CmsProduct | null,
): ProductExperienceProduct {
  return {
    slug: product.slug,
    nameFa: product.nameFa,
    nameEn: product.nameEn,
    brand: getCompactBrandLabel(product.brand),
    category: product.category,
    categoryTitle: product.categoryTitle,
    image: product.image,
    imageAlt: product.imageAlt,
    imageKind: product.imageKind,
    volume: product.volume,
    priceToman: product.priceToman,
    priceNote: product.priceNote,
    summary: toPublicCopy(product.summary),
    specs: getPublicSpecs(product.specs),
    visualProfile: cmsProduct?.visualProfile,
    visualScale: cmsProduct?.visualScale,
    visualOffsetX: cmsProduct?.visualOffsetX,
    visualOffsetY: cmsProduct?.visualOffsetY,
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
        summary: toPublicCopy(variant.summary),
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
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { slug } = await params;
  const variantParam = await searchParams;
  const hasSearchParams = Object.keys(variantParam).length > 0;
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

  const liveProduct = isUsableLiveProduct(cmsProduct, staticProduct)
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

  const title =
    plainText(liveProduct?.seoTitle || "") ||
    buildTransactionalProductTitle(
      product,
      staticProduct,
      liveProduct,
      variantId,
    );

  const curatedSummary = fillerCopyOverrides[product.slug]?.summary;
  const description =
    curatedSummary ||
    getPreferredProductMetaDescription(liveProduct, staticProduct ?? undefined) ||
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
    ...(hasSearchParams
      ? {
          robots: {
            index: false,
            follow: true,
          },
        }
      : {}),
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

  const liveProduct = isUsableLiveProduct(cmsProduct, staticProduct)
    ? cmsProduct
    : null;
  const useCatalogEditorialCopy = Boolean(
    liveProduct && staticProduct && !hasUsableCmsEditorialCopy(liveProduct),
  );

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

  // WooCommerce may preserve an old slug and append -2, -3, … to a newer
  // record. The public URL must remain the curated catalogue slug; serving
  // both as 200 pages would create a duplicate product URL in Google's index.
  if (slug !== product.slug) {
    const variant = initialVariantId
      ? `?variant=${encodeURIComponent(initialVariantId)}`
      : "";
    permanentRedirect(`/product/${product.slug}${variant}`);
  }

  // Related cards are editorial discovery content. Keeping them local prevents a
  // second WooCommerce request from holding the entire product page open while
  // the primary product price is already available from its live snapshot.
  const storefrontProducts = products;

  const related = storefrontProducts
    .filter(
      (item) =>
        item.category === product.category &&
        item.slug !== product.slug,
    )
    .slice(0, 3);
  const group = getGroupForCategory(product.category);
  const customerFaqs = getCustomerFaqs(product);
  const productExperience = getProductExperience(product, liveProduct);
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
  const catalogImage = staticProduct && hasLocalProductCutout(staticProduct.image)
    ? {
        src: getProductCutoutSrc(staticProduct.image),
        alt: staticProduct.imageAlt || `تصویر ${staticProduct.nameFa}`,
      }
    : null;

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
        catalogImage={catalogImage}
        livePricing={livePricing}
        liveShortDescription={
          useCatalogEditorialCopy ? "" : liveProduct?.shortDescription || ""
        }
        liveDescription={
          useCatalogEditorialCopy ? "" : liveProduct?.description || ""
        }
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
