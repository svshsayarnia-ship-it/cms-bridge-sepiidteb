# Sepiid Beauty

A production-ready, RTL beauty catalog, editorial site, and protected
WooCommerce CMS built with Next.js and prepared for GitHub + Vercel. It includes
premium hover and motion details, responsive commerce discovery, editorial
content, trust-policy pages, and a server-side product editor.

See [README_FA.md](./README_FA.md) for the Persian project map and editing guide.

## Prerequisites

- Node.js `>=22.13.0`
- npm

The project is a standard Next.js App Router application. Vercel runs
`npm ci` followed by `npm run build`.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `app/cms/` provides the protected WooCommerce product editor
- `app/api/cms/` keeps WooCommerce credentials and write operations server-side
- `vercel.json` declares the Next.js framework and build command
- `scripts/validate-artifact.sh` checks the uploadable project shape and secret hygiene

## Workspace Auth Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## WooCommerce CMS Environment

Copy the names from `.env.example` into the deployment environment. Use a fresh
WooCommerce REST API key with Read/Write access and install Sepiid Product Bridge
1.4+ on WordPress for direct media uploads. Never commit API credentials.

For a real subdomain such as `cms.sepiidbeauty.ir`, configure the independent CMS
login variables: `CMS_ADMIN_PASSWORD` and `CMS_SESSION_SECRET`. The protected
CMS uses a signed 12-hour HTTP-only cookie and no longer depends on ChatGPT
identity headers when those variables are present.

The market-pricing review queue also requires `CRON_SECRET` in the production
environment. Vercel calls `/api/cron/market-prices` every day at 05:30 and
11:30 UTC (09:00 and 15:00 Iran time) and sends this value as a bearer token.
One valid, exact-match market source is enough to create a pending proposal; a
Torob page with multiple sellers uses its available seller prices for the
suggested value. The one-time initial import may apply a price directly after
an explicit CMS confirmation; every later market change is saved as a pending
proposal and must be approved by a CMS administrator. The monitor uses Torob,
Sayan Center, and Roka Teb only; Digikala is not part of this workflow.

To deliver a newly created proposal outside the CMS, configure the following
production environment variables. They are optional; a delivery failure never
stops the pricing scan or removes its CMS proposal.

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_PRICE_ALERT_CHAT_ID`
- `RESEND_API_KEY`
- `PRICE_ALERT_EMAIL`
- `PRICE_ALERT_EMAIL_FROM` (a Resend-verified sender, for example `Sepiid Beauty <prices@sepiidbeauty.ir>`)

## Diagnostic Commands

- `npm ci`: install the lockfile exactly
- `npm run dev`: start local Next.js development
- `npm run build`: create the production build
- `npm run start`: serve the production build locally
- `npm test`: run the production build check
- `npm run lint`: run ESLint
- `npm run validate:artifact`: check required files, Vercel settings, and secret hygiene

## Deploy on Vercel

Import the GitHub repository as a new Vercel project. Keep the project root at
the repository root, leave the output directory at its default, and add the
variables from `.env.example` in Vercel Environment Variables. Never upload
`.env`, `.env.local`, or real WooCommerce credentials to GitHub.
