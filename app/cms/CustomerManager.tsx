"use client";

import { useEffect, useMemo, useState } from "react";
import type { CmsCustomer, CmsCustomersResponse } from "../lib/woocommerce";

const TYPE_LABEL: Record<CmsCustomer["accountType"], string> = { customer: "مشتری", clinic: "کلینیک", doctor: "پزشک", buyer: "خریدار" };
const money = new Intl.NumberFormat("fa-IR");

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, cache: "no-store" });
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "دریافت اطلاعات مشتریان ناموفق بود.");
  return body;
}

export function CustomerManager() {
  const [customers, setCustomers] = useState<CmsCustomer[]>([]);
  const [selected, setSelected] = useState<CmsCustomer | null>(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"all" | CmsCustomer["accountType"]>("all");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const data = await request<CmsCustomersResponse>(`/api/cms/customers?page=1&perPage=100&search=${encodeURIComponent(search)}`);
      setCustomers(data.customers); setTotal(data.total);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "خطا در دریافت مشتریان"); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
    // Initial load only; search is applied explicitly by the operator.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const visible = useMemo(() => type === "all" ? customers : customers.filter((customer) => customer.accountType === type), [customers, type]);

  async function save() {
    if (!selected || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const result = await request<{ customer: CmsCustomer }>(`/api/cms/customers/${selected.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(selected) });
      setSelected(result.customer);
      setCustomers((current) => current.map((item) => item.id === result.customer.id ? result.customer : item));
      setNotice("اطلاعات مشتری ذخیره شد.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "ذخیره اطلاعات مشتری ناموفق بود."); }
    finally { setSaving(false); }
  }

  return <section className="spb-customer-manager spb-cms-section">
    <header className="spb-customer-manager__head"><div><span>ارتباط با مشتری</span><h1>مشتریان</h1><p>حساب‌های ثبت‌شده و اطلاعات خرید را یک‌جا ببینید و به‌روز کنید.</p></div><b>{money.format(total)} مشتری</b></header>
    {error && <div className="spb-cms-alert is-error">{error}</div>}{notice && <div className="spb-cms-alert is-success">{notice}</div>}
    <div className="spb-customer-manager__tools"><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} placeholder="جست‌وجو با نام، ایمیل یا شماره" /><button type="button" className="spb-button" onClick={() => void load()}>جست‌وجو</button><select value={type} onChange={(event) => setType(event.target.value as typeof type)}><option value="all">همه حساب‌ها</option>{Object.entries(TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    <div className="spb-customer-manager__grid"><div className="spb-customer-list">{loading ? <p>در حال دریافت مشتریان…</p> : visible.length ? visible.map((customer) => <button type="button" key={customer.id} className={selected?.id === customer.id ? "is-selected" : ""} onClick={() => { setSelected({ ...customer }); setNotice(""); setError(""); }}><strong>{customer.fullName}</strong><span>{customer.phone || customer.email}</span><small>{TYPE_LABEL[customer.accountType]} · {money.format(customer.ordersCount)} سفارش</small></button>) : <p>مشتری مطابق این جست‌وجو پیدا نشد.</p>}</div>
      <div className="spb-customer-detail">{selected ? <><div className="spb-customer-detail__title"><div><span>شناسه {selected.id}</span><h2>{selected.fullName}</h2></div><div><b>{money.format(Number(selected.totalSpent || 0))}</b><small>مجموع خرید</small></div></div><div className="spb-customer-form"><label>نام و نام خانوادگی<input value={selected.fullName} onChange={(event) => setSelected({ ...selected, fullName: event.target.value })} /></label><label>ایمیل<input dir="ltr" value={selected.email} onChange={(event) => setSelected({ ...selected, email: event.target.value })} /></label><label>موبایل<input dir="ltr" value={selected.phone} onChange={(event) => setSelected({ ...selected, phone: event.target.value })} /></label><label>شهر<input value={selected.city} onChange={(event) => setSelected({ ...selected, city: event.target.value })} /></label><label>نوع حساب<select value={selected.accountType} onChange={(event) => setSelected({ ...selected, accountType: event.target.value as CmsCustomer["accountType"] })}>{Object.entries(TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>نام کلینیک / مرکز<input value={selected.clinicName} onChange={(event) => setSelected({ ...selected, clinicName: event.target.value })} /></label></div><footer><span>عضویت: {selected.createdAt ? new Date(selected.createdAt).toLocaleDateString("fa-IR") : "—"}</span><button type="button" className="spb-button is-primary" disabled={saving} onClick={() => void save()}>{saving ? "در حال ذخیره…" : "ذخیره تغییرات"}</button></footer></> : <p className="spb-customer-detail__empty">برای دیدن و مدیریت اطلاعات، یک مشتری را انتخاب کنید.</p>}</div></div>
  </section>;
}
