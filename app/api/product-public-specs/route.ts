import { NextRequest, NextResponse } from "next/server";
import { catalogProducts } from "../../catalog";
import { canonicalInventorySlug } from "../../current-inventory";

const SAFE_SPEC_LABELS = new Map<string, string>([
  ["نام رسمی", "نام رسمی"],
  ["برند", "برند"],
  ["سازنده", "سازنده"],
  ["کشور سازنده", "کشور سازنده"],
  ["کشور", "کشور سازنده"],
  ["گروه محصول", "نوع محصول"],
  ["گروه", "نوع محصول"],
  ["نوع محصول", "نوع محصول"],
  ["طبقه‌بندی سازنده", "طبقه‌بندی سازنده"],
  ["مدل", "مدل"],
  ["مدل‌های موجود", "مدل‌های موجود"],
  ["حجم", "حجم"],
  ["حجم کل", "حجم کل"],
  ["حجم هر سرنگ", "حجم هر سرنگ"],
  ["حجم هر ویال", "حجم هر ویال"],
  ["تعداد", "تعداد"],
  ["تعداد ست", "تعداد ست"],
  ["تعداد جعبه", "تعداد جعبه"],
  ["تعداد و حجم", "تعداد و حجم"],
  ["واحد بسته‌بندی", "واحد بسته‌بندی"],
  ["محتویات", "محتویات بسته"],
  ["بسته", "بسته‌بندی"],
  ["بسته رایج", "بسته‌بندی"],
  ["شکل بسته", "شکل بسته"],
  ["شکل محصول", "شکل محصول"],
  ["سرنگ", "سرنگ"],
  ["ویال", "ویال"],
  ["قدرت", "قدرت درج‌شده"],
  ["غلظت درج‌شده", "غلظت درج‌شده"],
  ["غلظت هیالورونیک اسید", "غلظت هیالورونیک اسید"],
  ["ترکیبات فعال اعلام‌شده", "ترکیبات فعال اعلام‌شده"],
  ["ترکیبات اعلام‌شده", "ترکیبات اعلام‌شده"],
  ["ترکیب اعلام‌شده", "ترکیب اعلام‌شده"],
  ["پپتیدهای اعلام‌شده", "پپتیدهای اعلام‌شده"],
  ["شرایط نگهداری", "شرایط نگهداری"],
  ["شرایط نگهداری اعلام‌شده", "شرایط نگهداری"],
  ["وضعیت عرضه", "وضعیت عرضه"],
  ["وضعیت اطلاعات", "وضعیت اطلاعات"],
  ["اطلاعات سازنده", "اطلاعات سازنده"],
]);

function cleanValue(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pushRow(
  rows: Array<[string, string]>,
  seen: Set<string>,
  label: string,
  value?: string,
) {
  const clean = value ? cleanValue(value) : "";
  if (!clean || seen.has(label)) return;
  seen.add(label);
  rows.push([label, clean]);
}

export async function GET(request: NextRequest) {
  const requestedSlug = request.nextUrl.searchParams.get("slug")?.trim() ?? "";
  if (!requestedSlug) {
    return NextResponse.json({ error: "missing_slug" }, { status: 400 });
  }

  const slug = canonicalInventorySlug(decodeURIComponent(requestedSlug));
  const product = catalogProducts.find((item) => item.slug === slug);

  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const rows: Array<[string, string]> = [];
  const seen = new Set<string>();

  pushRow(rows, seen, "برند", product.brand);
  pushRow(rows, seen, "دسته محصول", product.categoryTitle);
  pushRow(rows, seen, "حجم / بسته", product.volume);

  for (const [rawLabel, rawValue] of product.specs) {
    const label = SAFE_SPEC_LABELS.get(rawLabel);
    if (!label) continue;
    pushRow(rows, seen, label, rawValue);
  }

  return NextResponse.json(
    {
      slug: product.slug,
      nameFa: product.nameFa,
      rows,
      audience: cleanValue(product.audience || ""),
      warning: cleanValue(product.warning || ""),
      sourceStatus: cleanValue(product.sourceStatus || ""),
      reviewedAt: product.reviewedAt || "",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
