"use client";
/* eslint-disable @next/next/no-img-element -- local compressed assets */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { catalogGroups, productHref } from "../catalog";
import {
  products,
  whatsappHref,
  type Category,
} from "../data";
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
  return (
    <Link
      className={`sb-brand ${light ? "sb-brand--light" : ""}`}
      href="/"
      title={tagline}
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
        {tagline && <small>{tagline}</small>}
        <small>سپید بیوتی · انتخاب حرفه‌ای</small>
      </span>
    </Link>
  );
}

export { BrandMark };

export function SiteHeader({
  categories,
  presentation,
}: {
  categories: Category[];
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
  }, [query]);

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
    const closeAtDesktop = () => {
      if (window.matchMedia("(min-width: 821px)").matches) setMobileOpen(false);
    };
    document.addEventListener("keydown", trapFocus);
    window.addEventListener("resize", closeAtDesktop);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", trapFocus);
      window.removeEventListener("resize", closeAtDesktop);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [mobileOpen]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setMobileOpen(false);
      setCategoriesOpen(false);
      setSearchOpen(false);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [pathname]);

  return (
    <>
      <a className="sb-skip-link" href="#main-content">
        رفتن به محتوای اصلی
      </a>
      <div className="sb-trustbar">
        <div className="sb-shell sb-trustbar__inner">
          <p>
            <i />
            بررسی بسته‌بندی، بچ‌کد و شرایط تحویل پیش از ارسال
          </p>
          <div>
            <span>ارسال هماهنگ‌شده به سراسر ایران</span>
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
            onClick={openSearch}
            aria-label="باز کردن جستجوی محصولات"
          >
            <SearchIcon />
            <span>جستجو میان محصولات و برندها</span>
            <kbd>/</kbd>
          </button>

          <div className="sb-header__actions">
            <Link className="sb-header__account" href="/account">
              ورود / عضویت
            </Link>
            <Link className="sb-btn sb-btn--ghost sb-header__consult" href={whatsappHref()}>
              {presentation.consultationLabel}
            </Link>
            <button
              className="sb-icon-btn sb-mobile-search-btn"
              type="button"
              onClick={openSearch}
              aria-label="جستجوی محصولات"
            >
              <SearchIcon />
            </button>
            <button
              ref={mobileMenuTrigger}
              className="sb-icon-btn sb-mobile-menu-btn"
              type="button"
              onClick={() => setMobileOpen((value) => !value)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileOpen ? "بستن منو" : "باز کردن منو"}
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {(pathname.startsWith("/shop") || pathname.startsWith("/brands")) && (
          <div className="sb-header__mobile-search sb-shell">
            <button type="button" onClick={openSearch}>
              <SearchIcon />
              جستجو میان محصولات
            </button>
          </div>
        )}
{mobileOpen && (
  <button
    className="sb-mobile-menu-backdrop"
    type="button"
    aria-label="بستن منوی موبایل"
    onClick={() => {
      setMobileOpen(false);
      setCategoriesOpen(false);
    }}
  />
)}
        <div
          ref={mobilePanel}
          id="mobile-navigation"
          className={`sb-header__nav-wrap ${mobileOpen ? "sb-header__nav-wrap--open" : ""}`}
        >
          <nav
            className="sb-shell sb-nav"
            aria-label="منوی اصلی"
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setMobileOpen(false);
            }}
          >
            <div
              className="sb-nav__categories"
              onMouseEnter={() => setCategoriesOpen(true)}
              onMouseLeave={() => setCategoriesOpen(false)}
            >
              <button
                type="button"
                onClick={() => setCategoriesOpen((value) => !value)}
                aria-expanded={categoriesOpen}
                aria-controls="catalog-mega-menu"
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
                      مسیرهای دسته‌بندی برای شناخت بهتر ساخته شده‌اند؛ انتخاب پزشکی
                      همچنان به ارزیابی فرد واجد صلاحیت نیاز دارد.
                    </p>
                    <Link href="/shop">
                      مشاهده همه محصولات
                      <ArrowIcon />
                    </Link>
                  </div>
                  <div className="sb-mega-menu__links">
                    {catalogGroups.slice(0, 2).map((group) => (
                      <section className="sb-mega-menu__group" key={group.slug}>
                        <Link href={`/shop/group/${group.slug}`}>
                          <strong>{group.title}</strong>
                          <small>{group.en}</small>
                        </Link>
                        <div>
                          {categories
                            .filter((category) =>
                              group.categorySlugs.includes(category.slug),
                            )
                            .map((category) => (
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
              {(presentation.navigation.length ? presentation.navigation : navItems).map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    className={active ? "sb-nav__link--active" : ""}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <Link className="sb-nav__phone" href="tel:+989037251266">
              پشتیبانی:
              <b>۰۹۰۳۷۲۵۱۲۶۶</b>
            </Link>
          </nav>
        </div>
      </header>

      {searchOpen && (
        <div
          className="sb-search-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-title"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setSearchOpen(false);
          }}
        >
          <div className="sb-search-modal__panel" ref={searchPanel}>
            <div className="sb-search-modal__top">
              <div>
                <span>SEARCH / جستجو</span>
                <h2 id="search-title">محصول یا برند موردنظر را پیدا کنید.</h2>
              </div>
              <button
                className="sb-icon-btn"
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="بستن جستجو"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="sb-search-modal__field">
              <SearchIcon />
              <span className="sb-sr-only">عبارت جستجو</span>
              <input
                ref={searchInput}
                aria-label="عبارت جستجو"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="مثلاً جالپرو، فیلر یا Neuramis"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")}>
                  پاک‌کردن
                </button>
              )}
            </div>

            <div className="sb-search-modal__meta">
              <span aria-live="polite">
                {query ? `${searchResults.length} نتیجه` : "پیشنهادهای محبوب"}
              </span>
              <small>جستجو در نام فارسی، انگلیسی، برند و دسته</small>
            </div>

            <div className="sb-search-results">
              {searchResults.length ? (
                searchResults.map((product) => (
                  <Link href={productHref(product)} key={product.slug}>
                    <div
                      className="sb-search-results__image"
                      style={{
                        backgroundImage: `url(${product.image})`,
                        backgroundPosition: `${product.position} center`,
                      }}
                    />
                    <div>
                      <span>{product.categoryTitle}</span>
                      <strong>{product.nameFa}</strong>
                      <small>{product.nameEn}</small>
                    </div>
                    <ArrowIcon />
                  </Link>
                ))
              ) : (
                <div className="sb-search-results__empty">
                  <strong>نتیجه‌ای پیدا نشد.</strong>
                  <p>نام برند یا دسته را امتحان کنید، یا از پشتیبانی استعلام بگیرید.</p>
                  <Link href={whatsappHref(`سلام، محصول «${query}» را استعلام می‌کنم.`)}>
                    استعلام از پشتیبانی
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
