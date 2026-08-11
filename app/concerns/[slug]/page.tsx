import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentLandingPage } from "../../components/ContentLandingPage";
import {
  concerns,
  getConcern,
} from "../../content-architecture";
import { articles } from "../../data";
import { getStorefrontCatalog } from "../../lib/storefront-catalog";
import { getStorefrontCategories } from "../../lib/storefront-categories";
import { buildSeoMetadata } from "../../lib/seo";

export const revalidate = 300;

export function generateStaticParams() {
  return concerns
    .filter((concern) => concern.indexable)
    .map((concern) => ({ slug: concern.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const concern = getConcern(slug);

  if (!concern) return {};

  if (!concern.indexable) {
    return {
      robots: { index: false, follow: true },
    };
  }

  return buildSeoMetadata({
    title: concern.seoTitle,
    description: concern.description,
    path: `/concerns/${concern.slug}`,
    image: "/images/drive/hero-rejuvenation.webp",
    imageAlt: concern.title,
  });
}

export default async function ConcernPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const concern = getConcern(slug);

  if (!concern || !concern.indexable) {
    notFound();
  }

  const [{ products }, categories] =
    await Promise.all([
      getStorefrontCatalog(),
      getStorefrontCategories(),
    ]);

  return (
    <ContentLandingPage
      page={concern}
      kind="concern"
      products={products}
      categories={categories}
      articles={articles}
    />
  );
}
