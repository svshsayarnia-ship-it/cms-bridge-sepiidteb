"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { whatsappHref } from "../data";
import type { PublicProduct } from "../lib/public-product";
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
    title: "برای چه کاری دنبال محصول هستید؟",
    description: "با یک جواب کوتاه، مسیر مناسب‌تری برایتان باز می‌کنیم.",
    answers: [
      { label: "کلینیک یا مطب", value: "professional" },
      { label: "مرکز یا سالن زیبایی", value: "pro" },
      { label: "فقط می‌خواهم مدل‌ها را ببینم", value: "browse" },
    ],
  },
  {
    title: "دنبال کدام گروه محصول هستید؟",
    description: "گروهی را انتخاب کنید که به چیزی که می‌خواهید نزدیک‌تر است.",
    answers: [
      { label: "فیلر و ژل", value: "fillers" },
      { label: "مزوژل و اسکین‌بوستر", value: "skin-boosters" },
      { label: "مو و پوست سر", value: "hair-cocktails" },
      { label: "بوتاکس", value: "botulinum-toxins" },
      { label: "کوکتل‌های پوستی", value: "rejuvenation-cocktails" },
    ],
  },
  {
    title: "الان بیشتر چه چیزی برایتان مهم است؟",
    description: "در پایان، شما را مستقیم به همان صفحه یا راه ارتباطی می‌بریم.",
    answers: [
      { label: "دیدن محصولات این دسته", value: "shop" },
      { label: "مقایسه برند و مدل", value: "compare" },
      { label: "قیمت و موجودی روز", value: "inquiry" },
    ],
  },
  {
    title: "اگر نام مدل را می‌دانید، همین‌جا بنویسید.",
    description: "مثلاً نورامیس، جالپرو یا رووفیل. اگر پیدا نشد، باز هم می‌توانید از ما بپرسید.",
    answers: [],
    type: "product-name",
  },
  {
    title: "چطور ادامه بدهیم؟",
    description: "محصولات را ببینید یا مستقیم درباره قیمت و موجودی پیام بدهید.",
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
  products: PublicProduct[];
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
  }, [productName, products]);

  const recommendation = useMemo(() => {
    const categoryTitle = categoryLabels[category] ?? categoryLabels["skin-boosters"];

    if (finalChoice === "clinic" && role !== "browse") {
      return {
        eyebrow: "مسیر پیشنهادی برای شما",
        title: "فهرست سفارش‌تان را بفرستید.",
        text: "نام محصولات، تعداد و زمان تحویل را بنویسید تا بررسی و هماهنگ کنیم.",
        href: "/professional",
        action: "ورود به مسیر کلینیک",
      };
    }

    if (finalChoice === "support" || answers[2] === "inquiry") {
      const item = productName ? ` و مدل «${productName}»` : "";
      return {
        eyebrow: "پیشنهاد سپید",
        title: "قیمت و موجودی روز را از ما بپرسید.",
        text: `برای ${categoryTitle}${item} نام مدل، قیمت روز و جزئیات بسته را جواب می‌دهیم.`,
        href: whatsappHref(`سلام، برای ${categoryTitle}${item} موجودی و قیمت روز می‌خواهم.`),
        action: "شروع گفت‌وگو",
      };
    }

    if (productName) {
      return {
        eyebrow: "پیشنهاد سپید",
        title: `اول «${productName}» را در فروشگاه ببینید.`,
        text: "اگر مدل دقیق در فهرست نبود، نامش را برای ما بفرستید تا بررسی کنیم.",
        href: "/shop",
        action: "جست‌وجو در فروشگاه",
      };
    }

    return {
      eyebrow: "پیشنهاد سپید",
      title: `محصولات ${categoryTitle} را ببینید.`,
      text: "مدل‌ها، حجم بسته و اطلاعات هر مورد در همان صفحه کنار هم آمده است.",
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
    if (productMatch) {
      router.push(`/product/${productMatch.slug}`);
      return;
    }

    router.push(`/shop/${category}`);
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
          <span className="sb-eyebrow sb-eyebrow--gold">راهنمای کوتاه سپید</span>
          <h2 id="finder-title">با چند سؤال کوتاه، سریع‌تر به محصول برسید.</h2>
          <p>لازم نیست از اول همه‌چیز را بدانید؛ قدم‌به‌قدم جلو می‌رویم.</p>
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
                    پیدا کردن محصول <ArrowIcon />
                  </button>
                  <button
                    className="sb-finder__skip-name"
                    type="button"
                    onClick={continueWithProductName}
                  >
                    نام مدل را نمی‌دانم
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
                <button type="button" onClick={restart}>از اول شروع کنیم</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
