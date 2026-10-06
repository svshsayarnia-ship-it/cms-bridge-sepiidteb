import type { Category } from "../data";
import { getStorefrontProducts } from "../lib/storefront-catalog";
import { toPublicProduct } from "../lib/public-product";
import type { PublicProduct } from "../lib/public-product";
import type { SitePresentation } from "../lib/site-presentation";
import { SiteHeader } from "./SiteHeader";
import { getCustomerUser } from "../lib/customer-auth";

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
  | "fallbackImage"
  | "masterImage"
  | "imageAlt"
  | "position"
  | "visualProfile"
  | "visualScale"
  | "visualOffsetX"
  | "visualOffsetY"
  | "variants"
>;

/**
 * Keep the client boundary lean. SiteHeader search and navigation only read
 * the identifying fields plus the complete ProductVisual contract projected
 * below. Keeping category/profile/scale/offset metadata prevents search results
 * from silently falling back to a different image geometry than cards/PDPs.
 */
export async function SiteHeaderServer({
  categories,
  products,
  presentation,
}: {
  categories: Category[];
  products: PublicProduct[];
  presentation: SitePresentation["header"];
}) {
  const [initialUser, storefrontProducts] = await Promise.all([
    getCustomerUser().catch(() => null),
    getStorefrontProducts()
      .then((items) => items.length ? items.map(toPublicProduct) : products)
      .catch(() => products),
  ]);
  const headerCategories: HeaderCategory[] = categories.map(
    ({ slug, title, en }) => ({ slug, title, en }),
  );

  const headerProducts: HeaderProduct[] = storefrontProducts.map(
    ({
      slug,
      nameFa,
      nameEn,
      brand,
      category,
      categoryTitle,
      image,
      fallbackImage,
      masterImage,
      imageAlt,
      position,
      visualProfile,
      visualScale,
      visualOffsetX,
      visualOffsetY,
      variants,
    }) => ({
      slug,
      nameFa,
      nameEn,
      brand,
      category,
      categoryTitle,
      image,
      fallbackImage,
      masterImage,
      imageAlt,
      position,
      visualProfile,
      visualScale,
      visualOffsetX,
      visualOffsetY,
      variants,
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
      initialUser={initialUser}
    />
  );
}
