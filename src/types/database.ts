// KLJUČNO: TypeScript tipovi za Supabase bazu podataka
export interface Database {
  public: {
    Tables: {
      inventory: {
        Row: {
          id: string;
          name: string;
          code: string;
          unit: string;
          quantity: number;
          min_quantity: number;
          price: number;
          type: 'glass' | 'other';
          glass_thickness?: number;
          notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          unit: string;
          quantity: number;
          min_quantity: number;
          price: number;
          type: 'glass' | 'other';
          glass_thickness?: number;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          unit?: string;
          quantity?: number;
          min_quantity?: number;
          price?: number;
          type?: 'glass' | 'other';
          glass_thickness?: number;
          notes?: string;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string;
          price: number;
          materials: any; // JSON field
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description: string;
          price: number;
          materials: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string;
          price?: number;
          materials?: any;
          created_at?: string;
        };
      };
      work_orders: {
        Row: {
          id: string;
          order_number: string;
          client_id?: string;
          items: any; // JSON field
          status: 'draft' | 'pending' | 'in-progress' | 'completed' | 'cancelled';
          created_at: string;
          completed_at?: string;
          completion_reason?: string;
          notes?: string;
          quote_id?: string; // Reference to the quote
        };
        Insert: {
          id?: string;
          order_number: string;
          client_id?: string;
          items: any;
          status: 'draft' | 'pending' | 'in-progress' | 'completed' | 'cancelled';
          created_at?: string;
          completed_at?: string;
          completion_reason?: string;
          notes?: string;
          quote_id?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          client_id?: string;
          items?: any;
          status?: 'draft' | 'pending' | 'in-progress' | 'completed' | 'cancelled';
          created_at?: string;
          completed_at?: string;
          completion_reason?: string;
          notes?: string;
          quote_id?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          name: string;
          type: 'company' | 'individual';
          address: string;
          oib: string;
          contact_person?: string;
          phone?: string;
          email?: string;
          notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'company' | 'individual';
          address: string;
          oib: string;
          contact_person?: string;
          phone?: string;
          email?: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'company' | 'individual';
          address?: string;
          oib?: string;
          contact_person?: string;
          phone?: string;
          email?: string;
          notes?: string;
          created_at?: string;
        };
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          type: 'company' | 'individual';
          address: string;
          oib: string;
          contact_person?: string;
          phone?: string;
          email?: string;
          notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'company' | 'individual';
          address: string;
          oib: string;
          contact_person?: string;
          phone?: string;
          email?: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'company' | 'individual';
          address?: string;
          oib?: string;
          contact_person?: string;
          phone?: string;
          email?: string;
          notes?: string;
          created_at?: string;
        };
      };
      processes: {
        Row: {
          id: string;
          name: string;
          description: string;
          estimated_duration: number;
          order: number;
          price: number;
          price_type: string;
          thickness_prices?: any; // JSON array of thickness-price pairs
          tenant_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          estimated_duration: number;
          order: number;
          price: number;
          price_type: string;
          thickness_prices?: any; // JSON array of thickness-price pairs
          tenant_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          estimated_duration?: number;
          order?: number;
          price?: number;
          price_type?: string;
          thickness_prices?: any; // JSON array of thickness-price pairs
          tenant_id?: string;
          created_at?: string;
        };
      };
      stock_transactions: {
        Row: {
          id: string;
          inventory_item_id: string;
          type: 'in' | 'out' | 'adjustment' | 'return';
          quantity: number;
          previous_quantity: number;
          new_quantity: number;
          supplier_id?: string;
          document_number?: string;
          document_type?: 'invoice' | 'delivery-note' | 'other';
          notes?: string;
          attachment_url?: string;
          attachment_name?: string;
          attachment_type?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_item_id: string;
          type: 'in' | 'out' | 'adjustment' | 'return';
          quantity: number;
          previous_quantity: number;
          new_quantity: number;
          supplier_id?: string;
          document_number?: string;
          document_type?: 'invoice' | 'delivery-note' | 'other';
          notes?: string;
          attachment_url?: string;
          attachment_name?: string;
          attachment_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          inventory_item_id?: string;
          type?: 'in' | 'out' | 'adjustment';
          quantity?: number;
          previous_quantity?: number;
          new_quantity?: number;
          supplier_id?: string;
          document_number?: string;
          document_type?: 'invoice' | 'delivery-note' | 'other';
          notes?: string;
          attachment_url?: string;
          attachment_name?: string;
          attachment_type?: string;
          created_at?: string;
        };
      };
      delivery_notes: {
        Row: {
          id: string;
          delivery_number: string;
          work_order_id: string;
          client_id: string;
          items: any; // JSON field
          status: 'draft' | 'generated' | 'delivered' | 'invoiced';
          created_at: string;
          delivered_at?: string;
          delivered_by?: string;
          received_by?: string;
          invoiced_at?: string;
          invoice_number?: string;
          notes?: string;
        };
        Insert: {
          id?: string;
          delivery_number: string;
          work_order_id: string;
          client_id: string;
          items: any;
          status: 'draft' | 'generated' | 'delivered' | 'invoiced';
          created_at?: string;
          delivered_at?: string;
          delivered_by?: string;
          received_by?: string;
          invoiced_at?: string;
          invoice_number?: string;
          notes?: string;
        };
        Update: {
          id?: string;
          delivery_number?: string;
          work_order_id?: string;
          client_id?: string;
          items?: any;
          status?: 'draft' | 'generated' | 'delivered' | 'invoiced';
          created_at?: string;
          delivered_at?: string;
          delivered_by?: string;
          received_by?: string;
          invoiced_at?: string;
          invoice_number?: string;
          notes?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string;
          price: number;
          unit: string;
          tenant_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description: string;
          price: number;
          unit: string;
          tenant_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string;
          price?: number;
          unit?: string;
          tenant_id?: string;
          created_at?: string;
        };
      };
      quotes: {
        Row: {
          id: string;
          quote_number: string;
          client_id?: string;
          items: any; // JSON field
          status: 'created' | 'accepted' | 'rejected' | 'expired' | 'converted';
          created_at: string;
          valid_until: string;
          accepted_at?: string;
          rejected_at?: string;
          converted_to_work_order_id?: string;
          total_amount: number;
          product_amount?: number; // Amount for products only
          vat_rate: number;
          vat_amount: number;
          grand_total: number;
          process_amount?: number; // Amount for processes only
          payment_info: any;
          notes?: string;
          payment_date?: string;
        };
        Insert: {
          id?: string;
          quote_number: string;
          client_id?: string;
          items: any;
          status: 'created' | 'accepted' | 'rejected' | 'expired' | 'converted';
          created_at?: string;
          valid_until: string;
          accepted_at?: string;
          rejected_at?: string;
          converted_to_work_order_id?: string;
          total_amount: number;
          product_amount?: number; // Amount for products only
          vat_rate: number;
          vat_amount: number;
          grand_total: number;
          process_amount?: number; // Amount for processes only
          payment_info: any;
          notes?: string;
          payment_date?: string;
        };
        Update: {
          id?: string;
          quote_number?: string;
          client_id?: string;
          items?: any;
          status?: 'created' | 'accepted' | 'rejected' | 'expired' | 'converted';
          created_at?: string;
          valid_until?: string;
          accepted_at?: string;
          rejected_at?: string;
          converted_to_work_order_id?: string;
          total_amount?: number;
          product_amount?: number; // Optional for updates
          vat_rate?: number;
          vat_amount?: number;
          grand_total?: number;
          process_amount?: number; // Amount for processes only
          payment_info?: any;
          notes?: string;
          payment_date?: string;
        };
      };
      bank_accounts: {
        Row: {
          id: string;
          account_name: string;
          bank_name: string;
          iban: string;
          swift?: string;
          model?: string;
          reference_prefix?: string;
          purpose_code?: string;
          description?: string;
          is_default: boolean;
          is_visible_on_quotes: boolean;
          notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          account_name: string;
          bank_name: string;
          iban: string;
          swift?: string;
          model?: string;
          reference_prefix?: string;
          purpose_code?: string;
          description?: string;
          is_default?: boolean;
          is_visible_on_quotes?: boolean;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          account_name?: string;
          bank_name?: string;
          iban?: string;
          swift?: string;
          model?: string;
          reference_prefix?: string;
          purpose_code?: string;
          description?: string;
          is_default?: boolean;
          is_visible_on_quotes?: boolean;
          notes?: string;
          created_at?: string;
        };
      };
      payment_records: {
        Row: {
          id: string;
          quote_id: string;
          payment_method: 'cash' | 'bank_transfer' | 'card' | 'check' | 'other';
          amount: number;
          transaction_number?: string;
          description?: string;
          payment_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          payment_method: 'cash' | 'bank_transfer' | 'card' | 'check' | 'other';
          amount: number;
          transaction_number?: string;
          description?: string;
          payment_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          payment_method?: 'cash' | 'bank_transfer' | 'card' | 'check' | 'other';
          amount?: number;
          transaction_number?: string;
          description?: string;
          payment_date?: string;
          created_at?: string;
        };
      };
      devices: {
        Row: {
          id: string;
          device_name: string;
          device_code: string;
          tenant_id: string;
          email: string;
          password_hash: string;
          status: 'active' | 'inactive' | 'suspended';
          last_login?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          device_name: string;
          device_code: string;
          tenant_id: string;
          email: string;
          password_hash: string;
          status?: 'active' | 'inactive' | 'suspended';
          last_login?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          device_name?: string;
          device_code?: string;
          tenant_id?: string;
          email?: string;
          password_hash?: string;
          status?: 'active' | 'inactive' | 'suspended';
          last_login?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      device_sessions: {
        Row: {
          id: string;
          device_id: string;
          session_token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          session_token: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          session_token?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      device_permissions: {
        Row: {
          id: string;
          device_id: string;
          permission: string;
          granted_at: string;
        };
        Insert: {
          id?: string;
          device_id: string;
          permission: string;
          granted_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string;
          permission?: string;
          granted_at?: string;
        };
      };
      device_info: {
        Row: {
          id: string;
          device_name: string;
          device_code: string;
          tenant_id: string;
          auth_user_id?: string;
          status: 'active' | 'inactive' | 'suspended';
          last_login?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          device_name: string;
          device_code: string;
          tenant_id: string;
          auth_user_id?: string;
          status?: 'active' | 'inactive' | 'suspended';
          last_login?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          device_name?: string;
          device_code?: string;
          tenant_id?: string;
          auth_user_id?: string;
          status?: 'active' | 'inactive' | 'suspended';
          last_login?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
