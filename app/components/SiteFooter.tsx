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
      <div className="sb-footer__column"><strong>محصولات</strong><Link href="/shop/fillers">فیلر و ژل</Link><Link href="/shop/skin-boosters">مزوژل و اسکین‌بوستر</Link><Link href="/shop/botulinum-toxins">بوتاکس</Link><Link href="/shop/hair-cocktails">محصولات مو و پوست سر</Link></div>
      <div className="sb-footer__column"><strong>راهنما</strong><Link href="/guides">راهنمای ساده</Link><Link href="/magazine">مقاله‌ها</Link><Link href="/faq">سؤال‌های رایج</Link><Link href="/about">درباره سپید</Link><Link href="/professional">سفارش کلینیک</Link></div>
      <div className="sb-footer__contact"><span>مشاوره و استعلام</span><Link href={`tel:${presentation.phone}`}>{presentation.phone}</Link><p>{presentation.hours}</p><Link href="/contact">همه راه‌های ارتباط<ArrowIcon /></Link></div>
    </div>
    <div className="sb-footer__bottom"><span>© 2026 Sepiid Beauty</span><p>{presentation.legalNotice}</p><div><Link href="/policies/privacy">حریم خصوصی</Link><Link href="/policies/terms">شرایط استفاده</Link><Link href="/policies/shipping">ارسال</Link><Link href="/policies/returns">مغایرت و بازگشت</Link></div></div>
  </div></footer>;
}
