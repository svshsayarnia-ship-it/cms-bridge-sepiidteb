/* eslint-disable @next/next/no-img-element -- CMS image may be remote */
import Link from "next/link";
import type { SitePresentation } from "../lib/site-presentation";
import { ArrowIcon, ShieldIcon } from "./Icons";
import { BrandStamp } from "./BrandStamp";

export function EditableHomeHero({ hero }: { hero: SitePresentation["home"]["hero"] }) {
  return <section className="sb-hero"><div className="sb-shell sb-hero__grid">
    <div className="sb-hero__content"><span className="sb-eyebrow"><i />{hero.eyebrow}</span><h1><em>{hero.title}</em></h1><p>{hero.description}</p>
      <div className="sb-hero__actions"><Link className="sb-btn sb-btn--dark" href={hero.primaryCtaHref}>{hero.primaryCtaLabel}<ArrowIcon /></Link><Link className="sb-btn sb-btn--outline" href={hero.secondaryCtaHref}>{hero.secondaryCtaLabel}</Link></div>
      <div className="sb-hero__microproof">{hero.microproofItems.map(item => <span key={item}>{item}</span>)}</div>
    </div>
    <figure className="sb-hero__media"><BrandStamp /><span className="sb-hero__orb sb-hero__orb--one" /><span className="sb-hero__orb sb-hero__orb--two" /><div className="sb-hero__photo"><img src={hero.image} alt={hero.imageAlt} width="1400" height="933" fetchPriority="high" /></div>
      <figcaption><span>{hero.editorialLabel}</span><p>{hero.editorialCaption}</p></figcaption><div className="sb-hero__quality"><ShieldIcon /><div><strong>{hero.qualityTitle}</strong><small>{hero.qualitySubtitle}</small></div></div>
    </figure>
  </div></section>;
}
