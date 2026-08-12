"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  MarketPricingDashboard,
  MarketPricingProduct,
  MarketPricingScanSummary,
} from "../lib/market-pricing";
import {
  MARKET_PROVIDER_LABELS,
  MARKET_PROVIDERS,
  type MarketProvider,
  type MarketSourceConfig,
} from "../lib/pricing-types";

type ApiError = { error?: string };

async function pricingApi<T>(options?: RequestInit): Promise<T> {
  const response = await fetch("/api/cms/pricing", {
    ...options,
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as T & ApiError;
  if (!response.ok) throw new Error(body.error || `خطای ${response.status}`);
  return body;
}

function money(value: number | null): string {
  return value === null
    ? "ثبت نشده"
    : `${new Intl.NumberFormat("fa-IR").format(value)} تومان`;
}

function persianDate(value: string): string {
  if (!value) return "هنوز اجرا نشده";
  return new Intl.DateTimeFormat("fa-IR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const PROVIDER_HELP: Record<MarketProvider, string> = {
  sayancenter: "اگر لینک خالی باشد، تطبیق دقیق از فروشگاه سایان به‌صورت خودکار انجام می‌شود.",
  rokateb: "اگر لینک خالی باشد، تطبیق دقیق از فروشگاه روکاطب به‌صورت خودکار انجام می‌شود.",
  torob: "لینک دقیق صفحه همان مدل و حجم را از ترب وارد کنید؛ جست‌وجوی خودکار ترب انجام نمی‌شود.",
  digikala: "فقط پس از فعال‌سازی دسترسی رسمی API یا افیلیت دیجی‌کالا استفاده می‌شود.",
};

function currentPrice(product: MarketPricingProduct): number | null {
  const value = Number(product.salePrice || product.regularPrice || product.price);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function PricingManager() {
  const [dashboard, setDashboard] = useState<MarketPricingDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await pricingApi<MarketPricingDashboard>();
      setDashboard(data);
      setSelectedId((current) => current ?? data.products[0]?.id ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "دریافت پیشنهادهای قیمت ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const data = await pricingApi<MarketPricingDashboard>();
        if (cancelled) return;
        setDashboard(data);
        setSelectedId(data.products[0]?.id ?? null);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "دریافت پیشنهادهای قیمت ناموفق بود.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initialize();
    return () => {
      cancelled = true;
    };
  }, []);

  const pending = useMemo(
    () => dashboard?.products.filter((product) => product.pricing.proposal) ?? [],
    [dashboard],
  );
  const configuredCount = useMemo(
    () =>
      dashboard?.products.filter((product) =>
        product.pricing.sources.some((source) => source.enabled && source.url),
      ).length ?? 0,
    [dashboard],
  );
  const selected = dashboard?.products.find((product) => product.id === selectedId) ?? null;

  function replaceProduct(product: MarketPricingProduct) {
    setDashboard((current) =>
      current
        ? {
            ...current,
            products: current.products.map((item) =>
              item.id === product.id ? product : item,
            ),
          }
        : current,
    );
  }

  function editSource(provider: MarketProvider, patch: Partial<MarketSourceConfig>) {
    if (!selected) return;
    replaceProduct({
      ...selected,
      pricing: {
        ...selected.pricing,
        sources: MARKET_PROVIDERS.map((itemProvider) => {
          const current = selected.pricing.sources.find(
            (source) => source.provider === itemProvider,
          ) ?? {
            provider: itemProvider,
            url: "",
            enabled: itemProvider !== "digikala",
          };
          return itemProvider === provider ? { ...current, ...patch } : current;
        }),
      },
    });
  }

  async function postAction(
    action: string,
    payload: Record<string, unknown>,
    successMessage: string,
  ) {
    setBusy(`${action}-${String(payload.productId ?? "all")}`);
    setError("");
    setNotice("");
    try {
      const result = await pricingApi<{
        product?: MarketPricingProduct;
        summary?: MarketPricingScanSummary;
      }>({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (result.product) replaceProduct(result.product);
      if (result.summary) {
        setNotice(
          `${successMessage} ${result.summary.pricesApplied} قیمت اعمال شد، ` +
            `${result.summary.proposalsCreated} پیشنهاد ساخته شد، ` +
            `${result.summary.insufficientProducts} محصول داده کافی نداشت و ` +
            `${result.summary.failedProducts} بررسی ناموفق بود.`,
        );
        await load();
      } else {
        setNotice(successMessage);
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "عملیات قیمت‌گذاری ناموفق بود.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="spb-pricing-manager" aria-busy={loading || Boolean(busy)}>
      <div className="spb-pricing-manager__head">
        <div>
          <span>SMART MARKET PRICING</span>
          <h2>پیشنهاد هوشمند قیمت بازار</h2>
          <p>
            قیمت‌ها ساعت ۹ و ۱۵ بررسی می‌شوند. اعمال مستقیم فقط برای قیمت‌گذاری اولیه است؛
            تغییرهای بعدی همیشه منتظر تأیید شما می‌مانند.
          </p>
        </div>
        <div className="spb-pricing-manager__actions">
          <button
            type="button"
            className="spb-button is-primary"
            disabled={Boolean(busy) || loading}
            onClick={() =>
              void postAction("run", {}, "بررسی بازار تمام شد.")
            }
          >
            {busy === "run-all" ? "در حال بررسی بازار..." : "بررسی قیمت‌ها الآن"}
          </button>
          <button
            type="button"
            className="spb-button is-secondary"
            disabled={Boolean(busy) || loading}
            onClick={() => {
              if (
                window.confirm(
                  "قیمت اولیه کالاهایی که حداقل سه قیمت معتبر از فروشنده‌های هم‌واحد دارند مستقیماً روی ووکامرس اعمال شود؟ این مجوز برای هر کالا فقط یک بار استفاده می‌شود.",
                )
              ) {
                void postAction(
                  "initial-apply",
                  {},
                  "قیمت‌گذاری اولیه تمام شد.",
                );
              }
            }}
          >
            {busy === "initial-apply-all"
              ? "در حال اعمال قیمت‌های اولیه..."
              : "اعمال قیمت اولیه همه کالاها"}
          </button>
        </div>
      </div>

      <div className="spb-pricing-stats">
        <div><strong>{pending.length}</strong><span>منتظر تأیید شما</span></div>
        <div><strong>{configuredCount}</strong><span>محصول با لینک اختصاصی منبع</span></div>
        <div><strong>{dashboard?.products.length ?? 0}</strong><span>محصول منتشرشده</span></div>
        <div>
          <strong>۹:۰۰ و ۱۵:۰۰</strong>
          <span>دو بررسی روزانه به وقت ایران</span>
        </div>
      </div>

      {error && <div className="spb-cms-alert is-error">{error}</div>}
      {notice && <div className="spb-cms-alert is-success">{notice}</div>}

      <details className="spb-pricing-panel" open>
        <summary>
          <span>پیشنهادهای منتظر تأیید</span>
          <b>{pending.length}</b>
        </summary>
        <div className="spb-pricing-proposals">
          {loading && <p className="spb-pricing-empty">در حال دریافت پیشنهادها...</p>}
          {!loading && pending.length === 0 && (
            <p className="spb-pricing-empty">
              پیشنهاد معلقی وجود ندارد. پس از اتصال منابع، «بررسی قیمت‌ها الآن» را اجرا کنید.
            </p>
          )}
          {pending.map((product) => {
            const proposal = product.pricing.proposal!;
            const difference = proposal.currentPriceToman
              ? ((proposal.proposedPriceToman - proposal.currentPriceToman) /
                  proposal.currentPriceToman) *
                100
              : null;
            return (
              <article className="spb-price-proposal" key={proposal.id}>
                <div className="spb-price-proposal__title">
                  <div>
                    <h3>{product.name}</h3>
                    <p>{proposal.note}</p>
                  </div>
                  <span>{persianDate(proposal.createdAt)}</span>
                </div>
                <div className="spb-price-proposal__numbers">
                  <div><span>قیمت فعلی</span><strong>{money(proposal.currentPriceToman)}</strong></div>
                  <i>←</i>
                  <div className="is-proposed">
                    <span>میانگین پیشنهادی</span>
                    <strong>{money(proposal.proposedPriceToman)}</strong>
                    {difference !== null && (
                      <small className={difference > 0 ? "is-up" : "is-down"}>
                        {difference > 0 ? "+" : ""}
                        {new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 }).format(difference)}٪
                      </small>
                    )}
                  </div>
                </div>
                <div className="spb-price-samples">
                  {proposal.samples.map((sample) => (
                    <a href={sample.url} target="_blank" rel="noreferrer" key={sample.provider}>
                      <span>{sample.sourceLabel}</span>
                      <strong>{money(sample.priceToman)}</strong>
                      <small>{sample.productName}</small>
                    </a>
                  ))}
                </div>
                <div className="spb-price-proposal__actions">
                  <button
                    type="button"
                    className="spb-button is-primary"
                    disabled={Boolean(busy)}
                    onClick={() =>
                      void postAction(
                        "approve",
                        { productId: product.id, proposalId: proposal.id },
                        `قیمت «${product.name}» تأیید و روی ووکامرس اعمال شد.`,
                      )
                    }
                  >
                    تأیید و اعمال قیمت
                  </button>
                  <button
                    type="button"
                    className="spb-button is-danger"
                    disabled={Boolean(busy)}
                    onClick={() =>
                      void postAction(
                        "reject",
                        { productId: product.id, proposalId: proposal.id },
                        `پیشنهاد قیمت «${product.name}» رد شد.`,
                      )
                    }
                  >
                    رد پیشنهاد
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </details>

      <details className="spb-pricing-panel">
        <summary>
          <span>تنظیم منابع هر محصول</span>
          <b>{configuredCount}</b>
        </summary>
        <div className="spb-pricing-source-editor">
          <label>
            <span>محصول</span>
            <select
              value={selectedId ?? ""}
              onChange={(event) => setSelectedId(Number(event.target.value))}
            >
              {dashboard?.products.map((product) => (
                <option value={product.id} key={product.id}>{product.name}</option>
              ))}
            </select>
          </label>

          {selected && (
            <>
              <div className="spb-source-grid">
                {MARKET_PROVIDERS.map((provider) => {
                  const source = selected.pricing.sources.find(
                    (item) => item.provider === provider,
                  ) ?? { provider, url: "", enabled: provider !== "digikala" };
                  return (
                    <div className="spb-source-card" key={provider}>
                      <label className="spb-source-card__toggle">
                        <input
                          type="checkbox"
                          checked={source.enabled}
                          onChange={(event) =>
                            editSource(provider, { enabled: event.target.checked })
                          }
                        />
                        <strong>{MARKET_PROVIDER_LABELS[provider]}</strong>
                      </label>
                      <input
                        dir="ltr"
                        type="url"
                        value={source.url}
                        disabled={!source.enabled}
                        placeholder={
                          provider === "torob"
                            ? "https://torob.com/p/..."
                            : provider === "digikala"
                              ? "لینک مجاز API/افیلیت"
                              : "اختیاری؛ کشف خودکار فعال است"
                        }
                        onChange={(event) => editSource(provider, { url: event.target.value })}
                      />
                      <small>{PROVIDER_HELP[provider]}</small>
                    </div>
                  );
                })}
              </div>
              <div className="spb-pricing-source-editor__footer">
                <div>
                  <strong>قیمت فعلی: {money(currentPrice(selected))}</strong>
                  <span>آخرین بررسی: {persianDate(selected.pricing.lastCheckedAt)}</span>
                  <small>{selected.pricing.lastMessage}</small>
                </div>
                <button
                  type="button"
                  className="spb-button is-primary"
                  disabled={Boolean(busy)}
                  onClick={() =>
                    void postAction(
                      "save-sources",
                      { productId: selected.id, sources: selected.pricing.sources },
                      `منابع قیمت «${selected.name}» ذخیره شد.`,
                    )
                  }
                >
                  ذخیره منابع محصول
                </button>
              </div>
            </>
          )}
        </div>
      </details>
    </section>
  );
}
