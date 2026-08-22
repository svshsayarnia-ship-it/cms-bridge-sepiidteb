import Link from "next/link";

const steps = [
  { label: "انتخاب دسته", hint: "از گروه محصول شروع کنید.", href: "/shop", action: "دیدن دسته‌ها" },
  { label: "بررسی محصول", hint: "مشخصات و برند را کنار هم ببینید.", href: "/guides", action: "راهنمای انتخاب" },
  {
    label: "استعلام موجودی",
    hint: "قیمت و وضعیت همان مدل را بپرسید.",
    href: "https://wa.me/989037251266?text=%D8%B3%D9%84%D8%A7%D9%85%D8%8C%20%D8%A8%D8%B1%D8%A7%DB%8C%20%D8%A7%D8%B3%D8%AA%D8%B9%D9%84%D8%A7%D9%85%20%D9%85%D9%88%D8%AC%D9%88%D8%AF%DB%8C%20%D9%88%20%D9%82%DB%8C%D9%85%D8%AA%20%D9%BE%DB%8C%D8%A7%D9%85%20%D9%85%DB%8C%E2%80%8C%D8%AF%D9%87%D9%85.",
    action: "شروع گفت‌وگو",
  },
  { label: "پیگیری سفارش", hint: "برای تحویل یا وضعیت سفارش با ما در تماس باشید.", href: "/contact", action: "راه‌های تماس" },
];

export function CustomerJourney() {
  return (
    <nav className="sb-page-journey" aria-label="مسیر مشتری در سپید بیوتی">
      <div className="sb-page-journey__rail">
        <span className="sb-page-journey__label">مسیر شما در سپید</span>
        <ol>
          {steps.map((step, index) => (
            <li key={step.label}>
              <Link href={step.href}>
                <span className="sb-page-journey__bubble">۰{index + 1}</span>
                <span>{step.label}</span>
              </Link>
              <div className="sb-page-journey__suggestions">
                <p>{step.hint}</p>
                <Link href={step.href}>{step.action}</Link>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
