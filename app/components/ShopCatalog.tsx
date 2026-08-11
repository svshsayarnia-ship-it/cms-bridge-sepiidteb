"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Product } from "../data";
import { CloseIcon, FilterIcon, SearchIcon } from "./Icons";
import { ProductCard } from "./ProductCard";

export function ShopCatalog({
  items,
  initialCategory,
  categoryOptions = [],
}: {
  items: Product[];
  initialCategory?: string;
  categoryOptions?: Category[];
}) {
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState("all");
  const [category, setCategory] = useState(initialCategory ?? "all");
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!filtersOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const drawer = drawerRef.current;
    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    const focusable = () =>
      Array.from(drawer?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);

    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFiltersOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const controls = focusable();
      const first = controls[0];
      const last = controls.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [filtersOpen]);

  const brands = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.brand.trim()).filter(Boolean)),
      ).sort((first, second) => first.localeCompare(second, "fa")),
    [items],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa");
    const result = items.filter((item) => {
      const matchesQuery =
        !normalized ||
        [
          item.nameFa,
          item.nameEn,
          item.brand,
          item.shortBenefit,
          item.volume ?? "",
          item.categoryTitle,
        ]
          .join(" ")
          .toLocaleLowerCase("fa")
          .includes(normalized);
      const matchesBrand = brand === "all" || item.brand === brand;
      const matchesCategory = category === "all" || item.category === category;
      return matchesQuery && matchesBrand && matchesCategory;
    });

    if (sort === "name") {
      return [...result].sort((a, b) => a.nameFa.localeCompare(b.nameFa, "fa"));
    }
    if (sort === "brand") {
      return [...result].sort((a, b) => a.brand.localeCompare(b.brand));
    }
    return result;
  }, [brand, category, items, query, sort]);

  const reset = () => {
    setQuery("");
    setBrand("all");
    setCategory(initialCategory ?? "all");
    setSort("featured");
  };

  const filters = (
    <>
      <div className="sb-catalog__filter-head">
        <div>
          <FilterIcon />
          <strong>فیلتر محصولات</strong>
        </div>
        <button type="button" onClick={reset}>
          پاک‌کردن همه
        </button>
      </div>
      <label className="sb-catalog__search">
        <SearchIcon />
        <span className="sb-sr-only">جستجو در محصولات</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="نام محصول یا برند"
        />
      </label>
      {!initialCategory && (
        <fieldset className="sb-catalog__fieldset">
          <legend>دسته تخصصی</legend>
          <label>
            <input
              type="radio"
              name="category"
              checked={category === "all"}
              onChange={() => setCategory("all")}
            />
            همه دسته‌ها
            <small>{items.length}</small>
          </label>
          {categoryOptions.map((item) => (
            <label key={item.slug}>
              <input
                type="radio"
                name="category"
                checked={category === item.slug}
                onChange={() => setCategory(item.slug)}
              />
              {item.title}
              <small>
                {items.filter((product) => product.category === item.slug).length}
              </small>
            </label>
          ))}
        </fieldset>
      )}
      <fieldset className="sb-catalog__fieldset">
        <legend>برند</legend>
        <label>
          <input
            type="radio"
            name="brand"
            checked={brand === "all"}
            onChange={() => setBrand("all")}
          />
          همه برندها
          <small>{items.length}</small>
        </label>
        {brands.map((item) => (
          <label key={item}>
            <input
              type="radio"
              name="brand"
              checked={brand === item}
              onChange={() => setBrand(item)}
            />
            {item}
            <small>{items.filter((product) => product.brand === item).length}</small>
          </label>
        ))}
      </fieldset>
    </>
  );

  return (
    <div className="sb-catalog">
      <aside className="sb-catalog__sidebar" aria-label="فیلترهای محصولات">
        {filters}
      </aside>
      <div className="sb-catalog__main">
        <div className="sb-catalog__toolbar">
          <div>
            <button
              className="sb-catalog__mobile-filter"
              type="button"
              onClick={() => setFiltersOpen(true)}
            >
              <FilterIcon />
              فیلترها
            </button>
            <p aria-live="polite">
              <strong>{filtered.length}</strong>
              محصول {initialCategory ? "در این دسته" : "در فروشگاه"}
            </p>
          </div>
          <label>
            <span>مرتب‌سازی:</span>
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="featured">پیشنهاد سپید</option>
              <option value="name">نام محصول</option>
              <option value="brand">نام برند</option>
            </select>
          </label>
        </div>

        {filtered.length ? (
          <div className="sb-product-grid sb-product-grid--catalog">
            {filtered.map((product) => (
              <ProductCard product={product} key={product.slug} />
            ))}
          </div>
        ) : (
          <div className="sb-catalog__empty">
            <span>۰ نتیجه</span>
            <h2>ترکیب این فیلترها محصولی ندارد.</h2>
            <p>فیلترها را پاک کنید یا برای استعلام کالای موردنظر با پشتیبانی تماس بگیرید.</p>
            <button className="sb-btn sb-btn--dark" type="button" onClick={reset}>
              پاک‌کردن فیلترها
            </button>
          </div>
        )}
      </div>

      {filtersOpen && (
        <div
          className="sb-filter-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="فیلتر محصولات"
          ref={drawerRef}
        >
          <div className="sb-filter-drawer__top">
            <strong>فیلتر محصولات</strong>
            <button
              className="sb-icon-btn"
              type="button"
              onClick={() => setFiltersOpen(false)}
              aria-label="بستن فیلترها"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="sb-filter-drawer__content">{filters}</div>
          <button
            className="sb-btn sb-btn--dark sb-filter-drawer__apply"
            type="button"
            onClick={() => setFiltersOpen(false)}
          >
            نمایش {filtered.length} محصول
          </button>
        </div>
      )}
    </div>
  );
}
