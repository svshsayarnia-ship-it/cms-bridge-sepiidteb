import { cookies } from "next/headers";
import { clearCmsSessionCookie } from "@/app/lib/cms-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  clearCmsSessionCookie(await cookies());
  return Response.redirect(new URL("/cms/login", request.url), 303);
}
