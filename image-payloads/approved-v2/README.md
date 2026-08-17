# Approved product image payloads

These files are base64-encoded WebP assets generated and reviewed for Sepiid Beauty. `scripts/apply-approved-product-images.mjs` materializes them into `public/images/products/editorial/approved/` during `prebuild` and injects slug-specific catalog image overrides so shared family placeholders are not used for these products.
