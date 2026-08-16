function sanitizeStructuredData(key: string, value: unknown) {
  if (
    key === "availability" &&
    value === "https://schema.org/PreOrder"
  ) {
    return undefined;
  }

  return value;
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, sanitizeStructuredData).replace(
          /</g,
          "\\u003c",
        ),
      }}
    />
  );
}
