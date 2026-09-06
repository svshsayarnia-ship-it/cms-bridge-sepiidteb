import Link from "next/link";
import { whatsappHref } from "../data";
import type { SitePresentation } from "../lib/site-presentation";
import { ArrowIcon } from "./Icons";
import { BrandMark } from "./SiteHeader";

const enamadMarkup = "<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=7414582&Code=eD1Kxp1lMZfUYqpIAuzx7yAnSgqpAtGt' aria-label='مشاهده اعتبار اینماد سپید بیوتی' style='display:flex;width:100%;height:100%;align-items:center;justify-content:center;position:relative;z-index:2;pointer-events:auto;cursor:pointer'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=7414582&Code=eD1Kxp1lMZfUYqpIAuzx7yAnSgqpAtGt' alt='نماد اعتماد الکترونیکی سپید بیوتی' width='80' height='80' style='cursor:pointer;display:block;width:80px;height:80px;max-width:80px;object-fit:contain;pointer-events:auto' code='eD1Kxp1lMZfUYqpIAuzx7yAnSgqpAtGt'></a>";

export function SiteFooter({ presentation }: { presentation: SitePresentation["footer"] & { brandTagline: string } }) {
  return <footer className="sb-footer"><div className="sb-shell">
    <div className="sb-footer__cta"><div><span>{presentation.supportEyebrow}</span><h2>{presentation.supportTitle}</h2><p>{presentation.supportText}</p></div>
      <Link className="sb-btn sb-btn--gold" href={whatsappHref()}>{presentation.supportButtonLabel}<ArrowIcon /></Link></div>
    <div className="sb-footer__grid">
      <div className="sb-footer__brand"><BrandMark light tagline={presentation.brandTagline} /><p>{presentation.brandDescription}</p><div className="sb-footer__socials"><Link href="https://wa.me/989037251266">واتساپ</Link><Link href="tg://resolve?phone=989037251266">تلگرام</Link></div>
        <div
          className="sb-footer__enamad"
          aria-label="نماد اعتماد الکترونیکی سپید بیوتی"
          style={{
            marginTop: 18,
            width: 96,
            height: 96,
            minHeight: 96,
            display: "grid",
            placeItems: "center",
            padding: 0,
            borderRadius: 14,
            background: "#fff",
            position: "relative",
            zIndex: 1,
            overflow: "hidden",
          }}
          dangerouslySetInnerHTML={{ __html: enamadMarkup }}
        />
      </div>
      <div className="sb-footer__column"><strong>فروشگاه</strong><Link href="/shop/fillers">فیلرهای پوستی</Link><Link href="/shop/skin-boosters">اسکین‌بوستر و مزوژل</Link><Link href="/shop/botulinum-toxins">بوتاکس و بوتولینوم</Link><Link href="/shop/hair-cocktails">کوکتل‌های تخصصی مو</Link></div>
      <div className="sb-footer__column"><strong>راهنمای سپید</strong><Link href="/guides">راهنمای انتخاب</Link><Link href="/magazine">مجله و مقالات</Link><Link href="/faq">پرسش‌های متداول</Link><Link href="/about">درباره سپید بیوتی</Link><Link href="/professional">خرید حرفه‌ای کلینیک</Link></div>
      <div className="sb-footer__contact"><span>مشاوره و استعلام</span><Link href={`tel:${presentation.phone}`}>{presentation.phone}</Link><p>{presentation.hours}</p><Link href="/contact">همه راه‌های ارتباط<ArrowIcon /></Link></div>
    </div>
    <div className="sb-footer__bottom"><span>© 2026 Sepiid Beauty</span><p>{presentation.legalNotice}</p><div><Link href="/policies/privacy">حریم خصوصی</Link><Link href="/policies/terms">شرایط استفاده</Link><Link href="/policies/shipping">ارسال</Link><Link href="/policies/returns">مغایرت و بازگشت</Link></div></div>
    <div className="sb-footer__credit" aria-label="طراحی و اجرای سایت"><span>طراحی و اجرا توسط</span><strong>سیاوش سیارنیا</strong></div>
  </div></footer>;
}
