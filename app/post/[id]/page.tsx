import { supabase } from "@/lib/supabaseClient";
import { toPlainText } from "@/lib/content";
import { notFound } from "next/navigation";
import PostClient from "./PostClient";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: Props) {
  const { id } = await params;

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) notFound();

  return (
    <main className="min-h-screen bg-[#f8f7fb]">
      <div className="max-w-3xl mx-auto px-6 py-10">

        <article className="bg-white border rounded-3xl p-8 shadow-sm">
          <h1 className="text-4xl font-bold mb-6">
            {post.title}
          </h1>

          <div className="text-lg leading-8 text-gray-700 whitespace-pre-wrap">
            {toPlainText(post.content)}
          </div>
        </article>

        {/* SOCIAL LAYER */}
        <PostClient postId={id} />

      </div>
    </main>
  );
}
