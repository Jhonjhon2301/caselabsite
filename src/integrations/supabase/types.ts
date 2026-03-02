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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          coupon_code: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          items: Json
          last_recovery_at: string | null
          recovered_at: string | null
          recovery_attempts: number
          recovery_status: string
          session_id: string | null
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          last_recovery_at?: string | null
          recovered_at?: string | null
          recovery_attempts?: number
          recovery_status?: string
          session_id?: string | null
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          last_recovery_at?: string | null
          recovered_at?: string | null
          recovery_attempts?: number
          recovery_status?: string
          session_id?: string | null
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_email: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          color: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          content?: string
          created_at?: string
          created_by: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      b2b_customers: {
        Row: {
          cnpj: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          discount_percent: number
          id: string
          is_approved: boolean
          min_order_quantity: number
          notes: string | null
          pricing_tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cnpj?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          discount_percent?: number
          id?: string
          is_approved?: boolean
          min_order_quantity?: number
          notes?: string | null
          pricing_tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cnpj?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          discount_percent?: number
          id?: string
          is_approved?: boolean
          min_order_quantity?: number
          notes?: string | null
          pricing_tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      b2b_quotes: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          b2b_customer_id: string
          created_at: string
          discount: number
          id: string
          items: Json
          notes: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          b2b_customer_id: string
          created_at?: string
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          b2b_customer_id?: string
          created_at?: string
          discount?: number
          id?: string
          items?: Json
          notes?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "b2b_quotes_b2b_customer_id_fkey"
            columns: ["b2b_customer_id"]
            isOneToOne: false
            referencedRelation: "b2b_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string | null
          content: string
          cover_image: string | null
          created_at: string
          created_by: string
          excerpt: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          created_by: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_value: number | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
        }
        Relationships: []
      }
      custom_positions: {
        Row: {
          created_at: string
          id: string
          label: string
          name: string
          permissions: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          name: string
          permissions?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          name?: string
          permissions?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      designer_files: {
        Row: {
          created_at: string
          created_by: string
          file_size: number | null
          folder_id: string | null
          id: string
          mime_type: string | null
          name: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          created_by: string
          file_size?: number | null
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name: string
          storage_path: string
        }
        Update: {
          created_at?: string
          created_by?: string
          file_size?: number | null
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "designer_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "designer_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      designer_folders: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "designer_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "designer_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          expense_date: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by: string
          description: string
          due_date?: string | null
          expense_date?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          expense_date?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      fiscal_notes: {
        Row: {
          access_key: string | null
          cancel_xml_url: string | null
          created_at: string
          created_by: string
          customer_cpf: string | null
          customer_email: string | null
          customer_name: string | null
          error_message: string | null
          focus_id: string | null
          focus_ref: string | null
          id: string
          items: Json
          notes: string | null
          number: string | null
          order_id: string | null
          pdf_url: string | null
          series: string | null
          status: string
          total: number
          type: string
          updated_at: string
          xml_url: string | null
        }
        Insert: {
          access_key?: string | null
          cancel_xml_url?: string | null
          created_at?: string
          created_by: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string | null
          error_message?: string | null
          focus_id?: string | null
          focus_ref?: string | null
          id?: string
          items?: Json
          notes?: string | null
          number?: string | null
          order_id?: string | null
          pdf_url?: string | null
          series?: string | null
          status?: string
          total?: number
          type?: string
          updated_at?: string
          xml_url?: string | null
        }
        Update: {
          access_key?: string | null
          cancel_xml_url?: string | null
          created_at?: string
          created_by?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string | null
          error_message?: string | null
          focus_id?: string | null
          focus_ref?: string | null
          id?: string
          items?: Json
          notes?: string | null
          number?: string | null
          order_id?: string | null
          pdf_url?: string | null
          series?: string | null
          status?: string
          total?: number
          type?: string
          updated_at?: string
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      fixed_expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          created_by: string
          day_of_month: number | null
          description: string
          id: string
          is_active: boolean
          recurrence: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by: string
          day_of_month?: number | null
          description: string
          id?: string
          is_active?: boolean
          recurrence?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          created_by?: string
          day_of_month?: number | null
          description?: string
          id?: string
          is_active?: boolean
          recurrence?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_captures: {
        Row: {
          converted_at: string | null
          coupon_code: string | null
          created_at: string
          email: string
          id: string
          name: string | null
          page_url: string | null
          phone: string | null
          source: string | null
        }
        Insert: {
          converted_at?: string | null
          coupon_code?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          page_url?: string | null
          phone?: string | null
          source?: string | null
        }
        Update: {
          converted_at?: string | null
          coupon_code?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          page_url?: string | null
          phone?: string | null
          source?: string | null
        }
        Relationships: []
      }
      manual_sales: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          customer_name: string | null
          description: string
          id: string
          notes: string | null
          sale_date: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by: string
          customer_name?: string | null
          description: string
          id?: string
          notes?: string | null
          sale_date?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          customer_name?: string | null
          description?: string
          id?: string
          notes?: string | null
          sale_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_automations: {
        Row: {
          automation_type: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          order_id: string
          scheduled_at: string
          sent_at: string | null
          status: string
        }
        Insert: {
          automation_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          automation_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_automations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          coupon_id: string | null
          created_at: string
          customer_cpf: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          discount: number
          id: string
          notes: string | null
          payment_status: string
          shipping_address: string | null
          shipping_carrier: string | null
          shipping_cep: string | null
          shipping_city: string | null
          shipping_complement: string | null
          shipping_cost: number | null
          shipping_estimated_days: number | null
          shipping_neighborhood: string | null
          shipping_number: string | null
          shipping_original_cost: number | null
          shipping_service: string | null
          shipping_state: string | null
          status: string
          stripe_session_id: string | null
          subtotal: number
          total: number
          tracking_code: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_id?: string | null
          created_at?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_status?: string
          shipping_address?: string | null
          shipping_carrier?: string | null
          shipping_cep?: string | null
          shipping_city?: string | null
          shipping_complement?: string | null
          shipping_cost?: number | null
          shipping_estimated_days?: number | null
          shipping_neighborhood?: string | null
          shipping_number?: string | null
          shipping_original_cost?: number | null
          shipping_service?: string | null
          shipping_state?: string | null
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          total?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string | null
          created_at?: string
          customer_cpf?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_status?: string
          shipping_address?: string | null
          shipping_carrier?: string | null
          shipping_cep?: string | null
          shipping_city?: string | null
          shipping_complement?: string | null
          shipping_cost?: number | null
          shipping_estimated_days?: number | null
          shipping_neighborhood?: string | null
          shipping_number?: string | null
          shipping_original_cost?: number | null
          shipping_service?: string | null
          shipping_state?: string | null
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          total?: number
          tracking_code?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_name: string | null
          id: string
          is_approved: boolean
          photos: string[] | null
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          is_approved?: boolean
          photos?: string[] | null
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          is_approved?: boolean
          photos?: string[] | null
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_queue: {
        Row: {
          art_approved_at: string | null
          created_at: string
          customer_name: string | null
          designer_id: string | null
          designer_name: string | null
          id: string
          notes: string | null
          order_id: string
          priority: number
          product_name: string
          production_completed_at: string | null
          production_started_at: string | null
          quantity: number
          shipped_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          art_approved_at?: string | null
          created_at?: string
          customer_name?: string | null
          designer_id?: string | null
          designer_name?: string | null
          id?: string
          notes?: string | null
          order_id: string
          priority?: number
          product_name: string
          production_completed_at?: string | null
          production_started_at?: string | null
          quantity?: number
          shipped_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          art_approved_at?: string | null
          created_at?: string
          customer_name?: string | null
          designer_id?: string | null
          designer_name?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          priority?: number
          product_name?: string
          production_completed_at?: string | null
          production_started_at?: string | null
          quantity?: number
          shipped_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          circumference_cm: number | null
          created_at: string
          description: string | null
          discount_percent: number | null
          height_cm: number | null
          id: string
          images: string[] | null
          is_active: boolean
          is_customizable: boolean
          measurements: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          price: number
          purchase_cost: number
          stock_quantity: number
          text_left: number | null
          text_rotation: number | null
          text_top: number | null
          updated_at: string
          variants: Json | null
        }
        Insert: {
          category_id?: string | null
          circumference_cm?: number | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          height_cm?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_customizable?: boolean
          measurements?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          price?: number
          purchase_cost?: number
          stock_quantity?: number
          text_left?: number | null
          text_rotation?: number | null
          text_top?: number | null
          updated_at?: string
          variants?: Json | null
        }
        Update: {
          category_id?: string | null
          circumference_cm?: number | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          height_cm?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_customizable?: boolean
          measurements?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          price?: number
          purchase_cost?: number
          stock_quantity?: number
          text_left?: number | null
          text_rotation?: number | null
          text_top?: number | null
          updated_at?: string
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_coupon_id: string | null
          referred_email: string | null
          referred_user_id: string | null
          referrer_coupon_id: string | null
          referrer_user_id: string
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_coupon_id?: string | null
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_coupon_id?: string | null
          referrer_user_id: string
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_coupon_id?: string | null
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_coupon_id?: string | null
          referrer_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_coupon_id_fkey"
            columns: ["referred_coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_coupon_id_fkey"
            columns: ["referrer_coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_completed: boolean
          remind_date: string
          remind_time: string | null
          title: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_completed?: boolean
          remind_date: string
          remind_time?: string | null
          title: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          remind_date?: string
          remind_time?: string | null
          title?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          position: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volume_discounts: {
        Row: {
          created_at: string
          discount_percent: number
          id: string
          max_quantity: number | null
          min_quantity: number
        }
        Insert: {
          created_at?: string
          discount_percent?: number
          id?: string
          max_quantity?: number | null
          min_quantity: number
        }
        Update: {
          created_at?: string
          discount_percent?: number
          id?: string
          max_quantity?: number | null
          min_quantity?: number
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
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
