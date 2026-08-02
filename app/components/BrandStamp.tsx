/* eslint-disable @next/next/no-img-element -- local brand asset */

export function BrandStamp({ className = "" }: { className?: string }) {
  return (
    <span className={`sb-brand-stamp ${className}`} aria-hidden="true">
      <img src="/images/sepiid-logo.webp" alt="" width="900" height="900" />
      <i>SEPIID BEAUTY</i>
    </span>
  );
}
