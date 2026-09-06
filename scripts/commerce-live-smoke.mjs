const baseUrl = (process.env.BASE_URL || 'https://sepiidbeauty.ir').replace(/\/$/, '');
const requiredPaths = ['/shop', '/cart', '/checkout'];
const timeoutMs = 15000;

async function get(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      redirect: 'follow',
      headers: { 'user-agent': 'Sepiid-Commerce-Smoke/1.0' },
      signal: controller.signal,
    });
    return { path, status: response.status, url: response.url, text: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

const failures = [];
for (const path of requiredPaths) {
  try {
    const result = await get(path);
    if (result.status < 200 || result.status >= 400) failures.push(`${path} -> HTTP ${result.status}`);
    else console.log(`OK ${path} -> ${result.status}`);
  } catch (error) {
    failures.push(`${path} -> ${error instanceof Error ? error.message : 'request failed'}`);
  }
}

try {
  const shop = await get('/shop');
  const productPaths = [...new Set(
    [...shop.text.matchAll(/href=["'](\/product\/[^"'?#]+)["']/g)].map((match) => match[1]),
  )].sort();

  if (!productPaths.length) failures.push('/shop -> no product links discovered');
  console.log(`Discovered ${productPaths.length} product URLs`);

  for (const path of productPaths) {
    try {
      const result = await get(path);
      if (result.status !== 200) failures.push(`${path} -> HTTP ${result.status}`);
      else console.log(`OK ${path} -> 200`);
    } catch (error) {
      failures.push(`${path} -> ${error instanceof Error ? error.message : 'request failed'}`);
    }
  }
} catch (error) {
  failures.push(`/shop crawl -> ${error instanceof Error ? error.message : 'request failed'}`);
}

if (failures.length) {
  console.error('\nCOMMERCE SMOKE FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('\nCOMMERCE SMOKE PASSED');
