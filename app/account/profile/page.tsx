import type { Metadata } from "next";
import { CustomerAccount } from "../../components/CustomerAccount";

export const metadata: Metadata = {
  title: "مشخصات کاربر",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ProfilePage() {
  return <CustomerAccount initialMode="profile" />;
}
