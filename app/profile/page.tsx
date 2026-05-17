"use client";

import { useState } from "react";

type Post = {
  id: string;
  title: string;
  excerpt: string;
  created_at: string;
};

export default function ProfilePage() {
  const [posts] = useState<Post[]>([
    {
      id: "1",
      title: "Primul meu text",
      excerpt: "Acesta este un preview al articolului...",
      created_at: "2026-05-10",
    },
    {
      id: "2",
      title: "Scriere și idei",
      excerpt: "Un alt fragment dintr-un articol...",
      created_at: "2026-05-12",
    },
  ]);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 flex justify-center">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* LEFT - PROFILE */}
        <aside className="bg-white rounded-xl border p-6 h-fit space-y-5">

          {/* avatar */}
          <div className="w-20 h-20 rounded-full bg-zinc-200" />

          {/* name */}
          <div>
            <h1 className="text-xl font-bold text-zinc-900">
              Numele utilizatorului
            </h1>
            <p className="text-sm text-zinc-500">
              @username
            </p>
          </div>

          {/* bio */}
          <p className="text-sm text-zinc-600">
            Scriitor digital. Îmi place literatura, tehnologia și ideile simple.
          </p>

          {/* stats */}
          <div className="grid grid-cols-3 text-center text-sm border-t pt-4">
            <div>
              <div className="font-bold">12</div>
              <div className="text-zinc-500 text-xs">Texte</div>
            </div>

            <div>
              <div className="font-bold">48</div>
              <div className="text-zinc-500 text-xs">Likes</div>
            </div>

            <div>
              <div className="font-bold">3</div>
              <div className="text-zinc-500 text-xs">Followers</div>
            </div>
          </div>

          <button className="w-full bg-black text-white py-2 rounded-lg text-sm">
            Edit profile
          </button>
        </aside>

        {/* RIGHT - POSTS */}
        <section className="md:col-span-2 space-y-4">

          <h2 className="text-lg font-semibold text-zinc-900">
            Textele mele
          </h2>

          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white border rounded-xl p-5 hover:shadow-sm transition cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-zinc-900">
                {post.title}
              </h3>

              <p className="text-sm text-zinc-600 mt-2">
                {post.excerpt}
              </p>

              <div className="text-xs text-zinc-400 mt-3">
                {post.created_at}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}