"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function ProEditor({ onChange }: any) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Scrie aici...</p>",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const selection = editor.state.selection.empty;

  return (
    <div className="border p-4 min-h-[300px] relative">

      {/* ✨ CUSTOM TOOLBAR (NU BubbleMenu) */}
      {!selection && (
        <div className="absolute top-2 left-2 bg-white border shadow px-2 py-1 flex gap-2 z-10">
          <button onClick={() => editor.chain().focus().toggleBold().run()}>
            Bold
          </button>

          <button onClick={() => editor.chain().focus().toggleItalic().run()}>
            Italic
          </button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}