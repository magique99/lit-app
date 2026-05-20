"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Annotation } from "@/lib/types";

export default function TextAnnotations({ postId }: { postId: string }) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedText, setSelectedText] = useState<{ text: string; start: number; end: number } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [newAnnotation, setNewAnnotation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });

    loadAnnotations();
  }, [postId]);

  const loadAnnotations = useCallback(async () => {
    const { data } = await supabase
      .from("annotations")
      .select("*")
      .eq("post_id", postId);
    setAnnotations((data as Annotation[]) || []);
  }, [postId]);

  const addAnnotation = async () => {
    if (!selectedText || !currentUserId || !newAnnotation.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from("annotations")
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content_type: "comment",
          content: newAnnotation,
          start_offset: selectedText.start,
          end_offset: selectedText.end,
        })
        .select("*")
        .single();
    
      if (error) {
        console.error("INSERT ANNOTATION ERROR:", error);
        setError("Nu am putut salva adnotația.");
        return;
      }
      
      if (data) {
        setAnnotations((prev) => [...prev, data as Annotation]);
      }
    } catch (err) {
      console.error("EXCEPTION IN ADD ANNOTATION:", err);
      setError("A apărut o eroare neașteptată.");
    }
    
    setNewAnnotation("");
    setShowPopup(false);
    setSelectedText(null);
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) {
        setShowPopup(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      const article = document.querySelector("article");
      if (!article) return;
      
      const selectionInArticle = article.contains(range.startContainer) || article.contains(range.endContainer);
      if (!selectionInArticle) {
        setShowPopup(false);
        return;
      }
      
      let start = 0;
      const textNodes: Node[] = [];
      const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, null);
      
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
      
      for (const textNode of textNodes) {
        if (textNode === range.startContainer) {
          const preText = textNodes.slice(0, textNodes.indexOf(textNode)).reduce((acc, n) => acc + (n.textContent || ""), "");
          start = preText.length + range.startOffset;
          break;
        }
      }
      
      const end = start + selection.toString().length;
      
      setSelectedText({ text: selection.toString(), start, end });
      setPopupPos({ x: rect.left + rect.width / 2, y: rect.bottom });
      setShowPopup(true);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div className="mt-8">
      <p className="text-sm text-slate-500 mb-4">Selectează un fragment din text pentru a adăuga o adnotație.</p>
      
      {showPopup && selectedText && (
        <div
          className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-64"
          style={{ left: popupPos.x, top: popupPos.y }}
        >
          <p className="text-xs text-slate-600 mb-2 line-clamp-2">"{selectedText.text}"</p>
          <textarea
            value={newAnnotation}
            onChange={(e) => setNewAnnotation(e.target.value)}
            placeholder="Scrie adnotația..."
            className="w-full text-sm border border-slate-200 rounded p-2 mb-2"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={addAnnotation}
              className="flex-1 text-xs bg-amber-400 text-slate-900 rounded py-1 font-semibold"
            >
              Salvează
            </button>
            <button
              onClick={() => setShowPopup(false)}
              className="flex-1 text-xs border border-slate-200 rounded py-1"
            >
              Anulează
            </button>
          </div>
        </div>
      )}

      {annotations.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Adnotări</h3>
          {annotations.map((a) => (
            <div key={a.id} className="border-l-2 border-amber-400 pl-3">
              <p className="text-xs text-slate-500">Offset: {a.start_offset}-{a.end_offset}</p>
              <p className="text-sm text-slate-700">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}