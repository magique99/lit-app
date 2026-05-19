export type Post = {
  id: string;
  title: string;
  content: string | null;
  user_id: string;
  created_at: string;
  updated_at?: string | null;
  file_hash?: string | null;
  version?: number | null;
  doc_url?: string | null;
};

export type Like = {
  id: string;
  post_id: string;
  user_id?: string | null;
  created_at?: string | null;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type Profile = {
  id?: string;
  user_id: string;
  username: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
};

export type CommentWithProfile = Comment & {
  profiles?: Pick<Profile, "username" | "avatar_url"> | null;
};

export type Notification = {
  id: string;
  read: boolean;
  created_at: string;
  message?: string | null;
  type?: string | null;
  post_id?: string | null;
  actor_id?: string | null;
  user_id?: string | null;
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
