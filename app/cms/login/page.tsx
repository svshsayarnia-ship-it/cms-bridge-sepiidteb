import { redirect } from "next/navigation";
import { authorizeCmsRequest } from "../../lib/cms-auth";

export const dynamic = "force-dynamic";

export default async function CmsLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const authorization = await authorizeCmsRequest();
  if (authorization.ok) redirect("/cms");

  const params = await searchParams;
  const hasError = params?.error === "1";

  return (
    <main id="main-content" className="spb-cms-login">
      <section className="spb-cms-login__panel" aria-labelledby="cms-login-title">
        <div className="spb-cms-login__brand">
          <span>Sepiid CMS</span>
          <strong>ورود پنل مدیریت</strong>
        </div>
        <h1 id="cms-login-title">ورود امن به CMS سپید</h1>
        <p>برای مدیریت محصولات، قیمت‌ها، دسته‌بندی‌ها و تصاویر وارد شو.</p>
        {hasError && <div className="spb-cms-alert is-error">رمز واردشده درست نیست.</div>}
        <form action="/api/cms/login" method="post" className="spb-cms-login__form">
          <label htmlFor="cms-password">رمز CMS</label>
          <input
            id="cms-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            placeholder="رمز پنل را وارد کن"
          />
          <button type="submit" className="spb-button is-primary">
            ورود به پنل
          </button>
        </form>
      </section>
    </main>
  );
}
