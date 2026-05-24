export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      likes: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          actor_id: string | null;
          comment_id: string | null;
          created_at: string;
          id: string;
          message: string | null;
          post_id: string | null;
          read: boolean;
          type: "like_post" | "like_comment" | "comment" | "reply" | string;
          user_id: string | null;
        };
        Insert: {
          actor_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          message?: string | null;
          post_id?: string | null;
          read?: boolean;
          type: "like_post" | "like_comment" | "comment" | "reply" | string;
          user_id?: string | null;
        };
        Update: {
          actor_id?: string | null;
          comment_id?: string | null;
          created_at?: string;
          id?: string;
          message?: string | null;
          post_id?: string | null;
          read?: boolean;
          type?: "like_post" | "like_comment" | "comment" | "reply" | string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "notifications_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          content: string;
          created_at: string;
          doc_url: string | null;
          docx_path: string | null;
          docx_url: string | null;
          file_hash: string | null;
          genre: string | null;
          id: string;
          text_type: string | null;
          title: string;
          updated_at: string | null;
          user_id: string;
          uses_ai: boolean | null;
          version: number | null;
        };
        Insert: {
          content: string;
          created_at?: string;
          doc_url?: string | null;
          docx_path?: string | null;
          docx_url?: string | null;
          file_hash?: string | null;
          genre?: string | null;
          id?: string;
          text_type?: string | null;
          title: string;
          updated_at?: string | null;
          user_id: string;
          uses_ai?: boolean | null;
          version?: number | null;
        };
        Update: {
          content?: string;
          created_at?: string;
          doc_url?: string | null;
          docx_path?: string | null;
          docx_url?: string | null;
          file_hash?: string | null;
          genre?: string | null;
          id?: string;
          text_type?: string | null;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
          uses_ai?: boolean | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
profiles: {
          Row: {
            avatar_url: string | null;
            bio: string | null;
            created_at: string | null;
            id: string;
            role: string | null;
            updated_at: string | null;
            user_id: string;
            username: string | null;
            first_name: string | null;
            last_name: string | null;
            nickname: string | null;
            gender: string | null;
            age: number | null;
            city: string | null;
            country: string | null;
            phone: string | null;
            vehicle: string | null;
            awards: string | null;
            posts_count: number;
            followers_count: number;
            following_count: number;
            likes_count: number;
            comments_count: number;
            preferences: string[] | null;
          };
Insert: {
            avatar_url?: string | null;
            bio?: string | null;
            created_at?: string | null;
            id?: string;
            role?: string | null;
            updated_at?: string | null;
            user_id: string;
            username?: string | null;
            first_name?: string | null;
            last_name?: string | null;
            nickname?: string | null;
            gender?: string | null;
            age?: number | null;
            city?: string | null;
            country?: string | null;
            phone?: string | null;
            vehicle?: string | null;
            awards?: string | null;
            posts_count?: number;
            followers_count?: number;
            following_count?: number;
            likes_count?: number;
            comments_count?: number;
            preferences?: string[] | null;
          };
Update: {
            avatar_url?: string | null;
            bio?: string | null;
            created_at?: string | null;
            id?: string;
            role?: string | null;
            updated_at?: string | null;
            user_id?: string;
            username?: string | null;
            first_name?: string | null;
            last_name?: string | null;
            nickname?: string | null;
            gender?: string | null;
            age?: number | null;
            city?: string | null;
            country?: string | null;
            phone?: string | null;
            vehicle?: string | null;
            awards?: string | null;
            posts_count?: number;
            followers_count?: number;
            following_count?: number;
            likes_count?: number;
            comments_count?: number;
            preferences?: string[] | null;
          };
         Relationships: [];
       };
       follows: {
          Row: {
            id: string;
            follower_id: string;
            following_id: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            follower_id: string;
            following_id: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            follower_id?: string;
            following_id?: string;
            created_at?: string;
          };
          Relationships: [
            {
              foreignKeyName: "follows_follower_id_fkey";
              columns: ["follower_id"];
              isOneToOne: false;
              referencedRelation: "profiles";
              referencedColumns: ["user_id"];
            },
            {
              foreignKeyName: "follows_following_id_fkey";
              columns: ["following_id"];
              isOneToOne: false;
              referencedRelation: "profiles";
              referencedColumns: ["user_id"];
            },
          ];
        };
       annotations: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          content_type: string;
          content: string;
          start_offset: number;
          end_offset: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          content_type: string;
          content: string;
          start_offset: number;
          end_offset: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          content_type?: string;
          content?: string;
          start_offset?: number;
          end_offset?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "annotations_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "annotations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};