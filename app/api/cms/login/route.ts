import { cookies } from "next/headers";
import { createCmsSession, setCmsSessionCookie } from "@/app/lib/cms-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");
  const token = await createCmsSession(username, password);

  if (!token) {
    return Response.redirect(new URL("/cms/login?error=1", request.url), 303);
  }

  setCmsSessionCookie(await cookies(), token);
  return Response.redirect(new URL("/cms", request.url), 303);
}
