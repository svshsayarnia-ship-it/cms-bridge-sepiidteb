/* eslint-disable @next/next/no-img-element -- local editorial imagery */
import Link from "next/link";
import type { Article } from "../data";
import { ArrowIcon, ClockIcon } from "./Icons";
import { toReaderFriendlyCopy } from "../lib/public-copy";

export function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  return (
    <article className={`sb-article-card ${featured ? "sb-article-card--featured" : ""}`}>
      <Link
        className="sb-article-card__image"
        href={`/magazine/${article.slug}`}
        aria-label={`مطالعه مقاله ${article.title}`}
      >
        <img
          src={
            article.slug === "verify-dermal-filler-authenticity"
              ? "/images/magazine-authenticity-v2.webp"
              : article.image
          }
          alt={`تصویر مقاله ${article.title}`}
          width="1200"
          height="760"
          loading="lazy"
          style={{ objectPosition: article.imagePosition }}
        />
        <span>{article.category}</span>
      </Link>
      <div className="sb-article-card__content">
        <div className="sb-article-card__meta">
          <span>{article.date}</span>
          <span>
            <ClockIcon />
            {article.readTime}
          </span>
        </div>
        <Link href={`/magazine/${article.slug}`}>
          <h3>{toReaderFriendlyCopy(article.title)}</h3>
        </Link>
        <p>{toReaderFriendlyCopy(article.excerpt)}</p>
        <Link className="sb-text-link" href={`/magazine/${article.slug}`}>
          خواندن مقاله
          <ArrowIcon />
        </Link>
      </div>
    </article>
  );
}
