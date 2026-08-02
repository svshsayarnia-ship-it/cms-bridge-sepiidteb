import { redirect } from "next/navigation";
import { authorizeCmsRequest } from "../lib/cms-auth";
import { CmsDashboard } from "./CmsDashboard";

export const dynamic = "force-dynamic";

export default async function CmsPage() {
  const authorization = await authorizeCmsRequest();
  if (!authorization.ok && authorization.status === 401) {
    redirect("/cms/login");
  }

  if (!authorization.ok && authorization.status === 503) {
    return (
      <main id="main-content" className="spb-cms-setup">
        <h1>تنظیم اولیه CMS لازم است</h1>
        <p>متغیرهای CMS_ADMIN_PASSWORD و CMS_SESSION_SECRET را برای پنل مدیریت تنظیم کن.</p>
      </main>
    );
  }

  if (!authorization.ok) {
    return (
      <main id="main-content" className="spb-cms-setup">
        <h1>دسترسی مجاز نیست</h1>
        <p>{authorization.message}</p>
      </main>
    );
  }

  return <CmsDashboard userName={authorization.user.displayName} />;
}
