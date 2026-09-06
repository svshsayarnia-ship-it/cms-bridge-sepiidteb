"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "../checkout.module.css";

const CART_KEY = "sepiid-beauty-cart-v2";
const CART_EVENT = "sepiid-cart-updated";
const IDEMPOTENCY_KEY = "sepiid-beauty-checkout-idempotency-v1";
const DRAFT_KEY = "sepiid-beauty-checkout-draft-v2";

export function PaymentResultClient({
  status,
  order,
  transaction,
}: {
  status: "success" | "failed" | "error";
  order: string;
  transaction?: string;
}) {
  const success = status === "success";

  useEffect(() => {
    if (!success) return;
    try {
      window.localStorage.removeItem(CART_KEY);
      window.sessionStorage.removeItem(IDEMPOTENCY_KEY);
      window.sessionStorage.removeItem(DRAFT_KEY);
      window.dispatchEvent(new CustomEvent(CART_EVENT));
    } catch {
      // Payment is already verified server-side; browser cleanup is best effort only.
    }
  }, [success]);

  return (
    <main className={styles.page}>
      <div className="sb-shell">
        <div className={styles.steps} aria-label="مراحل خرید">
          <span><b>✓</b> سبد خرید</span>
          <span><b>✓</b> ثبت سفارش</span>
          <span className={styles.activeStep}><b>{success ? "✓" : "۳"}</b> پرداخت</span>
        </div>

        <section className={styles.card} style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div className={styles.sectionHeading} style={{ justifyContent: "center" }}>
            <span>{success ? "✓" : "!"}</span>
            <div style={{ textAlign: "right" }}>
              <h1 style={{ margin: 0, fontSize: "1.35rem" }}>
                {success ? "پرداخت با موفقیت انجام شد" : "پرداخت انجام نشد"}
              </h1>
              {order && <p>شماره سفارش: <strong>#{order}</strong></p>}
            </div>
          </div>

          {success ? (
            <>
              <p style={{ lineHeight: 1.9 }}>
                سفارش شما با موفقیت ثبت شد.
              </p>
              {transaction && (
                <p style={{ color: "var(--sb-muted)", fontSize: ".82rem" }}>
                  شناسه تراکنش: <span dir="ltr">{transaction}</span>
                </p>
              )}
            </>
          ) : (
            <p style={{ lineHeight: 1.9 }}>
              می‌توانید دوباره برای پرداخت تلاش کنید.
            </p>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 22 }}>
            {success ? (
              <Link className="sb-btn sb-btn--dark" href="/shop">بازگشت به فروشگاه</Link>
            ) : (
              <Link className="sb-btn sb-btn--dark" href="/checkout">تلاش دوباره برای پرداخت</Link>
            )}
            <Link className="sb-btn" href="/contact">تماس با سپید بیوتی</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
