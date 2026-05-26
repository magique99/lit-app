"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { CharacterCount } from "@tiptap/extension-character-count";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import RequireEmailVerification from "@/components/RequireEmailVerification";

const C = {
  bg: "#f7efe4",
  surface: "#ffffff",
  text: "#2A2520",
  muted: "#7A7268",
  border: "#e8ddd0",
  accent: "#B87D4B",
  accentLight: "rgba(184,125,75,0.10)",
};

const TEXT_TYPES = ["Proză", "Poezie", "Teatru", "Jurnal", "Eseu", "Altul"];

const GENRES = [
  "Grotesc", "Simbolic", "Oniric", "Poezie",
  "Eseu", "Ficțiune", "Non-ficțiune", "SF",
  "Thriller", "Polițist", "Romantic", "Absurd",
  "Noir", "Jurnal", "Experimental", "Altul",
];

function Chip({
  label, active, onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        cursor-pointer rounded-[1.25rem] px-4 py-[5px] text-[11px] font-medium
        tracking-wide transition-all duration-200
        outline-none
        "
      style={{
        border: `1.5px solid ${active ? C.accent : C.border}`,
        color: active ? "#fff" : C.muted,
        background: active ? C.accent : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.borderColor = C.accent;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.borderColor = C.border;
      }}
    >
      {label}
    </button>
  );
}

const Btn = ({
  onClick, active, label, title,
}: { onClick: () => void; active?: boolean; label: string; title: string }) => (
  <button
    onClick={onClick}
    title={title}
    className="
      flex items-center justify-center w-8 h-8 rounded-[0.6rem] text-[13px]
      font-medium transition-all duration-150 outline-none
      "
    style={{
      background: active ? C.accentLight : "transparent",
      color: active ? C.accent : C.muted,
      border: `1.5px solid ${active ? C.accent : "transparent"}`,
    }}
    onMouseEnter={(e) => {
      if (!active) { e.currentTarget.style.background = C.accentLight; e.currentTarget.style.borderColor = C.border; }
    }}
    onMouseLeave={(e) => {
      if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }
    }}
  >
    {label}
  </button>
);

function Toolbar({
   editor,
}: {
   editor: ReturnType<typeof useEditor> | null;
}) {
   if (!editor) return null;

   return (
     <div className="flex items-center gap-1 flex-wrap">
       <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            label="H2" title="Titlu paragraf" />
       <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            label={"\u201C\u201D"} title="Citat" />
       <span className="w-px h-4 mx-1" style={{ background: C.border }} />
       <Btn onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            label="B" title="Îngroșat" />
       <Btn onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            label="I" title="Italic" />
       <Btn onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            label="U" title="Subliniat" />
       <span className="w-px h-4 mx-1" style={{ background: C.border }} />
       <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()}
            label="─" title="Separator" />
     </div>
   );
}

function formatCountdown(ts: number): string {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 5) return "chiar acum";
  if (diff < 60) return `acum ${diff} secunde`;
  if (diff < 3600) return `acum ${Math.floor(diff / 60)} minute`;
  return `acum ${Math.floor(diff / 3600)} ore`;
}

function estimateReadingTime(plainText: string): number {
  return Math.max(1, Math.ceil(plainText.length / 1200));
}

const EditPostContent = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [textType, setTextType] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [readingMode, setReadingMode] = useState<"edit" | "read">("edit");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      CharacterCount,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Titlul paragrafului...";
          }
          return "\u201C\u00CEncepe cu prima propoziție care nu îți dă pace.\u201D";
        },
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    immediatelyRender: false,
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("title, content, text_type, genre")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (data) {
          setTitle(data.title || "");
          setTextType(data.text_type || "");
          setGenres(data.genre ? data.genre.split(", ") : []);
          if (editor) {
            editor.commands.setContent(data.content || "");
          }
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, editor]);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;
  const plainText = editor?.getText() ?? "";
  const readTime = estimateReadingTime(plainText);

  const toggleGenre = (g: string) => {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      setError("Adaugă un titlu.");
      return;
    }
    if (!editor?.getHTML().trim()) {
      setError("Adaugă conținut.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const { error } = await supabase
        .from("posts")
        .update({
          title: title.trim(),
          content: editor.getHTML(),
          text_type: textType || null,
          genre: genres.length > 0 ? genres.join(", ") : null,
        })
        .eq("id", id);

      if (error) throw error;
      setSuccess("Salvat cu succes!");
      setTimeout(() => {
        router.push(`/post/${id}`);
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [title, editor, textType, genres, id, router]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Se încarcă…</div>;
  }

  return (
    <main
      className="relative min-h-screen pt-14 pb-20 transition-colors duration-500"
      style={{
        background: focusMode
          ? "linear-gradient(180deg, #F7F3EE 0%, #ede5da 100%)"
          : "#f7efe4",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight" style={{ color: C.text }}>
              Editează textul
            </h1>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setReadingMode(m => m === "edit" ? "read" : "edit")}
              className="rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 active:scale-[0.97]"
              style={{
                color: readingMode === "read" ? C.text : C.text,
                border: `1.5px solid ${readingMode === "read" ? C.accent : C.border}`,
                background: readingMode === "read" ? C.accent : C.surface,
              }}
            >
              {readingMode === "edit" ? "Vizualizează 📖" : "Editare ✏️"}
            </button>
            <button
              onClick={() => setFocusMode((v) => !v)}
              className="rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 active:scale-[0.97]"
              style={{
                color: focusMode ? "#fff" : C.text,
                border: `1.5px solid ${focusMode ? C.accent : C.border}`,
                background: focusMode ? C.accent : C.surface,
              }}
            >
              {focusMode ? "Ieși din focus" : "Focus mode"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <input
              className="w-full bg-transparent border-none outline-none font-serif text-[32px] sm:text-[44px] font-medium leading-[1.15] placeholder:opacity-30 transition-all duration-500"
              style={{ color: C.text }}
              placeholder="Titlul"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px]"
                 style={{ color: C.muted }}>
              <span>⊕ {wordCount} cuvinte · {charCount} caractere</span>
              <span>⏱ {readTime} min citire</span>
              <div className="flex gap-1.5 flex-wrap">
                {TEXT_TYPES.map((t) => (
                  <Chip key={t} label={t} active={textType === t} onClick={() => {
                    setTextType(prev => prev === t ? "" : t);
                  }} />
                ))}
              </div>
            </div>

            {editor && (
            <div className="flex items-center gap-4 pb-3 mb-4 border-b"
                 style={{ borderColor: C.border }}>
              <Toolbar editor={editor} />
              <span className="w-px h-4" style={{ background: C.border }} />
              <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                title="Aliniază la centru"
                className="
                  flex items-center justify-center w-8 h-8 rounded-[0.6rem] text-[13px]
                  font-medium transition-all duration-150 outline-none
                "
                style={{
                  background: editor.isActive({ textAlign: 'center' }) ? C.accentLight : "transparent",
                  color: editor.isActive({ textAlign: 'center' }) ? C.accent : C.muted,
                  border: `1.5px solid ${editor.isActive({ textAlign: 'center' }) ? C.accent : "transparent"}`,
                }}
              >
                ⇫
              </button>
            </div>
            )}

            <div
              className="relative rounded-[1.75rem] border p-6 sm:p-9 transition-all duration-300"
              style={{
                borderColor: focusMode ? "transparent" : C.border,
                background: "rgba(255,255,255,0.65)",
                boxShadow: "0 8px 40px rgba(42,37,32,0.06)",
                minHeight: focusMode ? "60vh" : "480px",
              }}
            >
              <EditorContent editor={editor}
                className="Tiinia-editor text-[15px] sm:text-[16px]"
              />
            </div>
          </div>

          <div>
            <div className="sticky top-28 space-y-6">
              <div className="rounded-[1.5rem] border border-[#e8ddd0] bg-white/55 p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: C.accent }}>
                  Etichete / Gen
                </p>
                <p className="text-[11px] mb-3 italic" style={{ color: C.muted }}>
                  {genres.length === 0
                    ? "Alege categoriile care se potrivesc cel mai bine cu textul tău."
                    : `${genres.length} etichet${genres.length === 1 ? "ă" : "e"} selectat${genres.length === 1 ? "ă" : "e"}`}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {GENRES.map((g) => (
                    <Chip key={g} label={g} active={genres.includes(g)} onClick={() => toggleGenre(g)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white/80 backdrop-blur-xl"
           style={{ borderColor: C.border }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 px-6 py-5">
            <div className="flex items-center gap-5 text-[11px]" style={{ color: C.muted }}>
              <span>{wordCount} cuvinte</span>
              <span>{readTime} min citire</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/post/${id}`)}
                disabled={saving}
                className="
                  inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium
                  transition-all duration-300 active:scale-[0.97]
                  disabled:cursor-not-allowed
                "
                style={{
                  color: C.text,
                  border: `1.5px solid ${C.border}`,
                  background: C.surface,
                }}
              >
                Anulează
              </button>

              <button
                onClick={() => { void handleSave(); }}
                disabled={saving}
                className="
                  inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold
                  transition-all duration-300 active:scale-[0.97]
                  disabled:cursor-not-allowed
                "
                style={{
                  background: C.accent,
                  color: "#fff",
                  boxShadow: "0 8px 30px rgba(184,125,75,0.30)",
                }}
              >
                {saving ? "Se salvează…" : success ? "Salvat ✓" : "Salvează modificările"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-3 rounded-[1.5rem] border border-red-200/60 bg-red-50/80 px-5 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <style>{`
        .Tiinia-editor .ProseMirror {
          font-family: var(--font-lora), Georgia, 'Times New Roman', serif;
          line-height: 1.85;
          outline: none;
          min-height: 380px;
        }
        .Tiinia-editor .ProseMirror p  { margin-bottom: 0.85em; }
        .Tiinia-editor .ProseMirror h2 { font-size: 1.5rem; font-weight: 600; margin: 1.4em 0 0.5em; }
        .Tiinia-editor .ProseMirror h3 { font-size: 1.2rem; font-weight: 600; margin: 1.2em 0 0.5em; }
        .Tiinia-editor .ProseMirror blockquote {
          border-left: 2.5px solid rgba(184,125,75,0.4);
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
        }
        .Tiinia-editor .ProseMirror img { max-width: 100%; border-radius: 12px; }
      `}</style>
    </main>
  );
}

export default function EditPost() {
  return (
    <RequireEmailVerification>
      <EditPostContent />
    </RequireEmailVerification>
  );
}