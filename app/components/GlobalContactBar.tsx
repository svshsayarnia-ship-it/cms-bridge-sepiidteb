import Link from "next/link";

const officePhoneHref = "tel:+982128422578";
const mobilePhoneHref = "tel:+989037251266";

export function GlobalContactBar() {
  return (
    <aside className="sb-global-contact" aria-label="شماره‌های تماس سپید بیوتی">
      <div className="sb-shell sb-global-contact__inner">
        <span className="sb-global-contact__intro">راه‌های تماس مستقیم</span>
        <div className="sb-global-contact__phones">
          <Link href={officePhoneHref} className="sb-global-contact__phone sb-global-contact__phone--office">
            <span>تلفن ثابت دفتر</span>
            <b dir="ltr">۰۲۱-۲۸۴۲۲۵۷۸</b>
          </Link>
          <i aria-hidden="true" />
          <Link href={mobilePhoneHref} className="sb-global-contact__phone">
            <span>همراه و واتساپ</span>
            <b dir="ltr">۰۹۰۳۷۲۵۱۲۶۶</b>
          </Link>
        </div>
      </div>
    </aside>
  );
}
