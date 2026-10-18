/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness evaluates transpiled server modules. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Execute the real server modules with an isolated cache/transport. No live
// credentials or writes are used. Requests fail if the old Woo Basic auth is
// sent to the public WordPress attachment endpoint.
const root = path.resolve(__dirname, '..');
process.env.WORDPRESS_URL = 'https://wp.example.test';
process.env.WOOCOMMERCE_CONSUMER_KEY = 'test-consumer';
process.env.WOOCOMMERCE_CONSUMER_SECRET = 'test-secret';
let snapshots = {};
let requests = [];

function loader() {
  const loaded = new Map();
  function load(file) {
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    if (loaded.has(file)) return loaded.get(file).exports;
    const record = { exports: {} }; loaded.set(file, record);
    const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
        esModuleInterop: true, resolveJsonModule: true },
    }).outputText;
    const localRequire = (name) => {
      if (name === 'server-only') return {};
      if (name === 'react') return { cache: (fn) => fn };
      if (name === 'next/cache') return {
        unstable_cache: (fn) => {
          const entries = new Map();
          return (...args) => {
            const key = JSON.stringify(args);
            if (!entries.has(key)) {
              const task = Promise.resolve().then(() => fn(...args));
              entries.set(key, task); task.catch(() => entries.delete(key));
            }
            return entries.get(key);
          };
        }, revalidateTag: () => {},
      };
      if (name.endsWith('/storefront-product-snapshots') || name === './storefront-product-snapshots') {
        return { getStorefrontProductSnapshots: async () => snapshots };
      }
      if (name.startsWith('.') || name.startsWith('@/')) {
        let resolved = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name);
        if (!fs.existsSync(resolved)) resolved += '.ts';
        return load(resolved);
      }
      return require(name);
    };
    new Function('require', 'module', 'exports', '__filename', '__dirname', source)(
      localRequire, record, record.exports, file, path.dirname(file));
    return record.exports;
  }
  return (file) => load(path.join(root, file));
}

global.fetch = async (url, options = {}) => {
  const value = String(url); requests.push({ value, options });
  if (value.includes('/wp-json/wp/v2/media/')) {
    assert.equal(new Headers(options.headers).get('authorization'), null);
    return Response.json({ source_url: 'https://wp.example.test/uploads/new-role.webp', mime_type: 'image/webp' });
  }
  if (value.includes('/wp-json/wc/v3/products')) {
    return Response.json([{ id: 30129, slug: 'masport', name: 'Masport',
      status: 'publish', catalog_visibility: 'visible', categories: [], brands: [], meta_data: [],
      images: [{ id: 30193, src: 'https://wp.example.test/old-role.webp',
        name: 'sepiid-role-card-masport-slot-masport', alt: 'Old card' }] }],
      { headers: { 'x-wp-total': '1', 'x-wp-totalpages': '1' } });
  }
  return new Response(Uint8Array.of(82, 73, 70, 70), { headers: { 'content-type': 'image/webp' } });
};

(async () => {
  let load = loader();
  const woo = load('app/lib/woocommerce.ts');
  requests = [];
  const unknown = await woo.getCmsMediaAsset(999999);
  assert.equal(unknown.contentType, 'image/webp');
  assert.equal(requests.length, 2, 'new uploads must still resolve through public metadata');
  assert.equal(requests[0].options.next.revalidate, 86400);

  requests = [];
  const known = await woo.getCmsMediaAsset(30193);
  assert.equal(known.contentType, 'image/webp');
  assert.equal(requests.length, 1, 'confirmed attachment skips the metadata waterfall');
  assert.match(requests[0].value, /sepiid-role-card-masport-slot-masport\.webp$/);
  assert.equal(new Headers(requests[0].options.headers).get('authorization'), null);

  await assert.rejects(woo.getCmsMediaAsset(-1), (error) => error.status === 400);

  const catalog = await load('app/lib/storefront-catalog.ts').getStorefrontCatalog();
  const masport = catalog.products.find((product) => product.slug === 'masport');
  assert.equal(masport.image, '/api/cms/public-media?id=30193&cutout=3');
  assert.equal(masport.live, false, 'a media fallback must not invent live stock/prices');
  assert.equal(masport.stockStatus, 'unknown');
  const publicProduct = load('app/lib/public-product.ts').toPublicProduct(masport);
  assert.equal(publicProduct.image, masport.image, 'SSR card receives a usable CMS source');
  assert.ok(!JSON.stringify(publicProduct).includes('wp.sepiidbeauty.ir'), 'origin stays server-side');

  requests = [];
  const roleRoute = load('app/api/product-image-roles/route.ts');
  const roleRequest = () => new Request('https://shop.test/api/product-image-roles?slugs=masport');
  const first = await (await roleRoute.GET(roleRequest())).json();
  await roleRoute.GET(roleRequest());
  assert.equal(first.cardImages.masport.src, masport.image);
  assert.equal(requests.filter((r) => r.value.includes('/wp-json/wc/v3/products')).length, 1,
    'repeated role lookups share the cached CMS request');

  // Even an intentionally cleared current CMS record takes precedence over
  // the deployment media snapshot; old images must never be resurrected.
  snapshots = { masport: { slug: 'masport', name: 'Masport', images: [] } };
  const mixedRequest = () => new Request('https://shop.test/api/product-image-roles?slugs=masport,missing-product');
  const cleared = await (await roleRoute.GET(mixedRequest())).json();
  assert.equal(cleared.cardImages.masport, null);
  snapshots.masport.images = [{ id: 999998, src: '/api/cms/public-media?id=999998&cutout=3',
    name: 'sepiid-role-card-masport-slot-new', alt: 'New CMS upload' }];
  const updated = await (await roleRoute.GET(mixedRequest())).json();
  assert.equal(updated.cardImages.masport.src, '/api/cms/public-media?id=999998&cutout=3');
  console.log('PASS product image delivery: public metadata auth, direct confirmed files, SSR sources, cache reuse, CMS clear/update precedence');
})().catch((error) => { console.error(error); process.exitCode = 1; });
