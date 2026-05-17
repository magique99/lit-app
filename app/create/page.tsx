"use client";

import { useState } from "react";
import mammoth from "mammoth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { createPost } from "@/lib/postClient";
import { uploadDocx } from "@/lib/storage";

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
  const [progress, setProgress] = useState(0);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    setProgress(10);

    const ext = f.name.split(".").pop()?.toLowerCase();

    // ======================
    // TXT
    // ======================
    if (ext === "txt") {
      const text = await f.text();

      setFileHash(hashString(text));

      const html = text
        .split("\n")
        .map((l) => `<p>${l}</p>`)
        .join("");

      setContent(html);

      if (!title) {
        setTitle(text.split("\n").find(Boolean)?.slice(0, 120) || "Untitled");
      }

      setProgress(100);
      return;
    }

    // ======================
    // DOCX
    // ======================
    if (ext === "docx") {
      const buffer = await f.arrayBuffer();

      // DOCX validity check (ZIP signature)
      const bytes = new Uint8Array(buffer);
      if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        alert("Fișier DOCX invalid/corupt");
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
      return;
    }

    alert("Doar .txt sau .docx sunt acceptate");
  }

  async function publish() {
    if (!title.trim()) return alert("Adaugă titlu");
    if (!content.trim()) return alert("Adaugă conținut");

    setLoading(true);
    setProgress(10);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Trebuie să fii logat");
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
        const uploaded = await uploadDocx(
          file,
          user.id
        );

        await supabase.from("posts").insert({
          title,
          content,
          user_id: user.id,
          docx_url: uploaded.signedUrl,
          docx_path: uploaded.path,
        });
        docUrl = uploaded.signedUrl;
      } catch (err) {
        console.error("Upload error:", err);
        alert("Eroare upload DOCX");
        setLoading(false);
        return;
      }
    }

    setProgress(50);

    // ======================
    // DUPLICATE CHECK
    // ======================
    if (fileHash) {
      const { data: existing } = await supabase
        .from("posts")
        .select("id")
        .eq("file_hash", fileHash)
        .maybeSingle();

      if (existing) {
        alert("Acest document există deja");
        setLoading(false);
        return;
      }
    }

    setProgress(70);

    // ======================
    // CREATE POST (SAFE LAYER)
    // ======================
    try {
      const post = await createPost({
        title,
        content,
        user_id: user.id,
        file_hash: fileHash,
        version: 1,
      });

      // attach doc url (storage)
      if (docUrl) {
        await supabase
          .from("posts")
          .update({
            doc_url: docUrl,
          })
          .eq("id", post.id);
      }

      setProgress(100);

      router.push(`/post/${post.id}`);
    } catch (err) {
      console.error(err);
      alert("Eroare la salvare");
    }

    setLoading(false);
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">
        Creează postare
      </h1>

      {/* TITLE */}
      <input
        className="w-full border p-3 rounded mb-4"
        placeholder="Titlul postării"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* FILE UPLOAD */}
      <input
        type="file"
        accept=".txt,.docx"
        onChange={handleFileUpload}
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

          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}

      {/* PUBLISH */}
      <button
        onClick={publish}
        disabled={loading}
        className="bg-black text-white px-6 py-3 rounded"
      >
        {loading ? "Se publică..." : "Publică"}
      </button>
    </main>
  );
}