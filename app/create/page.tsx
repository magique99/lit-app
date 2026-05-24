"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  "Fiecare propoziție ar trebui să schimbe ceva.",
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

export function excerpt(html: string, max = 180): string {
  return htmlToPlainTextWithNewlines(html)
    .replace(/\s+/g, " ")
    .slice(0, max);
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
  const [publishDone, setPublishDone] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /* autosave */
  const [lastSaved, setLastSaved] = useState<number>(0);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DRAFT_KEY = "lit9_create_draft_v1";

  /* focus mode */
  const [focusMode, setFocusMode] = useState(false);

  /* reading mode */
  const [readingMode, setReadingMode] = useState<"edit" | "read">("edit");

  /* saving slug info */
  const lastSavedRef = useRef(0);

  /* Prevent ssr mismatch */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* ── tip from localStorage on mount ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.title) setTitle(d.title);
        if (d.textType) setTextType(d.textType);
        if (Array.isArray(d.genres)) setGenres(d.genres);
        if (new Date(d.ts).getTime() > Date.now() - 86400000) {
          setToast("Draft recuperat.");
          setTimeout(() => setToast(null), 3000);
        }
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
    onUpdate: ({ editor: ed }) => {
      scheduleAutosave();
    },
  });

  useEffect(() => {
    scheduleAutosave();
  }, [title, textType, genres, scheduleAutosave]);

  /* ── Derived ── */
  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;
  const plainText = editor?.getText() ?? "";
  const readTime = estimateReadingTime(plainText);
  const savedAgo = mounted && lastSaved > 0 ? formatCountdown(lastSaved) : "";

  const toggleGenre = (g: string) => {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const randomTip = useMemo(
    () => ATOMIC_TIPS[Math.floor(Math.random() * ATOMIC_TIPS.length)],
    [],
  );

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
      setPublishDone(true);
      setPublishedId(post.id);

      setTimeout(() => {
        setFocusMode(false);
        setPublishing(false);
      }, 2800);
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

      {/* ── Header bar ── */}
      <div className="max-w-7xl mx-auto px-6 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight"
                style={{ color: C.text }}>
              Adaugă un text
            </h1>
            <p className="mt-1 text-[12px] italic" style={{ color: C.muted }}>
              Fiecare cuvânt contează.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Reading mode toggle */}
            <button
              onClick={() => setReadingMode(m => m === "edit" ? "read" : "edit")}
              className="rounded-full px-4 py-2 text-[11px] font-medium tracking-wide transition-all"
              style={{
                border: `1.5px solid ${readingMode === "read" ? C.accent : C.border}`,
                color: readingMode === "read" ? "#fff" : C.muted,
                background: readingMode === "read" ? C.accent : "transparent",
              }}
            >
              {readingMode === "edit" ? "Vizualizează 📖" : "Editare ✏️"}
            </button>

            {/* Focus mode */}
            <button
              onClick={() => setFocusMode((v) => !v)}
              className="rounded-full px-4 py-2 text-[11px] font-medium tracking-wide transition-all"
              style={{
                border: `1.5px solid ${focusMode ? C.accent : C.border}`,
                color: focusMode ? "#fff" : C.muted,
                background: focusMode ? C.accent : "transparent",
              }}
            >
              {focusMode ? "Ieși din focus" : "Focus mode"}
            </button>
          </div>
        </div>

        {/* ── Inline status / error row ── */}
        {(publishError || (mounted && lastSaved > 0)) && (
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
          EDITOR AREA
          ───────────────────────────────────────────── */}
      <div className={`max-w-7xl mx-auto px-6 mt-8 transition-all duration-500 ${
        focusMode ? "max-w-3xl" : ""
      }`}>

        {/* TITLE */}
        <input
          className="w-full bg-transparent border-none outline-none font-serif text-[32px] sm:text-[44px] font-medium leading-[1.15] placeholder:opacity-30 transition-all duration-500"
          style={{ color: C.text }}
          placeholder="Titlul"
          value={title}
          onChange={(e) => { setTitle(e.target.value); scheduleAutosave(); }}
        />

        {/* META ROW */}
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px]"
             style={{ color: C.muted }}>

          {/* Word count / read time */}
          <span>⊕ {wordCount} cuvinte · {charCount} caractere</span>
          <span>⏱ {readTime} min citire</span>

          {/* Text type chips */}
          <div className="flex gap-1.5 flex-wrap">
            {TEXT_TYPES.map((t) => (
              <Chip key={t} label={t} active={textType === t} onClick={() => {
                setTextType(prev => prev === t ? "" : t);
                scheduleAutosave();
              }} />
            ))}
          </div>
        </div>

{/* ── SHARED CORE: EDITOR + TOOLBAR + PREVIEW ── */}
         <div className="mt-6 grid gap-8" style={{
           gridTemplateColumns: readingMode === "read" ? "1fr 1fr" : "1fr",
           gridTemplateAreas: readingMode === "read" ? '"editor preview"' : '"editor"',
         }}>
           {/* ── EDITOR PANEL ── */}
           <div className="grid-in-editor" style={{ display: readingMode === "read" ? "none" : undefined }}>

            {/* Toolbar */}
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

{/* ── PREVIEW PANEL ── */}
           {readingMode === "read" && (
             <div className="grid-in-preview rounded-[1.75rem] border p-8 sm:p-12"
                  style={{
                    borderColor: C.border,
                    background: "rgba(255,255,255,0.75)",
                    boxShadow: "0 8px 40px rgba(42,37,32,0.06)",
                  }}>
               {title && (
                 <h2 className="font-serif text-[36px] font-medium leading-[1.2] mb-6"
                     style={{ color: C.text }}>{title}</h2>
               )}
               <div
                 className="text-[16px] leading-[1.9]"
                 style={{ color: C.text, fontFamily: "var(--font-lora), Georgia, serif" }}
                 dangerouslySetInnerHTML={{ __html: editor?.getHTML() ?? "" }}
               />
               {!editor?.getHTML().trim() && (
                 <p className="italic" style={{ color: C.muted }}>
                   Scrie ceva în editor pentru a vedea preview-ul aici.
                 </p>
               )}
             </div>
           )}
         </div>

        {/* ── SIDEBAR (right, desktop, not in focus mode) ── */}
        <div className={`hidden lg:block transition-all duration-500 ${
          focusMode ? "lg:hidden" : ""
        }`}>
          <div className="sticky top-28 space-y-6" style={{ maxWidth: "260px" }}>

            {/* ── Card preview ── */}
            <PreviewCard
              title={title}
              htmlContent={editor?.getHTML() ?? ""}
              textType={textType}
              genres={genres}
            />

            {/* ── Genres chips ── */}
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

            {/* ── Producer tip ── */}
            <div className="rounded-[1.5rem] border border-[#e8ddd0] p-5"
                 style={{ background: "rgba(184,125,75,0.04)" }}>
              <p className="text-[10px] uppercase tracking-[0.3em] mb-2 font-serif"
                 style={{ color: C.accent }}>
                Sfat de scriitor
              </p>
              <p className="text-[12px] leading-relaxed italic" style={{ color: C.muted }}>
                "{randomTip}"
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ── ACTION BAR ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t bg-white/80 backdrop-blur-xl"
           style={{ borderColor: C.border }}>

        <div className={`mx-auto transition-all duration-500 ${
          focusMode ? "max-w-3xl" : "max-w-7xl"
        }`}>
          <div className="flex items-center justify-between gap-4 px-6 py-35">

            {/* left: word stats */}
            <div className="flex items-center gap-5 text-[11px]" style={{ color: C.muted }}>
              <span>{wordCount} cuvinte</span>
              <span>{readTime} min citire</span>
            </div>

            {/* right: publish */}
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
