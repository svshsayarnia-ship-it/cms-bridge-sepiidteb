import type { Metadata } from "next";
import { CustomerAccount } from "../components/CustomerAccount";

export const metadata: Metadata = {
  title: "حساب کاربری",
  description: "ورود، ثبت‌نام و مشاهده مشخصات اولیه مشتریان Sepiid Beauty.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function AccountPage() {
  return <CustomerAccount initialMode="login" />;
}
