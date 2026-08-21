import Link from "next/link";

const steps = [
  { label: "دسته‌تان را پیدا کنید", hint: "از همان گروهی شروع کنید که دنبالش هستید.", href: "/shop", action: "دیدن دسته‌ها" },
  { label: "مدل‌ها را مقایسه کنید", hint: "حجم، بسته و قیمت را کنار هم ببینید.", href: "/guides", action: "راهنمای انتخاب" },
  {
    label: "موجودی را بپرسید",
    hint: "اسم مدل را بفرستید تا قیمت و موجودی همان روز را چک کنیم.",
    href: "https://wa.me/989037251266?text=%D8%B3%D9%84%D8%A7%D9%85%D8%8C%20%D8%A8%D8%B1%D8%A7%DB%8C%20%D8%A7%D8%B3%D8%AA%D8%B9%D9%84%D8%A7%D9%85%20%D9%85%D9%88%D8%AC%D9%88%D8%AF%DB%8C%20%D9%88%20%D9%82%DB%8C%D9%85%D8%AA%20%D9%BE%DB%8C%D8%A7%D9%85%20%D9%85%DB%8C%E2%80%8C%D8%AF%D9%87%D9%85.",
    action: "پیام به سپید",
  },
  { label: "سفارش را پیگیری کنید", hint: "اگر سفارشی دارید، برای وضعیت ارسال یا تحویل پیام بدهید.", href: "/contact", action: "راه‌های تماس" },
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
