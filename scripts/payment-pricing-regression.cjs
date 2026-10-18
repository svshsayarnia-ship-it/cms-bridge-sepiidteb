(async()=>{
const [{ default: ts }, fs, vm, { default: assert }, { createRequire }] = await Promise.all([
  import('typescript'), import('node:fs'), import('node:vm'), import('node:assert/strict'), import('node:module'),
]);
const nodeRequire = createRequire(__filename);
process.env.WORDPRESS_URL='https://woo.test';process.env.WOOCOMMERCE_CONSUMER_KEY='test';process.env.WOOCOMMERCE_CONSUMER_SECRET='test';process.env.ABAN_API_TOKEN='test';
function load(file,fetch,snapshots=[{id:2,slug:'fusion-f-mesomatrix'}],catalog=[],overrides={}){const testModule={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module:testModule,exports:testModule.exports,require:n=>n==='server-only'?{}:n==='../catalog'?{catalogProducts:catalog}:n==='./variant-pricing'?{VARIANT_PRICE_META_KEY:'sepiid_variant_prices',parseVariantPriceOverrides:()=>overrides}:n.includes('current-inventory')?{isApprovedInventorySlug:()=>true,canonicalInventorySlug:s=>s,currentInventoryLegacyAliases:{}}:n.includes('storefront-runtime-cache')?{getRuntimeCheckoutProducts:async()=>snapshots}:nodeRequire(n),process,fetch,Headers,URL,URLSearchParams,AbortController,setTimeout,clearTimeout,Buffer,console});return testModule.exports;}
const reply=x=>new Response(JSON.stringify(x),{status:200});
const calls=[]; let savedOrder = null;
const product={id:1,name:'Fusion',slug:'fusion-f-mesomatrix',status:'publish',price:'6700000',regular_price:'6700000',sale_price:'',stock_status:'instock',manage_stock:false,date_modified_gmt:'2026-10-01T00:00:00'};
const newest={...product,id:2,slug:'fusion-f-mesomatrix-2',price:'12880000',regular_price:'12950000',sale_price:'12880000',date_modified_gmt:'2026-10-10T00:00:00'};
const checkout=load('app/lib/checkout-woocommerce.ts',async(url,opts)=>{calls.push({url:String(url),opts}); assert(!new URL(url).searchParams.get('slug')?.includes(','));if(opts.method!=='POST' && String(url).includes('/orders?')) return reply(savedOrder ? [savedOrder] : []); if(opts.method==='POST'){const b=JSON.parse(opts.body);assert.equal(b.currency,'IRR');assert.equal(b.line_items[0].product_id,2);assert.equal(b.line_items[0].total,'128800000');return reply({id:5,number:'5',status:'pending',total:'128800000',currency:b.currency,meta_data:b.meta_data});}return reply([product,newest]);});
const input={idempotencyKey:'sb_test123456789012',fullName:'Test Customer',phone:'09120000000',expectedSubtotal:12880000,lines:[{slug:product.slug,quantity:1}]};
const quote=await checkout.getCheckoutQuote(input.lines);assert.equal(quote[0].priceToman,12880000);
const order=await checkout.createPendingWooOrder(input);assert.equal(order.currency,'IRT');assert(!calls.some(c=>c.opts.method==='PUT'));
await assert.rejects(()=>checkout.createPendingWooOrder({...input,expectedSubtotal:6700000}),e=>e.code==='price_changed');
savedOrder={...order.__wooOrder,total:'6700000',currency:'IRR'};
await assert.rejects(()=>checkout.createPendingWooOrder({...input,retry:true}),e=>e.code==='order_price_changed');
await assert.rejects(()=>checkout.getCheckoutQuote([{slug:product.slug,quantity:NaN}]),e=>e.code==='invalid_cart_line');
// A cold cache must resolve the real -2 Woo record, without catalog writes.
const cold=load('app/lib/checkout-woocommerce.ts',async(url,opts)=>{
 assert(!opts.method || opts.method==='GET');
 const q=new URL(url).searchParams;
 assert(!q.get('slug')?.includes(','));
 return reply(q.get('page')==='2'?[]:[product,newest]);
},[]);
assert.equal((await cold.getCheckoutQuote(input.lines))[0].priceToman,12880000);
const suffixed=load('app/lib/checkout-woocommerce.ts',async()=>reply([newest]),[{id:2,slug:'fusion-f-mesomatrix',dateModifiedGmt:'2026-10-10'}]);
assert.equal((await suffixed.getCheckoutQuote(input.lines))[0].priceToman,12880000);
const variantCatalog=[{slug:product.slug,variants:[{id:'deep',volume:'1ml',priceToman:5000000},{id:'volume',volume:'1ml',priceToman:6000000}]}];
const variantCheckout=load('app/lib/checkout-woocommerce.ts',async(url,opts)=>{
 if(opts.method==='POST'){
  const body=JSON.parse(opts.body);
  assert.equal(body.line_items[0].total,'102000000');
  assert.equal(body.line_items[1].total,'60000000');
  assert.equal(body.line_items[0].meta_data.find(m=>m.key==='_sepiid_variant_id').value,'deep');
  return reply({id:6,total:'162000000',currency:'IRR',status:'pending'});
 }
 return reply([newest]);
},[{id:2,slug:product.slug}],variantCatalog,{deep:{regularPrice:'5200000',salePrice:'5100000'}});
const variantLines=[{slug:product.slug,variantId:'deep',volume:'1ml',quantity:2},{slug:product.slug,variantId:'volume',volume:'1ml',quantity:1}];
const variantQuote=await variantCheckout.getCheckoutQuote(variantLines);
assert.equal(variantQuote[0].priceToman,5100000);assert.equal(variantQuote[1].priceToman,6000000);
assert.notEqual(variantQuote[0].key,variantQuote[1].key);
assert.equal((await variantCheckout.createPendingWooOrder({...input,expectedSubtotal:16200000,lines:variantLines})).total,'16200000');
await assert.rejects(()=>variantCheckout.getCheckoutQuote([{slug:product.slug,volume:'1ml',quantity:1}]),e=>e.code==='variant_required');
await assert.rejects(()=>variantCheckout.getCheckoutQuote([{slug:product.slug,variantId:'fake',quantity:1}]),e=>e.code==='invalid_variant');
let bad=false;const amounts=[];
const gateway=load('app/lib/aban-gateway.ts',async(url,opts)=>{if(String(url).includes('invoices')){const b=JSON.parse(opts.body);amounts.push(b.amount_rial);return reply({invoice_id:'inv_test123',amount_rial:bad?6700000:b.amount_rial,payable_rial:bad?6707770:b.amount_rial+7770,payment_url:'https://abangateway.ir/pay/inv_test123'});}return reply({});});
const payment=await gateway.createAbanPayment({orderId:5,idempotencyKey:input.idempotencyKey,orderSnapshot:order.__wooOrder});assert.equal(amounts[0],128800000);assert.equal(payment.payableRial,128807770);bad=true;
await assert.rejects(()=>gateway.createAbanPayment({orderId:5,idempotencyKey:input.idempotencyKey,orderSnapshot:order.__wooOrder}),e=>e.code==='invalid_create_response');
console.log('PASS: latest duplicate CMS price, IRR order with Toman storefront total, authoritative line total, no price writes, stale quote rejection, 10x rial conversion, invalid invoice rejection');
})().catch(e=>{console.error(e);process.exit(1)});
