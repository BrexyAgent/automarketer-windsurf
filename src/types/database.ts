export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          plan: "free" | "pro" | "agency";
          owner_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: "free" | "pro" | "agency";
          owner_id?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          plan?: "free" | "pro" | "agency";
          owner_id?: string | null;
        };
      };
      organization_members: {
        Row: {
          organization_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          organization_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          role?: "owner" | "admin" | "member";
        };
      };
      organization_credentials: {
        Row: {
          id: string;
          organization_id: string;
          service: string;
          encrypted_value: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          service: string;
          encrypted_value: string;
          created_at?: string;
        };
        Update: {
          encrypted_value?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          industry: string | null;
          website: string | null;
          products: string | null;
          target_audience: string | null;
          platforms: string[];
          content_pillars: string[];
          notification_email: string | null;
          telegram_chat_id: string | null;
          whatsapp_number: string | null;
          auto_approve_hours: number;
          is_active: boolean;
          faqs: string | null;
          keywords: string | null;
          avoid: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          industry?: string | null;
          website?: string | null;
          products?: string | null;
          target_audience?: string | null;
          platforms?: string[];
          content_pillars?: string[];
          notification_email?: string | null;
          telegram_chat_id?: string | null;
          whatsapp_number?: string | null;
          auto_approve_hours?: number;
          is_active?: boolean;
          faqs?: string | null;
          keywords?: string | null;
          avoid?: string | null;
        };
        Update: {
          name?: string;
          industry?: string | null;
          website?: string | null;
          products?: string | null;
          target_audience?: string | null;
          platforms?: string[];
          content_pillars?: string[];
          notification_email?: string | null;
          telegram_chat_id?: string | null;
          whatsapp_number?: string | null;
          auto_approve_hours?: number;
          is_active?: boolean;
          faqs?: string | null;
          keywords?: string | null;
          avoid?: string | null;
        };
      };
      brand_intelligence: {
        Row: {
          id: string;
          organization_id: string;
          brand_id: string;
          voice_profile: string | null;
          competitor_analysis: string | null;
          strategy: string | null;
          keywords: string[];
          hashtag_banks: Record<string, unknown>;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          brand_id: string;
          voice_profile?: string | null;
          competitor_analysis?: string | null;
          strategy?: string | null;
          keywords?: string[];
          hashtag_banks?: Record<string, unknown>;
          completed_at?: string | null;
        };
        Update: {
          voice_profile?: string | null;
          competitor_analysis?: string | null;
          strategy?: string | null;
          keywords?: string[];
          hashtag_banks?: Record<string, unknown>;
          completed_at?: string | null;
        };
      };
      posts: {
        Row: {
          id: string;
          organization_id: string;
          brand_id: string;
          platform: string;
          content: string;
          hashtags: string[];
          image_url: string | null;
          image_prompt: string | null;
          content_pillar: string | null;
          best_time: string | null;
          status: "draft" | "pending_approval" | "approved" | "auto_approved" | "rejected" | "published" | "scheduled";
          approval_deadline: string | null;
          scheduled_at: string | null;
          published_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
          author: string;
          likes: number;
          comments: number;
          shares: number;
          reach: number;
          engagement_rate: number;
          platform_post_id: string | null;
          publish_error: string | null;
          is_thread: boolean;
          thread_tweets: Record<string, unknown>[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          brand_id: string;
          platform: string;
          content?: string;
          hashtags?: string[];
          image_url?: string | null;
          image_prompt?: string | null;
          content_pillar?: string | null;
          best_time?: string | null;
          status?: "draft" | "pending_approval" | "approved" | "auto_approved" | "rejected" | "published" | "scheduled";
          approval_deadline?: string | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          author?: string;
          likes?: number;
          comments?: number;
          shares?: number;
          reach?: number;
          engagement_rate?: number;
          platform_post_id?: string | null;
          publish_error?: string | null;
          is_thread?: boolean;
          thread_tweets?: Record<string, unknown>[];
        };
        Update: {
          content?: string;
          hashtags?: string[];
          image_url?: string | null;
          image_prompt?: string | null;
          content_pillar?: string | null;
          best_time?: string | null;
          status?: "draft" | "pending_approval" | "approved" | "auto_approved" | "rejected" | "published" | "scheduled";
          approval_deadline?: string | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          likes?: number;
          comments?: number;
          shares?: number;
          reach?: number;
          engagement_rate?: number;
          platform_post_id?: string | null;
          publish_error?: string | null;
          is_thread?: boolean;
          thread_tweets?: Record<string, unknown>[];
        };
      };
      weekly_reports: {
        Row: {
          id: string;
          organization_id: string;
          brand_id: string;
          week_start: string;
          week_end: string;
          report_text: string | null;
          total_posts: number;
          avg_engagement: number;
          best_platform: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          brand_id: string;
          week_start: string;
          week_end: string;
          report_text?: string | null;
          total_posts?: number;
          avg_engagement?: number;
          best_platform?: string | null;
          sent_at?: string | null;
        };
        Update: {
          report_text?: string | null;
          total_posts?: number;
          avg_engagement?: number;
          best_platform?: string | null;
          sent_at?: string | null;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          organization_id: string;
          brand_id: string | null;
          title: string;
          content: string;
          primary_keyword: string | null;
          keywords: Record<string, unknown>[];
          word_count: number;
          source: "claude" | "n8n";
          infographic_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          brand_id?: string | null;
          title: string;
          content: string;
          primary_keyword?: string | null;
          keywords?: Record<string, unknown>[];
          word_count?: number;
          source?: "claude" | "n8n";
          infographic_url?: string | null;
        };
        Update: {
          title?: string;
          content?: string;
          primary_keyword?: string | null;
          keywords?: Record<string, unknown>[];
          word_count?: number;
          infographic_url?: string | null;
        };
      };
      notification_settings: {
        Row: {
          id: string;
          organization_id: string;
          brand_id: string | null;
          telegram_enabled: boolean;
          whatsapp_enabled: boolean;
          slack_enabled: boolean;
          email_enabled: boolean;
          slack_webhook_url: string | null;
          weekly_report_day: number;
        };
        Insert: {
          id?: string;
          organization_id: string;
          brand_id?: string | null;
          telegram_enabled?: boolean;
          whatsapp_enabled?: boolean;
          slack_enabled?: boolean;
          email_enabled?: boolean;
          slack_webhook_url?: string | null;
          weekly_report_day?: number;
        };
        Update: {
          telegram_enabled?: boolean;
          whatsapp_enabled?: boolean;
          slack_enabled?: boolean;
          email_enabled?: boolean;
          slack_webhook_url?: string | null;
          weekly_report_day?: number;
        };
      };
    };
  };
};
