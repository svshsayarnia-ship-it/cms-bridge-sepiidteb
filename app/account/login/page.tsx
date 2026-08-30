import type { Metadata } from "next";
import { CustomerAccount } from "../../components/CustomerAccount";
import { getCustomerUser } from "../../lib/customer-auth";

export const metadata: Metadata = {
  title: "ورود کاربر",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function LoginPage() {
  const user = await getCustomerUser().catch(() => null);
  return <CustomerAccount initialMode="login" initialUser={user} />;
}
