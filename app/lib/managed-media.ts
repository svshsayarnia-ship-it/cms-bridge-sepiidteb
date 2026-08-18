import "server-only";

const MEDIA_DELETE_TIMEOUT_MS = 20_000;

type DeleteResult =
  | { deleted: true; reason: "deleted" }
  | { deleted: false; reason: "missing" | "still-in-use" };

function mediaConfig() {
  const storeUrl = (process.env.WORDPRESS_URL ?? "").trim().replace(/\/$/, "");
  const consumerKey = (process.env.WOOCOMMERCE_CONSUMER_KEY ?? "").trim();
  const consumerSecret = (process.env.WOOCOMMERCE_CONSUMER_SECRET ?? "").trim();

  if (!storeUrl || !consumerKey || !consumerSecret) {
    throw new Error("WooCommerce media cleanup is not configured.");
  }

  return { storeUrl, consumerKey, consumerSecret };
}

/**
 * Permanently remove a WordPress attachment that has already been detached
 * from the CMS-managed WooCommerce product/category.
 *
 * The Sepiid Product Bridge refuses deletion while the attachment is still in
 * use elsewhere, so shared media cannot be accidentally destroyed.
 */
export async function deleteCmsManagedMedia(
  attachmentId: number,
): Promise<DeleteResult> {
  if (!Number.isSafeInteger(attachmentId) || attachmentId <= 0) {
    return { deleted: false, reason: "missing" };
  }

  const { storeUrl, consumerKey, consumerSecret } = mediaConfig();
  const url = new URL(
    `${storeUrl}/wp-json/wc/v3/sepiid-media/${attachmentId}`,
  );
  url.searchParams.set("force", "true");
  url.searchParams.set("allow_in_use", "false");

  const headers = new Headers({
    accept: "application/json",
    "cache-control": "no-cache, no-store, max-age=0",
    pragma: "no-cache",
  });

  if ((process.env.WOOCOMMERCE_AUTH_MODE ?? "basic") === "query") {
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);
  } else {
    headers.set(
      "authorization",
      `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MEDIA_DELETE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers,
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.ok) {
      return { deleted: true, reason: "deleted" };
    }

    const payload = (await response.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
    };

    if (response.status === 404) {
      return { deleted: false, reason: "missing" };
    }

    if (
      response.status === 409 &&
      payload.code === "sepiid_bridge_media_in_use"
    ) {
      return { deleted: false, reason: "still-in-use" };
    }

    throw new Error(
      payload.message ||
        `WordPress media deletion failed with status ${response.status}.`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function cleanupDetachedCmsMedia(
  attachmentIds: number[],
  context: { ownerType: "product" | "category"; ownerId: number },
) {
  const uniqueIds = Array.from(
    new Set(
      attachmentIds.filter(
        (id) => Number.isSafeInteger(id) && id > 0,
      ),
    ),
  );

  for (const attachmentId of uniqueIds) {
    try {
      const result = await deleteCmsManagedMedia(attachmentId);
      console.info("[cms-media] detached attachment cleanup", {
        ...context,
        attachmentId,
        result: result.reason,
      });
    } catch (error) {
      // The owning product/category has already been saved with the authoritative
      // CMS image list. Do not report that successful write as failed merely
      // because WordPress media cleanup had a transient transport problem.
      console.warn("[cms-media] detached attachment cleanup failed", {
        ...context,
        attachmentId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
