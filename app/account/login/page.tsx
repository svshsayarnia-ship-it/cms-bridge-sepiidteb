import type { Metadata } from "next";
import { CustomerAccount } from "../../components/CustomerAccount";

export const metadata: Metadata = {
  title: "ورود کاربر",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return <CustomerAccount initialMode="login" />;
}
