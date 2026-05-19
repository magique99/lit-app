import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];

export type Post = Tables["posts"]["Row"];
export type PostInsert = Tables["posts"]["Insert"];
export type PostUpdate = Tables["posts"]["Update"];

export type Like = Tables["likes"]["Row"];
export type LikeInsert = Tables["likes"]["Insert"];

export type Comment = Tables["comments"]["Row"];
export type CommentInsert = Tables["comments"]["Insert"];

export type Profile = Tables["profiles"]["Row"];
export type ProfileInsert = Tables["profiles"]["Insert"];
export type ProfileUpdate = Tables["profiles"]["Update"];

export type Notification = Tables["notifications"]["Row"];

export type CommentWithProfile = Comment & {
  profiles?: Pick<Profile, "username" | "avatar_url"> | null;
};

export type SearchResult =
  | {
      type: "post";
      id: string;
      title: string | null;
    }
  | {
      type: "user";
      id: string;
      username: string | null;
      avatar_url: string | null;
    };
