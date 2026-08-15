import { siteOrigin } from "./site-url";

/**
 * IDs are shared by every product offer and the global OnlineStore entity.
 * Keeping a single source of truth prevents product pages from advertising a
 * return policy that differs from the published policy page.
 */
export const merchantOrganizationId = `${siteOrigin}/#organization`;
export const merchantReturnPolicyId =
  `${siteOrigin}/policies/returns#merchant-return-policy`;

/**
 * The business currently decides return eligibility for the exact product
 * before dispatch. The policy page contains those terms, so a policy-link is
 * the only accurate statement we can expose until a uniform return window is
 * formally adopted.
 */
export const merchantReturnPolicy = {
  "@type": "MerchantReturnPolicy",
  "@id": merchantReturnPolicyId,
  merchantReturnLink: `${siteOrigin}/policies/returns`,
};

export const merchantReturnPolicyReference = {
  hasMerchantReturnPolicy: {
    "@id": merchantReturnPolicyId,
  },
};
