"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicProduct } from "../lib/public-product";

type FinderComponent = typeof import("./HomeFinder")["HomeFinder"];

export function DeferredHomeFinder({ products }: { products: PublicProduct[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [Finder, setFinder] = useState<FinderComponent | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || Finder) return;

    let cancelled = false;
    const loadFinder = async () => {
      const homeFinderModule = await import("./HomeFinder");
      if (!cancelled) setFinder(() => homeFinderModule.HomeFinder);
    };

    if (!("IntersectionObserver" in window)) {
      void loadFinder();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          void loadFinder();
        }
      },
      { rootMargin: "700px 0px", threshold: 0 },
    );

    observer.observe(host);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [Finder]);

  return (
    <div ref={hostRef} style={{ minHeight: Finder ? undefined : "min(760px, 82vh)" }}>
      {Finder ? <Finder products={products} /> : null}
    </div>
  );
}
