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
  | "categoryTitle"
  | "image"
  | "position"
>;

/**
 * Keep the client boundary lean. SiteHeader search and navigation only read
 * the fields projected below; serializing the complete product catalog into
 * every page's React payload wastes bytes and parsing work on mobile.
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
      categoryTitle,
      image,
      position,
    }) => ({
      slug,
      nameFa,
      nameEn,
      brand,
      categoryTitle,
      image,
      position,
    }),
  );

  // SiteHeader intentionally consumes only the projected fields above. The
  // casts preserve its existing public prop types while avoiding a risky
  // client-component refactor during this technical SEO/performance fix.
  return (
    <SiteHeader
      categories={headerCategories as Category[]}
      products={headerProducts as PublicProduct[]}
      presentation={presentation}
    />
  );
}
