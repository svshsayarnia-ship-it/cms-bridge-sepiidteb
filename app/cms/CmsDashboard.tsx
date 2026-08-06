"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type {
  CmsCategory,
  CmsConnectionStatus,
  CmsImage,
  CmsProduct,
  CmsProductInput,
  CmsProductsResponse,
} from "../lib/cms-types";
import { CategoryManager } from "./CategoryManager";
import { RichTextEditor } from "./RichTextEditor";

type ApiError = { error?: string; code?: string };

const STATUS_LABELS: Record<CmsProduct["status"], string> = {
  publish: "منتشرشده",
  draft: "پیش‌نویس",
  pending: "در انتظار بررسی",
  private: "خصوصی",
};

const CMS_IMAGE_UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024;

function plainText(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function blankProduct(): CmsProduct {
  return {
    id: 0,
    name: "",
    slug: "",
    sku: "",
    type: "simple",
    status: "draft",
    catalogVisibility: "visible",
    featured: false,
    description: "",
    shortDescription: "",
    seoTitle: "",
metaDescription: "",
focusKeyword: "",

sourceName: "",
sourceUrl: "",

reviewerName: "",
reviewerRole: "",
reviewedAt: "",
    price: "",
    regularPrice: "",
    salePrice: "",
    manageStock: false,
    stockQuantity: null,
    stockStatus: "instock",
    categories: [],
    brands: [],
    images: [],
    permalink: "",
    dateModifiedGmt: "",
  };
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) throw new Error(body.error || `خطای ${response.status}`);
  return body;
}

function productInput(product: CmsProduct): CmsProductInput {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    status: product.status,
    catalogVisibility: product.catalogVisibility,
    featured: product.featured,
    description: product.description,
    shortDescription: product.shortDescription,
    seoTitle: product.seoTitle,
metaDescription: product.metaDescription,
focusKeyword: product.focusKeyword,

sourceName: product.sourceName,
sourceUrl: product.sourceUrl,

reviewerName: product.reviewerName,
reviewerRole: product.reviewerRole,
reviewedAt: product.reviewedAt,
    regularPrice: product.regularPrice,
    salePrice: product.salePrice,
    manageStock: product.manageStock,
    stockQuantity: product.stockQuantity,
    stockStatus: product.stockStatus,
    categoryIds: product.categories.map((category) => category.id),
    images: product.images,
    expectedModifiedGmt: product.dateModifiedGmt || undefined,
  };
}

export function CmsDashboard({ userName }: { userName: string }) {
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [categories, setCategories] = useState<CmsCategory[]>([]);
  const [selected, setSelected] = useState<CmsProduct | null>(null);
  const [connection, setConnection] = useState<CmsConnectionStatus | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const loadProducts = useCallback(
    async (requestedPage: number) => {
      setLoading(true);
      setError("");
      try {
        const query = new URLSearchParams({
          page: String(requestedPage),
          perPage: "30",
          search,
          status,
        });
        const data = await api<CmsProductsResponse>(`/api/cms/products?${query}`);
        setProducts(data.products);
        setPage(data.page);
        setTotal(data.total);
        setTotalPages(Math.max(1, data.totalPages));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "دریافت محصولات ناموفق بود.");
      } finally {
        setLoading(false);
      }
    },
    [search, status],
  );

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
       const connectionData = await api<CmsConnectionStatus>(
  "/api/cms/health",
);

if (cancelled) return;

setConnection(connectionData);

const categoryData = await api<{
  categories: CmsCategory[];
}>("/api/cms/categories");

if (cancelled) return;

setCategories(categoryData.categories);

const productData = await api<CmsProductsResponse>(
  "/api/cms/products?page=1&perPage=30&search=&status=all",
);

if (cancelled) return;

setProducts(productData.products);
setPage(productData.page);
setTotal(productData.total);
setTotalPages(Math.max(1, productData.totalPages));
      } catch (initialError) {
        if (!cancelled) {
          setError(
            initialError instanceof Error
              ? initialError.message
              : "راه‌اندازی CMS ناموفق بود.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const selectedCategoryIds = useMemo(
    () => new Set(selected?.categories.map((category) => category.id) ?? []),
    [selected],
  );

 const premiumReadiness = useMemo(() => {
  if (!selected) {
    return [];
  }

  const shortDescriptionLength =
    plainText(
      selected.shortDescription,
    ).length;

  const descriptionLength =
    plainText(
      selected.description,
    ).length;

  const seoTitleLength =
    selected.seoTitle.trim().length;

  const metaDescriptionLength =
    selected.metaDescription.trim().length;

  const hasValidSourceUrl =
    !selected.sourceUrl.trim() ||
    /^https?:\/\/[^\s]+$/i.test(
      selected.sourceUrl.trim(),
    );

  const hasValidReviewDate =
    !selected.reviewedAt.trim() ||
    !Number.isNaN(
      new Date(
        selected.reviewedAt,
      ).getTime(),
    );

  return [
    {
      label: "نام محصول کامل است",
      ready:
        selected.name.trim().length >= 3,
    },
    {
      label: "نامک محصول مشخص است",
      ready:
        selected.slug.trim().length >= 3,
    },
    {
      label:
        "توضیح کوتاه حداقل ۳۵ نویسه دارد",
      ready:
        shortDescriptionLength >= 35,
    },
    {
      label:
        "توضیحات کامل حداقل ۱۲۰ نویسه دارد",
      ready:
        descriptionLength >= 120,
    },
    {
      label:
        "حداقل یک دسته‌بندی انتخاب شده",
      ready:
        selected.categories.length > 0,
    },
    {
      label:
        "تصویر اصلی محصول اضافه شده",
      ready:
        selected.images.length > 0,
    },
    {
      label:
        "متن جایگزین تصویر اصلی ثبت شده",
      ready: Boolean(
        selected.images[0]?.alt.trim(),
      ),
    },
    {
      label:
        "عنوان سئو بین ۳۰ تا ۶۵ نویسه است",
      ready:
        seoTitleLength >= 30 &&
        seoTitleLength <= 65,
    },
    {
      label:
        "توضیح متا بین ۹۰ تا ۱۶۰ نویسه است",
      ready:
        metaDescriptionLength >= 90 &&
        metaDescriptionLength <= 160,
    },
    {
      label:
        "کلمه کلیدی اصلی مشخص است",
      ready:
        selected.focusKeyword.trim()
          .length >= 2,
    },
    {
      label:
        "نام منبع علمی یا رسمی ثبت شده",
      ready:
        selected.sourceName.trim()
          .length >= 3,
    },
    {
      label:
        "آدرس منبع معتبر است",
      ready:
        Boolean(
          selected.sourceUrl.trim(),
        ) && hasValidSourceUrl,
    },
    {
      label:
        "نام بازبین محتوا ثبت شده",
      ready:
        selected.reviewerName.trim()
          .length >= 3,
    },
    {
      label:
        "سمت یا تخصص بازبین ثبت شده",
      ready:
        selected.reviewerRole.trim()
          .length >= 3,
    },
    {
      label:
        "تاریخ بازبینی معتبر است",
      ready:
        Boolean(
          selected.reviewedAt.trim(),
        ) && hasValidReviewDate,
    },
    {
      label:
        "وضعیت موجودی مشخص است",
      ready:
        Boolean(selected.stockStatus),
    },
  ];
}, [selected]);
const failedReadinessItems =
  premiumReadiness.filter(
    (item) => !item.ready,
  );

const isPublishReady =
  failedReadinessItems.length === 0;
  function edit(patch: Partial<CmsProduct>) {
    setSelected((current) => (current ? { ...current, ...patch } : current));
    setDirty(true);
    setNotice("");
  }

  function choose(product: CmsProduct) {
    if (dirty && !window.confirm("تغییرات ذخیره‌نشده کنار گذاشته شود؟")) return;
    setSelected(structuredClone(product));
    setDirty(false);
    setNotice("");
    setError("");
  }

  function createNew() {
    if (dirty && !window.confirm("تغییرات ذخیره‌نشده کنار گذاشته شود؟")) return;
    setSelected(blankProduct());
    setDirty(false);
    setNotice("");
    setError("");
  }

  async function submit(event: FormEvent) {
   event.preventDefault();

if (!selected || saving) {
  return;
}

if (
  selected.status === "publish" &&
  !isPublishReady
) {
  const missingItems =
    failedReadinessItems
      .slice(0, 4)
      .map((item) => item.label)
      .join("، ");

  setNotice("");
  setError(
    `انتشار انجام نشد. ابتدا موارد ناقص را تکمیل کن: ${missingItems}${
      failedReadinessItems.length > 4
        ? ` و ${
            failedReadinessItems.length - 4
          } مورد دیگر`
        : ""
    }. برای ذخیره موقت، وضعیت محصول را روی «پیش‌نویس» قرار بده.`,
  );

  return;
}

setSaving(true);
    setError("");
    setNotice("");

    try {
      const isNew = selected.id === 0;
      const data = await api<{ product: CmsProduct }>(
        isNew ? "/api/cms/products" : `/api/cms/products/${selected.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(productInput(selected)),
        },
      );
      setSelected(data.product);
      setProducts((current) => {
        const exists = current.some((product) => product.id === data.product.id);
        return exists
          ? current.map((product) =>
              product.id === data.product.id ? data.product : product,
            )
          : [data.product, ...current];
      });
      setDirty(false);
      setNotice(isNew ? "محصول در وردپرس ساخته شد." : "تغییرات در وردپرس ذخیره شد.");
      if (isNew) setTotal((value) => value + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "ذخیره محصول ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  async function trash() {
    if (!selected?.id || saving) return;
    if (!window.confirm(`«${selected.name}» به زباله‌دان منتقل شود؟`)) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/cms/products/${selected.id}`, { method: "DELETE" });
      setProducts((current) => current.filter((product) => product.id !== selected.id));
      setSelected(null);
      setDirty(false);
      setTotal((value) => Math.max(0, value - 1));
      setNotice("محصول به زباله‌دان وردپرس منتقل شد.");
    } catch (trashError) {
      setError(trashError instanceof Error ? trashError.message : "حذف محصول ناموفق بود.");
    } finally {
      setSaving(false);
    }
  }

  function toggleCategory(category: CmsCategory) {
    if (!selected) return;
    const exists = selectedCategoryIds.has(category.id);
    edit({
      categories: exists
        ? selected.categories.filter((item) => item.id !== category.id)
        : [
            ...selected.categories,
            { id: category.id, name: category.name, slug: category.slug },
          ],
    });
  }

async function uploadFiles(files: FileList | null) {
  if (!selected || !files?.length || uploading || saving) return;

  const selectedFiles = Array.from(files);

  const oversized = selectedFiles.find(
    (file) => file.size > CMS_IMAGE_UPLOAD_LIMIT_BYTES,
  );

  if (oversized) {
    setNotice("");
    setError(
      "حجم هر تصویر برای آپلود از CMS باید کمتر از ۴ مگابایت باشد. تصویر را فشرده کن و دوباره آپلود کن.",
    );
    return;
  }

  setUploading(true);
  setSaving(true);
  setError("");
  setNotice("");

  try {
    let currentProduct = selected;

    /*
     * اگر محصول جدید است، ابتدا آن را به‌صورت پیش‌نویس
     * در WooCommerce ایجاد می‌کنیم تا شناسه محصول داشته باشد.
     */
    if (currentProduct.id === 0) {
      if (!currentProduct.name.trim()) {
        throw new Error(
          "قبل از آپلود تصویر، نام محصول را وارد کن.",
        );
      }

      const created = await api<{ product: CmsProduct }>(
        "/api/cms/products",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(
            productInput({
              ...currentProduct,
              status: "draft",
            }),
          ),
        },
      );

      currentProduct = created.product;

      setProducts((products) => [
        created.product,
        ...products.filter(
          (product) => product.id !== created.product.id,
        ),
      ]);

      setTotal((value) => value + 1);
    }

    /*
     * تصاویر مستقیماً داخل Media Library وردپرس آپلود می‌شوند.
     */
    const uploadedImages: CmsImage[] = [];

    for (const file of selectedFiles) {
      const form = new FormData();

      form.set("file", file);
      form.set("alt", currentProduct.name);

      const uploaded = await api<{ image: CmsImage }>(
        "/api/cms/media",
        {
          method: "POST",
          body: form,
        },
      );

      uploadedImages.push(uploaded.image);
    }

    /*
     * عکس‌ها به محصول WooCommerce متصل می‌شوند.
     * اولین عکس آرایه، تصویر اصلی محصول خواهد بود.
     */
    const productWithImages: CmsProduct = {
      ...currentProduct,
     images: [
  ...uploadedImages,
  ...currentProduct.images,
],
    };

    /*
     * ذخیره مستقیم تصاویر روی محصول WooCommerce
     */
    const saved = await api<{ product: CmsProduct }>(
      `/api/cms/products/${currentProduct.id}`,
      {
        method: "PUT",
        headers: {
          "content-type": "application/json",
        },
       body: JSON.stringify({
  ...productInput(productWithImages),
  expectedModifiedGmt: undefined,
}),
      },
    );

    /*
     * اطلاعات نهایی از پاسخ WooCommerce در CMS نمایش داده می‌شود.
     */
    setSelected(saved.product);

    setProducts((products) => {
      const exists = products.some(
        (product) => product.id === saved.product.id,
      );

      if (!exists) {
        return [saved.product, ...products];
      }

      return products.map((product) =>
        product.id === saved.product.id
          ? saved.product
          : product,
      );
    });

    setDirty(false);

    setNotice(
      uploadedImages.length === 1
        ? "تصویر مستقیماً روی محصول ووکامرس ذخیره شد."
        : `${uploadedImages.length} تصویر مستقیماً روی محصول ووکامرس ذخیره شدند.`,
    );
  } catch (uploadError) {
    setError(
      uploadError instanceof Error
        ? uploadError.message
        : "آپلود و اتصال تصویر به محصول ناموفق بود.",
    );
  } finally {
    setUploading(false);
    setSaving(false);
  }
}



  function addImageUrl() {
    if (!selected || !imageUrl.trim()) return;
    let url: URL;
    try {
      url = new URL(imageUrl.trim());
    } catch {
      setError("آدرس تصویر معتبر نیست.");
      return;
    }
    if (!/^https?:$/.test(url.protocol)) {
      setError("آدرس تصویر باید با http یا https شروع شود.");
      return;
    }
    edit({
      images: [
        ...selected.images,
        { id: 0, src: url.toString(), name: "", alt: selected.name },
      ],
    });
    setImageUrl("");
  }

  function makePrimary(index: number) {
    if (!selected || index === 0) return;
    const images = [...selected.images];
    const [image] = images.splice(index, 1);
    images.unshift(image);
    edit({ images });
  }

  return (
    <main id="main-content" className={`spb-cms-root${selected ? " has-selection" : ""}`}>
      <header className="spb-cms-header">
        <div>
          <strong>Sepiid CMS</strong>
          <span>
            {connection
              ? connection.connected
                ? `متصل به ${connection.storeUrl}`
                : `عدم اتصال به ${connection.storeUrl}`
              : "بررسی اتصال..."}
          </span>
        </div>
        <div className="spb-cms-header__status">
          <span className={connection?.connected ? "is-online" : ""}>
            {connection?.connected ? "اتصال برقرار" : connection ? "اتصال ناموفق" : "در حال اتصال"}
          </span>
          <small>{userName}</small>
          <form action="/api/cms/logout" method="post">
            <button type="submit" className="spb-button is-ghost">
              خروج
            </button>
          </form>
        </div>
      </header>

      {connection && !connection.connected && (
        <div className="spb-cms-alert is-error">
          اتصال CMS به WooCommerce برقرار نشد: {connection.message || "وردپرس پاسخ نداد."}
        </div>
      )}
      {connection && !connection.mediaUploadReady && (
        <div className="spb-cms-warning">
          {connection.connected
            ? "ویرایش محصول فعال است؛ برای آپلود مستقیم عکس، افزونه Sepiid Product Bridge نسخه 1.4 یا جدیدتر را نصب کن."
            : "تا زمانی که اتصال WooCommerce برقرار نشود، آپلود عکس و ذخیره محصول هم ناموفق می‌ماند."}
        </div>
      )}
      {error && <div className="spb-cms-alert is-error">{error}</div>}
      {notice && <div className="spb-cms-alert is-success">{notice}</div>}

      {categories.length > 0 && (
        <CategoryManager
          categories={categories}
          onCategoryUpdated={(category) => {
            setCategories((current) =>
              current.map((item) =>
                item.id === category.id
                  ? category
                  : item,
              ),
            );
          }}
        />
      )}

      <div className="spb-cms-layout">
        <aside className="spb-cms-list">
          <div className="spb-cms-list__head">
            <div>
              <h1>محصولات</h1>
              <span>{total} محصول</span>
            </div>
            <button type="button" className="spb-button is-primary" onClick={createNew}>
              محصول جدید
            </button>
          </div>

          <form
            className="spb-cms-search"
            onSubmit={(event) => {
              event.preventDefault();
              void loadProducts(1);
            }}
          >
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جست‌وجوی نام یا SKU"
              aria-label="جست‌وجوی محصول"
            />
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">همه وضعیت‌ها</option>
              <option value="publish">منتشرشده</option>
              <option value="draft">پیش‌نویس</option>
              <option value="pending">در انتظار</option>
              <option value="private">خصوصی</option>
            </select>
            <button type="submit" className="spb-button">اعمال</button>
          </form>

          <div className="spb-product-list" aria-busy={loading}>
            {loading && <div className="spb-cms-empty">در حال دریافت محصولات...</div>}
            {!loading && products.length === 0 && (
              <div className="spb-cms-empty">محصولی با این فیلتر پیدا نشد.</div>
            )}
            {!loading &&
              products.map((product) => (
                <button
                  type="button"
                  key={product.id}
                  className={`spb-product-row${selected?.id === product.id ? " is-active" : ""}`}
                  onClick={() => choose(product)}
                >
                  {product.images[0]?.src ? (
                    // eslint-disable-next-line @next/next/no-img-element -- remote WooCommerce media.
                    <img src={product.images[0].src} alt="" />
                  ) : (
                    <span className="spb-product-row__placeholder">بدون عکس</span>
                  )}
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.sku || "بدون SKU"}</small>
                  </span>
                  <em className={`is-${product.status}`}>{STATUS_LABELS[product.status]}</em>
                </button>
              ))}
          </div>

          <div className="spb-cms-pagination">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => void loadProducts(page - 1)}
            >
              قبلی
            </button>
            <span>صفحه {page} از {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => void loadProducts(page + 1)}
            >
              بعدی
            </button>
          </div>
        </aside>

        <section className="spb-cms-editor">
          {!selected ? (
            <div className="spb-cms-editor__empty">
              <h2>یک محصول را انتخاب کن</h2>
              <p>اطلاعات، تصاویر، قیمت و دسته‌بندی محصول از همین‌جا در وردپرس ویرایش می‌شود.</p>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="spb-cms-editor__toolbar">
                <button type="button" className="spb-mobile-back" onClick={() => setSelected(null)}>
                  بازگشت به فهرست
                </button>
                <div>
                  <h2>{selected.id ? selected.name || "ویرایش محصول" : "محصول جدید"}</h2>
                  <span>{dirty ? "تغییرات ذخیره‌نشده" : "همگام با وردپرس"}</span>
                </div>
                <div className="spb-cms-actions">
                  {selected.permalink && (
                    <a href={selected.permalink} target="_blank" rel="noreferrer" className="spb-button">
                      مشاهده
                    </a>
                  )}
                  <button type="submit" className="spb-button is-primary" disabled={saving || uploading}>
                    {saving ? "در حال ذخیره..." : "ذخیره در وردپرس"}
                  </button>
                </div>
              </div>

              <div className="spb-premium-panel">
                <div>
                  <span>PREMIUM PUBLISH CHECK</span>
                  <h3>آماده‌سازی محصول برای نسخه پریمیوم سایت</h3>
                  <p>
                    قبل از انتشار، این چک‌لیست کمک می‌کند کارت محصول، صفحه محصول و
                    خروجی ووکامرس با ظاهر کامل سایت هماهنگ بماند.
                  </p>
                </div>
                <ul>
                  {premiumReadiness.map((item) => (
                    <li className={item.ready ? "is-ready" : ""} key={item.label}>
                      <i />
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="spb-cms-section">
                <h3>اطلاعات اصلی</h3>
                <div className="spb-form-grid">
                  <label className="is-wide">
                    <span>نام محصول</span>
                    <input required value={selected.name} onChange={(event) => edit({ name: event.target.value })} />
                  </label>
                  <label>
                    <span>SKU</span>
                    <input value={selected.sku} onChange={(event) => edit({ sku: event.target.value })} />
                  </label>
                  <label>
                    <span>نامک</span>
                    <input dir="ltr" value={selected.slug} onChange={(event) => edit({ slug: event.target.value })} />
                  </label>
                  <label>
                    <span>وضعیت</span>
                    <select
                      value={selected.status}
                      onChange={(event) => edit({ status: event.target.value as CmsProduct["status"] })}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>نمایش در فروشگاه</span>
                    <select
                      value={selected.catalogVisibility}
                      onChange={(event) =>
                        edit({ catalogVisibility: event.target.value as CmsProduct["catalogVisibility"] })
                      }
                    >
                      <option value="visible">فروشگاه و جست‌وجو</option>
                      <option value="catalog">فقط فروشگاه</option>
                      <option value="search">فقط جست‌وجو</option>
                      <option value="hidden">مخفی</option>
                    </select>
                  </label>
                  <label className="spb-check-field">
                    <input
                      type="checkbox"
                      checked={selected.featured}
                      onChange={(event) => edit({ featured: event.target.checked })}
                    />
                    <span>محصول ویژه</span>
                  </label>
                </div>
              </div>

              <div className="spb-cms-section">
                <h3>توضیحات</h3>
                <RichTextEditor
                  label="توضیح کوتاه"
                  value={selected.shortDescription}
                  onChange={(shortDescription) => edit({ shortDescription })}
                  minHeight={90}
                />
                <RichTextEditor
                  label="توضیحات کامل"
                  value={selected.description}
                  onChange={(description) => edit({ description })}
                  minHeight={210}
                />
              </div>

              <div className="spb-cms-section">
               
  <h3>سئو و اعتبار محتوا</h3>

  <div className="spb-form-grid">
    <label className="is-wide">
      <span>عنوان سئو</span>
      <input
        value={selected.seoTitle}
        onChange={(event) =>
          edit({ seoTitle: event.target.value })
        }
        placeholder="مثلاً خرید نورامیس دیپ لیدوکائین"
      />
    </label>

    <label className="is-wide">
      <span>توضیحات متا</span>
      <textarea
        value={selected.metaDescription}
        onChange={(event) =>
          edit({ metaDescription: event.target.value })
        }
        placeholder="خلاصه اختصاصی صفحه برای نتایج گوگل"
      />
    </label>

    <label>
      <span>کلمه کلیدی اصلی</span>
      <input
        value={selected.focusKeyword}
        onChange={(event) =>
          edit({ focusKeyword: event.target.value })
        }
      />
    </label>

    <label>
      <span>نام منبع</span>
      <input
        value={selected.sourceName}
        onChange={(event) =>
          edit({ sourceName: event.target.value })
        }
      />
    </label>

    <label className="is-wide">
      <span>لینک منبع</span>
      <input
        dir="ltr"
        value={selected.sourceUrl}
        onChange={(event) =>
          edit({ sourceUrl: event.target.value })
        }
      />
    </label>

    <label>
      <span>نام بازبین</span>
      <input
        value={selected.reviewerName}
        onChange={(event) =>
          edit({ reviewerName: event.target.value })
        }
      />
    </label>

    <label>
      <span>سمت یا تخصص بازبین</span>
      <input
        value={selected.reviewerRole}
        onChange={(event) =>
          edit({ reviewerRole: event.target.value })
        }
      />
    </label>

    <label>
  <span>تاریخ بررسی</span>
  <input
    type="date"
    value={selected.reviewedAt}
    onChange={(event) =>
      edit({
        reviewedAt: event.target.value,
      })
    }
  />
</label>
  </div>
</div>
                <div className="spb-cms-section">
                <h3>قیمت و موجودی</h3>
                <div className="spb-form-grid">
                  <label>
                    <span>قیمت عادی</span>
                    <input
                      inputMode="numeric"
                      dir="ltr"
                      value={selected.regularPrice}
                      onChange={(event) => edit({ regularPrice: event.target.value.replace(/[^0-9.]/g, "") })}
                      placeholder="مثلاً 4500000"
                    />
                  </label>
                  <label>
                    <span>قیمت فروش ویژه</span>
                    <input
                      inputMode="numeric"
                      dir="ltr"
                      value={selected.salePrice}
                      onChange={(event) => edit({ salePrice: event.target.value.replace(/[^0-9.]/g, "") })}
                    />
                  </label>
                  <label>
                    <span>وضعیت موجودی</span>
                    <select
                      value={selected.stockStatus}
                      onChange={(event) => edit({ stockStatus: event.target.value as CmsProduct["stockStatus"] })}
                    >
                      <option value="instock">موجود</option>
                      <option value="outofstock">ناموجود</option>
                      <option value="onbackorder">سفارش با تأخیر</option>
                    </select>
                  </label>
                  <label className="spb-check-field">
                    <input
                      type="checkbox"
                      checked={selected.manageStock}
                      onChange={(event) => edit({ manageStock: event.target.checked })}
                    />
                    <span>مدیریت تعداد موجودی</span>
                  </label>
                  {selected.manageStock && (
                    <label>
                      <span>تعداد موجود</span>
                      <input
                        type="number"
                        min="0"
                        value={selected.stockQuantity ?? ""}
                        onChange={(event) =>
                          edit({ stockQuantity: event.target.value === "" ? null : Number(event.target.value) })
                        }
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="spb-cms-section">
                <h3>دسته‌بندی‌ها</h3>
                <div className="spb-category-grid">
                  {categories.map((category) => (
                    <label key={category.id}>
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.has(category.id)}
                        onChange={() => toggleCategory(category)}
                      />
                      <span>{category.name}</span>
                      <small>{category.count}</small>
                    </label>
                  ))}
                </div>
              </div>

              <div className="spb-cms-section">
                <div className="spb-section-head">
                  <div>
                    <h3>تصاویر</h3>
                    <p>تصویر اول، تصویر اصلی محصول است.</p>
                  </div>
                  <label className={`spb-button is-primary${!connection?.mediaUploadReady ? " is-disabled" : ""}`}>
                    {uploading ? "در حال آپلود..." : "آپلود عکس"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      disabled={uploading || !connection?.mediaUploadReady}
                      onChange={(event) => {
                        void uploadFiles(event.target.files);
                        event.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <div className="spb-image-url">
                  <input
                    dir="ltr"
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder="یا آدرس مستقیم تصویر را وارد کن"
                  />
                  <button type="button" className="spb-button" onClick={addImageUrl}>افزودن آدرس</button>
                </div>
                {selected.images.length === 0 ? (
                  <div className="spb-cms-empty is-compact">هنوز تصویری برای این محصول ثبت نشده است.</div>
                ) : (
                  <div className="spb-image-grid">
                    {selected.images.map((image, index) => (
                      <figure key={`${image.id}-${image.src}-${index}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- remote WooCommerce media. */}
                        <img src={image.src} alt={image.alt || selected.name} />
                        <figcaption>
                          <span>{index === 0 ? "تصویر اصلی" : `تصویر ${index + 1}`}</span>
                          <div>
                            {index > 0 && (
                              <button type="button" onClick={() => makePrimary(index)}>اصلی</button>
                            )}
                            <button
                              type="button"
                              className="is-danger"
                              onClick={() => edit({ images: selected.images.filter((_, itemIndex) => itemIndex !== index) })}
                            >
                              حذف
                            </button>
                          </div>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </div>

              {selected.id > 0 && (
                <div className="spb-cms-danger-zone">
                  <div>
                    <strong>انتقال به زباله‌دان</strong>
                    <span>محصول از فروشگاه حذف می‌شود و در وردپرس قابل بازیابی است.</span>
                  </div>
                  <button type="button" className="spb-button is-danger" onClick={() => void trash()} disabled={saving}>
                    انتقال به زباله‌دان
                  </button>
                </div>
              )}
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
