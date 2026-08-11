import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentLandingPage } from "../../components/ContentLandingPage";
import {
  getGuide,
  guides,
} from "../../content-architecture";
import { articles } from "../../data";
import { getStorefrontCatalog } from "../../lib/storefront-catalog";
import { getStorefrontCategories } from "../../lib/storefront-categories";
import { buildSeoMetadata } from "../../lib/seo";

export const revalidate = 300;

export function generateStaticParams() {
  return guides
    .filter((guide) => guide.indexable)
    .map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) return {};

  if (!guide.indexable) {
    return {
      robots: { index: false, follow: true },
    };
  }

  return buildSeoMetadata({
    title: guide.seoTitle,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    image: "/images/magazine-authenticity-v2.webp",
    imageAlt: guide.title,
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide || !guide.indexable) {
    notFound();
  }

  const [{ products }, categories] =
    await Promise.all([
      getStorefrontCatalog(),
      getStorefrontCategories(),
    ]);

  return (
    <ContentLandingPage
      page={guide}
      kind="guide"
      products={products}
      categories={categories}
      articles={articles}
    />
  );
}
