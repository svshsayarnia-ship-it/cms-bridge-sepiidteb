import Link from "next/link";
import { ChevronIcon } from "./Icons";
import { JsonLd } from "./JsonLd";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const origin = "https://sepiid-beauty-home.svshsayarnia.chatgpt.site";

  return (
    <>
      <nav className="sb-breadcrumbs" aria-label="مسیر صفحه">
        <Link href="/">خانه</Link>
        {items.map((item) => (
          <span key={`${item.label}-${item.href ?? "current"}`}>
            <ChevronIcon />
            {item.href ? <Link href={item.href}>{item.label}</Link> : <b>{item.label}</b>}
          </span>
        ))}
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "خانه",
              item: origin,
            },
            ...items.map((item, index) => ({
              "@type": "ListItem",
              position: index + 2,
              name: item.label,
              ...(item.href ? { item: `${origin}${item.href}` } : {}),
            })),
          ],
        }}
      />
    </>
  );
}

