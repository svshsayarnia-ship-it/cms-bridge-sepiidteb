"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { whatsappHref } from "../data";
import type { Product } from "../data";
import { ArrowIcon, CheckIcon } from "./Icons";
import { VialMark } from "./VialMark";

type Answer = { label: string; value: string };
type Question = {
  title: string;
  description: string;
  answers: Answer[];
  type?: "choice" | "product-name";
};

const questions: Question[] = [
  {
    title: "برای چه نوع خریدی دنبال محصول هستید؟",
    description: "تا مسیر مناسب‌تری برای دیدن کالاها و استعلام به شما نشان بدهیم.",
    answers: [
      { label: "کلینیک یا مطب", value: "professional" },
      { label: "مرکز یا سالن زیبایی", value: "pro" },
      { label: "فقط می‌خواهم محصولات را ببینم", value: "browse" },
    ],
  },
  {
    title: "دنبال کدام گروه محصول هستید؟",
    description: "دسته‌ای را انتخاب کنید که به خرید شما نزدیک‌تر است.",
    answers: [
      { label: "فیلر و ژل", value: "fillers" },
      { label: "مزوژل و اسکین‌بوستر", value: "skin-boosters" },
      { label: "مو و پوست سر", value: "hair-cocktails" },
      { label: "بوتاکس", value: "botulinum-toxins" },
      { label: "کوکتل‌های پوستی", value: "rejuvenation-cocktails" },
    ],
  },
  {
    title: "الان بیشتر به چه کمکی نیاز دارید؟",
    description: "در پایان، شما را مستقیم به همان مسیر می‌بریم.",
    answers: [
      { label: "دیدن محصولات این دسته", value: "shop" },
      { label: "مقایسه برند و مدل", value: "compare" },
      { label: "قیمت و موجودی روز", value: "inquiry" },
    ],
  },
  {
    title: "نام برند یا مدل موردنظرتان را بنویسید.",
    description: "مثلاً نورامیس، جالپرو یا رِووفیل. ما آن را در دستهٔ درست جست‌وجو می‌کنیم.",
    answers: [],
    type: "product-name",
  },
  {
    title: "دوست دارید از کدام مسیر ادامه دهید؟",
    description: "می‌توانید محصولات را ببینید یا مستقیم دربارهٔ موجودی پیام بدهید.",
    answers: [
      { label: "نمایش محصولات", value: "shop" },
      { label: "استعلام در واتساپ", value: "support" },
      { label: "مسیر خرید کلینیکی", value: "clinic" },
    ],
  },
];

const categoryLabels: Record<string, string> = {
  fillers: "فیلر و ژل",
  "skin-boosters": "مزوژل و اسکین‌بوستر",
  "hair-cocktails": "کوکتل‌های مو و پوست سر",
  "botulinum-toxins": "بوتاکس",
  "rejuvenation-cocktails": "کوکتل‌های پوستی",
};

export function HomeFinder({
  products,
}: {
  products: Product[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [productName, setProductName] = useState("");
  const question = questions[step];
  const complete = step === questions.length;
  const category = answers[1] ?? "skin-boosters";
  const finalChoice = answers[4] ?? "shop";
  const role = answers[0] ?? "browse";
  const productMatch = useMemo(() => {
    const normalized = productName
      .trim()
      .toLocaleLowerCase("fa")
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک");

    if (!normalized) return undefined;

    return products.find((product) =>
      [product.nameFa, product.nameEn, product.brand, product.slug]
        .join(" ")
        .toLocaleLowerCase("fa")
        .replace(/[يى]/g, "ی")
        .replace(/ك/g, "ک")
        .includes(normalized),
    );
  }, [productName]);

  const recommendation = useMemo(() => {
    const categoryTitle = categoryLabels[category] ?? categoryLabels["skin-boosters"];

    if (finalChoice === "clinic" && role !== "browse") {
      return {
        eyebrow: "مسیر پیشنهادی برای شما",
        title: "فرم سفارش کلینیکی آماده است.",
        text: "فهرست اقلام و زمان تحویل مدنظرتان را بفرستید تا هماهنگ کنیم.",
        href: "/professional",
        action: "ورود به مسیر کلینیک",
      };
    }

    if (finalChoice === "support" || answers[2] === "inquiry") {
      const item = productName ? ` و مدل «${productName}»` : "";
      return {
        eyebrow: "مسیر پیشنهادی برای شما",
        title: "موجودی و قیمت روز را از ما بپرسید.",
        text: `برای ${categoryTitle}${item} موجودی، قیمت و جزئیات بسته را بررسی می‌کنیم.`,
        href: whatsappHref(`سلام، برای ${categoryTitle}${item} موجودی و قیمت روز می‌خواهم.`),
        action: "شروع گفت‌وگو",
      };
    }

    if (productName) {
      return {
        eyebrow: "مسیر پیشنهادی برای شما",
        title: `برای «${productName}» از جست‌وجوی فروشگاه شروع کنید.`,
        text: "اگر مدل دقیق در فهرست نبود، از همان صفحه موجودی آن را استعلام کنید.",
        href: "/shop",
        action: "جست‌وجو در فروشگاه",
      };
    }

    return {
      eyebrow: "مسیر پیشنهادی برای شما",
      title: `${categoryTitle} آمادهٔ مشاهده است.`,
      text: "محصولات، برندها و مشخصات هر مورد را در یک صفحه ببینید.",
      href: `/shop/${category}`,
      action: "مشاهده محصولات مرتبط",
    };
  }, [answers, category, finalChoice, productName, role]);

  const choose = (value: string) => {
    setAnswers((current) => [...current.slice(0, step), value]);
    setStep((current) => current + 1);
  };

  const continueWithProductName = () => {
    setAnswers((current) => [
      ...current.slice(0, step),
      productName.trim() ? "known" : "unknown",
    ]);
    setStep((current) => current + 1);
  };

  const showNamedProducts = () => {
    const name = productName.trim();
    const targetCategory = productMatch?.category ?? category;
    const query = name ? `?q=${encodeURIComponent(name)}` : "";
    router.push(`/shop/${targetCategory}${query}`);
  };

  const restart = () => {
    setStep(0);
    setAnswers([]);
    setProductName("");
  };

  return (
    <section className="sb-finder" aria-labelledby="finder-title">
      <div className="sb-shell sb-finder__grid">
        <div className="sb-finder__intro">
          <span className="sb-eyebrow sb-eyebrow--gold">SEPIID GUIDE / ۵ QUESTION</span>
          <h2 id="finder-title">در پنج سؤال، مسیر خریدتان را پیدا کنید.</h2>
          <p>چند پاسخ کوتاه بدهید تا سریع‌تر به دسته یا محصول موردنظرتان برسید.</p>
          <ol className="sb-finder__steps" aria-label="مراحل راهنمای انتخاب">
            {questions.map((item, index) => (
              <li className={index === step ? "sb-finder__step--active" : index < step ? "sb-finder__step--done" : ""} key={item.title}>
                <span>{index < step ? <CheckIcon /> : `۰${index + 1}`}</span>
                <b>{index === step ? item.title : `پرسش ${index + 1}`}</b>
              </li>
            ))}
          </ol>
        </div>

        <div className="sb-finder__result">
          {!complete ? (
            <div className="sb-finder__question" key={question.title}>
              <VialMark className="sb-vial-mark--guide" />
              <span className="sb-finder__index">۰{step + 1}</span>
              <span className="sb-eyebrow">پرسش {step + 1} از ۵</span>
              <h3>{question.title}</h3>
              <p>{question.description}</p>
              {question.type === "product-name" ? (
                <div className="sb-finder__name-field">
                  <label htmlFor="finder-product-name">نام برند یا مدل</label>
                  <input
                    id="finder-product-name"
                    value={productName}
                    onChange={(event) => setProductName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") showNamedProducts();
                    }}
                    placeholder="مثلاً نورامیس دیپ"
                    type="text"
                  />
                  <button type="button" onClick={showNamedProducts}>
                    نمایش محصولات موردنظر <ArrowIcon />
                  </button>
                  <button
                    className="sb-finder__skip-name"
                    type="button"
                    onClick={continueWithProductName}
                  >
                    نام محصول را نمی‌دانم
                  </button>
                </div>
              ) : (
                <div className="sb-finder__answers">
                  {question.answers.map((answer) => (
                    <button type="button" onClick={() => choose(answer.value)} key={answer.value}>
                      <span>{answer.label}</span><ArrowIcon />
                    </button>
                  ))}
                </div>
              )}
              {step > 0 && <button className="sb-finder__back" type="button" onClick={() => setStep((current) => current - 1)}>بازگشت به پرسش قبل</button>}
            </div>
          ) : (
            <div className="sb-finder__question sb-finder__question--result">
              <span className="sb-finder__index">✓</span>
              <span className="sb-eyebrow">{recommendation.eyebrow}</span>
              <h3>{recommendation.title}</h3>
              <p>{recommendation.text}</p>
              <div className="sb-finder__chips"><span>دسته: {categoryLabels[category]}</span><span>پاسخ‌های شما ثبت نمی‌شود.</span></div>
              <div className="sb-finder__actions">
                <Link className="sb-btn sb-btn--gold" href={recommendation.href}>{recommendation.action}<ArrowIcon /></Link>
                <button type="button" onClick={restart}>شروع دوباره</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
