import { createHash } from "node:crypto";
import { revalidateTag } from "next/cache";
import { STOREFRONT_CATALOG_TAG } from "@/app/lib/storefront-catalog";
import {
  createProduct,
  getProductBySlug,
  listCategories,
} from "@/app/lib/woocommerce";
import { rememberStorefrontProduct } from "@/app/lib/storefront-product-snapshots";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EXPECTED_TOKEN_HASH =
  "487f26a9bbe776e09c59c6d248c8c696caa159c990c2c6ea10ffb764d3b6fc00";

function isAuthorized(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const digest = createHash("sha256").update(token).digest("hex");
  return digest === EXPECTED_TOKEN_HASH;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await getProductBySlug("blank-b", {
    requestTimeoutMs: 20_000,
    requestMaxAttempts: 3,
  });

  if (existing) {
    await rememberStorefrontProduct(existing, { requirePersistence: true });
    revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });
    return Response.json({
      ok: true,
      created: false,
      product: {
        id: existing.id,
        name: existing.name,
        slug: existing.slug,
        status: existing.status,
        regularPrice: existing.regularPrice,
      },
    });
  }

  const categories = await listCategories({
    requestTimeoutMs: 20_000,
    requestMaxAttempts: 3,
  });
  const skinBoosters = categories.find(
    (category) => category.slug === "skin-boosters",
  );

  const product = await createProduct({
    name: "بلانک بی",
    slug: "blank-b",
    sku: "",
    status: "publish",
    catalogVisibility: "visible",
    featured: false,
    description:
      "<p>بلانک بی (Blank B) در کاتالوگ فعلی سپیدطب عرضه می‌شود و برای مدیریت یکپارچه در CMS سپید بیوتی به WooCommerce همگام‌سازی شده است.</p><p>نام محصول، بچ‌کد، تاریخ و سلامت بسته هنگام استعلام و پیش از نهایی‌شدن سفارش کنترل شود.</p>",
    shortDescription:
      "بلانک بی (Blank B)، محصول حرفه‌ای مراقبت و جوان‌سازی پوست؛ اطلاعات بسته و موجودی هنگام استعلام کنترل می‌شود.",
    seoTitle: "بلانک بی (Blank B) | قیمت و مشخصات | سپید بیوتی",
    metaDescription:
      "قیمت و مشخصات بلانک بی (Blank B) در سپید بیوتی؛ اطلاعات موجودی، بسته‌بندی و اصالت محصول هنگام استعلام و پیش از سفارش بررسی می‌شود.",
    focusKeyword: "بلانک بی",
    sourceName: "SepiidTeb — Blank B",
    sourceUrl: "https://sepiidteb.ir/product/122/",
    reviewerName: "",
    reviewerRole: "",
    reviewedAt: "2026-08-16",
    regularPrice: "7400000",
    salePrice: "",
    manageStock: false,
    stockQuantity: null,
    stockStatus: "instock",
    categoryIds: skinBoosters ? [skinBoosters.id] : [],
    images: [],
  });

  await rememberStorefrontProduct(product, { requirePersistence: true });
  revalidateTag(STOREFRONT_CATALOG_TAG, { expire: 0 });

  return Response.json({
    ok: true,
    created: true,
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      status: product.status,
      regularPrice: product.regularPrice,
      categories: product.categories,
    },
  });
}
