# Sepiid Beauty Product Image Pipeline

## Goal

Product images are maintained once per product or verified variant. Homepage cards, category cards, search, carousel and PDP must never require separate image fixes.

## Source of truth

- WooCommerce/CMS primary product image is the canonical live master.
- Static repository assets exist only as approved migration/fallback media.
- Every public surface renders the product through `ProductVisual`.
- The same saved `CmsProduct` record must feed discovery surfaces and PDP.

## Data flow

1. Select or upload the primary image in CMS.
2. Save the product.
3. The CMS route writes WooCommerce and reads the product back.
4. The saved image order and attachment identity are verified.
5. The confirmed product record is written to Runtime Cache and the shared Next Data Cache snapshot.
6. Runtime Cache maintains a compact slug index so catalog/listing reads can overlay the same newest product record used by PDP.
7. Storefront routes are revalidated.
8. Every surface renders the same master through `ProductVisual`.

## Regression recovery (2026-10-06)

- Search eligibility is independent of image eligibility; header reads the same snapshot catalogue, with approved inventory fallback. Persian/Arabic letters, spacing, digits and variant names share one matcher with Shop.
- Legacy restoration must use the same cutout normalization/validation gate as manual upload.
- Exact legacy role filenames resolve to checked-in, alpha-audited transparent derivatives at the public media boundary. New uniquely named normalized CMS uploads are never replaced by that mapping.
- Public media metadata and bytes are cached, and ProductVisual requests responsive sizes. The `cutout=3` URL version evicts the previously cached opaque legacy responses.
- Category artwork is the only decorative background; no extra glass/radial overlay is drawn.
- The prebuild regression audit validates real transparency and searches before every deployment.

## Visual contract

Approved local cutouts must satisfy the repository image audit:

- transparent 1400×1400 canvas
- safe margins
- centered product
- controlled visual footprint
- common baseline
- no baked checkerboard/editorial background

Category decoration belongs to the UI stage, not to the product asset.

## Variant rule

A variant may replace the canonical master only when its image is explicitly verified/approved by the existing variant-media contract. Missing or unverified variant media must fall back to the canonical product master rather than a random family image.

## Forbidden fixes

Do not fix a product image by:

- adding product-specific CSS zoom/offset rules
- changing the image independently on homepage/category/PDP
- rendering product images directly with `<img>`/`<Image>` outside `ProductVisual`
- introducing a new cache path for one storefront surface
- using category backgrounds as part of the product cutout

If a product looks wrong, fix the master asset, visual profile, or pipeline—not an individual page.

## Automated gates

Every pull request must pass:

- storefront image reference audit
- product visual architecture audit
- storefront product cache unification audit
- product variant media audit
- normalized cutout geometry/transparency audit
- lint and production build

## Definition of done for the image phase

The image problem is considered closed only when all of the following are true:

1. Changing one CMS primary image changes the same product image everywhere after the save/revalidation cycle.
2. No public surface has a separate product-image source.
3. No product-specific CSS/image patch is needed for normal products.
4. A new approved product can be added without editing homepage/category/PDP code.
5. Bad local cutouts fail CI before merge/deploy.
6. Variant media cannot silently override the canonical master unless verified.

After these conditions pass, future work should treat image regressions as pipeline failures, not page-design tasks.

The older Neurafill Lido staged payload cannot be decoded and is excluded from the approved derivative map. It must be replaced with a verified source before it can be restored through the normalized import path.
