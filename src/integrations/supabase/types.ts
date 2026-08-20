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
    PostgrestVersion: "14.15"
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
          delivery_fee: number
          discount: number
          id: string
          item_price: number
          method: Database["public"]["Enums"]["order_method"]
          notes: string
          original_price: number
          pickup_window: string | null
          placed_at: string
          receipt_number: string
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          customer_id: string
          delivery_address?: string | null
          delivery_fee?: number
          discount?: number
          id?: string
          item_price?: number
          method?: Database["public"]["Enums"]["order_method"]
          notes?: string
          original_price?: number
          pickup_window?: string | null
          placed_at?: string
          receipt_number: string
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          customer_id?: string
          delivery_address?: string | null
          delivery_fee?: number
          discount?: number
          id?: string
          item_price?: number
          method?: Database["public"]["Enums"]["order_method"]
          notes?: string
          original_price?: number
          pickup_window?: string | null
          placed_at?: string
          receipt_number?: string
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
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
          latitude: number | null
          legacy_id: string | null
          longitude: number | null
          meals_rescued: number | null
          neighborhood: string | null
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
          latitude?: number | null
          legacy_id?: string | null
          longitude?: number | null
          meals_rescued?: number | null
          neighborhood?: string | null
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
          latitude?: number | null
          legacy_id?: string | null
          longitude?: number | null
          meals_rescued?: number | null
          neighborhood?: string | null
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
    }
    Enums: {
      account_status: "active" | "suspended"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      vendor_status: ["pending", "approved", "rejected", "deactivated"],
    },
  },
} as const
