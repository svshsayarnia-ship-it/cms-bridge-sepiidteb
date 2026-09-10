"use client";

import { useEffect } from "react";

type HeroSlide = {
  href: string;
  image: string;
  alt: string;
  name: string;
  brand: string;
};

export function HaloHeroInteractions() {
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".halo-home .halo-hero");
    if (!hero) return;

    const visual = hero.querySelector<HTMLElement>(".halo-hero__visual");
    const stage = hero.querySelector<HTMLElement>(".halo-hero__product-stage");
    const image = stage?.querySelector<HTMLImageElement>(".halo-hero__product-image");
    const name = stage?.querySelector<HTMLElement>(".halo-hero__product-meta strong");
    const brand = stage?.querySelector<HTMLElement>(".halo-hero__product-meta small");
    const pager = Array.from(hero.querySelectorAll<HTMLElement>(".halo-hero__pager span"));
    const productCards = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(".halo-home .halo-product-card"),
    ).slice(0, 3);

    if (!visual || !stage || !image || !name || !brand || productCards.length < 2) return;

    const slides: HeroSlide[] = productCards
      .map((card) => {
        const cardImage = card.querySelector<HTMLImageElement>(".halo-product-card__image img");
        const cardName = card.querySelector<HTMLElement>("h3");
        const cardBrand = card.querySelector<HTMLElement>(".halo-product-card__brand");
        return {
          href: card.getAttribute("href") || "",
          image: cardImage?.currentSrc || cardImage?.src || "",
          alt: cardImage?.alt || cardName?.textContent?.trim() || "محصول منتخب سپید بیوتی",
          name: cardName?.textContent?.trim() || "محصول منتخب سپید بیوتی",
          brand: cardBrand?.textContent?.trim() || "Sepiid Beauty",
        };
      })
      .filter((slide) => slide.href && slide.image);

    if (slides.length < 2) return;

    let active = 0;
    let transitionTimer: number | undefined;

    const setActive = (nextIndex: number) => {
      active = (nextIndex + slides.length) % slides.length;
      const slide = slides[active];

      image.classList.add("is-changing");
      if (transitionTimer) window.clearTimeout(transitionTimer);
      transitionTimer = window.setTimeout(() => {
        image.src = slide.image;
        image.alt = slide.alt;
        name.textContent = slide.name;
        brand.textContent = `${slide.brand} · انتخاب ویژه سپید`;
        stage.dataset.href = slide.href;
        stage.setAttribute("aria-label", `مشاهده ${slide.name}`);
        image.classList.remove("is-changing");
      }, 120);

      pager.forEach((item, index) => {
        item.setAttribute("aria-current", index === active ? "true" : "false");
        item.setAttribute("aria-label", `نمایش محصول ${index + 1}`);
      });
    };

    const pagerCleanups = pager.map((item, index) => {
      item.setAttribute("role", "button");
      item.setAttribute("tabindex", "0");
      const onClick = () => setActive(index);
      const onKeyDown = (event: Event) => {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
          keyboardEvent.preventDefault();
          setActive(index);
        }
      };
      item.addEventListener("click", onClick);
      item.addEventListener("keydown", onKeyDown);
      return () => {
        item.removeEventListener("click", onClick);
        item.removeEventListener("keydown", onKeyDown);
      };
    });

    const controls = document.createElement("div");
    controls.className = "halo-hero__nav-controls";
    controls.setAttribute("aria-label", "جابجایی بین محصولات منتخب");

    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "halo-hero__nav-button";
    previous.setAttribute("aria-label", "محصول قبلی");
    previous.textContent = "→";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "halo-hero__nav-button";
    next.setAttribute("aria-label", "محصول بعدی");
    next.textContent = "←";

    const onPrevious = () => setActive(active - 1);
    const onNext = () => setActive(active + 1);
    previous.addEventListener("click", onPrevious);
    next.addEventListener("click", onNext);
    controls.append(previous, next);
    visual.appendChild(controls);

    const openStage = () => {
      const href = stage.dataset.href;
      if (href) window.location.assign(href);
    };
    const onStageKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Enter") openStage();
    };

    stage.setAttribute("role", "link");
    stage.setAttribute("tabindex", "0");
    stage.addEventListener("click", openStage);
    stage.addEventListener("keydown", onStageKeyDown);

    // Start with the same first featured product already rendered server-side.
    stage.dataset.href = slides[0].href;
    setActive(0);

    return () => {
      if (transitionTimer) window.clearTimeout(transitionTimer);
      pagerCleanups.forEach((cleanup) => cleanup());
      previous.removeEventListener("click", onPrevious);
      next.removeEventListener("click", onNext);
      stage.removeEventListener("click", openStage);
      stage.removeEventListener("keydown", onStageKeyDown);
      controls.remove();
    };
  }, []);

  return null;
}
