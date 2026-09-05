import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سبد خرید",
  description: "مشاهده و مدیریت محصولات انتخاب‌شده در سبد خرید Sepiid Beauty.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
