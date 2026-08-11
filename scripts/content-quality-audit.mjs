import {
  brandPages,
  concerns,
  guides,
  pageOwnership,
} from "../app/content-architecture.ts";

const errors = [];
const warnings = [];

const aiPhrases = [
  "در دنیای امروز",
  "همان‌طور که می‌دانید",
  "همانطور که می‌دانید",
  "لازم به ذکر است",
  "شایان ذکر است",
  "در نهایت می‌توان گفت",
  "گامی مؤثر",
  "گامی موثر",
];

const unsafeClaims = [
  "درمان قطعی",
  "بدون عارضه",
  "تضمین نتیجه",
  "مناسب برای همه",
  "بهترین محصول برای",
];

function textValues(value) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(textValues);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(textValues);
  }
  return [];
}

function wordCount(value) {
  return textValues(value)
    .join(" ")
    .replace(/https?:\/\/\S+/g, " ")
    .trim()
    .split(/\s+/u)
    .filter(Boolean).length;
}

function auditLanding(type, page) {
  const values = textValues(page);
  const copy = values.join(" ");
  const words = wordCount(page);

  if (words > 2000) {
    errors.push(`${type}/${page.slug}: ${words} words (limit 2000)`);
  }

  for (const phrase of aiPhrases) {
    if (copy.includes(phrase)) {
      errors.push(`${type}/${page.slug}: generic phrase «${phrase}»`);
    }
  }

  for (const phrase of unsafeClaims) {
    if (copy.includes(phrase)) {
      errors.push(`${type}/${page.slug}: unsafe claim «${phrase}»`);
    }
  }

  for (const section of page.sections ?? []) {
    for (const paragraph of section.paragraphs) {
      if (paragraph.length > 420) {
        warnings.push(
          `${type}/${page.slug}: long paragraph in «${section.title}»`,
        );
      }
    }
  }

  const questions = (page.faq ?? []).map((item) => item.question);
  if (new Set(questions).size !== questions.length) {
    errors.push(`${type}/${page.slug}: duplicate FAQ question`);
  }
}

for (const guide of guides) auditLanding("guides", guide);
for (const concern of concerns) auditLanding("concerns", concern);

const routeKeys = [
  ...guides.map((page) => `guides/${page.slug}`),
  ...concerns.map((page) => `concerns/${page.slug}`),
  ...brandPages.map((page) => `brands/${page.slug}`),
];

if (new Set(routeKeys).size !== routeKeys.length) {
  errors.push("duplicate content route");
}

for (const guide of guides) {
  for (const slug of guide.concernSlugs) {
    if (!concerns.some((concern) => concern.slug === slug)) {
      errors.push(`guides/${guide.slug}: missing concern ${slug}`);
    }
  }

  for (const source of guide.sources) {
    if (!source.href.startsWith("https://")) {
      errors.push(`guides/${guide.slug}: source must use HTTPS`);
    }
  }
}

for (const concern of concerns) {
  for (const slug of concern.guideSlugs) {
    if (!guides.some((guide) => guide.slug === slug)) {
      errors.push(`concerns/${concern.slug}: missing guide ${slug}`);
    }
  }
}

const ownerPatterns = pageOwnership.map(
  (owner) => `${owner.intent}:${owner.pathPattern}`,
);

if (new Set(ownerPatterns).size !== ownerPatterns.length) {
  errors.push("duplicate intent owner");
}

if (warnings.length) {
  for (const warning of warnings) {
    console.warn(`WARN ${warning}`);
  }
}

if (errors.length) {
  for (const error of errors) {
    console.error(`FAIL ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `PASS content quality: ${guides.length} guides, ${concerns.length} concerns, ${brandPages.length} brands`,
  );
}
