import { siteOrigin } from "../lib/site-url";

export const revalidate = 86400;

export function GET() {
  const content = `# Sepiid Beauty

> فروشگاه و مجله فارسی محصولات حرفه‌ای زیبایی و تزریقی؛ با تمرکز بر انتخاب آگاهانه، مشخصات محصول و بررسی اصالت.

## صفحات اصلی
- فروشگاه: ${siteOrigin}/shop
- فیلر و ژل‌های حجم‌دهنده: ${siteOrigin}/shop/fillers
- مزوژل و اسکین‌بوستر: ${siteOrigin}/shop/skin-boosters
- بوتولینوم: ${siteOrigin}/shop/botulinum-toxins
- راهنمای انتخاب: ${siteOrigin}/guides
- مجله: ${siteOrigin}/magazine

## اعتماد و پشتیبانی
- بررسی اصالت: ${siteOrigin}/policies/authenticity
- ارسال: ${siteOrigin}/policies/shipping
- مرجوعی: ${siteOrigin}/policies/returns
- تماس: ${siteOrigin}/contact

## یادداشت استفاده
اطلاعات هر محصول، از جمله موجودی و قیمت، باید از همان صفحه محصول بررسی شود. محتوای سایت جایگزین مشاوره پزشکی یا درمانی نیست.
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
