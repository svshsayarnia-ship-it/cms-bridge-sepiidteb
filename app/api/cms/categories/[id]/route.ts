import { revalidateTag } from "next/cache";

import { cmsApiGuard } from "@/app/lib/cms-auth";
import type {
  CmsCategoryInput,
  CmsImage,
} from "@/app/lib/cms-types";
import { cleanupDetachedCmsMedia } from "@/app/lib/managed-media";
import {
  STOREFRONT_CATALOG_TAG,
} from "@/app/lib/storefront-catalog";
import {
  STOREFRONT_CATEGORIES_TAG,
} from "@/app/lib/storefront-categories";
import {
  errorResponse,
  listCategories,
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
    const input = parseCategoryInput(
      await request.json(),
    );
    const currentCategory = (
      await listCategories({
        requestTimeoutMs: 20_000,
        requestMaxAttempts: 1,
      })
    ).find((category) => category.id === id);

    if (!currentCategory) {
      throw new WooCommerceError(
        "دسته‌بندی در WooCommerce پیدا نشد.",
        404,
        "category_not_found",
      );
    }

    const oldImageId = currentCategory.image?.id ?? 0;
    const requestedImageId = input.image?.id ?? 0;

    const category = await updateCategory(
      id,
      input,
    );

    // The category image selected in CMS is the complete authoritative state.
    // Once WooCommerce confirms the new image (or null), remove the detached
    // attachment unless the bridge reports that it is shared elsewhere.
    if (
      oldImageId > 0 &&
      oldImageId !== requestedImageId
    ) {
      await cleanupDetachedCmsMedia(
        [oldImageId],
        {
          ownerType: "category",
          ownerId: id,
        },
      );
    }

    revalidateTag(
      STOREFRONT_CATALOG_TAG,
      { expire: 0 },
    );

    revalidateTag(
      STOREFRONT_CATEGORIES_TAG,
      { expire: 0 },
    );

    return Response.json({
      category,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
