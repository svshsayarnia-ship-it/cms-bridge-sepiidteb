export default function Loading() {
  return (
    <main
      id="main-content"
      className="sb-loading"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="sb-shell sb-loading__grid">
        <div className="sb-loading__copy">
          <span className="sb-loading__line sb-loading__line--eyebrow" />
          <span className="sb-loading__line sb-loading__line--title" />
          <span className="sb-loading__line sb-loading__line--body" />
          <span className="sb-loading__line sb-loading__line--body sb-loading__line--short" />

          <span className="sb-sr-only">
            در حال بارگذاری صفحه
          </span>
        </div>

        <span
          className="sb-loading__visual"
          aria-hidden="true"
        />
      </div>
    </main>
  );
}