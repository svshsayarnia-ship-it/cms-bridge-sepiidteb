type ArticleDate = {
  datePublished?: string;
  dateModified?: string;
};

function timestamp(value?: string) {
  if (!value) return 0;

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Keeps the magazine feed in publication order. A managed article without a
 * publication date falls back to its last review date, then keeps its original
 * relative order when neither date is available.
 */
export function sortArticlesNewestFirst<T extends ArticleDate>(articles: T[]) {
  return articles
    .map((article, index) => ({
      article,
      index,
      publishedAt: timestamp(article.datePublished),
      modifiedAt: timestamp(article.dateModified),
    }))
    .sort((left, right) => {
      const leftPrimary = left.publishedAt || left.modifiedAt;
      const rightPrimary = right.publishedAt || right.modifiedAt;

      return (
        rightPrimary - leftPrimary ||
        right.modifiedAt - left.modifiedAt ||
        left.index - right.index
      );
    })
    .map(({ article }) => article);
}
