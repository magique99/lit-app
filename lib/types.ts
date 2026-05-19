import type { Database } from "@/lib/database.types";

type Tables = Database["public"]["Tables"];

export type Post = Tables["posts"]["Row"];
export type PostInsert = Tables["posts"]["Insert"];
export type PostUpdate = Tables["posts"]["Update"];

export type Like = Tables["likes"]["Row"];
export type LikeInsert = Tables["likes"]["Insert"];

export type Comment = Tables["comments"]["Row"];
export type CommentInsert = Tables["comments"]["Insert"];

export type UserRole = "owner" | "administrator" | "user";

type ProfileRow = Tables["profiles"]["Row"];

export type Profile = Omit<ProfileRow, "role"> & {
  role?: UserRole | null;
};
export type ProfileInsert = Omit<Tables["profiles"]["Insert"], "role"> & {
  role?: UserRole | null;
};
export type ProfileUpdate = Omit<Tables["profiles"]["Update"], "role"> & {
  role?: UserRole | null;
};

export function toProfile(dbProfile: ProfileRow | null): Profile | null {
  if (!dbProfile) return null;
  return {
    ...dbProfile,
    role: dbProfile.role as UserRole | null,
  };
}

export type Notification = Tables["notifications"]["Row"];

export type CommentWithProfile = Comment & {
  profiles?: Pick<Profile, "username" | "avatar_url"> | null;
};

export type AnnotationType = "comment" | "note";

export type Annotation = {
  id: string;
  post_id: string;
  user_id: string;
  content_type: AnnotationType;
  content: string;
  start_offset: number;
  end_offset: number;
  created_at: string;
  updated_at: string;
  profiles?: Pick<Profile, "username" | "avatar_url"> | null;
};

export type AnnotationInsert = {
  post_id: string;
  user_id: string;
  content_type: AnnotationType;
  content: string;
  start_offset: number;
  end_offset: number;
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