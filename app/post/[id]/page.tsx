import { supabase } from "@/lib/supabaseClient";
import { toPlainText } from "@/lib/content";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PostClient from "./PostClient";
import LikeButton from "@/components/LikeButton";
import TextAnnotations from "@/components/TextAnnotations";
import PaginatedContent from "./PaginatedContent";

type Props = {
  params: Promise<{ id: string }>;
};

type PostPageData = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string | null;
};

type ProfileData = {
  username: string | null;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
};

export default async function PostPage({ params }: Props) {
  const { id } = await params;

  let post: PostPageData | null = null;
  let fetchError: unknown = null;

  try {
    const result = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single<PostPageData>();
    
    post = result.data;
    fetchError = result.error;
  } catch (e) {
    fetchError = e;
  }

  if (fetchError || !post) {
    notFound();
  }

  let profile: ProfileData | null = null;

  if (post.user_id) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("username, avatar_url, first_name, last_name, nickname")
      .eq("user_id", post.user_id)
      .maybeSingle<ProfileData>();
      
    if (!profileError && profileData) {
      let displayName = null;
      if (profileData.username && profileData.username.trim() !== '') {
        displayName = profileData.username;
      } else if ((profileData.first_name && profileData.first_name.trim() !== '') || 
                 (profileData.last_name && profileData.last_name.trim() !== '')) {
        displayName = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim();
      } else if (profileData.nickname && profileData.nickname.trim() !== '') {
        displayName = profileData.nickname;
      }
      
      profile = {
        username: displayName ?? null,
        avatar_url: profileData.avatar_url ?? null,
        first_name: profileData.first_name ?? null,
        last_name: profileData.last_name ?? null,
        nickname: profileData.nickname ?? null
      };
    }
  }

  const authorName = profile?.username ?? "anonim";

  const publishedAt = new Date(post.created_at).toLocaleDateString(
    "ro-RO",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const { data: commentsData, error: commentsError } = await supabase
    .from("comments")
    .select("id", { count: "exact" })
    .eq("post_id", id);

  const commentCount = commentsError ? 0 : (commentsData?.length ?? 0);

  return (
    <main className="relative min-h-screen bg-[#f7efe4] text-slate-950">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        
        <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-[#fcf5ec] p-8 shadow-[0_40px_120px_rgba(15,23,42,0.12)]">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">
                Vizualizare text
              </p>

              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                {post.title}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">
                {toPlainText(post.content).slice(0, 220)}...
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                {post.user_id ? (
                  <Link href={`/profile/${post.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full">
                      <Image
                        src={profile?.avatar_url ?? "/user.jpg"}
                        alt={authorName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">@{authorName}</p>
                      <p className="text-xs text-slate-500">
                        Publicat {publishedAt}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <>
                    <div className="relative h-12 w-12 overflow-hidden rounded-full">
                      <Image
                        src="/user.jpg"
                        alt="anonim"
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">@anonim</p>
                      <p className="text-xs text-slate-500">
                        Publicat {publishedAt}
                      </p>
                    </div>
                  </>
                )}
              </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500 sm:mt-5">
                  <LikeButton postId={id} />
                  <span className="inline-flex items-center gap-2">💬 {commentCount}</span>
                </div>
            </div>
          </div>
        </section>

        <article className="mt-10 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-10 shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
          <PaginatedContent content={post.content} wordsPerPage={350} />
        </article>

        <TextAnnotations postId={id} postContent={post.content} />

        <PostClient postId={id} />
      </div>
    </main>
  );
}