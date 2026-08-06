"use client";

import {
  FormEvent,
  useState,
} from "react";

import type {
  CmsCategory,
  CmsCategoryInput,
  CmsImage,
} from "../lib/cms-types";

type ApiError = {
  error?: string;
};

type CategoryManagerProps = {
  categories: CmsCategory[];
  onCategoryUpdated: (
    category: CmsCategory,
  ) => void;
};

async function api<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
  });

  const body = (
    await response
      .json()
      .catch(() => ({}))
  ) as T & ApiError;

  if (!response.ok) {
    throw new Error(
      body.error ||
        `خطای ${response.status}`,
    );
  }

  return body;
}

function categoryInput(
  category: CmsCategory,
): CmsCategoryInput {
  return {
    name: category.name,
    slug: category.slug,
    description:
      category.description,
    image: category.image,
  };
}

export function CategoryManager({
  categories,
  onCategoryUpdated,
}: CategoryManagerProps) {
  const [selectedId, setSelectedId] =
    useState<number>(
      () => categories[0]?.id ?? 0,
    );

  const [draft, setDraft] =
    useState<CmsCategory | null>(
      () =>
        categories[0]
          ? structuredClone(
              categories[0],
            )
          : null,
    );

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [notice, setNotice] =
    useState("");

  const [error, setError] =
    useState("");



  function selectCategory(
    id: number,
  ) {
    const category =
      categories.find(
        (item) => item.id === id,
      );

    setSelectedId(id);
    setDraft(
      category
        ? structuredClone(category)
        : null,
    );

    setNotice("");
    setError("");
  }

  function edit(
    patch: Partial<CmsCategory>,
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            ...patch,
          }
        : current,
    );

    setNotice("");
    setError("");
  }

  async function uploadImage(
    file: File | undefined,
  ) {
    if (
      !draft ||
      !file ||
      uploading ||
      saving
    ) {
      return;
    }

    if (
      file.size >
      4 * 1024 * 1024
    ) {
      setError(
        "حجم تصویر باید کمتر از ۴ مگابایت باشد.",
      );
      return;
    }

    setUploading(true);
    setNotice("");
    setError("");

    try {
      const form = new FormData();

      form.set("file", file);
      form.set(
        "alt",
        draft.name,
      );

      const result = await api<{
        image: CmsImage;
      }>("/api/cms/media", {
        method: "POST",
        body: form,
      });

      edit({
        image: result.image,
      });

      setNotice(
        "تصویر در کتابخانه وردپرس آپلود شد. برای اتصال به دسته‌بندی، ذخیره را بزن.",
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "آپلود تصویر ناموفق بود.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      !draft ||
      saving ||
      uploading
    ) {
      return;
    }

    setSaving(true);
    setNotice("");
    setError("");

    try {
      const result = await api<{
        category: CmsCategory;
      }>(
        `/api/cms/categories/${draft.id}`,
        {
          method: "PUT",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify(
            categoryInput(draft),
          ),
        },
      );

      setDraft(result.category);
      onCategoryUpdated(
        result.category,
      );

      setNotice(
        "تغییرات دسته‌بندی در WooCommerce ذخیره شد.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "ذخیره دسته‌بندی ناموفق بود.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="spb-cms-section">
      <div>
        <span>
          STOREFRONT CATEGORIES
        </span>

        <h2>
          مدیریت دسته‌بندی‌های فروشگاه
        </h2>

        <p>
          عنوان، نامک، توضیحات و
          تصویر دسته‌بندی مستقیماً
          در WooCommerce ذخیره می‌شود.
        </p>
      </div>

      {error && (
        <div className="spb-cms-alert is-error">
          {error}
        </div>
      )}

      {notice && (
        <div className="spb-cms-alert is-success">
          {notice}
        </div>
      )}

      {!draft ? (
        <div className="spb-cms-empty">
          دسته‌بندی‌ای دریافت نشد.
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="spb-form-grid">
            <label className="is-wide">
              <span>
                انتخاب دسته‌بندی
              </span>

              <select
                value={selectedId}
                onChange={(event) =>
                  selectCategory(
                    Number(
                      event.target.value,
                    ),
                  )
                }
              >
                {categories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              <span>
                عنوان دسته‌بندی
              </span>

              <input
                required
                value={draft.name}
                onChange={(event) =>
                  edit({
                    name:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              <span>نامک</span>

              <input
                dir="ltr"
                value={draft.slug}
                onChange={(event) =>
                  edit({
                    slug:
                      event.target.value,
                  })
                }
              />
            </label>

            <label className="is-wide">
              <span>
                توضیحات دسته‌بندی
              </span>

              <textarea
                rows={5}
                value={
                  draft.description
                }
                onChange={(event) =>
                  edit({
                    description:
                      event.target.value,
                  })
                }
              />
            </label>
          </div>

          <div className="spb-cms-section">
            <h3>
              تصویر دسته‌بندی
            </h3>

            {draft.image?.src && (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element -- remote WordPress media */}
                <img
                  src={
                    draft.image.src
                  }
                  alt={
                    draft.image.alt ||
                    draft.name
                  }
                  width={240}
                  height={160}
                />

                <button
                  type="button"
                  className="spb-button is-ghost"
                  onClick={() =>
                    edit({
                      image: null,
                    })
                  }
                >
                  حذف تصویر
                </button>
              </div>
            )}

            <label>
              <span>
                آپلود تصویر جدید
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={
                  uploading || saving
                }
                onChange={(event) => {
                  void uploadImage(
                    event.target
                      .files?.[0],
                  );

                  event.target.value =
                    "";
                }}
              />
            </label>
          </div>

          <button
            type="submit"
            className="spb-button is-primary"
            disabled={
              saving || uploading
            }
          >
            {saving
              ? "در حال ذخیره..."
              : uploading
                ? "در حال آپلود..."
                : "ذخیره دسته‌بندی در وردپرس"}
          </button>
        </form>
      )}
    </section>
  );
}