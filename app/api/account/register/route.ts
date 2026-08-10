import { cookies } from "next/headers";
import {
  clientIpFromRequest,
  createCustomerSession,
  isTrustedAccountMutation,
  setCustomerSessionCookie,
} from "@/app/lib/customer-auth";
import {
  customerAccountErrorResponse,
  registerCustomer,
  type CustomerRegistrationInput,
  type CustomerType,
} from "@/app/lib/customer-woocommerce";

export const dynamic = "force-dynamic";

const CUSTOMER_TYPES = new Set<CustomerType>([
  "clinic",
  "doctor",
  "buyer",
  "customer",
]);

export async function POST(request: Request) {
  if (!isTrustedAccountMutation(request)) {
    return Response.json(
      { error: "درخواست ثبت‌نام معتبر نیست." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const customerType =
      typeof body.customerType === "string" &&
      CUSTOMER_TYPES.has(body.customerType as CustomerType)
        ? (body.customerType as CustomerType)
        : "customer";

    const input: CustomerRegistrationInput = {
      fullName: typeof body.fullName === "string" ? body.fullName.trim() : "",
      email: typeof body.email === "string" ? body.email.trim() : "",
      phone: typeof body.phone === "string" ? body.phone.trim() : "",
      password: typeof body.password === "string" ? body.password : "",
      clinicName:
        typeof body.clinicName === "string" ? body.clinicName.trim() : "",
      city: typeof body.city === "string" ? body.city.trim() : "",
      customerType,
    };

    if (
      input.fullName.length < 3 ||
      !input.email.includes("@") ||
      input.phone.length < 10 ||
      input.password.length < 8
    ) {
      return Response.json(
        { error: "نام، ایمیل، موبایل و رمز عبور معتبر را وارد کن." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const profile = await registerCustomer(
      input,
      clientIpFromRequest(request),
    );
    const token = await createCustomerSession(profile.id);
    setCustomerSessionCookie(await cookies(), token);

    return Response.json(
      { profile },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return customerAccountErrorResponse(error);
  }
}
