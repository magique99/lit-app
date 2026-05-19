"use client";

import { useState, useEffect } from "react";

type Props = {
  content: string;
  wordsPerPage?: number;
};

export default function PaginatedContent({ content, wordsPerPage = 350 }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pages, setPages] = useState<string[]>([]);

  useEffect(() => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const pages: string[] = [];
    
    for (let i = 0; i < words.length; i += wordsPerPage) {
      const pageWords = words.slice(i, i + wordsPerPage);
      pages.push(pageWords.join(" "));
    }
    
    setPages(pages.length > 0 ? pages : [""]);
    setCurrentPage(1);
  }, [content, wordsPerPage]);

  const totalPages = pages.length;
  const currentText = pages[currentPage - 1] || "";

  if (totalPages === 0) return null;

  return (
    <div className="font-serif">
      <div className="max-w-3xl mx-auto px-8 py-12">
        <div className="text-lg leading-relaxed text-slate-800 text-justify hyphens-auto">
          {currentText.split("\n").map((para, i) => (
            <p key={i} className={i > 0 ? "mt-6" : ""}>
              {para}
            </p>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-12 pt-8 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 rounded-full text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Înapoi
            </button>

            <span className="text-sm text-slate-500 font-medium">
              Pagina {currentPage} din {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-6 py-3 rounded-full text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Înainte →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}