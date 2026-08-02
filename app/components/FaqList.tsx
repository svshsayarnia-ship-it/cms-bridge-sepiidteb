"use client";

import { useState } from "react";

type Faq = {
  question: string;
  answer: string;
};

export function FaqList({ items }: { items: Faq[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="sb-faq-list">
      {items.map((item, index) => {
        const open = openIndex === index;
        const triggerId = `faq-trigger-${index}`;
        const panelId = `faq-panel-${index}`;
        return (
          <article className={`sb-faq ${open ? "sb-faq--open" : ""}`} key={item.question}>
            <button
              id={triggerId}
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpenIndex(open ? -1 : index)}
            >
              <span>۰{index + 1}</span>
              <strong>{item.question}</strong>
              <i aria-hidden="true">{open ? "−" : "+"}</i>
            </button>
            <div
              className="sb-faq__answer"
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!open}
            >
              <p>{item.answer}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
