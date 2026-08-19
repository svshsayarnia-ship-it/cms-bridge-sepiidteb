import type { Metadata } from "next";
import { PasswordResetForm } from "../../components/PasswordResetForm";

export const metadata: Metadata = {
  title: "بازیابی رمز عبور",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string | string[]; login?: string | string[] }>;
}) {
  const params = await searchParams;
  const resetKey = first(params.key);
  const login = first(params.login);

  return <PasswordResetForm login={login} resetKey={resetKey} />;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
