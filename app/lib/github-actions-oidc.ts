const ISSUER = "https://token.actions.githubusercontent.com";
const JWKS_URL = `${ISSUER}/.well-known/jwks`;
const EXPECTED_AUDIENCE = "sepiid-price-cron";
const EXPECTED_REPOSITORY = "svshsayarnia-ship-it/cms-bridge-sepiidteb";
const EXPECTED_REF = "refs/heads/main";
const EXPECTED_WORKFLOW_REF = `${EXPECTED_REPOSITORY}/.github/workflows/market-price-scan.yml@${EXPECTED_REF}`;

type JwtHeader = {
  alg?: string;
  kid?: string;
};

type GithubActionsClaims = {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  repository?: string;
  ref?: string;
  event_name?: string;
  workflow_ref?: string;
};

type GithubJwk = JsonWebKey & { kid?: string; alg?: string; use?: string };
type GithubJwks = { keys?: GithubJwk[] };

function decodeSegment<T>(segment: string): T | null {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

function audienceMatches(value: string | string[] | undefined): boolean {
  if (typeof value === "string") return value === EXPECTED_AUDIENCE;
  return Array.isArray(value) && value.includes(EXPECTED_AUDIENCE);
}

async function signingKey(kid: string): Promise<CryptoKey | null> {
  const response = await fetch(JWKS_URL, {
    headers: { accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) return null;
  const jwks = (await response.json()) as GithubJwks;
  const jwk = jwks.keys?.find(
    (item) => item.kid === kid && (!item.alg || item.alg === "RS256") && (!item.use || item.use === "sig"),
  );
  if (!jwk) return null;
  try {
    return await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
  } catch {
    return null;
  }
}

export async function verifyGithubActionsOidc(request: Request): Promise<boolean> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodeSegment<JwtHeader>(headerPart);
  const claims = decodeSegment<GithubActionsClaims>(payloadPart);
  if (!header || !claims || header.alg !== "RS256" || !header.kid) return false;

  const now = Math.floor(Date.now() / 1000);
  if (
    claims.iss !== ISSUER ||
    !audienceMatches(claims.aud) ||
    claims.repository !== EXPECTED_REPOSITORY ||
    claims.ref !== EXPECTED_REF ||
    claims.workflow_ref !== EXPECTED_WORKFLOW_REF ||
    !["schedule", "workflow_dispatch"].includes(claims.event_name ?? "") ||
    typeof claims.exp !== "number" ||
    claims.exp < now - 30 ||
    (typeof claims.nbf === "number" && claims.nbf > now + 30) ||
    (typeof claims.iat === "number" && claims.iat > now + 30)
  ) {
    return false;
  }

  const key = await signingKey(header.kid);
  if (!key) return false;

  try {
    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      Buffer.from(signaturePart, "base64url"),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`),
    );
  } catch {
    return false;
  }
}
