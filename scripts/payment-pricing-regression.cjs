const ts=require(process.cwd()+'/node_modules/typescript');
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
process.env.WORDPRESS_URL='https://woo.test';process.env.WOOCOMMERCE_CONSUMER_KEY='test';process.env.WOOCOMMERCE_CONSUMER_SECRET='test';process.env.ABAN_API_TOKEN='test';
function load(file,fetch){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>n==='server-only'?{}:n.includes('current-inventory')?{isApprovedInventorySlug:()=>true}:n.includes('storefront-runtime-cache')?{getRuntimeStorefrontProduct:async()=>({id:2})}:require(n),process,fetch,Headers,URL,URLSearchParams,AbortController,setTimeout,clearTimeout,Buffer,console});return module.exports;}
const reply=x=>new Response(JSON.stringify(x),{status:200});
(async()=>{
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
let bad=false;const amounts=[];
const gateway=load('app/lib/aban-gateway.ts',async(url,opts)=>{if(String(url).includes('invoices')){const b=JSON.parse(opts.body);amounts.push(b.amount_rial);return reply({invoice_id:'inv_test123',amount_rial:bad?6700000:b.amount_rial,payable_rial:bad?6707770:b.amount_rial+7770,payment_url:'https://abangateway.ir/pay/inv_test123'});}return reply({});});
const payment=await gateway.createAbanPayment({orderId:5,idempotencyKey:input.idempotencyKey,orderSnapshot:order.__wooOrder});assert.equal(amounts[0],128800000);assert.equal(payment.payableRial,128807770);bad=true;
await assert.rejects(()=>gateway.createAbanPayment({orderId:5,idempotencyKey:input.idempotencyKey,orderSnapshot:order.__wooOrder}),e=>e.code==='invalid_create_response');
console.log('PASS: latest duplicate CMS price, IRR order with Toman storefront total, authoritative line total, no price writes, stale quote rejection, 10x rial conversion, invalid invoice rejection');
})().catch(e=>{console.error(e);process.exit(1)});
