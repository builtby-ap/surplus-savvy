export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          line1: string
          notes: string | null
          phone: string
          recipient: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          line1?: string
          notes?: string | null
          phone?: string
          recipient?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          line1?: string
          notes?: string | null
          phone?: string
          recipient?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          admin_note: string | null
          clicks: number
          cost: number | null
          created_at: string
          end_date: string | null
          id: string
          impressions: number
          requested_end_date: string
          requested_start_date: string
          start_date: string | null
          status: Database["public"]["Enums"]["ad_status"]
          tagline: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          admin_note?: string | null
          clicks?: number
          cost?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          impressions?: number
          requested_end_date: string
          requested_start_date: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          tagline?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          admin_note?: string | null
          clicks?: number
          cost?: number | null
          created_at?: string
          end_date?: string | null
          id?: string
          impressions?: number
          requested_end_date?: string
          requested_start_date?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["ad_status"]
          tagline?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "advertised_vendors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertisements_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advertisements_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line: string
          building_floor: string | null
          city: string
          created_at: string
          customer_id: string
          delivery_note: string | null
          id: string
          is_default: boolean
          label: string
          latitude: number | null
          longitude: number | null
          phone: string
          recipient_name: string
          township: string
          updated_at: string
        }
        Insert: {
          address_line?: string
          building_floor?: string | null
          city?: string
          created_at?: string
          customer_id: string
          delivery_note?: string | null
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string
          recipient_name?: string
          township?: string
          updated_at?: string
        }
        Update: {
          address_line?: string
          building_floor?: string | null
          city?: string
          created_at?: string
          customer_id?: string
          delivery_note?: string | null
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string
          recipient_name?: string
          township?: string
          updated_at?: string
        }
        Relationships: []
      }
      food_posts: {
        Row: {
          available_from: string
          available_until: string
          category: Database["public"]["Enums"]["bag_category"]
          created_at: string
          description: string
          discounted_price: number
          fulfillment: Database["public"]["Enums"]["fulfillment_type"]
          id: string
          image_url: string | null
          is_available: boolean
          legacy_id: string | null
          original_price: number
          pickup_instructions: string
          quantity_left: number
          rating: number
          title: string
          total_quantity: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          available_from?: string
          available_until?: string
          category?: Database["public"]["Enums"]["bag_category"]
          created_at?: string
          description?: string
          discounted_price?: number
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          image_url?: string | null
          is_available?: boolean
          legacy_id?: string | null
          original_price?: number
          pickup_instructions?: string
          quantity_left?: number
          rating?: number
          title: string
          total_quantity?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          available_from?: string
          available_until?: string
          category?: Database["public"]["Enums"]["bag_category"]
          created_at?: string
          description?: string
          discounted_price?: number
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          image_url?: string | null
          is_available?: boolean
          legacy_id?: string | null
          original_price?: number
          pickup_instructions?: string
          quantity_left?: number
          rating?: number
          title?: string
          total_quantity?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_posts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "advertised_vendors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_posts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_posts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          food_post_id: string | null
          id: string
          order_id: string
          original_price: number
          quantity: number
          title: string
          unit_price: number
          vendor_id: string
        }
        Insert: {
          created_at?: string
          food_post_id?: string | null
          id?: string
          order_id: string
          original_price?: number
          quantity?: number
          title: string
          unit_price?: number
          vendor_id: string
        }
        Update: {
          created_at?: string
          food_post_id?: string | null
          id?: string
          order_id?: string
          original_price?: number
          quantity?: number
          title?: string
          unit_price?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_food_post_id_fkey"
            columns: ["food_post_id"]
            isOneToOne: false
            referencedRelation: "food_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "advertised_vendors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          customer_id: string
          delivery_address: string | null
          delivery_address_id: string | null
          delivery_building_floor: string | null
          delivery_city: string | null
          delivery_fee: number
          delivery_latitude: number | null
          delivery_longitude: number | null
          delivery_method: Database["public"]["Enums"]["order_method"]
          delivery_note: string | null
          delivery_phone: string | null
          delivery_recipient_name: string | null
          delivery_township: string | null
          discount: number
          id: string
          item_price: number
          method: Database["public"]["Enums"]["order_method"]
          notes: string
          original_price: number
          payment_rejection_reason: string | null
          payment_screenshot_url: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_verified_at: string | null
          payment_verified_by: string | null
          pickup_window: string | null
          placed_at: string
          receipt_number: string
          reward_code: string | null
          reward_discount: number
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          customer_id: string
          delivery_address?: string | null
          delivery_address_id?: string | null
          delivery_building_floor?: string | null
          delivery_city?: string | null
          delivery_fee?: number
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_method?: Database["public"]["Enums"]["order_method"]
          delivery_note?: string | null
          delivery_phone?: string | null
          delivery_recipient_name?: string | null
          delivery_township?: string | null
          discount?: number
          id?: string
          item_price?: number
          method?: Database["public"]["Enums"]["order_method"]
          notes?: string
          original_price?: number
          payment_rejection_reason?: string | null
          payment_screenshot_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          pickup_window?: string | null
          placed_at?: string
          receipt_number: string
          reward_code?: string | null
          reward_discount?: number
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          customer_id?: string
          delivery_address?: string | null
          delivery_address_id?: string | null
          delivery_building_floor?: string | null
          delivery_city?: string | null
          delivery_fee?: number
          delivery_latitude?: number | null
          delivery_longitude?: number | null
          delivery_method?: Database["public"]["Enums"]["order_method"]
          delivery_note?: string | null
          delivery_phone?: string | null
          delivery_recipient_name?: string | null
          delivery_township?: string | null
          discount?: number
          id?: string
          item_price?: number
          method?: Database["public"]["Enums"]["order_method"]
          notes?: string
          original_price?: number
          payment_rejection_reason?: string | null
          payment_screenshot_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          pickup_window?: string | null
          placed_at?: string
          receipt_number?: string
          reward_code?: string | null
          reward_discount?: number
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_delivery_address_id_fkey"
            columns: ["delivery_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "advertised_vendors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          account_name: string
          created_at: string
          id: string
          instructions: string
          qr_image_url: string
          updated_at: string
        }
        Insert: {
          account_name?: string
          created_at?: string
          id?: string
          instructions?: string
          qr_image_url?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          created_at?: string
          id?: string
          instructions?: string
          qr_image_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          kind: string
          order_id: string | null
          points: number
          reason: string
          ref: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          kind: string
          order_id?: string | null
          points: number
          reason: string
          ref: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          kind?: string
          order_id?: string | null
          points?: number
          reason?: string
          ref?: string
        }
        Relationships: []
      }
      points_settings: {
        Row: {
          bags_10_bonus: number
          bags_5_bonus: number
          first_order_bonus: number
          id: boolean
          points_per_1000_mmk: number
          review_points: number
          updated_at: string
        }
        Insert: {
          bags_10_bonus?: number
          bags_5_bonus?: number
          first_order_bonus?: number
          id?: boolean
          points_per_1000_mmk?: number
          review_points?: number
          updated_at?: string
        }
        Update: {
          bags_10_bonus?: number
          bags_5_bonus?: number
          first_order_bonus?: number
          id?: boolean
          points_per_1000_mmk?: number
          review_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }
      review_helpful: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          review_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string
          id?: string
          review_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_photos: {
        Row: {
          created_at: string
          id: string
          image_url: string
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          id: string
          reason: string
          resolved_at: string | null
          review_id: string
          status: string
        }
        Insert: {
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          reason: string
          resolved_at?: string | null
          review_id: string
          status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          reason?: string
          resolved_at?: string | null
          review_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          bag_title: string | null
          created_at: string
          customer_id: string
          food_quality_rating: number | null
          id: string
          order_id: string
          overall_rating: number
          portion_rating: number | null
          review_text: string
          reviewer_name: string
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          value_rating: number | null
          vendor_id: string
        }
        Insert: {
          bag_title?: string | null
          created_at?: string
          customer_id?: string
          food_quality_rating?: number | null
          id?: string
          order_id: string
          overall_rating: number
          portion_rating?: number | null
          review_text?: string
          reviewer_name?: string
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          value_rating?: number | null
          vendor_id: string
        }
        Update: {
          bag_title?: string | null
          created_at?: string
          customer_id?: string
          food_quality_rating?: number | null
          id?: string
          order_id?: string
          overall_rating?: number
          portion_rating?: number | null
          review_text?: string
          reviewer_name?: string
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          value_rating?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "advertised_vendors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          code: string
          created_at: string
          customer_id: string
          id: string
          points_spent: number
          reward_id: string
          reward_title: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          customer_id: string
          id?: string
          points_spent: number
          reward_id: string
          reward_title: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          customer_id?: string
          id?: string
          points_spent?: number
          reward_id?: string
          reward_title?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string
          discount_mmk: number
          id: string
          is_active: boolean
          points_cost: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          discount_mmk?: number
          id?: string
          is_active?: boolean
          points_cost: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          discount_mmk?: number
          id?: string
          is_active?: boolean
          points_cost?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          marketing_emails: boolean
          new_posts_nearby: boolean
          order_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          marketing_emails?: boolean
          new_posts_nearby?: boolean
          order_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          marketing_emails?: boolean
          new_posts_nearby?: boolean
          order_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          ad_priority: number
          ad_tagline: string | null
          address: string
          business_license_name: string | null
          business_license_url: string | null
          city: string
          created_at: string
          delivery_fee: number
          delivery_minimum: number
          description: string
          display_alias: string | null
          email: string | null
          fda_approval_name: string | null
          fda_approval_url: string | null
          fulfillment: Database["public"]["Enums"]["fulfillment_type"]
          id: string
          image_url: string | null
          is_advertised: boolean
          latitude: number | null
          legacy_id: string | null
          logo_initials: string
          longitude: number | null
          meals_rescued: number
          name: string
          neighborhood: string
          owner_id: string | null
          phone: string | null
          rating: number
          rejection_reason: string | null
          review_count: number
          type: Database["public"]["Enums"]["business_type"]
          updated_at: string
          verification_status: Database["public"]["Enums"]["vendor_status"]
          verified: boolean
        }
        Insert: {
          ad_priority?: number
          ad_tagline?: string | null
          address?: string
          business_license_name?: string | null
          business_license_url?: string | null
          city?: string
          created_at?: string
          delivery_fee?: number
          delivery_minimum?: number
          description?: string
          display_alias?: string | null
          email?: string | null
          fda_approval_name?: string | null
          fda_approval_url?: string | null
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          image_url?: string | null
          is_advertised?: boolean
          latitude?: number | null
          legacy_id?: string | null
          logo_initials?: string
          longitude?: number | null
          meals_rescued?: number
          name: string
          neighborhood?: string
          owner_id?: string | null
          phone?: string | null
          rating?: number
          rejection_reason?: string | null
          review_count?: number
          type?: Database["public"]["Enums"]["business_type"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["vendor_status"]
          verified?: boolean
        }
        Update: {
          ad_priority?: number
          ad_tagline?: string | null
          address?: string
          business_license_name?: string | null
          business_license_url?: string | null
          city?: string
          created_at?: string
          delivery_fee?: number
          delivery_minimum?: number
          description?: string
          display_alias?: string | null
          email?: string | null
          fda_approval_name?: string | null
          fda_approval_url?: string | null
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"]
          id?: string
          image_url?: string | null
          is_advertised?: boolean
          latitude?: number | null
          legacy_id?: string | null
          logo_initials?: string
          longitude?: number | null
          meals_rescued?: number
          name?: string
          neighborhood?: string
          owner_id?: string | null
          phone?: string | null
          rating?: number
          rejection_reason?: string | null
          review_count?: number
          type?: Database["public"]["Enums"]["business_type"]
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["vendor_status"]
          verified?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      advertised_vendors_public: {
        Row: {
          ad_priority: number | null
          city: string | null
          id: string | null
          image_url: string | null
          logo_initials: string | null
          name: string | null
          neighborhood: string | null
          tagline: string | null
          type: Database["public"]["Enums"]["business_type"] | null
        }
        Insert: {
          ad_priority?: number | null
          city?: string | null
          id?: string | null
          image_url?: string | null
          logo_initials?: string | null
          name?: string | null
          neighborhood?: string | null
          tagline?: string | null
          type?: Database["public"]["Enums"]["business_type"] | null
        }
        Update: {
          ad_priority?: number | null
          city?: string | null
          id?: string | null
          image_url?: string | null
          logo_initials?: string | null
          name?: string | null
          neighborhood?: string | null
          tagline?: string | null
          type?: Database["public"]["Enums"]["business_type"] | null
        }
        Relationships: []
      }
      vendors_public: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          delivery_fee: number | null
          delivery_minimum: number | null
          description: string | null
          display_alias: string | null
          fulfillment: Database["public"]["Enums"]["fulfillment_type"] | null
          id: string | null
          image_url: string | null
          latitude: number | null
          legacy_id: string | null
          longitude: number | null
          meals_rescued: number | null
          name: string | null
          neighborhood: string | null
          phone: string | null
          rating: number | null
          review_count: number | null
          type: Database["public"]["Enums"]["business_type"] | null
          verification_status:
            | Database["public"]["Enums"]["vendor_status"]
            | null
          verified: boolean | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          delivery_fee?: number | null
          delivery_minimum?: number | null
          description?: string | null
          display_alias?: string | null
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"] | null
          id?: string | null
          image_url?: string | null
          latitude?: number | null
          legacy_id?: string | null
          longitude?: number | null
          meals_rescued?: number | null
          name?: string | null
          neighborhood?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          type?: Database["public"]["Enums"]["business_type"] | null
          verification_status?:
            | Database["public"]["Enums"]["vendor_status"]
            | null
          verified?: boolean | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          delivery_fee?: number | null
          delivery_minimum?: number | null
          description?: string | null
          display_alias?: string | null
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"] | null
          id?: string | null
          image_url?: string | null
          latitude?: number | null
          legacy_id?: string | null
          longitude?: number | null
          meals_rescued?: number | null
          name?: string | null
          neighborhood?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          type?: Database["public"]["Enums"]["business_type"] | null
          verification_status?:
            | Database["public"]["Enums"]["vendor_status"]
            | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      alias_label: {
        Args: { _type: Database["public"]["Enums"]["business_type"] }
        Returns: string
      }
      expire_food_posts: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_vendor: {
        Args: { _user_id: string; _vendor_id: string }
        Returns: boolean
      }
      redeem_reward: { Args: { _reward_id: string }; Returns: string }
      resubmit_payment: {
        Args: { order_id: string; screenshot_url: string }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "suspended"
      ad_status: "pending" | "active" | "rejected" | "expired"
      app_role: "customer" | "food_vendor" | "admin"
      bag_category:
        | "mixed_meals"
        | "bakery"
        | "grocery"
        | "produce"
        | "snacks"
        | "beverages"
        | "desserts"
      business_type:
        | "restaurant"
        | "cafe"
        | "bakery"
        | "grocery"
        | "fresh_market"
        | "snack_shop"
        | "convenience"
        | "producer"
      fulfillment_type: "pickup" | "delivery" | "both"
      order_method: "pickup" | "delivery"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "out_for_delivery"
        | "picked_up"
        | "delivered"
        | "cancelled"
        | "rejected"
      payment_status:
        | "not_required"
        | "awaiting_verification"
        | "verified"
        | "rejected"
      review_status: "published" | "reported" | "hidden" | "removed"
      vendor_status: "pending" | "approved" | "rejected" | "deactivated"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "suspended"],
      ad_status: ["pending", "active", "rejected", "expired"],
      app_role: ["customer", "food_vendor", "admin"],
      bag_category: [
        "mixed_meals",
        "bakery",
        "grocery",
        "produce",
        "snacks",
        "beverages",
        "desserts",
      ],
      business_type: [
        "restaurant",
        "cafe",
        "bakery",
        "grocery",
        "fresh_market",
        "snack_shop",
        "convenience",
        "producer",
      ],
      fulfillment_type: ["pickup", "delivery", "both"],
      order_method: ["pickup", "delivery"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "out_for_delivery",
        "picked_up",
        "delivered",
        "cancelled",
        "rejected",
      ],
      payment_status: [
        "not_required",
        "awaiting_verification",
        "verified",
        "rejected",
      ],
      review_status: ["published", "reported", "hidden", "removed"],
      vendor_status: ["pending", "approved", "rejected", "deactivated"],
    },
  },
} as const
