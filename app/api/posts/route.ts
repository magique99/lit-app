import { createClient } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, content, text_type, genre, uses_ai } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }

  // Ensure profile exists
  await supabase.from("profiles").upsert({
    user_id: user.id,
    username: `user_${user.id.slice(0, 8)}`,
  }, { onConflict: "user_id" });

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title,
      content,
      user_id: user.id,
      text_type: text_type || null,
      genre: genre || null,
      uses_ai: uses_ai || null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}