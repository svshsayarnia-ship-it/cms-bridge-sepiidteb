import { cookies } from "next/headers";
import { createCmsSession, setCmsSessionCookie } from "@/app/lib/cms-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const token = await createCmsSession(password);

  if (!token) {
    return Response.redirect(new URL("/cms/login?error=1", request.url), 303);
  }

  setCmsSessionCookie(await cookies(), token);
  return Response.redirect(new URL("/cms", request.url), 303);
}
