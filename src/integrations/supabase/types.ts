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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          area: string | null
          city: string | null
          created_at: string
          id: string
          message: string
          municipality_user_id: string
          target_role: string | null
          title: string
        }
        Insert: {
          area?: string | null
          city?: string | null
          created_at?: string
          id?: string
          message: string
          municipality_user_id: string
          target_role?: string | null
          title: string
        }
        Update: {
          area?: string | null
          city?: string | null
          created_at?: string
          id?: string
          message?: string
          municipality_user_id?: string
          target_role?: string | null
          title?: string
        }
        Relationships: []
      }
      buildings: {
        Row: {
          address: string
          admin_user_id: string
          area: string | null
          city: string | null
          created_at: string
          id: string
          name: string
          num_households: number
          total_waste_collected: number | null
          updated_at: string
          weekly_pickup_day: string | null
        }
        Insert: {
          address: string
          admin_user_id: string
          area?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
          num_households?: number
          total_waste_collected?: number | null
          updated_at?: string
          weekly_pickup_day?: string | null
        }
        Update: {
          address?: string
          admin_user_id?: string
          area?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          num_households?: number
          total_waste_collected?: number | null
          updated_at?: string
          weekly_pickup_day?: string | null
        }
        Relationships: []
      }
      cleanup_drives: {
        Row: {
          area: string | null
          city: string
          created_at: string
          description: string | null
          drive_date: string
          id: string
          municipality_user_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          city: string
          created_at?: string
          description?: string | null
          drive_date: string
          id?: string
          municipality_user_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          city?: string
          created_at?: string
          description?: string | null
          drive_date?: string
          id?: string
          municipality_user_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      collectors: {
        Row: {
          collection_capacity: number | null
          created_at: string
          id: string
          rating: number | null
          service_area: string | null
          total_ratings: number | null
          updated_at: string
          user_id: string
          vehicle_type: string | null
        }
        Insert: {
          collection_capacity?: number | null
          created_at?: string
          id?: string
          rating?: number | null
          service_area?: string | null
          total_ratings?: number | null
          updated_at?: string
          user_id: string
          vehicle_type?: string | null
        }
        Update: {
          collection_capacity?: number | null
          created_at?: string
          id?: string
          rating?: number | null
          service_area?: string | null
          total_ratings?: number | null
          updated_at?: string
          user_id?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          reference_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          reference_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          reference_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          quantity: number
          recycler_id: string
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          quantity: number
          recycler_id: string
          status?: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          quantity?: number
          recycler_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "waste_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_type: string
          pickup_request_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_type?: string
          pickup_request_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_type?: string
          pickup_request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_requests: {
        Row: {
          actual_weight: number | null
          ai_confidence: number | null
          ai_detected_type: string | null
          ai_estimated_weight: number | null
          area: string | null
          building_id: string | null
          city: string | null
          collector_id: string | null
          created_at: string
          estimated_weight: number
          household_id: string
          id: string
          payment_amount: number | null
          photo_url: string | null
          pickup_address: string
          pickup_type: string
          preferred_time: string | null
          reward_points: number | null
          status: Database["public"]["Enums"]["pickup_status"]
          updated_at: string
          waste_type: Database["public"]["Enums"]["waste_type"]
        }
        Insert: {
          actual_weight?: number | null
          ai_confidence?: number | null
          ai_detected_type?: string | null
          ai_estimated_weight?: number | null
          area?: string | null
          building_id?: string | null
          city?: string | null
          collector_id?: string | null
          created_at?: string
          estimated_weight: number
          household_id: string
          id?: string
          payment_amount?: number | null
          photo_url?: string | null
          pickup_address: string
          pickup_type?: string
          preferred_time?: string | null
          reward_points?: number | null
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
          waste_type: Database["public"]["Enums"]["waste_type"]
        }
        Update: {
          actual_weight?: number | null
          ai_confidence?: number | null
          ai_detected_type?: string | null
          ai_estimated_weight?: number | null
          area?: string | null
          building_id?: string | null
          city?: string | null
          collector_id?: string | null
          created_at?: string
          estimated_weight?: number
          household_id?: string
          id?: string
          payment_amount?: number | null
          photo_url?: string | null
          pickup_address?: string
          pickup_type?: string
          preferred_time?: string | null
          reward_points?: number | null
          status?: Database["public"]["Enums"]["pickup_status"]
          updated_at?: string
          waste_type?: Database["public"]["Enums"]["waste_type"]
        }
        Relationships: [
          {
            foreignKeyName: "pickup_requests_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_subscriptions: {
        Row: {
          area: string | null
          city: string | null
          created_at: string
          estimated_weight: number
          frequency: string
          household_id: string
          id: string
          is_active: boolean
          last_generated_at: string | null
          pickup_address: string
          pickup_day: string
          preferred_time: string | null
          updated_at: string
          waste_types: string[]
        }
        Insert: {
          area?: string | null
          city?: string | null
          created_at?: string
          estimated_weight?: number
          frequency?: string
          household_id: string
          id?: string
          is_active?: boolean
          last_generated_at?: string | null
          pickup_address: string
          pickup_day?: string
          preferred_time?: string | null
          updated_at?: string
          waste_types: string[]
        }
        Update: {
          area?: string | null
          city?: string | null
          created_at?: string
          estimated_weight?: number
          frequency?: string
          household_id?: string
          id?: string
          is_active?: boolean
          last_generated_at?: string | null
          pickup_address?: string
          pickup_day?: string
          preferred_time?: string | null
          updated_at?: string
          waste_types?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          area: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          verified: boolean
        }
        Insert: {
          address?: string | null
          area?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          verified?: boolean
        }
        Update: {
          address?: string | null
          area?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      ratings: {
        Row: {
          collector_id: string
          comment: string | null
          created_at: string
          household_id: string
          id: string
          pickup_request_id: string
          rating: number
        }
        Insert: {
          collector_id: string
          comment?: string | null
          created_at?: string
          household_id: string
          id?: string
          pickup_request_id: string
          rating: number
        }
        Update: {
          collector_id?: string
          comment?: string | null
          created_at?: string
          household_id?: string
          id?: string
          pickup_request_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_pickup_request_id_fkey"
            columns: ["pickup_request_id"]
            isOneToOne: false
            referencedRelation: "pickup_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          points: number
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waste_inventory: {
        Row: {
          collector_id: string
          created_at: string
          id: string
          price_per_kg: number
          quantity: number
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
          waste_type: Database["public"]["Enums"]["waste_type"]
        }
        Insert: {
          collector_id: string
          created_at?: string
          id?: string
          price_per_kg: number
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          waste_type: Database["public"]["Enums"]["waste_type"]
        }
        Update: {
          collector_id?: string
          created_at?: string
          id?: string
          price_per_kg?: number
          quantity?: number
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
          waste_type?: Database["public"]["Enums"]["waste_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "household"
        | "collector"
        | "recycler"
        | "admin"
        | "municipality"
      order_status: "available" | "reserved" | "sold" | "delivered"
      pickup_status:
        | "requested"
        | "accepted"
        | "collector_en_route"
        | "collected"
        | "completed"
        | "cancelled"
      waste_type:
        | "plastic"
        | "paper"
        | "cardboard"
        | "metal"
        | "electronics"
        | "glass"
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
      app_role: ["household", "collector", "recycler", "admin", "municipality"],
      order_status: ["available", "reserved", "sold", "delivered"],
      pickup_status: [
        "requested",
        "accepted",
        "collector_en_route",
        "collected",
        "completed",
        "cancelled",
      ],
      waste_type: [
        "plastic",
        "paper",
        "cardboard",
        "metal",
        "electronics",
        "glass",
      ],
    },
  },
} as const
