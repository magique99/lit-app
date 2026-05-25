"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { createPost } from "@/lib/postClient";
import { htmlToPlainTextWithNewlines } from "@/lib/content";
import RequireEmailVerification from "@/components/RequireEmailVerification";
import * as mammoth from "mammoth";

/* =======================================================
    COLOANE
    ======================================================= */
const C = {
  bg: "#f7efe4",
  surface: "#ffffff",
  text: "#2A2520",
  muted: "#7A7268",
  border: "#e8ddd0",
  accent: "#B87D4B",
  accentLight: "rgba(184,125,75,0.10)",
};

/* =======================================================
    OPCȚIUNI
    ======================================================= */
const TEXT_TYPES = ["Proză", "Poezie", "Teatru", "Jurnal", "Eseu", "Altul"];

const GENRES = [
  "Grotesc", "Simbolic", "Oniric", "Poezie",
  "Eseu", "Ficțiune", "Non-ficțiune", "SF",
  "Thriller", "Polițist", "Romantic", "Absurd",
  "Noir", "Jurnal", "Experimental", "Altul",
];

const ATOMIC_TIPS = [
  "Titlul trebuie să fie prima declarație.",
  "Scrie ceva ce nu ai putea spune cu voce tare.",
  "Trimite primul paragraf la un prieten.",
  "Poezia are nevoie de rima sau de ritm?",
  "Fiecare propoziție ar trebui să schimbe cevo.",
  "Săgeții trebuie să arate înainte, nu în spate.",
  "Nu explica prea mult.",
  "Dacă te cutremură, publică-l.",
];

/* =======================================================
   UTILS
   ======================================================= */
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



/* =======================================================
   CHIP BUTTON
   ======================================================= */
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

/* =======================================================
    TOOLBAR
    ======================================================= */
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

/* =======================================================
   PREVIEW CARD
   ======================================================= */
function PreviewCard({
  title,
  htmlContent,
  textType,
  genres,
}: {
  title: string;
  htmlContent: string;
  textType?: string;
  genres: string[];
}) {
  const plain = htmlToPlainTextWithNewlines(htmlContent).replace(/\s+/g, " ");
  const excerpt = plain.slice(0, 160) + (plain.length > 160 ? "…" : "");
  const readTime = estimateReadingTime(plain);
  const previewTitle = title.trim();

  return (
    <div className="rounded-[1.75rem] border border-[#e8ddd0] bg-white/70 p-6"
         style={{ boxShadow: "0 8px 40px rgba(42,37,32,0.06)" }}
    >
      <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: C.accent }}>Așa va apărea în feed</p>

      <h3 className="mt-3 font-serif text-[18px] font-medium leading-snug" style={{ color: C.text }}>
        {previewTitle || <span style={{ color: C.muted, fontStyle: "italic", fontWeight: 400 }}>Fără titlu incă</span>}
      </h3>

      <p className="mt-2 text-[13px] leading-relaxed" style={{ color: C.muted }}>
        {excerpt}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px]" style={{ color: C.muted }}>
        {textType && <span className="uppercase tracking-wider" style={{ opacity: 0.7 }}>{textType}</span>}
        <span className="flex items-center gap-1">
          <span>⏱</span> {readTime} min citire
        </span>
        {genres.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {genres.map((g) => (
              <span key={g} className="px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide"
                    style={{ background: C.accentLight, color: C.accent }}>
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =======================================================
   PUBLISH OVERLAY
   ======================================================= */
function PublishOverlay({
  visible,
  label,
  progress,
  onDone,
  onCancel,
}: {
  visible: boolean;
  label: string;
  progress: number;   // 0–100
  onDone: () => void;
  onCancel: () => void;
}) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
      style={{
        background: "rgba(247,239,228,0.97)",
        backdropFilter: "blur(12px)",
        animation: "publishIn 0.3s ease-out",
      }}
    >
      <style>{`
        @keyframes publishIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes barGrow  { from { width: 0; } }
      `}</style>

      <p className="text-[11px] uppercase tracking-[0.4em] font-serif" style={{ color: C.accent }}>
        {progress >= 100 ? "Finalizat" : "Publică textul"}
      </p>

      <p className="text-center max-w-sm text-[15px] leading-relaxed font-serif italic" style={{ color: C.text }}>
        Va apărea în feed-ul comunității.
      </p>

      {/* progress bar */}
      <div className="w-56 h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: C.accent,
            animation: "barGrow 0.6s ease-out",
          }}
        />
      </div>

      <p className="text-[11px]" style={{ color: C.muted }}>{label}</p>

      {progress >= 100 && (
        <button
          onClick={onDone}
          className="mt-3 rounded-full px-8 py-3 text-sm font-semibold text-white shadow-lg
                     transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.97]"
          style={{ background: C.accent }}
        >
          Vezi textul publicat
        </button>
      )}

      {progress < 100 && (
        <button
          onClick={onCancel}
          className="mt-2 text-[12px] transition-colors"
          style={{ color: C.muted }}
        >
          Revino mai târziu
        </button>
      )}
    </div>
);
}

/* =======================================================
   PREVIEW MODAL
   ======================================================= */
function PreviewModal({
  visible,
  title,
  htmlContent,
  textType,
  genres,
  onClose,
}: {
  visible: boolean;
  title: string;
  htmlContent: string;
  textType?: string;
  genres: string[];
  onClose: () => void;
}) {
  const plain = htmlToPlainTextWithNewlines(htmlContent).replace(/\s+/g, " ");
  const readTime = estimateReadingTime(plain);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white/98 backdrop-blur-xl overflow-y-auto">
      <style>{`
        .preview-content .ProseMirror {
          font-family: var(--font-lora), Georgia, 'Times New Roman', serif;
          line-height: 1.85;
        }
        .preview-content p { margin-bottom: 1.1em; }
        .preview-content h2 { font-size: 1.5rem; font-weight: 600; margin: 1.6em 0 0.6em; }
        .preview-content h3 { font-size: 1.25rem; font-weight: 600; margin: 1.4em 0 0.5em; }
        .preview-content blockquote {
          border-left: 3px solid rgba(184,125,75,0.4);
          padding-left: 1.2em;
          margin: 1.4em 0;
          font-style: italic;
          color: #555;
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-xs uppercase tracking-[0.4em] font-serif" style={{ color: C.accent }}>
            Preview publicare
          </h2>
          <button
            onClick={onClose}
            className="rounded-full px-5 py-2 text-sm font-medium transition-all duration-200"
            style={{
              color: C.text,
              border: `1.5px solid ${C.border}`,
              background: C.surface,
            }}
          >
            Închide ×
          </button>
        </div>

        <article className="rounded-[2.5rem] border border-slate-200 bg-white p-12 shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
          <h1 className="font-serif text-4xl font-semibold leading-tight mb-4" style={{ color: C.text }}>
            {title.trim() || <span style={{ color: C.muted }}>Fără titlu</span>}
          </h1>

          <div className="flex items-center gap-4 text-xs mb-8" style={{ color: C.muted }}>
            {textType && <span className="uppercase tracking-wider">{textType}</span>}
            <span>•</span>
            <span>{readTime} min citire</span>
            {genres.length > 0 && (
              <>
                <span>•</span>
                <div className="flex gap-1.5">
                  {genres.map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded-full text-[10px]"
                          style={{ background: C.accentLight, color: C.accent }}>
                      {g}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div
            className="preview-content text-lg leading-relaxed text-slate-800 max-w-3xl"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </article>
      </div>
    </div>
  );
}

/* =======================================================
    MAIN FORM
   ======================================================= */
function CreatePostForm() {
  const router = useRouter();

/* ── State ── */
   const [title, setTitle] = useState("");
   const [textType, setTextType] = useState("");
   const [genres, setGenres] = useState<string[]>([]);
   const [publishProgress, setPublishProgress] = useState(0);
   const [publishLabel, setPublishLabel] = useState("");
   const [publishing, setPublishing] = useState(false);
   const [publishedId, setPublishedId] = useState<string | null>(null);
   const [publishError, setPublishError] = useState<string | null>(null);
   const [toast, setToast] = useState<string | null>(null);
   const [docxLoading, setDocxLoading] = useState(false);

   /* autosave */
   const [lastSaved, setLastSaved] = useState<number>(0);
   const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
   const DRAFT_KEY = "lit9_create_draft_v1";
   const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);

/* focus mode */
    const [focusMode, setFocusMode] = useState(false);

    /* reading mode */
    const [readingMode, setReadingMode] = useState<"edit" | "read">("edit");

    /* preview mode */
    const [showPreview, setShowPreview] = useState(false);

     /* ── tip from localStorage on mount ── */
    useEffect(() => {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const d = JSON.parse(saved);
          queueMicrotask(() => {
            if (d.title) {
              setTitle(d.title);
            }
            if (d.textType) {
              setTextType(d.textType);
            }
            if (Array.isArray(d.genres)) {
              setGenres(d.genres);
            }
            if (new Date(d.ts).getTime() > Date.now() - 86400000) {
              setToast("Draft recuperat.");
              setTimeout(() => setToast(null), 3000);
            }
          });
        }
      } catch { /* ignore */ }
    }, [DRAFT_KEY]);

  /* ── Autosave to localStorage ── */
  const scheduleAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          title,
          textType,
          genres,
          ts: Date.now(),
        }));
        setLastSaved(Date.now() / 1000);
      } catch { /* storage full */ }
    }, 1200);
  }, [title, textType, genres]);

/* ── TIPTAP EDITOR ── */
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
        Link.configure({ openOnClick: false }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
      ],
      content: "",
      immediatelyRender: false,
      onUpdate: () => {
        scheduleAutosave();
      },
    });

   useEffect(() => {
     editorRef.current = editor;
   }, [editor]);

   const handleDocxUpload = useCallback(async (file: File) => {
     if (!file || !file.name.endsWith(".docx")) {
       setPublishError("Selectează un fișier .docx valid.");
       return;
     }

     setDocxLoading(true);
     setPublishError(null);

     try {
       const arrayBuffer = await file.arrayBuffer();
       const result = await mammoth.convertToHtml({ arrayBuffer });
       
       if (editorRef.current && result.value) {
         editorRef.current.commands.setContent(result.value);
         const text = htmlToPlainTextWithNewlines(result.value);
         const firstLine = text.split("\n")[0] || "";
         if (firstLine.length > 20 && !title) {
           setTitle(firstLine.substring(0, 60));
         }
         setToast("Conținut încărcat din DOCX.");
         setTimeout(() => setToast(null), 3000);
       }
     } catch (err) {
       console.error(err);
       setPublishError("Nu am putut citi fișierul DOCX.");
     } finally {
       setDocxLoading(false);
     }
   }, [title]);

  useEffect(() => {
    scheduleAutosave();
  }, [title, textType, genres, scheduleAutosave]);

  /* ── Derived ── */
  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;
  const plainText = editor?.getText() ?? "";
  const readTime = estimateReadingTime(plainText);
  const savedAgo = lastSaved > 0 ? formatCountdown(lastSaved) : "";

  const toggleGenre = (g: string) => {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

   const [randomTip] = useState(() => {
       return ATOMIC_TIPS[Math.floor(Math.random() * ATOMIC_TIPS.length)];
     });

  /* ── Publish ── */
  const handlePublish = useCallback(async () => {
    if (!title.trim()) {
      setPublishError("Adaugă un titlu înainte de publicare.");
      return;
    }
    if (!editor?.getHTML().trim()) {
      setPublishError("Adaugă conținut înainte de publicare.");
      return;
    }
    if (!textType) {
      setPublishError("Selectează un tip de text.");
      return;
    }
    if (genres.length === 0) {
      setPublishError("Selectează cel puțin un gen / etichetă.");
      return;
    }

    setPublishError(null);
    setPublishing(true);
    setPublishProgress(5);
    setPublishLabel("Se verifică autentificărea…");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setPublishError("Trebuie să fii logat ca să publici.");
      setPublishing(false);
      setPublishProgress(0);
      return;
    }

    const genreBlob = genres.length > 0 ? genres.join(", ") : null;

    setPublishProgress(25);
    setPublishLabel("Se pregătește postarea…");

    try {
      setPublishProgress(50);
      setPublishLabel("Se salvează în baza de date…");

      const post = await createPost({
        title: title.trim(),
        content: editor!.getHTML(),
        user_id: user.id,
        version: 1,
        text_type: textType,
        genre: genreBlob,
        uses_ai: null,
      });

      setPublishProgress(80);
      setPublishLabel("Publică…");

      /* clear local draft */
      localStorage.removeItem(DRAFT_KEY);
      setLastSaved(0);

setPublishProgress(100);
        setPublishLabel("Publicat.");
        setPublishedId(post.id);

        setTimeout(() => {
          setFocusMode(false);
          setPublishing(false);
          router.push(`/post/${post.id}`);
        }, 1500);
    } catch (err: unknown) {
      console.error(err);
      setPublishError(err instanceof Error ? err.message : "Nu am putut salva postarea.");
      setPublishing(false);
      setPublishProgress(0);
    }
  }, [title, textType, genres, editor]);

  const handleDone = useCallback(() => {
    if (publishedId) router.push(`/post/${publishedId}`);
  }, [publishedId, router]);

  /* ────────────────────────────────────────────────
     RENDER
     ──────────────────────────────────────────────── */
  return (
    <main
      className="relative min-h-screen pt-14 pb-20 transition-colors duration-500"
      style={{
        background: focusMode
          ? "linear-gradient(180deg, #F7F3EE 0%, #ede5da 100%)"
          : "#f7efe4",
      }}
    >
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 rounded-2xl px-5 py-2.5 text-[13px] font-medium text-white shadow-lg"
             style={{ background: C.accent, animation: "publishIn 0.3s ease-out" }}>
          {toast}
        </div>
      )}

      <PublishOverlay
        visible={publishing}
        label={publishLabel}
        progress={publishProgress}
        onDone={handleDone}
        onCancel={() => { setPublishing(false); setPublishProgress(0); }}
      />

      <PreviewModal
        visible={showPreview}
        title={title}
        htmlContent={editor?.getHTML() ?? ""}
        textType={textType}
        genres={genres}
        onClose={() => setShowPreview(false)}
      />

      {/* ── Header bar ── */}
      <div className="max-w-7xl mx-auto px-6 pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Header left */}
          <div className="lg:col-span-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight"
                style={{ color: C.text }}>
              Adaugă un text
            </h1>
            <p className="mt-2 text-[13px] italic" style={{ color: C.muted }}>
              Publică poezie, proză scurtă, eseu sau experiment literar
            </p>
          </div>

          {/* Header right - controls */}
          <div className="flex items-center justify-end gap-3">
            {/* Preview button */}
            <button
              onClick={() => setShowPreview(true)}
              className="rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 active:scale-[0.97]"
              style={{
                color: C.text,
                border: `1.5px solid ${C.border}`,
                background: C.surface,
              }}
            >
              Preview 👁️
            </button>

            {/* Reading mode toggle */}
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

            {/* Focus mode */}
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

            {/* DOCX Import */}
            <label className="rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300 active:scale-[0.97] cursor-pointer"
              style={{
                color: C.text,
                border: `1.5px solid ${C.border}`,
                background: C.surface,
              }}
            >
              {docxLoading ? "Se încarcă..." : "Import DOCX"}
              <input
                type="file"
                accept=".docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDocxUpload(file);
                }}
                disabled={docxLoading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* ── Inline status / error row ── */}
        {(publishError || lastSaved > 0) && (
          <div className="mt-3 flex items-center gap-4">
            {publishError && (
              <p className="text-[12px] text-rose-500/80">{publishError}</p>
            )}
            {savedAgo && !publishError && (
              <p className="text-[11px] italic" style={{ color: C.muted }}>
                💾 Last saved {savedAgo}
              </p>
            )}
          </div>
        )}
      </div>

      {publishError && (
        <div className="max-w-7xl mx-auto px-6 mt-3 rounded-[1.5rem] border border-red-200/60 bg-red-50/80 px-5 py-3 text-[13px] text-red-700">
          {publishError}
        </div>
      )}

{/* ─────────────────────────────────────────────
           EDITOR AREA - TWO COLUMN LAYOUT
           ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN - Main content */}
          <div className="lg:col-span-2">
            {/* TITLE */}
            <input
              className="w-full bg-transparent border-none outline-none font-serif text-[32px] sm:text-[44px] font-medium leading-[1.15] placeholder:opacity-30 transition-all duration-500"
              style={{ color: C.text }}
              placeholder="Titlul"
              value={title}
              onChange={(e) => { setTitle(e.target.value); scheduleAutosave(); }}
            />

            {/* META ROW */}
            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px]"
                 style={{ color: C.muted }}>
              <span>⊕ {wordCount} cuvinte · {charCount} caractere</span>
              <span>⏱ {readTime} min citire</span>
              <div className="flex gap-1.5 flex-wrap">
                {TEXT_TYPES.map((t) => (
                  <Chip key={t} label={t} active={textType === t} onClick={() => {
                    setTextType(prev => prev === t ? "" : t);
                    scheduleAutosave();
                  }} />
                ))}
              </div>
            </div>

            {/* Toolbar */}
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
                onMouseEnter={(e) => {
                  if (!editor.isActive({ textAlign: 'center' })) { e.currentTarget.style.background = C.accentLight; e.currentTarget.style.borderColor = C.border; }
                }}
                onMouseLeave={(e) => {
                  if (!editor.isActive({ textAlign: 'center' })) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }
                }}
              >
                ⇫
              </button>
            </div>
            )}

            {/* Editor box */}
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

          {/* RIGHT COLUMN - Sidebar */}
          <div>
            <div className="sticky top-28 space-y-6">
              {/* Quick Tips Card */}
              <div className="rounded-[1.5rem] border border-[#e8ddd0] bg-white/60 p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: C.accent }}>
                  Sfaturi rapide
                </p>
                <p className="text-[12px] leading-relaxed italic mb-4" style={{ color: C.muted }}>
                  {randomTip}
                </p>
                <div className="space-y-2 text-[11px]" style={{ color: C.muted }}>
                  <p>• Începe cu o idee simplă, nu cu perfecțiunea.</p>
                  <p>• Lasă textul să se așeze, apoi revino asupra lui.</p>
                  <p>• Nu te opri la prima versiune — revino și rescrie.</p>
                  <p>• Ajustează ritmul citindu-l de mai multe ori.</p>
                  <p>• Citește textul înainte să-l publici.</p>
                </div>
              </div>

              {/* Stats Card */}
              <div className="rounded-[1.5rem] border border-[#e8ddd0] bg-white/60 p-5">
                <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: C.accent }}>
                  Statistici
                </p>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span style={{ color: C.muted }}>Cuvinte:</span>
                    <span style={{ color: C.text }}>{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: C.muted }}>Timp citire:</span>
                    <span style={{ color: C.text }}>{readTime} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: C.muted }}>Genuri:</span>
                    <span style={{ color: C.text }}>{genres.length}</span>
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <PreviewCard
                title={title}
                htmlContent={editor?.getHTML() ?? ""}
                textType={textType}
                genres={genres}
              />

              {/* Genres Section */}
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

      {/* ── ACTION BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white/80 backdrop-blur-xl"
           style={{ borderColor: C.border }}>

        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 px-6 py-5">

            {/* left: word stats */}
            <div className="flex items-center gap-5 text-[11px]" style={{ color: C.muted }}>
              <span>{wordCount} cuvinte</span>
              <span>{readTime} min citire</span>
            </div>

            {/* right: publish */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(true)}
                disabled={publishing}
                className="
                  inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium
                  transition-all duration-300 active:scale-[0.97]
                  disabled:cursor-not-allowed
                "
                style={{
                  color: C.text,
                  border: `1.5px solid ${C.border}`,
                  background: C.surface,
                  ...(publishing ? { opacity: 0.65 } : {}),
                }}
              >
                Preview 👁️
              </button>

              <button
                onClick={() => { setPublishError(null); void handlePublish(); }}
                disabled={publishing}
                className="
                  inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold
                  transition-all duration-300 active:scale-[0.97]
                  disabled:cursor-not-allowed
                "
                style={{
                  background: C.accent,
                  color: "#fff",
                  boxShadow: "0 8px 30px rgba(184,125,75,0.30)",
                  ...(publishing ? { opacity: 0.65 } : {}),
                }}
                onMouseEnter={(e) => !publishing && (e.currentTarget.style.background = "#9E6538")}
                onMouseLeave={(e) => !publishing && (e.currentTarget.style.background = C.accent)}
              >
                {publishing ? "Se publică…" : "Publică textul"}
                <span style={{ opacity: 0.6 }}>↗</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TIPTAP STYLES ── */}
      <style>{`
        /* Lora serif font applied to editor content only — not on UI */
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

export default function CreatePost() {
  return (
    <RequireEmailVerification>
      <CreatePostForm />
    </RequireEmailVerification>
  );
}
