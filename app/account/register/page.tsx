import type { Metadata } from "next";
import { CustomerAccount } from "../../components/CustomerAccount";

export const metadata: Metadata = {
  title: "ثبت‌نام کاربر",
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterPage() {
  return <CustomerAccount initialMode="register" />;
}
