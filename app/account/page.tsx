import type { Metadata } from "next";
import { CustomerAccount } from "../components/CustomerAccount";

export const metadata: Metadata = {
  title: "حساب کاربری",
  description: "ورود امن، ثبت‌نام، بازیابی رمز و مدیریت مشخصات مشتریان Sepiid Beauty.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function AccountPage() {
  return <CustomerAccount initialMode="login" />;
}
