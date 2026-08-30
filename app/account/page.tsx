import type { Metadata } from "next";
import { CustomerAccount } from "../components/CustomerAccount";
import { getCustomerUser } from "../lib/customer-auth";

export const metadata: Metadata = {
  title: "حساب کاربری",
  description: "ورود امن، ثبت‌نام، بازیابی رمز و مدیریت مشخصات مشتریان Sepiid Beauty.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function AccountPage() {
  const user = await getCustomerUser().catch(() => null);
  return <CustomerAccount initialMode="login" initialUser={user} />;
}
