import Link from "next/link";
import type { ReactNode } from "react";

type CommercialIntentCopy = {
  title: string;
  body: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

const commercialIntentByCategory: Record<string, CommercialIntentCopy> = {
  fillers: {
    title: "خرید فیلر لب و ژل لب؛ از مدل مناسب شروع کنید",
    body:
      "اگر با عبارت «خرید فیلر لب» یا «خرید ژل لب» وارد این صفحه شده‌اید، ابتدا مدل، حجم هر سرنگ، تعداد داخل بسته و قیمت همان مدل را مقایسه کنید. انتخاب ناحیه و روش استفاده باید توسط پزشک واجد صلاحیت انجام شود.",
    primaryHref: "/shop/fillers#category-products",
    primaryLabel: "مشاهده فیلرها و قیمت‌ها",
    secondaryHref: "/professional",
    secondaryLabel: "استعلام خرید کلینیکی",
  },
  "skin-boosters": {
    title: "خرید مزوژل جوان‌ساز و اسکین‌بوستر با مقایسه قیمت",
    body:
      "برای جست‌وجوهایی مثل «خرید مزوژل جوان‌ساز»، نام دقیق مدل، حجم، تعداد سرنگ یا ویال و واحد قیمت را کنار هم ببینید. عنوان جوان‌ساز به‌تنهایی برای انتخاب محصول کافی نیست.",
    primaryHref: "/shop/skin-boosters#category-products",
    primaryLabel: "مشاهده مزوژل‌ها و قیمت‌ها",
    secondaryHref: "/professional",
    secondaryLabel: "استعلام برای کلینیک",
  },
  "botulinum-toxins": {
    title: "برای جست‌وجوی «خرید بوتاکس اصل»، فقط نام روی جعبه کافی نیست",
    body:
      "در خرید فرآورده‌های بوتولینوم، نام دقیق مدل، تعداد واحد، وضعیت پلمب و بچ، شرایط نگهداری و منبع تأمین همان بسته را بررسی کنید. سپید بیوتی ادعای اصالت قطعی را صرفاً بر اساس ظاهر بسته یا نام برند مطرح نمی‌کند.",
    primaryHref: "/shop/botulinum-toxins#category-products",
    primaryLabel: "مشاهده بوتاکس‌ها و قیمت‌ها",
    secondaryHref: "/guides/botulinum-toxin",
    secondaryLabel: "راهنمای بررسی قبل از خرید",
  },
  "rejuvenation-cocktails": {
    title: "خرید کوکتل مزوتراپی؛ مدل و واحد قیمت را روشن کنید",
    body:
      "اگر هدف شما خرید کوکتل مزوتراپی برای کلینیک است، نام کامل محصول، حجم، تعداد ویال یا سرنگ و واحد قیمت را پیش از استعلام مشخص کنید تا محصولات متفاوت با هم مقایسه نشوند.",
    primaryHref: "/shop/rejuvenation-cocktails#category-products",
    primaryLabel: "مشاهده کوکتل‌ها و قیمت‌ها",
    secondaryHref: "/professional",
    secondaryLabel: "استعلام خرید عمده و کلینیکی",
  },
};

export default async function CategoryClusterLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const commercialIntent = commercialIntentByCategory[category];

  return (
    <>
      {children}

      {commercialIntent ? (
        <section
          className="sb-section sb-product-info-section"
          aria-labelledby={`${category}-commercial-intent-title`}
        >
          <div className="sb-shell sb-product-info-section__grid">
            <div>
              <h2 id={`${category}-commercial-intent-title`}>
                {commercialIntent.title}
              </h2>
              <p>{commercialIntent.body}</p>
            </div>
            <div className="sb-article-parent-guide">
              <span>مسیر سریع خرید و استعلام</span>
              <Link href={commercialIntent.primaryHref}>
                {commercialIntent.primaryLabel}
              </Link>
              {commercialIntent.secondaryHref && commercialIntent.secondaryLabel ? (
                <Link href={commercialIntent.secondaryHref}>
                  {commercialIntent.secondaryLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {category === "skin-boosters" ? (
        <section
          className="sb-section sb-product-info-section"
          aria-labelledby="skin-booster-jalupro-guide-title"
        >
          <div className="sb-shell sb-product-info-section__grid">
            <div>
              <h2 id="skin-booster-jalupro-guide-title">
                بین مدل‌های جالپرو مردد هستید؟
              </h2>
              <p>
                Classic، HMW و Super Hydro یک مدل واحد نیستند. قبل از مقایسه قیمت،
                تفاوت ترکیب و ساختار بسته هر مدل را ببینید.
              </p>
            </div>
            <div className="sb-article-parent-guide">
              <span>راهنمای مقایسه مدل‌های Jalupro</span>
              <Link href="/magazine/jalupro-classic-hmw-super-hydro-guide">
                تفاوت Classic، HMW و Super Hydro
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
