"use client";

import { useState } from "react";
import mammoth from "mammoth";
import { useRouter } from "next/navigation";
import { toPlainText } from "@/lib/content";
import { supabase } from "@/lib/supabaseClient";
import { createPost } from "@/lib/postClient";
import { uploadDocx } from "@/lib/storage";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hashString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

const TEXT_TYPES = ["Proză", "Poezie", "Teatru", "Jurnal", "Altul"];
const GENRES = ["Ficțiune", "Non-ficțiune", "SF", "Thriller", "Polițist", "Romantic", "Altul"];

export default function CreatePost() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [textType, setTextType] = useState("");
  const [genre, setGenre] = useState("");
  const [usesAI, setUsesAI] = useState(false);

  const [fileHash, setFileHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setError(null);
    setStatus("Se citește fișierul...");
    setProcessingFile(true);
    setFile(f);
    setProgress(10);

    const ext = f.name.split(".").pop()?.toLowerCase();

    if (ext === "txt") {
      try {
        const text = await f.text();

        setFileHash(hashString(text));

        const html = text
          .split("\n")
          .map((line) => `<p>${escapeHtml(line)}</p>`)
          .join("");

        setContent(html);

        if (!title) {
          setTitle(text.split("\n").find(Boolean)?.slice(0, 120) || "Untitled");
        }

        setProgress(100);
        setStatus("Fișierul este gata pentru publicare.");
      } catch (err) {
        console.error("TXT READ ERROR:", err);
        setError("Nu am putut citi fișierul TXT.");
        setProgress(0);
      }

      setProcessingFile(false);
      return;
    }

    if (ext === "docx") {
      try {
        const buffer = await f.arrayBuffer();

        const bytes = new Uint8Array(buffer);
        if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
          setError("Fișierul DOCX pare invalid sau corupt.");
          setProgress(0);
          setProcessingFile(false);
          return;
        }

        setProgress(30);

        const [htmlRes, textRes] = await Promise.all([
          mammoth.convertToHtml({ arrayBuffer: buffer }),
          mammoth.extractRawText({ arrayBuffer: buffer }),
        ]);

        const text = textRes.value;
        const html = htmlRes.value;

        setFileHash(hashString(text));
        setContent(html);

        if (!title) {
          const auto = text.split("\n").find(Boolean);
          if (auto) setTitle(auto?.slice(0, 120) || "Untitled");
        }

        setProgress(100);
        setStatus("Fișierul este gata pentru publicare.");
      } catch (err) {
        console.error("DOCX READ ERROR:", err);
        setError("Nu am putut procesa fișierul DOCX.");
        setProgress(0);
      }

      setProcessingFile(false);
      return;
    }

    setError("Doar fișierele .txt sau .docx sunt acceptate.");
    setProgress(0);
    setProcessingFile(false);
  }

   async function publish() {
     if (!title.trim()) {
       setError("Adaugă un titlu înainte de publicare.");
       return;
     }
 
     if (!content.trim()) {
       setError("Adaugă conținut înainte de publicare.");
       return;
     }

     if (!textType) {
       setError("Selectează un tip de text.");
       return;
     }

     if (!genre) {
       setError("Selectează un gen.");
       return;
     }

    setError(null);
    setStatus("Se pregătește publicarea...");
    setLoading(true);
    setProgress(10);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Trebuie să fii logat ca să publici.");
      setLoading(false);
      return;
    }

    setProgress(25);

    let docUrl: string | null = null;

    if (file?.name.endsWith(".docx")) {
      try {
        setStatus("Se încarcă documentul...");
        const uploaded = await uploadDocx(file, user.id);
        docUrl = uploaded.signedUrl;
      } catch (err) {
        console.error("Upload error:", err);
        setError("Nu am putut încărca documentul DOCX.");
        setLoading(false);
        return;
      }
    }

    setProgress(50);

    if (fileHash) {
      setStatus("Se verifică duplicatele...");
      const { data: existing, error } = await supabase
        .from("posts")
        .select("id")
        .eq("file_hash", fileHash)
        .maybeSingle();

      if (error) {
        console.error("DUPLICATE CHECK ERROR:", error);
        setError("Nu am putut verifica dacă documentul există deja.");
        setLoading(false);
        return;
      }

      if (existing) {
        setError("Acest document există deja.");
        setLoading(false);
        return;
      }
    }

    setProgress(70);

     try {
       setStatus("Se salvează postarea...");
       const post = await createPost({
         title,
         content,
         user_id: user.id,
         file_hash: fileHash,
         version: 1,
         doc_url: docUrl,
         text_type: textType,
         genre: genre,
         uses_ai: usesAI,
       });

       setProgress(100);
       setStatus("Publicat.");
       
       // Show confirmation message and redirect after a brief delay
       alert("Publicare realizată cu succes!");
       router.push(`/post/${post.id}`);
     } catch (err) {
       console.error(err);
       setError("Nu am putut salva postarea.");
     }

    setLoading(false);
  }

  return (
    <main className="relative min-h-screen bg-[#f7efe4] text-slate-950 pt-12">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold mb-8 text-slate-950">
          Adaugă un text
        </h1>

        {error && (
          <div className="mb-6 rounded-[1.5rem] border border-red-200/60 bg-red-50/80 px-5 py-4 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {status && !error && (
          <div className="mb-6 rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
            {status}
          </div>
        )}

        <section className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
          <input
            className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-lg text-slate-900 placeholder:text-slate-500 shadow-sm focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-100"
            placeholder="Titlul textului"
            value={title}
            disabled={loading}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <select
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 shadow-sm"
              value={textType}
              disabled={loading}
              onChange={(e) => setTextType(e.target.value)}
            >
              <option value="">Tip text (alegere)</option>
              {TEXT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-900 shadow-sm"
              value={genre}
              disabled={loading}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="">Gen (alegere)</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

            <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={usesAI}
                disabled={loading}
                onChange={(e) => setUsesAI(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Acest text a fost generat cu AI
            </label>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="w-full sm:w-auto">
                <input
                  type="file"
                  accept=".txt,.docx"
                  onChange={handleFileUpload}
                  disabled={loading || processingFile}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-amber-400 file:px-6 file:py-3 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-amber-300"
                />
              </div>
              <div className="w-full sm:w-auto">
                <button
                  onClick={publish}
                  disabled={loading || processingFile}
                  className="mt-0 inline-flex items-center justify-center rounded-full bg-amber-400 px-8 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Se publică..." : processingFile ? "Se procesează..." : "Publică"}
                </button>
              </div>
            </div>

            {content && (
              <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Preview
                </h3>
                <div className="prose max-w-none text-sm leading-7 text-slate-700" dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            )}
        </section>
      </div>
    </main>
  );
}