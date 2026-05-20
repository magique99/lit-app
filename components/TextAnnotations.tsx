"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Annotation } from "@/lib/types";

export default function TextAnnotations({ postId }: { postId: string }) {
  const pathname = usePathname();
  const isPostPage = pathname?.startsWith("/post/");

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedText, setSelectedText] = useState<{ text: string; start: number; end: number } | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [newAnnotation, setNewAnnotation] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const popupId = useRef(0);
  const showPopupRef = useRef(showPopup);
  const lastSelectionKeyRef = useRef<string | null>(null);

  showPopupRef.current = showPopup;

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
        return;
      }

      if (data) {
        setAnnotations((prev) => [...prev, data as Annotation]);
      }
    } catch (err) {
      console.error("EXCEPTION IN ADD ANNOTATION:", err);
    }

    setNewAnnotation("");
    setShowPopup(false);
    setSelectedText(null);
    lastSelectionKeyRef.current = null;
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });

    void loadAnnotations();
  }, [loadAnnotations]);

  useEffect(() => {
    function handleMouseUp() {
      const selection = window.getSelection();
      if (!selection || !selection.toString().trim()) return;

      const range = selection.getRangeAt(0);

      // The only element with [data-post-content] is inside PaginatedContent,
      // which is used only on /post/[id]. If it's not found (any other page),
      // this handler returns immediately — no popup anywhere else.
      const textEl = document.querySelector("[data-post-content]");
      if (!textEl) return;

      const inside = textEl.contains(range.startContainer) || textEl.contains(range.endContainer);
      if (!inside) return;

      const selectionKey = `${range.startContainer.textContent}-${range.startOffset}-${range.endOffset}`;
      if (lastSelectionKeyRef.current === selectionKey && showPopupRef.current) return;
      lastSelectionKeyRef.current = selectionKey;

      const rect = range.getBoundingClientRect();

      let start = 0;
      const textNodes: Node[] = [];
      const walker = document.createTreeWalker(textEl, NodeFilter.SHOW_TEXT, null);

      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }

      for (const textNode of textNodes) {
        if (textNode === range.startContainer) {
          const preText = textNodes
            .slice(0, textNodes.indexOf(textNode))
            .reduce((acc, n) => acc + (n.textContent || ""), "");
          start = preText.length + range.startOffset;
          break;
        }
      }

      setSelectedText({ text: selection.toString(), start, end: start + selection.toString().length });
      setPopupPos({ x: rect.left + rect.width / 2, y: rect.bottom });
      setShowPopup(true);
    }

    function handlePopupMouseDown(e: MouseEvent) {
      if (e.target instanceof HTMLElement && e.target.closest('.fixed.z-50')) {
        return;
      }
    }

    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handlePopupMouseDown);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handlePopupMouseDown);
    };
  }, [postId]);

  return (
    <div className="mt-8">
      <p className="text-sm text-slate-500 mb-4">Selectează un fragment din text pentru a adăuga o adnotație.</p>

      {showPopup && selectedText && (
        <div
          key={popupId.current}
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
