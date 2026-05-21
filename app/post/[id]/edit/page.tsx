"use client";

import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type FormValues = {
  title: string;
  content: string;
};

export default function EditPostPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [post, setPost] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FormValues>({ title: "", content: "" });

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("title, content")
          .eq("id", id)
          .single();

        if (error) throw error;
        if (data) {
          setPost(data);
          setFormValues(data);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ title: formValues.title, content: formValues.content })
        .eq("id", id);

      if (error) throw error;
      setSuccess("Post updated successfully!");
      // Redirect to the post page after a short delay
      setTimeout(() => {
        router.push(`/post/${id}`);
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!post) {
    return <p>Loading post...</p>;
  }

  return (
    <main className="min-h-screen bg-[#f7efe4] text-slate-950 p-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Post</h1>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            value={formValues.title}
            onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
            className="border rounded px-3 py-2 w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <textarea
            value={formValues.content}
            onChange={(e) => setFormValues({ ...formValues, content: e.target.value })}
            className="border rounded px-3 py-2 w-full h-96"
            required
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-400 text-slate-950 px-4 py-2 rounded hover:bg-amber-300 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/post/${id}`)}
            className="bg-slate-300 text-slate-950 px-4 py-2 rounded hover:bg-slate-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}