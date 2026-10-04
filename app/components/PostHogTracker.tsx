"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { readCart } from "../lib/cart";
import { ecommerceValueRial, toGaItem, trackPosthogEvent } from "../lib/analytics";

// The project token is public by design; it identifies the ingestion project, not an API secret.
const token = "phc_qD4NtdqBDhHscvGj5UbjF6mZXmmcCcs7HGU8KEGdfZz9";
const host = "https://us.i.posthog.com";

function trackRoute(pathname: string) {
  if (pathname === "/cart" || pathname === "/checkout") {
    const items = readCart();
    if (!items.length) return;
    trackPosthogEvent(pathname === "/cart" ? "view_cart" : "begin_checkout", {
      currency: "IRR",
      value: ecommerceValueRial(items),
      items: items.map((item, index) => toGaItem(item, index)),
      item_count: items.reduce((count, item) => count + item.quantity, 0),
    });
  }
  if (pathname.startsWith("/product/")) {
    const slug = decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "");
    window.setTimeout(() => {
      const name = document.querySelector("h1")?.textContent?.replace(/\s+/gu, " ").trim() || slug;
      const category = document.querySelector<HTMLElement>(".sb-product-detail")?.dataset.category;
      trackPosthogEvent("view_item", {
        item_id: slug,
        item_name: name,
        item_category: category,
        currency: "IRR",
      });
    }, 300);
  }
}

export function PostHogTracker() {
  const pathname = usePathname();
  useEffect(() => trackRoute(pathname), [pathname]);

  return (
    <Script id="sepiid-posthog-sdk" strategy="beforeInteractive">
      {`!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2===o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],o="capture identify alias reset".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
posthog.init("${token}",{api_host:"${host}",ui_host:"https://us.posthog.com",capture_pageview:"history_change",capture_pageleave:true,autocapture:false,session_recording:{maskAllInputs:true,maskTextSelector:"[data-ph-mask]"},before_send:function(event){if(event&&event.properties){for(var k of ["$current_url","$referrer","$pageview_previous_page"]){var v=event.properties[k];if(typeof v==="string"){try{var u=new URL(v,location.origin);if(u.pathname.startsWith("/checkout")){u.search="";u.hash="";event.properties[k]=u.toString()}}catch(e){}}}}return event}});`}
    </Script>
  );
}
