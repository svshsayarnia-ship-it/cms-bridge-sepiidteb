"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useRef } from "react";

type Props = {
  html: string;
  onChange(html: string): void;
  onUseSource(): void;
};

/**
 * TipTap deliberately supports the article subset we use day-to-day.  When a
 * legacy article contains a richer construct, we keep it in source mode so
 * opening the visual editor can never silently flatten it.
 */
export function visualEditorSafety(html: string) {
  const reasons: string[] = [];
  if (/<h1\b/i.test(html)) reasons.push("این متن یک H1 داخلی دارد");
  if (/<(?:figure|figcaption|article|section|header|footer|nav|span)\b/i.test(html)) reasons.push("در متن یک ساختار پیشرفتهٔ HTML وجود دارد");
  if (/<(?:iframe|video|audio|svg|math)\b/i.test(html)) reasons.push("رسانه یا محتوای تعبیه‌شده دارد");
  if (/<img\b[^>]*\s(?:width|height)\s*=/i.test(html)) reasons.push("اندازهٔ سفارشی تصویر دارد");

  for (const match of html.matchAll(/<h[234]\b([^>]*)>/gi)) {
    const id = match[1].match(/\bid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)?.slice(1).find(Boolean);
    if (id && !/^section-\d+(?:-\d+)?$/i.test(id)) {
      reasons.push("شناسهٔ اختصاصی برای تیتر دارد");
      break;
    }
  }
  return reasons;
}

function ToolbarButton({ active = false, children, onClick, title }: { active?: boolean; children: React.ReactNode; onClick(): void; title: string }) {
  return <button type="button" className={active ? "is-active" : ""} aria-pressed={active} title={title} onClick={onClick}>{children}</button>;
}

export function ArticleVisualEditor({ html, onChange, onUseSource }: Props) {
  const lastHtml = useRef(html);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: false }),
      Underline,
      Link.configure({ autolink: true, linkOnPaste: true, openOnClick: false, protocols: ["https"] }),
      Image.configure({ allowBase64: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: html,
    editorProps: { attributes: { class: "spb-tiptap-surface", dir: "rtl" } },
    onUpdate: ({ editor: activeEditor }) => {
      const nextHtml = activeEditor.getHTML();
      lastHtml.current = nextHtml;
      onChange(nextHtml);
    },
  });

  useEffect(() => {
    if (!editor || html === lastHtml.current || html === editor.getHTML()) return;
    editor.commands.setContent(html, { emitUpdate: false });
    lastHtml.current = html;
  }, [editor, html]);

  if (!editor) return <div className="spb-tiptap-loading">در حال آماده‌سازی ویرایشگر…</div>;

  function setLink() {
    const activeEditor = editor;
    if (!activeEditor) return;
    const previous = activeEditor.getAttributes("link").href as string | undefined;
    const href = window.prompt("نشانی لینک (https:// یا مسیر داخلی /…)", previous ?? "");
    if (href === null) return;
    if (!href.trim()) {
      activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!(href.startsWith("https://") || href.startsWith("/"))) {
      window.alert("فقط لینک امن https:// یا مسیر داخلی /… پذیرفته می‌شود.");
      return;
    }
    activeEditor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }

  return <div className="spb-tiptap-editor">
    <div className="spb-tiptap-editor__toolbar" role="toolbar" aria-label="ابزارهای ویرایش مقاله">
      <ToolbarButton title="پررنگ" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><b>پررنگ</b></ToolbarButton>
      <ToolbarButton title="مورب" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><i>مورب</i></ToolbarButton>
      <ToolbarButton title="زیرخط" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>زیرخط</u></ToolbarButton>
      <ToolbarButton title="تیتر بخش" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
      <ToolbarButton title="زیرتیتر" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
      <ToolbarButton title="فهرست نشانه‌دار" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>• فهرست</ToolbarButton>
      <ToolbarButton title="فهرست شماره‌دار" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>۱. فهرست</ToolbarButton>
      <ToolbarButton title="نقل‌قول" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>نقل‌قول</ToolbarButton>
      <ToolbarButton title="لینک" active={editor.isActive("link")} onClick={setLink}>لینک</ToolbarButton>
      <ToolbarButton title="درج جدول ۳×۳" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>جدول</ToolbarButton>
      <ToolbarButton title="بازگشت" onClick={() => editor.chain().focus().undo().run()}>↶</ToolbarButton>
      <ToolbarButton title="دوباره" onClick={() => editor.chain().focus().redo().run()}>↷</ToolbarButton>
      <button type="button" className="spb-tiptap-editor__source" onClick={onUseSource}>HTML خام</button>
    </div>
    <EditorContent editor={editor} />
    <p className="spb-tiptap-editor__hint">عنوان بالای فرم، تنها H1 صفحه است. تغییرات اینجا همان HTML امنِ ذخیره‌شده برای سایت است.</p>
  </div>;
}
