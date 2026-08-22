"use client";

import { useRef, useState } from "react";
import type { CmsImage } from "../lib/cms-types";

type Props = {
  defaultAlt: string;
  onUseAsFeatured(image: CmsImage, alt: string): void;
  onInsertIntoArticle(image: CmsImage, alt: string): void;
};

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function ArticleImageUploader({ defaultAlt, onUseAsFeatured, onInsertIntoArticle }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState(defaultAlt);
  const [image, setImage] = useState<CmsImage | null>(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  async function upload() {
    if (!file || uploading) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setStatus("حجم تصویر باید کمتر از ۴ مگابایت باشد.");
      return;
    }
    if (!alt.trim()) {
      setStatus("برای تصویر یک ALT توصیفی بنویس.");
      return;
    }

    setUploading(true);
    setStatus("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("alt", alt.trim());
      const response = await fetch("/api/cms/article-media", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "آپلود تصویر ناموفق بود.");
      setImage(payload.image as CmsImage);
      setStatus("تصویر آپلود شد؛ حالا محل استفاده را انتخاب کن.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "آپلود تصویر ناموفق بود.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="spb-article-image-uploader">
      <div>
        <strong>تصویر مقاله</strong>
        <small>تصویر شاخص یا عکس داخل متن را اینجا آپلود کن. عکس مقاله بدون حذف پس‌زمینه ذخیره می‌شود.</small>
      </div>
      <label className="spb-button is-primary">
        {file ? "تغییر فایل تصویر" : "انتخاب تصویر"}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            setFile(selected);
            setImage(null);
            setStatus(selected ? `آمادهٔ آپلود: ${selected.name}` : "");
          }}
        />
      </label>
      <label className="is-wide">
        <span>ALT تصویر</span>
        <input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="توصیف روشن و مرتبط با مقاله" />
      </label>
      <button type="button" className="spb-button" disabled={!file || uploading} onClick={() => void upload()}>
        {uploading ? "در حال آپلود…" : "آپلود تصویر"}
      </button>

      {image ? (
        <div className="spb-article-image-uploader__result">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote WordPress media */}
          <img src={image.src} alt={alt} />
          <div>
            <button type="button" className="spb-button" onClick={() => onUseAsFeatured(image, alt.trim())}>استفاده به‌عنوان تصویر شاخص</button>
            <button type="button" className="spb-button" onClick={() => onInsertIntoArticle(image, alt.trim())}>درج در محل نشانگر متن</button>
          </div>
        </div>
      ) : null}
      {status ? <p className="spb-article-image-uploader__status">{status}</p> : null}
    </div>
  );
}
