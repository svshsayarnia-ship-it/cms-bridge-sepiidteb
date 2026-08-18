# Sepiid Beauty Product Visual System

## Scope

This system standardizes only product-image presentation. Existing category colours, category stage artwork, typography, card structure, PDP structure and brand identity remain owned by the existing UI.

## Single rendering path

Every public product image must pass through:

- `app/components/product/ProductVisual.tsx`
- `app/config/productVisualConfig.ts`
- `app/config/visualProfiles.ts`
- `app/product-visual.css`

Direct product `<img>`/`<Image>` rendering, product image CSS backgrounds and product-specific CSS patches are not allowed on storefront surfaces.

## Product contract

The runtime contract supports:

- `masterImage`: canonical asset for every surface
- `category`: selects the approved category presentation defaults
- `visualProfile`: `tall | wide | square | vial | bottle | syringe | box | kit | default`
- optional `visualScale`
- optional `visualOffsetX`
- optional `visualOffsetY`

Offsets are clamped to `±5%`. Scale is bounded and is derived from category scale × profile multiplier unless an explicit override is supplied.

## Image behavior

- square reserved visual frame
- `object-fit: contain`
- `object-position: center bottom`
- no uncontrolled crop
- no layout shift caused by image dimensions
- responsive `sizes` per surface
- lazy loading by default; priority only for important above-the-fold images
- standard fallback if an image fails

## Background ownership

The product asset never owns category decoration. During this refactor, the already-approved category backgrounds remain on their existing UI wrappers so their colours, gradients and stage artwork are not repainted or changed. `ProductVisual` owns only product-asset geometry and rendering.

## Master image rule

`toPublicProduct()` exposes the canonical product asset as `masterImage`, while `ProductVisual` also accepts the existing `image` field for backward-compatible migration. Card, category, search, carousel and PDP rendering all resolve through the same component and the same cutout resolver.

The CMS/WooCommerce primary product image remains authoritative. Local approved product assets are normalized to cutouts by `getProductCutoutSrc()`; there are no family-specific source-image bypasses.

## Current asset normalization

The existing repository cutout pipeline uses normalized transparent square canvases. The UI architecture does not depend on the physical master canvas size, so future 1600×1600 masters can replace migrated assets without any component or page changes.

Known legacy white-carton assets that previously required display workarounds are tracked in `app/config/needsImageNormalization.ts`. That queue is QA metadata only and must never be used to alter runtime scale, background or CSS per product.

## Regression guard

`npm run audit:product-visuals` runs automatically in `prebuild` and fails when:

- a required storefront surface stops using `ProductVisual`
- Product Card or PDP reintroduces a raw image render
- a product image is rendered as a CSS background
- deprecated Fusion/Hyaluronidase image CSS reappears
- product-specific source-image bypass logic reappears
- `contain` / `center bottom` invariants disappear
- the master-image/profile contract is removed

## Adding a product

Normal path:

1. Upload/select the primary product image in CMS.
2. Assign the correct category.
3. Use the category default visual profile, or provide a profile when the product shape genuinely differs.
4. Save.

No page edit, product CSS, manual zoom patch or breakpoint-specific image rule should be required.

## QA matrix

Reference widths:

- mobile: 320, 375, 390, 430
- tablet: 768
- desktop: 1024, 1280, 1440, 1920

Required surfaces:

- Homepage product sections
- Category cards
- Category featured product
- Search results
- Related products
- Featured carousel and thumbnails
- Product detail page

For each surface verify no crop, consistent baseline, stable frame, correct category background, similar visual weight between mobile and desktop, and the same canonical product asset between discovery surfaces and PDP.
