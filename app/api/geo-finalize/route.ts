import { NextResponse } from "next/server";

const SELF_TEST_TOKEN = "acgysaRTkyJOkVWvbC23IQQd6E-JYm8V";
const INDEXNOW_KEY = "d10c46cb8901901b5b6c50734ba9a191434b9b47ecd9fa18";
const CHANGED_URLS = [
  "https://sepiidbeauty.ir/product/neuramis-deep-lidocaine",
];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  if (requestUrl.searchParams.get("token") !== SELF_TEST_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const indexNow = await Promise.all(
    CHANGED_URLS.map(async (url) => {
      try {
        const response = await fetch(
          `https://api.indexnow.org/indexnow?url=${encodeURIComponent(url)}&key=${INDEXNOW_KEY}`,
          { cache: "no-store" },
        );
        return { url, status: response.status };
      } catch (error) {
        return {
          url,
          status: 0,
          error: error instanceof Error ? error.message : "unknown",
        };
      }
    }),
  );

  let oaiSearchBotStatus = 0;
  try {
    const response = await fetch(CHANGED_URLS[0], {
      cache: "no-store",
      headers: { "user-agent": "OAI-SearchBot/1.0" },
    });
    oaiSearchBotStatus = response.status;
  } catch {
    oaiSearchBotStatus = 0;
  }

  return NextResponse.json(
    { ok: true, indexNow, oaiSearchBotStatus },
    { headers: { "Cache-Control": "no-store" } },
  );
}
