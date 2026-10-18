# Product image delivery repair

The live filler category returned HTML without product `<img>` elements. The
client role lookup took 14.78–16.88 seconds from the test environment. An image
request for attachment 30193 returned `502` with `تصویر CMS با خطای 401 پاسخ داد.`,
and Next Image returned `400 The requested resource isn't a valid image.`
Public WordPress metadata for the same attachment returned 200 without Basic
authentication. Its original WebP was 8,182 bytes; the sampled Neuramis image
was 22,832 bytes. These samples implicate delivery/authentication and discovery,
not excessive file size. Remote timings include this environment's network
overhead and are not browser Core Web Vitals.

## Change

- Read published attachment metadata without WooCommerce Basic credentials.
- Materialize role metadata and attachment source URLs confirmed by a read of
  the published WooCommerce products on October 18. The server-only snapshot
  contains image metadata, not commerce fields or substitute photos.
- Resolve known attachment files directly, skipping the metadata lookup.
- Supply confirmed CMS role IDs in SSR cards when no live product snapshot
  exists. A live record with no images stays empty; a new CMS upload wins.
- Cache the recovery catalogue read for five minutes through Next Data Cache,
  using the existing CMS-write invalidation tags. Mixed batches preserve
  confirmed records over the cached recovery response.

## Validation

- `npx next build`: compiled, TypeScript passed, generated 108 routes.
  No production credentials were loaded. Commerce/category lookups used their
  existing fallback behavior during the build.
- Targeted ESLint, CMS image authority, variant media, cache unification,
  storefront regressions and literal image reference audits passed.
- `node scripts/test-product-image-delivery.cjs`: public metadata sends no
  Authorization; known attachments skip metadata; SSR keeps the same CMS ID;
  public props contain no raw WordPress media origin; repeated role reads
  reuse a cached catalogue response; live cleared/new media win in mixed batches.
- Production-mode local HTTP check: `/shop/fillers` 200 with 9 CMS product image
  tags already in the initial HTML; no raw WordPress media URL in HTML.
- Same-origin media and Next Image returned 200. WebP optimizer check: 9,576
  bytes, first transformation 246 ms, warm HIT 6 ms. This was local testing with
  a previously cached source; it is not a production speed claim.

## Release state

Prepared against main `23bdc3eb843f1bbef4016b0b1bd5da8d26e4c0b2`.
Production deployment and browser/device verification remain pending. Render
reported no selected workspace and requires the user to identify it. The known
workspace is My Workspace (svshsayarnia@gmail.com). Before release, verify the
Sepiid Beauty service and current live commit, then verify image responses and
the first product row on the public site. No DNS, commerce, prices, stock or
visual styling changed in this repair.
