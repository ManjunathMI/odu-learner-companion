// Hand-written types matching phase1-schema.sql.
// Replace with: npx supabase gen types typescript --project-id <id> > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      learning_paths: {
        Row: { id: string; title: string; description: string | null; tags: string[] | null; created_by: string; visibility: 'public' | 'private'; wall_status: 'pending_review' | 'approved' | 'rejected' | 'unlisted'; created_at: string; updated_at: string };
        Insert: { title: string; description?: string | null; tags?: string[] | null; created_by: string; visibility?: 'public' | 'private'; wall_status?: 'pending_review' | 'approved' | 'rejected' | 'unlisted' };
        Update: { title?: string; description?: string | null; tags?: string[] | null; visibility?: 'public' | 'private'; wall_status?: 'pending_review' | 'approved' | 'rejected' | 'unlisted'; updated_at?: string };
        Relationships: [];
      };
      path_memberships: {
        Row: { id: string; user_id: string; path_id: string; role: 'admin' | 'moderator' | 'learner'; status: 'pending' | 'approved' | 'rejected'; joined_at: string; decided_at: string | null };
        Insert: { user_id: string; path_id: string; role?: 'admin' | 'moderator' | 'learner'; status?: 'pending' | 'approved' | 'rejected'; decided_at?: string | null };
        Update: { role?: 'admin' | 'moderator' | 'learner'; status?: 'pending' | 'approved' | 'rejected'; decided_at?: string | null };
        Relationships: [];
      };
      platform_admins: {
        Row: { user_id: string };
        Insert: { user_id: string };
        Update: { user_id?: string };
        Relationships: [];
      };
      profiles: {
        Row: { user_id: string; display_name: string; avatar_url: string | null; bio: string | null; social_links: Json; repo_links: Json; profile_visibility: 'joined_paths_only' | 'public'; updated_at: string };
        Insert: { user_id: string; display_name: string; avatar_url?: string | null; bio?: string | null; social_links?: Json; repo_links?: Json; profile_visibility?: 'joined_paths_only' | 'public' };
        Update: { display_name?: string; avatar_url?: string | null; bio?: string | null; social_links?: Json; repo_links?: Json; profile_visibility?: 'joined_paths_only' | 'public'; updated_at?: string };
        Relationships: [];
      };
      phases: {
        Row: { id: string; path_id: string; title: string; goal: string | null; sort_order: number };
        Insert: { path_id: string; title: string; goal?: string | null; sort_order?: number };
        Update: { title?: string; goal?: string | null; sort_order?: number };
        Relationships: [];
      };
      days: {
        Row: { id: string; phase_id: string; day_label: string; title: string; hours: string | null; sort_order: number };
        Insert: { phase_id: string; day_label: string; title: string; hours?: string | null; sort_order?: number };
        Update: { day_label?: string; title?: string; hours?: string | null; sort_order?: number };
        Relationships: [];
      };
      lesson_items: {
        Row: { id: string; day_id: string; title: string; url: string; tag: 'hands' | 'exam' | null; sort_order: number };
        Insert: { day_id: string; title: string; url: string; tag?: 'hands' | 'exam' | null; sort_order?: number };
        Update: { title?: string; url?: string; tag?: 'hands' | 'exam' | null; sort_order?: number };
        Relationships: [];
      };
      progress: {
        Row: { id: string; user_id: string; path_id: string; item_key: string; done: boolean; updated_at: string };
        Insert: { user_id: string; path_id: string; item_key: string; done?: boolean };
        Update: { done?: boolean; updated_at?: string };
        Relationships: [];
      };
      notes: {
        Row: { id: string; path_id: string; item_key: string; user_id: string; note_text: string; created_at: string };
        Insert: { path_id: string; item_key: string; user_id: string; note_text: string };
        Update: never;
        Relationships: [];
      };
      feedback: {
        Row: { id: string; path_id: string | null; user_id: string | null; message: string; created_at: string };
        Insert: { path_id?: string | null; user_id?: string | null; message: string };
        Update: never;
        Relationships: [];
      };
      badge_definitions: {
        Row: { id: string; path_id: string | null; name: string; description: string | null; icon: string | null; criteria_type: 'automatic' | 'manual'; automatic_rule: Json | null };
        Insert: { path_id?: string | null; name: string; description?: string | null; icon?: string | null; criteria_type: 'automatic' | 'manual'; automatic_rule?: Json | null };
        Update: { path_id?: string | null; name?: string; description?: string | null; icon?: string | null; criteria_type?: 'automatic' | 'manual'; automatic_rule?: Json | null };
        Relationships: [];
      };
      badge_awards: {
        Row: { id: string; user_id: string; badge_id: string; awarded_by: string | null; awarded_at: string };
        Insert: { user_id: string; badge_id: string; awarded_by?: string | null };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_role: { Args: { p_path_id: string }; Returns: 'admin' | 'moderator' | 'learner' | null };
      is_path_admin: { Args: { p_path_id: string }; Returns: boolean };
      is_moderator_or_above: { Args: { p_path_id: string }; Returns: boolean };
      is_approved_member: { Args: { p_path_id: string }; Returns: boolean };
      is_platform_admin: { Args: Record<never, never>; Returns: boolean };
      path_is_public: { Args: { p_path_id: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
