import type { Category } from "../data";
import type { PublicProduct } from "../lib/public-product";
import type { SitePresentation } from "../lib/site-presentation";
import { SiteHeader } from "./SiteHeader";

type HeaderCategory = Pick<Category, "slug" | "title" | "en">;

type HeaderProduct = Pick<
  PublicProduct,
  | "slug"
  | "nameFa"
  | "nameEn"
  | "brand"
  | "category"
  | "categoryTitle"
  | "image"
  | "masterImage"
  | "imageAlt"
  | "position"
  | "visualProfile"
  | "visualScale"
  | "visualOffsetX"
  | "visualOffsetY"
>;

/**
 * Keep the client boundary lean. SiteHeader search and navigation only read
 * the identifying fields plus the complete ProductVisual contract projected
 * below. Keeping category/profile/scale/offset metadata prevents search results
 * from silently falling back to a different image geometry than cards/PDPs.
 */
export function SiteHeaderServer({
  categories,
  products,
  presentation,
}: {
  categories: Category[];
  products: PublicProduct[];
  presentation: SitePresentation["header"];
}) {
  const headerCategories: HeaderCategory[] = categories.map(
    ({ slug, title, en }) => ({ slug, title, en }),
  );

  const headerProducts: HeaderProduct[] = products.map(
    ({
      slug,
      nameFa,
      nameEn,
      brand,
      category,
      categoryTitle,
      image,
      masterImage,
      imageAlt,
      position,
      visualProfile,
      visualScale,
      visualOffsetX,
      visualOffsetY,
    }) => ({
      slug,
      nameFa,
      nameEn,
      brand,
      category,
      categoryTitle,
      image,
      masterImage,
      imageAlt,
      position,
      visualProfile,
      visualScale,
      visualOffsetX,
      visualOffsetY,
    }),
  );

  // SiteHeader intentionally consumes only the projected fields above. The
  // casts preserve its existing public prop types while keeping the client
  // payload compact and the product visual contract intact.
  return (
    <SiteHeader
      categories={headerCategories as Category[]}
      products={headerProducts as PublicProduct[]}
      presentation={presentation}
    />
  );
}
