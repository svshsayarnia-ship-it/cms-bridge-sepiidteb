"use client";
/* eslint-disable @next/next/no-img-element -- local compressed assets */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { catalogGroups, productHref } from "../catalog";
import {
  whatsappHref,
  type Category,
} from "../data";
import type { PublicProduct } from "../lib/public-product";
import { getProductCutoutSrc } from "../lib/product-image";
import type { SitePresentation } from "../lib/site-presentation";
import {
  ArrowIcon,
  ChevronIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
} from "./Icons";

const navItems = [
  { href: "/shop", label: "فروشگاه" },
  { href: "/brands", label: "برندها" },
  { href: "/guides", label: "راهنمای انتخاب" },
  { href: "/magazine", label: "مجله سپید" },
  { href: "/professional", label: "همکاری با کلینیک‌ها" },
  { href: "/contact", label: "تماس" },
];

function BrandMark({ light = false, tagline }: { light?: boolean; tagline?: string }) {
  const resolvedTagline = tagline || "سپید بیوتی · انتخاب حرفه‌ای";

  return (
    <Link
      className={`sb-brand ${light ? "sb-brand--light" : ""}`}
      href="/"
      title={resolvedTagline}
      aria-label="Sepiid Beauty، صفحه اصلی"
    >
      <span className="sb-brand__mark">
        <img
          src="/images/sepiid-logo.webp"
          alt=""
          width="900"
          height="900"
          aria-hidden="true"
        />
      </span>
      <span>
        <strong>Sepiid Beauty</strong>
        <small>{resolvedTagline}</small>
      </span>
    </Link>
  );
}

export { BrandMark };

export function SiteHeader({
  categories,
  products,
  presentation,
}: {
  categories: Category[];
  products: PublicProduct[];
  presentation: SitePresentation["header"];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const searchPanel = useRef<HTMLDivElement>(null);
  const mobilePanel = useRef<HTMLDivElement>(null);
  const mobileMenuTrigger = useRef<HTMLButtonElement>(null);
  const lastSearchTrigger = useRef<HTMLButtonElement | null>(null);
  const openSearch = (event: MouseEvent<HTMLButtonElement>) => {
    lastSearchTrigger.current = event.currentTarget;
    setMobileOpen(false);
    setCategoriesOpen(false);
    setSearchOpen(true);
  };

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa");
    if (!normalized) return products.slice(0, 5);

    return products
      .filter((product) =>
        [
          product.nameFa,
          product.nameEn,
          product.brand,
          product.categoryTitle,
        ]
          .join(" ")
          .toLocaleLowerCase("fa")
          .includes(normalized),
      )
      .slice(0, 7);
  }, [products, query]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileOpen(false);
        setCategoriesOpen(false);
      }

      if (event.key === "/" && !searchOpen) {
        const target = event.target as HTMLElement;
        if (!["INPUT", "TEXTAREA"].includes(target.tagName)) {
          event.preventDefault();
          setSearchOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = lastSearchTrigger.current;
    const panel = searchPanel.current;
    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    const focusable = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => searchInput.current?.focus(), 50);

    const trapFocus = (event: KeyboardEvent) => {
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

    document.addEventListener("keydown", trapFocus);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const panel = mobilePanel.current;
    const trigger = mobileMenuTrigger.current;
    const focusableSelector =
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
    const focusable = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => focusable()[0]?.focus(), 50);
    const trapFocus = (event: KeyboardEvent) => {
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

    document.addEventListener("keydown", trapFocus);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
    setCategoriesOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const groupedCategories = useMemo(
    () =>
      catalogGroups
        .map((group) => ({
          ...group,
          categories: categories.filter((category) =>
            group.categorySlugs.includes(category.slug),
          ),
        }))
        .filter((group) => group.categories.length > 0),
    [categories],
  );

  const searchSuggestion = searchResults[0];

  return (
    <>
      <div className="sb-trustbar">
        <div className="sb-shell sb-trustbar__inner">
          <p>
            <i />
            {presentation.trustPrimary}
          </p>
          <div>
            <span>{presentation.trustSecondary}</span>
            <a href="tel:+989037251266">۰۹۰۳۷۲۵۱۲۶۶</a>
          </div>
        </div>
      </div>

      <header className="sb-header">
        <div className="sb-shell sb-header__primary">
          <BrandMark tagline={presentation.brandTagline} />

          <button
            className="sb-header-search"
            type="button"
            aria-label="باز کردن جستجوی محصولات"
            onClick={openSearch}
          >
            <SearchIcon />
            <span>{presentation.searchPlaceholder}</span>
            <kbd>/</kbd>
          </button>

          <div className="sb-header__actions">
            <Link className="sb-header__account" href="/account">
              ورود / عضویت
            </Link>
            <a
              className="sb-btn sb-btn--ghost sb-header__consult"
              href={whatsappHref}
            >
              {presentation.consultationLabel}
            </a>
            <button
              className="sb-icon-btn sb-mobile-search-btn"
              type="button"
              aria-label="جستجوی محصولات"
              onClick={openSearch}
            >
              <SearchIcon />
            </button>
            <button
              ref={mobileMenuTrigger}
              className="sb-icon-btn sb-mobile-menu-btn"
              type="button"
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileOpen ? "بستن منو" : "باز کردن منو"}
              onClick={() => setMobileOpen((current) => !current)}
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        <div
          ref={mobilePanel}
          id="mobile-navigation"
          className={`sb-header__nav-wrap ${mobileOpen ? "sb-header__nav-wrap--open" : ""}`}
        >
          <nav className="sb-shell sb-nav" aria-label="منوی اصلی">
            <div className="sb-nav__categories">
              <button
                type="button"
                aria-expanded={categoriesOpen}
                aria-controls="catalog-mega-menu"
                onClick={() => setCategoriesOpen((current) => !current)}
              >
                <MenuIcon />
                دسته‌بندی محصولات
                <ChevronIcon />
              </button>

              <div
                id="catalog-mega-menu"
                className={`sb-mega-menu ${categoriesOpen ? "sb-mega-menu--open" : ""}`}
              >
                <div className="sb-mega-menu__grid">
                  <div className="sb-mega-menu__intro">
                    <span>SHOP / CATEGORIES</span>
                    <h2>از نیاز شروع کنید، نه از نام محصول.</h2>
                    <p>
                      مسیرهای دسته‌بندی برای شناخت بهتر ساخته شده‌اند؛ انتخاب پزشکی همچنان به ارزیابی فرد واجد صلاحیت نیاز دارد.
                    </p>
                    <Link href="/shop">
                      مشاهده همه محصولات
                      <ArrowIcon />
                    </Link>
                  </div>

                  <div className="sb-mega-menu__links">
                    {groupedCategories.map((group) => (
                      <section className="sb-mega-menu__group" key={group.slug}>
                        <Link href={`/shop/group/${group.slug}`}>
                          <strong>{group.title}</strong>
                          <small>{group.en}</small>
                        </Link>
                        <div>
                          {group.categories.map((category) => (
                            <Link href={`/shop/${category.slug}`} key={category.slug}>
                              <span>•</span>
                              <div>
                                <strong>{category.title}</strong>
                                <small>{category.en}</small>
                              </div>
                              <ArrowIcon />
                            </Link>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>

                  <figure className="sb-mega-menu__visual">
                    <img
                      src="/images/drive/category-skinbooster.webp"
                      alt=""
                      width="1254"
                      height="1254"
                    />
                    <figcaption>انتخاب دقیق‌تر برای خرید حرفه‌ای</figcaption>
                  </figure>
                </div>
              </div>
            </div>

            <div className="sb-nav__links">
              {navItems.map((item) => (
                <Link
                  className={pathname === item.href ? "is-active" : ""}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <a className="sb-nav__phone" href="tel:+989037251266">
              پشتیبانی:
              <b>۰۹۰۳۷۲۵۱۲۶۶</b>
            </a>
          </nav>
        </div>
      </header>

      {searchOpen && (
        <div className="sb-search-overlay" role="presentation" onMouseDown={() => setSearchOpen(false)}>
          <section
            ref={searchPanel}
            className="sb-search-panel"
            role="dialog"
            aria-modal="true"
            aria-label="جستجوی محصولات"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="sb-search-panel__head">
              <div>
                <span>SEARCH / SEPIID</span>
                <strong>محصول، برند یا دسته را جستجو کنید.</strong>
              </div>
              <button
                type="button"
                aria-label="بستن جستجو"
                onClick={() => setSearchOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <label className="sb-search-panel__field">
              <SearchIcon />
              <input
                ref={searchInput}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={presentation.searchPlaceholder}
                autoComplete="off"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")}>
                  پاک کردن
                </button>
              )}
            </label>

            {searchSuggestion && !query && (
              <div className="sb-search-panel__suggestion">
                <span>پیشنهاد سریع</span>
                <Link href={productHref(searchSuggestion.slug)}>
                  <img
                    src={getProductCutoutSrc(searchSuggestion.image)}
                    alt=""
                    width="96"
                    height="96"
                  />
                  <div>
                    <small>{searchSuggestion.brand}</small>
                    <strong>{searchSuggestion.nameFa}</strong>
                  </div>
                  <ArrowIcon />
                </Link>
              </div>
            )}

            <div className="sb-search-panel__results">
              {searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <Link href={productHref(product.slug)} key={product.slug}>
                    <img
                      src={getProductCutoutSrc(product.image)}
                      alt=""
                      width="88"
                      height="88"
                    />
                    <div>
                      <span>{product.brand}</span>
                      <strong>{product.nameFa}</strong>
                      <small>{product.categoryTitle}</small>
                    </div>
                    <ArrowIcon />
                  </Link>
                ))
              ) : (
                <div className="sb-search-panel__empty">
                  <strong>نتیجه‌ای پیدا نشد.</strong>
                  <p>نام برند یا بخشی از نام محصول را امتحان کنید.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
