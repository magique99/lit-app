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

export default function CreatePost() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);

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

    // ======================
    // TXT
    // ======================
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

    // ======================
    // DOCX
    // ======================
    if (ext === "docx") {
      try {
        const buffer = await f.arrayBuffer();

        // DOCX validity check (ZIP signature)
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

    // ======================
    // SUPABASE STORAGE UPLOAD (DOCX)
    // ======================
    if (file?.name.endsWith(".docx")) {
      try {
        setStatus("Se încarcă documentul...");
        const uploaded = await uploadDocx(
          file,
          user.id
        );

        docUrl = uploaded.signedUrl;
      } catch (err) {
        console.error("Upload error:", err);
        setError("Nu am putut încărca documentul DOCX.");
        setLoading(false);
        return;
      }
    }

    setProgress(50);

    // ======================
    // DUPLICATE CHECK
    // ======================
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

    // ======================
    // CREATE POST (SAFE LAYER)
    // ======================
    try {
      setStatus("Se salvează postarea...");
      const post = await createPost({
        title,
        content,
        user_id: user.id,
        file_hash: fileHash,
        version: 1,
        doc_url: docUrl,
      });

      setProgress(100);
      setStatus("Publicat.");

      router.push(`/post/${post.id}`);
    } catch (err) {
      console.error(err);
      setError("Nu am putut salva postarea.");
    }

    setLoading(false);
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">
        Creează postare
      </h1>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {status && !error && (
        <div className="mb-4 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-600">
          {status}
        </div>
      )}

      {/* TITLE */}
      <input
        className="w-full border p-3 rounded mb-4"
        placeholder="Titlul postării"
        value={title}
        disabled={loading}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* FILE UPLOAD */}
      <input
        type="file"
        accept=".txt,.docx"
        onChange={handleFileUpload}
        disabled={loading || processingFile}
        className="mb-4"
      />

      {/* PROGRESS BAR */}
      {progress > 0 && (
        <div className="h-2 bg-gray-200 rounded mb-4">
          <div
            className="h-2 bg-green-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* PREVIEW */}
      {content && (
        <div className="border rounded p-6 mb-6">
          <h2 className="text-lg font-bold mb-3">
            Preview
          </h2>

          <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
            {toPlainText(content)}
          </div>
        </div>
      )}

      {/* PUBLISH */}
      <button
        onClick={publish}
        disabled={loading || processingFile}
        className="bg-black text-white px-6 py-3 rounded disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? "Se publică..." : processingFile ? "Se procesează..." : "Publică"}
      </button>
    </main>
  );
}
