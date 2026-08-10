import { cookies } from "next/headers";
import {
  clientIpFromRequest,
  createCustomerSession,
  isTrustedAccountMutation,
  setCustomerSessionCookie,
} from "@/app/lib/customer-auth";
import {
  customerAccountErrorResponse,
  loginCustomer,
} from "@/app/lib/customer-woocommerce";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isTrustedAccountMutation(request)) {
    return Response.json(
      { error: "درخواست ورود معتبر نیست." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const body = (await request.json()) as {
      identifier?: unknown;
      password?: unknown;
    };
    const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return Response.json(
        { error: "شماره موبایل/ایمیل و رمز عبور را وارد کن." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const profile = await loginCustomer(
      identifier,
      password,
      clientIpFromRequest(request),
    );
    const token = await createCustomerSession(profile.id);
    setCustomerSessionCookie(await cookies(), token);

    return Response.json(
      { profile },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return customerAccountErrorResponse(error);
  }
}
