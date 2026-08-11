import { cookies } from "next/headers";
import {
  clearCustomerSessionCookie,
  isTrustedAccountMutation,
} from "@/app/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isTrustedAccountMutation(request)) {
    return Response.json(
      { error: "درخواست خروج معتبر نیست." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  clearCustomerSessionCookie(await cookies());
  return Response.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
