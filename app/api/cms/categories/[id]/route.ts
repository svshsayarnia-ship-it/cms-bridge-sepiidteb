import { revalidateTag } from "next/cache";

import { cmsApiGuard } from "@/app/lib/cms-auth";
import type {
  CmsCategoryInput,
  CmsImage,
} from "@/app/lib/cms-types";
import {
  STOREFRONT_CATALOG_TAG,
} from "@/app/lib/storefront-catalog";
import {
  errorResponse,
  updateCategory,
  WooCommerceError,
} from "@/app/lib/woocommerce";

export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

async function categoryId(
  context: Context,
): Promise<number> {
  const { id } = await context.params;
  const value = Number(id);

  if (
    !Number.isSafeInteger(value) ||
    value <= 0
  ) {
    throw new WooCommerceError(
      "شناسه دسته‌بندی معتبر نیست.",
      400,
      "invalid_category_id",
    );
  }

  return value;
}

function text(value: unknown): string {
  return typeof value === "string"
    ? value
    : "";
}

function parseImage(
  value: unknown,
): CmsImage | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new WooCommerceError(
      "اطلاعات تصویر دسته‌بندی معتبر نیست.",
      400,
      "invalid_category_image",
    );
  }

  const image = value as Record<
    string,
    unknown
  >;

  const id = Number(image.id ?? 0);
  const src = text(image.src).trim();

  if (
    !Number.isSafeInteger(id) ||
    id < 0 ||
    (id === 0 && !src)
  ) {
    throw new WooCommerceError(
      "تصویر دسته‌بندی معتبر نیست.",
      400,
      "invalid_category_image",
    );
  }

  return {
    id,
    src,
    name: text(image.name),
    alt: text(image.alt),
  };
}

function parseCategoryInput(
  value: unknown,
): CmsCategoryInput {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new WooCommerceError(
      "اطلاعات دسته‌بندی معتبر نیست.",
      400,
      "invalid_category_input",
    );
  }

  const input = value as Record<
    string,
    unknown
  >;

  return {
    name: text(input.name),
    slug: text(input.slug),
    description: text(
      input.description,
    ),
    image: parseImage(input.image),
  };
}

export async function PUT(
  request: Request,
  context: Context,
) {
  const denied = await cmsApiGuard(
    request,
  );

  if (denied) {
    return denied;
  }

  try {
    const id = await categoryId(context);

    const category = await updateCategory(
      id,
      parseCategoryInput(
        await request.json(),
      ),
    );

    revalidateTag(
      STOREFRONT_CATALOG_TAG,
      { expire: 0 },
    );

    return Response.json({
      category,
    });
  } catch (error) {
    return errorResponse(error);
  }
}