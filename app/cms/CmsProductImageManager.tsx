"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  CmsConnectionStatus,
  CmsImage,
  CmsProduct,
  CmsProductsResponse,
} from "../lib/cms-types";
import {
  cardImageRoleToken,
  findCardRoleImage,
  findVariantRoleImage,
  isCardRoleImage,
  isVariantRoleImage,
  roleUploadFileName,
  variantImageRoleToken,
} from "../lib/product-image-roles";

export type CmsImageFamilyDefinition = {
  slug: string;
  nameFa: string;
  variants: Array<{
    id: string;
    label: string;
    nameFa: string;
    nameEn: string;
  }>;
};

type ApiError = { error?: string };

type ImageTarget =
  | { kind: "card" }
  | { kind: "variant"; variantId: string; variantName: string };

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) throw new Error(body.error || `خطای ${response.status}`);
  return body;
}

function roleIdentity(image: CmsImage): string {
  return `${image.name} ${image.src}`.toLowerCase();
}

function isManagedRoleImage(image: CmsImage): boolean {
  return roleIdentity(image).includes("sepiid-role-");
}

function resolveFamily(
  productSlug: string,
  families: CmsImageFamilyDefinition[],
): CmsImageFamilyDefinition | null {
  const exact = families.find((family) => family.slug === productSlug);
  if (exact) return exact;

  const duplicate = productSlug.match(/^(.*)-(\d+)$/u);
  if (!duplicate) return null;

  const suffix = Number(duplicate[2]);
  if (!Number.isInteger(suffix) || suffix < 2 || suffix > 20) return null;
  return families.find((family) => family.slug === duplicate[1]) ?? null;
}

function replaceProductInList(
  products: CmsProduct[],
  product: CmsProduct,
): CmsProduct[] {
  return products.map((item) => (item.id === product.id ? product : item));
}

export function CmsProductImageManager({
  families,
}: {
  families: CmsImageFamilyDefinition[];
}) {
  const [products, setProducts] = useState<CmsProduct[]>([]);
  const [selectedId, setSelectedId] = useState<number>(0);
  const [connection, setConnection] = useState<CmsConnectionStatus | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [workingKey, setWorkingKey] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [health, productData] = await Promise.all([
          api<CmsConnectionStatus>("/api/cms/health"),
          api<CmsProductsResponse>(
            "/api/cms/products?page=1&perPage=100&search=&status=all",
          ),
        ]);

        if (cancelled) return;
        setConnection(health);
        setProducts(productData.products);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت محصولات برای مدیریت تصویر ناموفق بود.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("fa");
    if (!term) return products;

    return products.filter((product) =>
      `${product.name} ${product.slug} ${product.sku}`
        .toLocaleLowerCase("fa")
        .includes(term),
    );
  }, [products, search]);

  const selected = products.find((product) => product.id === selectedId) ?? null;
  const family = selected ? resolveFamily(selected.slug, families) : null;
  const roleSlugs = selected
    ? Array.from(new Set([selected.slug, family?.slug ?? ""].filter(Boolean)))
    : [];
  const masterImage =
    selected?.images.find((image) => !isManagedRoleImage(image)) ??
    selected?.images[0] ??
    null;
  const cardImage = selected
    ? findCardRoleImage(selected.images, roleSlugs)
    : null;

  async function refreshProduct(productId: number): Promise<CmsProduct> {
    const data = await api<{ product: CmsProduct }>(
      `/api/cms/products/${productId}`,
    );
    return data.product;
  }

  async function saveImages(
    currentProduct: CmsProduct,
    images: CmsImage[],
  ): Promise<CmsProduct> {
    const saved = await api<{ product: CmsProduct }>(
      `/api/cms/products/${currentProduct.id}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: currentProduct.name,
          images,
        }),
      },
    );

    setProducts((items) => replaceProductInList(items, saved.product));
    return saved.product;
  }

  async function uploadRole(
    files: FileList | null,
    target: ImageTarget,
  ) {
    if (!selected || !files?.length || workingKey) return;

    if (files.length !== 1) {
      setNotice("");
      setError("برای هر جایگاه فقط یک تصویر انتخاب کن.");
      return;
    }

    const file = files[0];
    if (file.size > MAX_IMAGE_BYTES) {
      setNotice("");
      setError("حجم تصویر باید کمتر از ۴ مگابایت باشد.");
      return;
    }

    const key = target.kind === "card" ? "card" : `variant:${target.variantId}`;
    setWorkingKey(key);
    setError("");
    setNotice("");

    try {
      const currentProduct = await refreshProduct(selected.id);
      const currentFamily = resolveFamily(currentProduct.slug, families);
      const currentRoleSlugs = Array.from(
        new Set(
          [currentProduct.slug, currentFamily?.slug ?? ""].filter(Boolean),
        ),
      );
      const token =
        target.kind === "card"
          ? cardImageRoleToken(currentProduct.slug)
          : variantImageRoleToken(currentProduct.slug, target.variantId);
      const renamedFile = new File(
        [file],
        roleUploadFileName(file.name, token),
        {
          type: file.type,
          lastModified: Date.now(),
        },
      );
      const form = new FormData();
      form.set("file", renamedFile);
      form.set(
        "alt",
        target.kind === "card"
          ? `تصویر کارت ${currentProduct.name}`
          : `تصویر ${target.variantName}`,
      );

      const uploaded = await api<{ image: CmsImage }>("/api/cms/media", {
        method: "POST",
        body: form,
      });

      const retainedImages = currentProduct.images.filter((image) =>
        target.kind === "card"
          ? !isCardRoleImage(image, currentRoleSlugs)
          : !isVariantRoleImage(
              image,
              currentRoleSlugs,
              target.variantId,
            ),
      );

      await saveImages(currentProduct, [...retainedImages, uploaded.image]);
      setNotice(
        target.kind === "card"
          ? "عکس بیرونی محصول ذخیره شد."
          : `عکس ${target.variantName} ذخیره شد.`,
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "ذخیره تصویر ناموفق بود.",
      );
    } finally {
      setWorkingKey("");
    }
  }

  async function removeRole(target: ImageTarget) {
    if (!selected || workingKey) return;

    const key = target.kind === "card" ? "card" : `variant:${target.variantId}`;
    setWorkingKey(key);
    setError("");
    setNotice("");

    try {
      const currentProduct = await refreshProduct(selected.id);
      const currentFamily = resolveFamily(currentProduct.slug, families);
      const currentRoleSlugs = Array.from(
        new Set(
          [currentProduct.slug, currentFamily?.slug ?? ""].filter(Boolean),
        ),
      );
      const images = currentProduct.images.filter((image) =>
        target.kind === "card"
          ? !isCardRoleImage(image, currentRoleSlugs)
          : !isVariantRoleImage(
              image,
              currentRoleSlugs,
              target.variantId,
            ),
      );

      await saveImages(currentProduct, images);
      setNotice(
        target.kind === "card"
          ? "عکس بیرونی محصول حذف شد؛ کارت از تصویر پیش‌فرض استفاده می‌کند."
          : `عکس اختصاصی ${target.variantName} حذف شد.`,
      );
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "حذف تصویر ناموفق بود.",
      );
    } finally {
      setWorkingKey("");
    }
  }

  return (
    <section className="spb-role-manager" aria-busy={loading}>
      <div className="spb-role-manager__head">
        <div>
          <span className="spb-role-manager__eyebrow">مدیریت تصویر محصول</span>
          <h2>عکس کارت بیرونی و عکس هر مدل</h2>
          <p>
            عکس Master صفحه محصول دست‌نخورده می‌ماند. برای خانواده‌های چندمدلی، هر مدل جایگاه مستقل خودش را دارد.
          </p>
        </div>
        <span className={connection?.mediaUploadReady ? "is-ready" : "is-offline"}>
          {connection?.mediaUploadReady ? "آپلود مستقیم فعال" : "آپلود مستقیم غیرفعال"}
        </span>
      </div>

      {error && <div className="spb-role-manager__alert is-error">{error}</div>}
      {notice && <div className="spb-role-manager__alert is-success">{notice}</div>}

      <div className="spb-role-manager__picker">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="جست‌وجوی نام، نامک یا SKU"
          aria-label="جست‌وجوی محصول برای مدیریت تصویر"
        />
        <select
          value={selectedId || ""}
          onChange={(event) => {
            setSelectedId(Number(event.target.value) || 0);
            setError("");
            setNotice("");
          }}
          disabled={loading}
        >
          <option value="">{loading ? "در حال دریافت محصولات..." : "یک محصول را انتخاب کن"}</option>
          {filteredProducts.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}{product.sku ? ` · ${product.sku}` : ""}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="spb-role-manager__body">
          <div className="spb-role-manager__summary">
            <div className="spb-role-manager__preview">
              {masterImage?.src ? (
                // eslint-disable-next-line @next/next/no-img-element -- WooCommerce media is remote.
                <img src={masterImage.src} alt={masterImage.alt || selected.name} />
              ) : (
                <span>بدون Master</span>
              )}
            </div>
            <div>
              <small>تصویر اصلی صفحه محصول / Master</small>
              <strong>{selected.name}</strong>
              <p>این تصویر از بخش اصلی CMS مدیریت می‌شود و این قسمت آن را تغییر نمی‌دهد.</p>
            </div>
          </div>

          <article className="spb-role-card is-card-role">
            <div className="spb-role-card__visual">
              {cardImage?.src ? (
                // eslint-disable-next-line @next/next/no-img-element -- WooCommerce media is remote.
                <img src={cardImage.src} alt={cardImage.alt || selected.name} />
              ) : (
                <span>از Master استفاده می‌شود</span>
              )}
            </div>
            <div className="spb-role-card__content">
              <small>قبل از کلیک کاربر</small>
              <h3>عکس بیرونی محصول / Product Card</h3>
              <p>فقط روی کارت‌های صفحه اصلی، دسته‌بندی و لیست محصولات نمایش داده می‌شود.</p>
              <div className="spb-role-card__actions">
                <label className={`spb-button is-primary${!connection?.mediaUploadReady ? " is-disabled" : ""}`}>
                  {workingKey === "card" ? "در حال ذخیره..." : cardImage ? "تعویض عکس کارت" : "آپلود عکس کارت"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    disabled={Boolean(workingKey) || !connection?.mediaUploadReady}
                    onChange={(event) => {
                      void uploadRole(event.target.files, { kind: "card" });
                      event.target.value = "";
                    }}
                  />
                </label>
                {cardImage && (
                  <button
                    type="button"
                    className="spb-button is-danger"
                    disabled={Boolean(workingKey)}
                    onClick={() => void removeRole({ kind: "card" })}
                  >
                    حذف عکس کارت
                  </button>
                )}
              </div>
            </div>
          </article>

          <div className="spb-role-manager__variants">
            <div className="spb-role-manager__variants-head">
              <div>
                <small>خانواده محصول</small>
                <h3>{family ? `${family.nameFa} · ${family.variants.length.toLocaleString("fa-IR")} مدل` : "محصول تک‌مدلی"}</h3>
              </div>
              <p>
                {family
                  ? "برای هر مدل عکس دقیق همان بسته را جداگانه بارگذاری کن."
                  : "برای این محصول در کاتالوگ فعلی مدل جداگانه‌ای تعریف نشده است."}
              </p>
            </div>

            {family && (
              <div className="spb-role-manager__variant-grid">
                {family.variants.map((variant) => {
                  const image = findVariantRoleImage(
                    selected.images,
                    roleSlugs,
                    variant.id,
                  );
                  const key = `variant:${variant.id}`;

                  return (
                    <article className="spb-role-card" key={variant.id}>
                      <div className="spb-role-card__visual">
                        {image?.src ? (
                          // eslint-disable-next-line @next/next/no-img-element -- WooCommerce media is remote.
                          <img src={image.src} alt={image.alt || variant.nameFa} />
                        ) : (
                          <span>هنوز عکس اختصاصی ندارد</span>
                        )}
                      </div>
                      <div className="spb-role-card__content">
                        <small>{variant.label}</small>
                        <h4>{variant.nameFa}</h4>
                        <em dir="ltr">{variant.nameEn}</em>
                        <div className="spb-role-card__actions">
                          <label className={`spb-button is-primary${!connection?.mediaUploadReady ? " is-disabled" : ""}`}>
                            {workingKey === key ? "در حال ذخیره..." : image ? "تعویض عکس مدل" : "آپلود عکس این مدل"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              multiple
                              disabled={Boolean(workingKey) || !connection?.mediaUploadReady}
                              onChange={(event) => {
                                void uploadRole(event.target.files, {
                                  kind: "variant",
                                  variantId: variant.id,
                                  variantName: variant.nameFa,
                                });
                                event.target.value = "";
                              }}
                            />
                          </label>
                          {image && (
                            <button
                              type="button"
                              className="spb-button is-danger"
                              disabled={Boolean(workingKey)}
                              onClick={() =>
                                void removeRole({
                                  kind: "variant",
                                  variantId: variant.id,
                                  variantName: variant.nameFa,
                                })
                              }
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
