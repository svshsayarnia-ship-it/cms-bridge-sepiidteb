import { redirect } from "next/navigation";
import { catalogProducts } from "../catalog";
import { authorizeCmsRequest } from "../lib/cms-auth";
import { CmsDashboard } from "./CmsDashboard";
import {
  CmsProductImageManager,
  type CmsImageFamilyDefinition,
} from "./CmsProductImageManager";

export const dynamic = "force-dynamic";

const imageFamilies: CmsImageFamilyDefinition[] = catalogProducts.flatMap((product) =>
  product.variants?.length
    ? [
        {
          slug: product.slug,
          nameFa: product.nameFa,
          variants: product.variants.map((variant) => ({
            id: variant.id,
            label: variant.label,
            nameFa: variant.nameFa,
            nameEn: variant.nameEn,
          })),
        },
      ]
    : [],
);

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

  return (
    <>
      <CmsProductImageManager families={imageFamilies} />
      <CmsDashboard userName={authorization.user.displayName} />
    </>
  );
}
