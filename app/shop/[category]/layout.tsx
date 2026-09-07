import Link from "next/link";
import type { ReactNode } from "react";

export default async function CategoryClusterLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  return (
    <>
      {children}
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
