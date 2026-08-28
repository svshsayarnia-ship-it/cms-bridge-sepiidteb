import Link from "next/link";

const steps = [
  { label: "اسم یا مدل را می‌دانم", hint: "مستقیم وارد فروشگاه شوید و نام محصول یا برند را جست‌وجو کنید.", href: "/shop", action: "رفتن به فروشگاه" },
  { label: "بین چند مدل مرددم", hint: "از راهنما شروع کنید؛ تفاوت دسته، مدل، حجم و بسته را قدم‌به‌قدم ببینید.", href: "/guides", action: "شروع راهنمای انتخاب" },
  {
    label: "برای کلینیک خرید دارم",
    hint: "فهرست چند قلمی را یک‌جا بفرستید تا مدل، موجودی و زمان تحویل هر مورد بررسی شود.",
    href: "/professional",
    action: "سفارش کلینیکی",
  },
  {
    label: "می‌خواهم قبل از خرید مطمئن شوم",
    hint: "چک‌لیست اصالت، بسته‌بندی و بچ‌کد را بخوانید و اگر چیزی مبهم بود از ما بپرسید.",
    href: "/magazine/verify-dermal-filler-authenticity",
    action: "دیدن چک‌لیست اصالت",
  },
];

export function CustomerJourney() {
  return (
    <nav className="sb-page-journey" aria-label="مراحل خرید در سپید بیوتی">
      <div className="sb-page-journey__rail">
        <span className="sb-page-journey__label">اگر نمی‌دانید از کجا شروع کنید</span>
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
