"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type EditorMode = "visual" | "html";

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
  const editorRef =
    useRef<HTMLDivElement>(null);

  const [mode, setMode] =
    useState<EditorMode>("visual");

  useEffect(() => {
    if (mode !== "visual") {
      return;
    }

    const editor = editorRef.current;

    if (
      editor &&
      editor.innerHTML !== value &&
      document.activeElement !== editor
    ) {
      editor.innerHTML = value;
    }
  }, [mode, value]);

  function command(
    name: string,
    commandValue?: string,
  ) {
    const editor = editorRef.current;

    if (!editor || mode !== "visual") {
      return;
    }

    editor.focus();

    document.execCommand(
      name,
      false,
      commandValue,
    );

    onChange(editor.innerHTML);
  }

  function addLink() {
    const href = window.prompt(
      "آدرس لینک را وارد کن:",
      "https://",
    );

    if (href?.trim()) {
      command("createLink", href.trim());
    }
  }

  return (
    <div className="spb-rich-field">
      <div className="spb-rich-field__head">
        <span className="spb-field-label">
          {label}
        </span>

        <div
          className="spb-rich-mode-switch"
          role="group"
          aria-label={`حالت ویرایش ${label}`}
        >
          <button
            type="button"
            className={
              mode === "visual"
                ? "is-active"
                : ""
            }
            aria-pressed={mode === "visual"}
            onClick={() => setMode("visual")}
          >
            دیداری
          </button>

          <button
            type="button"
            className={
              mode === "html"
                ? "is-active"
                : ""
            }
            aria-pressed={mode === "html"}
            onClick={() => setMode("html")}
          >
            HTML
          </button>
        </div>
      </div>

      {mode === "visual" ? (
        <>
          <div
            className="spb-rich-toolbar"
            role="toolbar"
            aria-label={`ابزار ${label}`}
          >
            <button
              type="button"
              title="عنوان سطح دو"
              onClick={() =>
                command(
                  "formatBlock",
                  "h2",
                )
              }
            >
              H2
            </button>

            <button
              type="button"
              title="عنوان سطح سه"
              onClick={() =>
                command(
                  "formatBlock",
                  "h3",
                )
              }
            >
              H3
            </button>

            <button
              type="button"
              title="پررنگ"
              onClick={() =>
                command("bold")
              }
            >
              <b>B</b>
            </button>

            <button
              type="button"
              title="مورب"
              onClick={() =>
                command("italic")
              }
            >
              <i>I</i>
            </button>

            <button
              type="button"
              title="فهرست نشانه‌دار"
              onClick={() =>
                command(
                  "insertUnorderedList",
                )
              }
            >
              List
            </button>

            <button
              type="button"
              title="فهرست شماره‌دار"
              onClick={() =>
                command(
                  "insertOrderedList",
                )
              }
            >
              1.
            </button>

            <button
              type="button"
              title="افزودن لینک"
              onClick={addLink}
            >
              Link
            </button>

            <button
              type="button"
              title="حذف قالب‌بندی"
              onClick={() =>
                command("removeFormat")
              }
            >
              Clear
            </button>
          </div>

          <div
            ref={editorRef}
            className="spb-rich-editor"
            contentEditable
            suppressContentEditableWarning
            style={{ minHeight }}
            onInput={(event) =>
              onChange(
                event.currentTarget
                  .innerHTML,
              )
            }
            onBlur={(event) =>
              onChange(
                event.currentTarget
                  .innerHTML,
              )
            }
            aria-label={label}
          />
        </>
      ) : (
        <>
          <textarea
            className="spb-rich-html-editor"
            dir="ltr"
            spellCheck={false}
            style={{ minHeight }}
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value,
              )
            }
            aria-label={`${label} به صورت HTML`}
            placeholder="<h2>عنوان بخش</h2>

<p>متن پاراگراف...</p>"
          />

          <small className="spb-rich-html-help">
            تگ‌های مجاز: p، h2، h3،
            ul، ol، li، strong، em،
            a و br
          </small>
        </>
      )}
    </div>
  );
}
