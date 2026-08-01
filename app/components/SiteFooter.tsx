import Link from "next/link";
import { whatsappHref } from "../data";
import { ArrowIcon } from "./Icons";
import { BrandMark } from "./SiteHeader";

export function SiteFooter() {
  return (
    <footer className="sb-footer">
      <div className="sb-shell">
        <div className="sb-footer__cta">
          <div>
            <span>SUPPORT / پشتیبانی</span>
            <h2>قبل از خرید، سؤال درست را بپرسید.</h2>
            <p>برای موجودی، مشخصات بسته و شرایط تحویل، مستقیم با تیم ما گفت‌وگو کنید.</p>
          </div>
          <Link className="sb-btn sb-btn--gold" href={whatsappHref()}>
            شروع گفت‌وگو
            <ArrowIcon />
          </Link>
        </div>

        <div className="sb-footer__grid">
          <div className="sb-footer__brand">
            <BrandMark light />
            <p>
              مرجع انتخاب و استعلام محصولات حرفه‌ای زیبایی با تمرکز بر اصالت،
              اطلاعات شفاف و پشتیبانی انسانی.
            </p>
            <div className="sb-footer__socials">
              <Link href="https://wa.me/989037251266">WhatsApp</Link>
              <Link href="tg://resolve?phone=989037251266">Telegram</Link>
            </div>
          </div>
          <div className="sb-footer__column">
            <strong>فروشگاه</strong>
            <Link href="/shop/fillers">فیلرهای پوستی</Link>
            <Link href="/shop/skin-boosters">اسکین‌بوستر و مزوژل</Link>
            <Link href="/shop/botulinum-toxins">بوتاکس و بوتولینوم</Link>
            <Link href="/shop/hair-cocktails">کوکتل‌های تخصصی مو</Link>
            <Link href="/shop/rejuvenation-cocktails">کوکتل‌های جوان‌سازی</Link>
          </div>
          <div className="sb-footer__column">
            <strong>راهنمای سپید</strong>
            <Link href="/guides">راهنمای انتخاب</Link>
            <Link href="/magazine/verify-dermal-filler-authenticity">بررسی اصالت</Link>
            <Link href="/magazine">مجله و مقالات</Link>
            <Link href="/about">درباره سپید بیوتی</Link>
            <Link href="/professional">خرید حرفه‌ای کلینیک</Link>
          </div>
          <div className="sb-footer__contact">
            <span>مشاوره و استعلام</span>
            <Link href="tel:+989037251266">۰۹۰۳۷۲۵۱۲۶۶</Link>
            <p>شنبه تا پنجشنبه · ۹ تا ۲۰</p>
            <Link href="/contact">
              همه راه‌های ارتباط
              <ArrowIcon />
            </Link>
          </div>
        </div>

        <div className="sb-footer__bottom">
          <span>© 2026 Sepiid Beauty</span>
          <p>
            محتوای سایت آموزشی است. محصولات تزریقی باید فقط توسط افراد واجد صلاحیت
            انتخاب و استفاده شوند.
          </p>
          <div>
            <Link href="/policies/privacy">حریم خصوصی</Link>
            <Link href="/policies/terms">شرایط استفاده</Link>
            <Link href="/policies/shipping">ارسال</Link>
            <Link href="/policies/returns">مغایرت و بازگشت</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
