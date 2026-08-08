import Link from "next/link";
import { whatsappHref } from "../data";
import type { SitePresentation } from "../lib/site-presentation";
import { ArrowIcon } from "./Icons";
import { BrandMark } from "./SiteHeader";

export function SiteFooter({ presentation }: { presentation: SitePresentation["footer"] & { brandTagline: string } }) {
  return <footer className="sb-footer"><div className="sb-shell">
    <div className="sb-footer__cta"><div><span>{presentation.supportEyebrow}</span><h2>{presentation.supportTitle}</h2><p>{presentation.supportText}</p></div>
      <Link className="sb-btn sb-btn--gold" href={whatsappHref()}>{presentation.supportButtonLabel}<ArrowIcon /></Link></div>
    <div className="sb-footer__grid">
      <div className="sb-footer__brand"><BrandMark light tagline={presentation.brandTagline} /><p>{presentation.brandDescription}</p><div className="sb-footer__socials"><Link href="https://wa.me/989037251266">WhatsApp</Link><Link href="tg://resolve?phone=989037251266">Telegram</Link></div></div>
      <div className="sb-footer__column"><strong>فروشگاه</strong><Link href="/shop/fillers">فیلرهای پوستی</Link><Link href="/shop/skin-boosters">اسکین‌بوستر و مزوژل</Link><Link href="/shop/botulinum-toxins">بوتاکس و بوتولینوم</Link><Link href="/shop/hair-cocktails">کوکتل‌های تخصصی مو</Link></div>
      <div className="sb-footer__column"><strong>راهنمای سپید</strong><Link href="/guides">راهنمای انتخاب</Link><Link href="/magazine">مجله و مقالات</Link><Link href="/about">درباره سپید بیوتی</Link><Link href="/professional">خرید حرفه‌ای کلینیک</Link></div>
      <div className="sb-footer__contact"><span>مشاوره و استعلام</span><Link href={`tel:${presentation.phone}`}>{presentation.phone}</Link><p>{presentation.hours}</p><Link href="/contact">همه راه‌های ارتباط<ArrowIcon /></Link></div>
    </div>
    <div className="sb-footer__bottom"><span>© 2026 Sepiid Beauty</span><p>{presentation.legalNotice}</p><div><Link href="/policies/privacy">حریم خصوصی</Link><Link href="/policies/terms">شرایط استفاده</Link><Link href="/policies/shipping">ارسال</Link><Link href="/policies/returns">مغایرت و بازگشت</Link></div></div>
  </div></footer>;
}
