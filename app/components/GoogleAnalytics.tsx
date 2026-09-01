"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { readCart } from "../lib/cart";
import {
  getGaMeasurementId,
  toGaItem,
  trackEcommerceEvent,
  trackGaEvent,
} from "../lib/analytics";

function productSlugFromHref(href: string) {
  try {
    const url = new URL(href, window.location.origin);
    const match = url.pathname.match(/^\/product\/([^/?#]+)/u);
    return match ? decodeURIComponent(match[1]) : "";
  } catch {
    return "";
  }
}

function visibleText(element: Element | null) {
  return (element?.textContent ?? "").replace(/\s+/gu, " ").trim().slice(0, 160);
}

function trackRoute(pathname: string) {
  const pageLocation = window.location.href;
  trackGaEvent("page_view", {
    page_title: document.title,
    page_location: pageLocation,
    page_path: `${window.location.pathname}${window.location.search}`,
  });

  const searchParams = new URLSearchParams(window.location.search);
  const searchTerm = ["q", "search", "s"]
    .map((key) => searchParams.get(key)?.trim())
    .find(Boolean);
  if (searchTerm) {
    trackGaEvent("search", { search_term: searchTerm });
  }

  if (pathname === "/cart") {
    trackEcommerceEvent("view_cart", readCart());
    return;
  }

  if (pathname === "/checkout") {
    trackEcommerceEvent("begin_checkout", readCart());
    return;
  }

  if (pathname.startsWith("/product/")) {
    const slug = decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "");
    const heading = visibleText(document.querySelector("h1"));
    const category = document.querySelector<HTMLElement>(".sb-product-detail")?.dataset.category;
    trackGaEvent("view_item", {
      currency: "IRR",
      items: [
        toGaItem({
          slug,
          nameFa: heading || document.title.split("|")[0]?.trim() || slug,
          category,
        }),
      ],
    });
    return;
  }

  if (pathname === "/shop" || pathname.startsWith("/shop/")) {
    window.setTimeout(() => {
      const cards = Array.from(document.querySelectorAll<HTMLElement>(".sb-product-card"));
      const items = cards.slice(0, 20).flatMap((card, index) => {
        const link = card.querySelector<HTMLAnchorElement>('a[href^="/product/"]');
        if (!link) return [];
        const slug = productSlugFromHref(link.href);
        if (!slug) return [];
        const name = visibleText(card.querySelector("h3")) || slug;
        return [{
          ...toGaItem({
            slug,
            nameFa: name,
            category: card.dataset.category,
          }, index),
          item_list_id: pathname,
          item_list_name: document.title.split("|")[0]?.trim() || "فروشگاه",
        }];
      });

      if (items.length) {
        trackGaEvent("view_item_list", {
          item_list_id: pathname,
          item_list_name: document.title.split("|")[0]?.trim() || "فروشگاه",
          items,
        });
      }
    }, 500);
  }
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const measurementId = getGaMeasurementId();

  useEffect(() => {
    if (!measurementId) return;
    trackRoute(pathname);
  }, [measurementId, pathname]);

  useEffect(() => {
    if (!measurementId) return;

    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;

      const href = anchor.href;
      const label = visibleText(anchor);

      if (/^https:\/\/wa\.me\//u.test(href)) {
        trackGaEvent("generate_lead", {
          method: "whatsapp",
          cta_text: label || "whatsapp",
          page_path: window.location.pathname,
        });
        return;
      }

      if (anchor.getAttribute("href")?.startsWith("tel:")) {
        trackGaEvent("generate_lead", {
          method: "phone",
          cta_text: label || "phone",
          page_path: window.location.pathname,
        });
        return;
      }

      const slug = productSlugFromHref(href);
      if (slug) {
        const card = anchor.closest<HTMLElement>(".sb-product-card");
        const name = visibleText(card?.querySelector("h3")) || label || slug;
        trackGaEvent("select_item", {
          item_list_id: window.location.pathname,
          item_list_name: document.title.split("|")[0]?.trim() || "فروشگاه",
          items: [
            {
              ...toGaItem({
                slug,
                nameFa: name,
                category: card?.dataset.category,
              }),
              item_list_id: window.location.pathname,
              item_list_name: document.title.split("|")[0]?.trim() || "فروشگاه",
            },
          ],
        });
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [measurementId]);

  if (!measurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="sepiid-ga4" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${measurementId}',{send_page_view:false});`}
      </Script>
    </>
  );
}
