"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Annotation } from "@/lib/types";

export default function TextAnnotations({ postId }: { postId: string }) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedText, setSelectedText] = useState<{ text: string; start: number; end: number } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [newAnnotation, setNewAnnotation] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });

    loadAnnotations();
  }, [postId]);

  const loadAnnotations = useCallback(async () => {
    const { data } = await supabase
      .from("annotations")
      .select<Annotation>("*")
      .eq("post_id", postId);
    setAnnotations((data as Annotation[]) || []);
  }, [postId]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Find position in the text
      const contentEl = contentRef.current;
      if (!contentEl) return;
      
      let start = 0;
      const textNodes: Node[] = [];
      const walker = document.createTreeWalker(contentEl, NodeFilter.SHOW_TEXT, null);
      
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
      
      for (const textNode of textNodes) {
        if (textNode === range.startContainer) {
          const preText = textNodes.slice(0, textNodes.indexOf(textNode)).reduce((acc, n) => acc + n.textContent, "");
          start = preText.length + range.startOffset;
          break;
        }
      }
      
      const end = start + selection.toString().length;
      
      setSelectedText({ text: selection.toString(), start, end });
      setPopupPos({ x: rect.left + rect.width / 2, y: rect.bottom });
      setShowPopup(true);
    } else {
      setShowPopup(false);
    }
  }, []);

  const addAnnotation = async () => {
    if (!selectedText || !currentUserId || !newAnnotation.trim()) return;
    
    const { data, error } = await supabase
      .from("annotations")
      .insert({
        post_id: postId,
        user_id: currentUserId,
        content_type: "comment",
        content: newAnnotation,
        start_offset: selectedText.start,
        end_offset: selectedText.end,
      } as any)
      .select("*")
      .single();
    
    if (!error && data) {
      setAnnotations((prev) => [...prev, data as Annotation]);
    }
    
    setNewAnnotation("");
    setShowPopup(false);
    setSelectedText(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div className="mt-8">
      <div
        ref={contentRef}
        onMouseUp={handleMouseUp}
        className="prose max-w-none text-slate-700"
      >
        <p className="text-sm text-slate-500 mb-2">Selectează un fragment pentru a adăuga o adnotație.</p>
      </div>
      
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