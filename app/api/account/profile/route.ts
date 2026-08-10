import {
  authorizeCustomerRequest,
  customerSessionErrorResponse,
  isTrustedAccountMutation,
} from "@/app/lib/customer-auth";
import {
  customerAccountErrorResponse,
  getCustomerProfile,
  type CustomerProfileUpdateInput,
  type CustomerType,
  updateCustomerProfile,
} from "@/app/lib/customer-woocommerce";

export const dynamic = "force-dynamic";

const CUSTOMER_TYPES = new Set<CustomerType>([
  "clinic",
  "doctor",
  "buyer",
  "customer",
]);

export async function GET(request: Request) {
  const authorization = await authorizeCustomerRequest(request);
  if (!authorization.ok) return customerSessionErrorResponse(authorization);

  try {
    const profile = await getCustomerProfile(authorization.userId);
    return Response.json(
      { profile },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return customerAccountErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  if (!isTrustedAccountMutation(request)) {
    return Response.json(
      { error: "درخواست ویرایش حساب معتبر نیست." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const authorization = await authorizeCustomerRequest(request);
  if (!authorization.ok) return customerSessionErrorResponse(authorization);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const customerType =
      typeof body.customerType === "string" &&
      CUSTOMER_TYPES.has(body.customerType as CustomerType)
        ? (body.customerType as CustomerType)
        : "customer";

    const input: CustomerProfileUpdateInput = {
      fullName: typeof body.fullName === "string" ? body.fullName.trim() : "",
      clinicName:
        typeof body.clinicName === "string" ? body.clinicName.trim() : "",
      city: typeof body.city === "string" ? body.city.trim() : "",
      customerType,
    };

    if (input.fullName.length < 3) {
      return Response.json(
        { error: "نام و نام خانوادگی را کامل وارد کن." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const profile = await updateCustomerProfile(authorization.userId, input);
    return Response.json(
      { profile },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return customerAccountErrorResponse(error);
  }
}
