import type { Metadata } from "next";
import { CustomerAccount } from "../../components/CustomerAccount";
import { getCustomerUser } from "../../lib/customer-auth";

export const metadata: Metadata = {
  title: "ثبت‌نام کاربر",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function RegisterPage() {
  const user = await getCustomerUser().catch(() => null);
  return <CustomerAccount initialMode="register" initialUser={user} />;
}
