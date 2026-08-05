"use client";

import { useEffect, useRef } from "react";

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange(value: string): void;
  minHeight?: number;
};

export function RichTextEditor({
  label,
  value,
  onChange,
  minHeight = 150,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value && document.activeElement !== editor) {
      editor.innerHTML = value;
    }
  }, [value]);

  function command(name: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(name, false, commandValue);
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function addLink() {
    const href = window.prompt("آدرس لینک را وارد کن:", "https://");
    if (href) command("createLink", href);
  }

  return (
    <div className="spb-rich-field">
      <span className="spb-field-label">{label}</span>
      <div className="spb-rich-toolbar" role="toolbar" aria-label={`ابزار ${label}`}>
        <button
  type="button"
  title="عنوان سطح دو"
  onClick={() => command("formatBlock", "h2")}
>
  H2
</button>

<button
  type="button"
  title="عنوان سطح سه"
  onClick={() => command("formatBlock", "h3")}
>
  H3
</button>
        <button type="button" title="پررنگ" onClick={() => command("bold")}>
          <b>B</b>
        </button>
        <button type="button" title="مورب" onClick={() => command("italic")}>
          <i>I</i>
        </button>
        <button type="button" title="فهرست" onClick={() => command("insertUnorderedList")}>
          List
        </button>
        <button
  type="button"
  title="فهرست شماره‌دار"
  onClick={() => command("insertOrderedList")}
>
  1.
</button>
        <button type="button" title="لینک" onClick={addLink}>
          Link
        </button>
        <button type="button" title="حذف قالب‌بندی" onClick={() => command("removeFormat")}>
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        className="spb-rich-editor"
        contentEditable
        suppressContentEditableWarning
        style={{ minHeight }}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        aria-label={label}
      />
    </div>
  );
}
