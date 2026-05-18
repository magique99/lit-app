"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState, useEffect } from "react";

export default function ProEditor({ onChange }: any) {
  const [isEmptySelection, setIsEmptySelection] =
    useState(true);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Scrie aici...</p>",

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },

    onSelectionUpdate: ({ editor }) => {
      setIsEmptySelection(editor.state.selection.empty);
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-gray-200 rounded-xl p-4 min-h-[300px] relative bg-white">

      {/* TOOLBAR */}
      {!isEmptySelection && (
        <div
          className="
            absolute top-2 left-2
            flex gap-2
            bg-white border border-gray-100
            shadow-sm
            rounded-lg
            px-2 py-1
            z-10
          "
        >

          <ToolButton
            onClick={() =>
              editor.chain().focus().toggleBold().run()
            }
            active={editor.isActive("bold")}
          >
            B
          </ToolButton>

          <ToolButton
            onClick={() =>
              editor.chain().focus().toggleItalic().run()
            }
            active={editor.isActive("italic")}
          >
            I
          </ToolButton>

          <ToolButton
            onClick={() =>
              editor.chain().focus().toggleBulletList().run()
            }
            active={editor.isActive("bulletList")}
          >
            •
          </ToolButton>

        </div>
      )}

      {/* EDITOR */}
      <EditorContent editor={editor} />

    </div>
  );
}

/* =========================
   BUTTON (Instagram-like)
========================= */

function ToolButton({
  children,
  onClick,
  active,
}: any) {
  return (
    <button
      onClick={onClick}
      className={`
        w-8 h-8
        flex items-center justify-center
        rounded-md
        text-sm
        transition
        ${
          active
            ? "bg-black text-white"
            : "hover:bg-gray-100 text-gray-700"
        }
      `}
    >
      {children}
    </button>
  );
}