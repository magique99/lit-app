"use client";

import { useState, useMemo } from "react";

type Props = {
  content: string;
  wordsPerPage?: number;
};

export default function PaginatedContent({
  content,
  wordsPerPage = 200,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const pages = useMemo(() => {
    const paraRegex = /<p[\s>][\s\S]*?<\/p>|<p[\s>][\s\S]*?(?=<p|\/body|$)/gi;
    const paragraphs: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = paraRegex.exec(content)) !== null) {
      paragraphs.push(m[0] || "");
    }
    if (paragraphs.length === 0) {
      const plain = content.replace(/<[^>]+>/g, "").trim();
      if (plain) {
        paragraphs.push(`<p>${plain}</p>`);
      }
    }

    const result: string[] = [];
    let currentWords = 0;
    let buffer: string = "";

    const flush = () => {
      if (buffer.trim()) result.push(buffer.trim());
    };

    for (const para of paragraphs) {
      const wc = (para.replace(/<[^>]+>/g, "").match(/\S+/g) || []).length;
      if (currentWords > 0 && currentWords + wc > wordsPerPage) {
        flush();
        currentWords = 0;
        buffer = "";
      }
      buffer += para;
      currentWords += wc;
    }
    flush();

    return result.length > 0 ? result : [""];
  }, [content, wordsPerPage]);

  const totalPages = pages.length;

  if (totalPages === 0) return null;

  return (
    <div className="font-serif">
      {totalPages === 1 ? (
        <div
          className="max-w-3xl mx-auto px-8 py-12 text-lg leading-relaxed text-slate-800 text-justify hyphens-auto"
          dangerouslySetInnerHTML={{ __html: pages[0] }}
        />
      ) : (
        <>
          <div
            className="max-w-3xl mx-auto px-8 py-12 text-lg leading-relaxed text-slate-800 text-justify hyphens-auto"
            dangerouslySetInnerHTML={{ __html: pages[currentPage - 1] }}
          />

          <div className="mx-auto max-w-3xl mt-12 pt-8 border-t border-slate-200 flex items-center justify-between px-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 rounded-full text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Înapoi
            </button>

            <span className="text-sm text-slate-500 font-medium">
              Pagina {currentPage} din {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-6 py-3 rounded-full text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Înainte →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
