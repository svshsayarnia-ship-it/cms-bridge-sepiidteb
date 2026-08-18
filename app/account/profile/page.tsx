import type { Metadata } from "next";
import { CustomerAccount } from "../../components/CustomerAccount";
import { requireCustomerUser } from "../../lib/customer-auth";

export const metadata: Metadata = {
  title: "مشخصات کاربر",
  robots: {
    index: false,
    follow: true,
  },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireCustomerUser("/account/profile");
  return <CustomerAccount initialMode="profile" initialUser={user} />;
}
