import type { Metadata } from "next";
import "./cms.css";
import { CmsRawImagePipeline } from "./CmsRawImagePipeline";

export const metadata: Metadata = {
  title: "مدیریت محصولات",
  robots: { index: false, follow: false },
};

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CmsRawImagePipeline />
      {children}
    </>
  );
}
