import { supabase } from "@/lib/supabaseClient";
import { toPlainText } from "@/lib/content";
import { notFound } from "next/navigation";
import PostClient from "./PostClient";

type Props = {
  params: { id: string };
};

type PostPageData = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string | null;
  profiles?: {
    username: string | null;
    avatar_url: string | null;
  } | null;
};

export default async function PostPage({ params }: Props) {
  const { id } = params;

  // Try relational select first (includes author profile). If that fails,
  // fall back to a simple select to avoid returning 404 when the relation
  // isn't available or the DB relationship name differs.
  let post: PostPageData | null = null;
  let error: any = null;

  try {
    const res = await supabase
      .from("posts")
      .select("*, profiles(username, avatar_url)")
      .eq("id", id)
      .single();

    post = res.data as PostPageData | null;
    error = res.error;
  } catch (err) {
    error = err;
  }

  if ((error || !post) && !post) {
    // fallback: fetch without relational join
    try {
      const res2 = await supabase.from("posts").select("*").eq("id", id).single();
      post = res2.data as PostPageData | null;
      error = res2.error;
    } catch (err) {
      error = err;
    }
  }

  if (error || !post) {
    console.error("Post fetch error:", error);
    notFound();
  }

  const authorName = post.profiles?.username ?? "anonim";
  const publishedAt = new Date(post.created_at).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="relative min-h-screen bg-[#f7efe4] text-slate-950">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-[#fcf5ec] p-8 shadow-[0_40px_120px_rgba(15,23,42,0.12)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Vizualizare text</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                {post.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
                {toPlainText(post.content).slice(0, 220)}...
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-[#f5ece1]">
                  {post.profiles?.avatar_url ? (
                    <img
                      src={post.profiles.avatar_url}
                      alt={authorName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                      {authorName[0]?.toUpperCase() ?? "A"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">@{authorName}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Publicat {publishedAt}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <article className="mt-10 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
          <div className="prose prose-slate max-w-none text-slate-700 prose-p:leading-relaxed prose-p:whitespace-pre-wrap prose-h2:text-slate-900 prose-h2:mt-8 prose-h2:mb-4 prose-strong:text-slate-900 prose-em:text-slate-800">
            {toPlainText(post.content)}
          </div>
        </article>

        <PostClient postId={id} />
      </div>
    </main>
  );
}
