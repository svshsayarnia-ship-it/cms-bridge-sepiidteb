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
          lastModified: file.lastModified,
        },
      );
      const form = new FormData();
      form.set("file", renamedFile);
      form.set(
        "alt",
        target.kind === "card"
          ? `تصویر اصلی ${currentProduct.name}`
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
          ? "عکس اصلی CMS ذخیره شد و در همه بخش‌های ویترین استفاده می‌شود."
          : `عکس اختصاصی ${target.variantName} ذخیره شد.`,
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
          ? "عکس اصلی CMS حذف شد؛ تا ثبت عکس جدید عکس CMS قدیمی محصول حفظ می‌شود و تصویر مستقیم ووکامرس استفاده نمی‌شود."
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
          <h2>منبع واحد تصاویر: CMS</h2>
          <p>
            عکس اصلی محصول و عکس هر مدل از همین بخش کنترل می‌شوند. تصاویر Featured یا Gallery ووکامرس در ویترین سایت نادیده گرفته می‌شوند.
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
              {cardImage?.src ? (
                // eslint-disable-next-line @next/next/no-img-element -- CMS media can be remote.
                <img src={cardImage.src} alt={cardImage.alt || selected.name} />
              ) : (
                <span>عکس اصلی CMS ثبت نشده</span>
              )}
            </div>
            <div>
              <small>منبع نمایش عمومی</small>
              <strong>{selected.name}</strong>
              <p>همه کارت‌ها، پیشنهادها، لیست‌ها و نمای پایه صفحه محصول از عکس اصلی CMS دستور می‌گیرند؛ انتخاب مدل، فقط عکس اختصاصی همان مدل را جایگزین می‌کند.</p>
            </div>
          </div>

          <article className="spb-role-card is-card-role">
            <div className="spb-role-card__visual">
              {cardImage?.src ? (
                // eslint-disable-next-line @next/next/no-img-element -- CMS media can be remote.
                <img src={cardImage.src} alt={cardImage.alt || selected.name} />
              ) : (
                <span>هنوز عکس اصلی CMS ندارد</span>
              )}
            </div>
            <div className="spb-role-card__content">
              <small>تصویر پایه همه سطوح</small>
              <h3>عکس اصلی محصول / CMS Primary</h3>
              <p>این تصویر روی کارت محصول، صفحه اصلی، دسته‌بندی، نتایج، پیشنهادها و حالت پایه صفحه محصول استفاده می‌شود.</p>
              <div className="spb-role-card__actions">
                <label className={`spb-button is-primary${!connection?.mediaUploadReady ? " is-disabled" : ""}`}>
                  {workingKey === "card" ? "در حال ذخیره..." : cardImage ? "تعویض عکس اصلی" : "آپلود عکس اصلی"}
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
                    حذف عکس اصلی
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
                  ? "برای هر مدل عکس دقیق همان بسته را جداگانه بارگذاری کن؛ هیچ مدل عکس خواهر/برادر خودش را به ارث نمی‌برد."
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
                          // eslint-disable-next-line @next/next/no-img-element -- CMS media can be remote.
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
