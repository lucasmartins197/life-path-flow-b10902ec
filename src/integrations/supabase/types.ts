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
      admin_reports: {
        Row: {
          created_at: string
          data: Json
          end_date: string
          generated_by: string | null
          id: string
          report_period: string
          report_type: string
          start_date: string
        }
        Insert: {
          created_at?: string
          data?: Json
          end_date: string
          generated_by?: string | null
          id?: string
          report_period: string
          report_type: string
          start_date: string
        }
        Update: {
          created_at?: string
          data?: Json
          end_date?: string
          generated_by?: string | null
          id?: string
          report_period?: string
          report_type?: string
          start_date?: string
        }
        Relationships: []
      }
      agent_memory: {
        Row: {
          content: string
          created_at: string
          expires_at: string | null
          id: string
          importance: number | null
          memory_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          importance?: number | null
          memory_type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          importance?: number | null
          memory_type?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_messages: {
        Row: {
          actions_taken: Json | null
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          actions_taken?: Json | null
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          actions_taken?: Json | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      anchor_contacts: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          last_alert_sent_at: string | null
          name: string
          phone: string
          receive_alerts: boolean | null
          receive_reports: boolean | null
          relationship: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          last_alert_sent_at?: string | null
          name: string
          phone: string
          receive_alerts?: boolean | null
          receive_reports?: boolean | null
          relationship: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          last_alert_sent_at?: string | null
          name?: string
          phone?: string
          receive_alerts?: boolean | null
          receive_reports?: boolean | null
          relationship?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      body_evolution: {
        Row: {
          ai_analysis: Json | null
          body_fat_percent: number | null
          created_at: string
          id: string
          muscle_mass_percent: number | null
          notes: string | null
          photo_type: string
          photo_url: string
          taken_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          body_fat_percent?: number | null
          created_at?: string
          id?: string
          muscle_mass_percent?: number | null
          notes?: string | null
          photo_type?: string
          photo_url: string
          taken_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          body_fat_percent?: number | null
          created_at?: string
          id?: string
          muscle_mass_percent?: number | null
          notes?: string | null
          photo_type?: string
          photo_url?: string
          taken_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          event_type: string
          external_calendar_id: string | null
          id: string
          is_all_day: boolean | null
          is_global: boolean | null
          is_recurring: boolean | null
          location: string | null
          meeting_url: string | null
          recurrence_rule: string | null
          reminder_minutes: number | null
          session_id: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string
          external_calendar_id?: string | null
          id?: string
          is_all_day?: boolean | null
          is_global?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          meeting_url?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          session_id?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_type?: string
          external_calendar_id?: string | null
          id?: string
          is_all_day?: boolean | null
          is_global?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          meeting_url?: string | null
          recurrence_rule?: string | null
          reminder_minutes?: number | null
          session_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      community_rules_acceptance: {
        Row: {
          accepted_at: string
          id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      community_stories: {
        Row: {
          comment_count: number
          content: string
          created_at: string
          id: string
          is_flagged: boolean
          is_published: boolean
          journey_moment: string | null
          photo_url: string | null
          support_count: number
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          comment_count?: number
          content: string
          created_at?: string
          id?: string
          is_flagged?: boolean
          is_published?: boolean
          journey_moment?: string | null
          photo_url?: string | null
          support_count?: number
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          comment_count?: number
          content?: string
          created_at?: string
          id?: string
          is_flagged?: boolean
          is_published?: boolean
          journey_moment?: string | null
          photo_url?: string | null
          support_count?: number
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      daily_reflections: {
        Row: {
          ai_response: string | null
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ai_response?: string | null
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          ai_recommendations: string[] | null
          created_at: string
          exercise_summary: Json | null
          id: string
          is_viewed: boolean | null
          journey_summary: Json | null
          nutrition_summary: Json | null
          overall_score: number | null
          report_date: string
          risk_assessment: Json | null
          routine_summary: Json | null
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          ai_recommendations?: string[] | null
          created_at?: string
          exercise_summary?: Json | null
          id?: string
          is_viewed?: boolean | null
          journey_summary?: Json | null
          nutrition_summary?: Json | null
          overall_score?: number | null
          report_date?: string
          risk_assessment?: Json | null
          routine_summary?: Json | null
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          ai_recommendations?: string[] | null
          created_at?: string
          exercise_summary?: Json | null
          id?: string
          is_viewed?: boolean | null
          journey_summary?: Json | null
          nutrition_summary?: Json | null
          overall_score?: number | null
          report_date?: string
          risk_assessment?: Json | null
          routine_summary?: Json | null
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      debt_simulations: {
        Row: {
          ai_result: Json | null
          created_at: string
          debt_amount: number
          id: string
          interest_rate: number
          monthly_income: number
          user_id: string
        }
        Insert: {
          ai_result?: Json | null
          created_at?: string
          debt_amount: number
          id?: string
          interest_rate: number
          monthly_income: number
          user_id: string
        }
        Update: {
          ai_result?: Json | null
          created_at?: string
          debt_amount?: number
          id?: string
          interest_rate?: number
          monthly_income?: number
          user_id?: string
        }
        Relationships: []
      }
      exercise_activities: {
        Row: {
          calories_per_minute: number | null
          category: string
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          calories_per_minute?: number | null
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          calories_per_minute?: number | null
          category?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          activity_id: string | null
          calories_burned: number | null
          created_at: string
          custom_activity_name: string | null
          duration_minutes: number
          id: string
          intensity: string
          logged_at: string
          notes: string | null
          photo_url: string | null
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          calories_burned?: number | null
          created_at?: string
          custom_activity_name?: string | null
          duration_minutes?: number
          id?: string
          intensity?: string
          logged_at?: string
          notes?: string | null
          photo_url?: string | null
          user_id: string
        }
        Update: {
          activity_id?: string | null
          calories_burned?: number | null
          created_at?: string
          custom_activity_name?: string | null
          duration_minutes?: number
          id?: string
          intensity?: string
          logged_at?: string
          notes?: string | null
          photo_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "exercise_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_events: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string | null
          due_date: string | null
          event_type: string
          id: string
          is_completed: boolean | null
          is_recurring: boolean | null
          recurrence_pattern: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_type: string
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_type?: string
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          created_at: string
          current_amount: number
          deadline: string | null
          id: string
          target_amount: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          target_amount?: number
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          target_amount?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_profile: {
        Row: {
          created_at: string
          debts: Json
          fixed_expenses: Json
          goal: string | null
          goal_deadline: string | null
          id: string
          income: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          debts?: Json
          fixed_expenses?: Json
          goal?: string | null
          goal_deadline?: string | null
          id?: string
          income?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          debts?: Json
          fixed_expenses?: Json
          goal?: string | null
          goal_deadline?: string | null
          id?: string
          income?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          is_recurring: boolean
          recurring_day: number | null
          transaction_date: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          recurring_day?: number | null
          transaction_date?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_recurring?: boolean
          recurring_day?: number | null
          transaction_date?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      journey_progress: {
        Row: {
          ai_conversation: Json | null
          answers: Json | null
          checklist_items: Json | null
          completed_at: string | null
          created_at: string
          current_section: number | null
          id: string
          is_completed: boolean | null
          started_at: string | null
          step_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_conversation?: Json | null
          answers?: Json | null
          checklist_items?: Json | null
          completed_at?: string | null
          created_at?: string
          current_section?: number | null
          id?: string
          is_completed?: boolean | null
          started_at?: string | null
          step_number: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_conversation?: Json | null
          answers?: Json | null
          checklist_items?: Json | null
          completed_at?: string | null
          created_at?: string
          current_section?: number | null
          id?: string
          is_completed?: boolean | null
          started_at?: string | null
          step_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journey_steps: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          exercises: Json | null
          id: string
          is_published: boolean | null
          reflection_questions: Json | null
          step_number: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          exercises?: Json | null
          id?: string
          is_published?: boolean | null
          reflection_questions?: Json | null
          step_number: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          exercises?: Json | null
          id?: string
          is_published?: boolean | null
          reflection_questions?: Json | null
          step_number?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      lawyer_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      lawyer_documents: {
        Row: {
          created_at: string
          document_type: string
          file_url: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type?: string
          file_url: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_url?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_consultations: {
        Row: {
          approximate_income: number | null
          created_at: string
          debt_description: string
          id: string
          lawyer_id: string
          lgpd_consent: boolean
          patient_city: string
          patient_cpf: string
          patient_id: string
          patient_name: string
          session_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approximate_income?: number | null
          created_at?: string
          debt_description: string
          id?: string
          lawyer_id: string
          lgpd_consent?: boolean
          patient_city: string
          patient_cpf: string
          patient_id: string
          patient_name: string
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approximate_income?: number | null
          created_at?: string
          debt_description?: string
          id?: string
          lawyer_id?: string
          lgpd_consent?: boolean
          patient_city?: string
          patient_cpf?: string
          patient_id?: string
          patient_name?: string
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_consultations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"] | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"] | null
          user_id?: string
        }
        Relationships: []
      }
      nutrition_foods: {
        Row: {
          brand: string | null
          calories: number
          carbohydrates: number
          created_at: string
          created_by: string | null
          fat: number
          fiber: number
          id: string
          is_verified: boolean | null
          name: string
          protein: number
          serving_size: number
          serving_unit: string
          sodium: number | null
          sugar: number | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          calories?: number
          carbohydrates?: number
          created_at?: string
          created_by?: string | null
          fat?: number
          fiber?: number
          id?: string
          is_verified?: boolean | null
          name: string
          protein?: number
          serving_size?: number
          serving_unit?: string
          sodium?: number | null
          sugar?: number | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          calories?: number
          carbohydrates?: number
          created_at?: string
          created_by?: string | null
          fat?: number
          fiber?: number
          id?: string
          is_verified?: boolean | null
          name?: string
          protein?: number
          serving_size?: number
          serving_unit?: string
          sodium?: number | null
          sugar?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calories: number
          carbohydrates: number
          created_at: string
          custom_food_name: string | null
          fat: number
          fiber: number
          food_id: string | null
          id: string
          logged_at: string
          meal_type: string
          notes: string | null
          protein: number
          quantity: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbohydrates?: number
          created_at?: string
          custom_food_name?: string | null
          fat?: number
          fiber?: number
          food_id?: string | null
          id?: string
          logged_at?: string
          meal_type?: string
          notes?: string | null
          protein?: number
          quantity?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbohydrates?: number
          created_at?: string
          custom_food_name?: string | null
          fat?: number
          fiber?: number
          food_id?: string | null
          id?: string
          logged_at?: string
          meal_type?: string
          notes?: string | null
          protein?: number
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_logs_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "nutrition_foods"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_professional_links: {
        Row: {
          id: string
          is_active: boolean | null
          linked_at: string
          patient_id: string
          professional_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          linked_at?: string
          patient_id: string
          professional_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          linked_at?: string
          patient_id?: string
          professional_id?: string
        }
        Relationships: []
      }
      patient_profiles: {
        Row: {
          allergies: string[] | null
          blood_type: string | null
          created_at: string
          current_step: number | null
          date_of_birth: string | null
          emergency_contact: string | null
          goals: string[] | null
          health_notes: string | null
          height_cm: number | null
          id: string
          journey_started_at: string | null
          last_activity_at: string | null
          medications: string[] | null
          streak_days: number | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string
          current_step?: number | null
          date_of_birth?: string | null
          emergency_contact?: string | null
          goals?: string[] | null
          health_notes?: string | null
          height_cm?: number | null
          id?: string
          journey_started_at?: string | null
          last_activity_at?: string | null
          medications?: string[] | null
          streak_days?: number | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string
          current_step?: number | null
          date_of_birth?: string | null
          emergency_contact?: string | null
          goals?: string[] | null
          health_notes?: string | null
          height_cm?: number | null
          id?: string
          journey_started_at?: string | null
          last_activity_at?: string | null
          medications?: string[] | null
          streak_days?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      patient_record_entries: {
        Row: {
          content: string
          created_at: string
          entry_type: string
          id: string
          is_private: boolean | null
          metadata: Json | null
          patient_id: string
          professional_id: string | null
          title: string | null
        }
        Insert: {
          content: string
          created_at?: string
          entry_type: string
          id?: string
          is_private?: boolean | null
          metadata?: Json | null
          patient_id: string
          professional_id?: string | null
          title?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          entry_type?: string
          id?: string
          is_private?: boolean | null
          metadata?: Json | null
          patient_id?: string
          professional_id?: string | null
          title?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_type: string
          platform_fee: number | null
          professional_amount: number | null
          session_id: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_id: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_type: string
          platform_fee?: number | null
          professional_amount?: number | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_id?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_type?: string
          platform_fee?: number | null
          professional_amount?: number | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_id?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          bio: string | null
          council_number: string | null
          council_state: string | null
          council_verified: boolean | null
          created_at: string
          credentials: string | null
          hourly_rate: number | null
          id: string
          is_approved: boolean | null
          is_online: boolean | null
          professional_type:
            | Database["public"]["Enums"]["professional_type"]
            | null
          rating: number | null
          specialty: string
          total_sessions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          council_number?: string | null
          council_state?: string | null
          council_verified?: boolean | null
          created_at?: string
          credentials?: string | null
          hourly_rate?: number | null
          id?: string
          is_approved?: boolean | null
          is_online?: boolean | null
          professional_type?:
            | Database["public"]["Enums"]["professional_type"]
            | null
          rating?: number | null
          specialty: string
          total_sessions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          council_number?: string | null
          council_state?: string | null
          council_verified?: boolean | null
          created_at?: string
          credentials?: string | null
          hourly_rate?: number | null
          id?: string
          is_approved?: boolean | null
          is_online?: boolean | null
          professional_type?:
            | Database["public"]["Enums"]["professional_type"]
            | null
          rating?: number | null
          specialty?: string
          total_sessions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          complement: string | null
          country: string | null
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          id: string
          neighborhood: string | null
          number: string | null
          onboarding_completed: boolean | null
          phone: string | null
          state: string | null
          street: string | null
          stripe_customer_id: string | null
          subscription_end: string | null
          subscription_status: string
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          complement?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          neighborhood?: string | null
          number?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          state?: string | null
          street?: string | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          complement?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          id?: string
          neighborhood?: string | null
          number?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          state?: string | null
          street?: string | null
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: string
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      recovery_scores: {
        Row: {
          calculated_at: string
          created_at: string
          exercise_score: number
          id: string
          journey_score: number
          nutrition_score: number
          routine_score: number
          score: number
          streak_bonus: number
          therapy_score: number
          user_id: string
        }
        Insert: {
          calculated_at?: string
          created_at?: string
          exercise_score?: number
          id?: string
          journey_score?: number
          nutrition_score?: number
          routine_score?: number
          score?: number
          streak_bonus?: number
          therapy_score?: number
          user_id: string
        }
        Update: {
          calculated_at?: string
          created_at?: string
          exercise_score?: number
          id?: string
          journey_score?: number
          nutrition_score?: number
          routine_score?: number
          score?: number
          streak_bonus?: number
          therapy_score?: number
          user_id?: string
        }
        Relationships: []
      }
      risk_signals: {
        Row: {
          alert_sent: boolean | null
          created_at: string
          description: string | null
          detected_at: string
          id: string
          is_resolved: boolean | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["risk_level"]
          signal_type: string
          user_id: string
        }
        Insert: {
          alert_sent?: boolean | null
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          is_resolved?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["risk_level"]
          signal_type: string
          user_id: string
        }
        Update: {
          alert_sent?: boolean | null
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          is_resolved?: boolean | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["risk_level"]
          signal_type?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_activities: {
        Row: {
          activity_data: Json
          ai_feedback: string | null
          category: string
          completed_at: string
          created_at: string
          duration_minutes: number
          id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          activity_data?: Json
          ai_feedback?: string | null
          category: string
          completed_at?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          rating?: number | null
          user_id: string
        }
        Update: {
          activity_data?: Json
          ai_feedback?: string | null
          category?: string
          completed_at?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      routine_days: {
        Row: {
          afternoon_plan: Json | null
          created_at: string
          date: string
          evening_plan: Json | null
          id: string
          mood_rating: number | null
          morning_plan: Json | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          afternoon_plan?: Json | null
          created_at?: string
          date: string
          evening_plan?: Json | null
          id?: string
          mood_rating?: number | null
          morning_plan?: Json | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          afternoon_plan?: Json | null
          created_at?: string
          date?: string
          evening_plan?: Json | null
          id?: string
          mood_rating?: number | null
          morning_plan?: Json | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          price: number
          professional_id: string
          rating: number | null
          scheduled_at: string
          session_type: string | null
          status: Database["public"]["Enums"]["session_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          price: number
          professional_id: string
          rating?: number | null
          scheduled_at: string
          session_type?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          price?: number
          professional_id?: string
          rating?: number | null
          scheduled_at?: string
          session_type?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      story_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_flagged: boolean
          story_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_flagged?: boolean
          story_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_flagged?: boolean
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "community_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_supports: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_supports_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "community_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          plan_type: string
          price_amount: number
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type: string
          price_amount: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_type?: string
          price_amount?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trail_progress: {
        Row: {
          completed_at: string | null
          exercises_completed: Json | null
          id: string
          is_completed: boolean | null
          reflection_answers: Json | null
          started_at: string | null
          step_id: string
          user_id: string
          video_watched: boolean | null
        }
        Insert: {
          completed_at?: string | null
          exercises_completed?: Json | null
          id?: string
          is_completed?: boolean | null
          reflection_answers?: Json | null
          started_at?: string | null
          step_id: string
          user_id: string
          video_watched?: boolean | null
        }
        Update: {
          completed_at?: string | null
          exercises_completed?: Json | null
          id?: string
          is_completed?: boolean | null
          reflection_answers?: Json | null
          started_at?: string | null
          step_id?: string
          user_id?: string
          video_watched?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "trail_progress_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_name: string
          badge_type: string
          earned_at: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          badge_name: string
          badge_type: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          badge_name?: string
          badge_type?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_routine: {
        Row: {
          categories: Json
          created_at: string
          id: string
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: Json
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: Json
          created_at?: string
          id?: string
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_class: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          link: string
          scheduled_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string
          scheduled_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string
          scheduled_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_patient_record: {
        Args: { _patient_id: string; _professional_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "professional" | "admin"
      notification_type:
        | "system"
        | "session"
        | "payment"
        | "journey"
        | "routine"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      professional_type:
        | "psiquiatra"
        | "psicologo"
        | "terapeuta"
        | "advogado"
        | "contador"
        | "educador_financeiro"
      risk_level: "baixo" | "moderado" | "alto" | "critico"
      session_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      subscription_status: "active" | "cancelled" | "expired" | "pending"
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
      app_role: ["user", "professional", "admin"],
      notification_type: ["system", "session", "payment", "journey", "routine"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      professional_type: [
        "psiquiatra",
        "psicologo",
        "terapeuta",
        "advogado",
        "contador",
        "educador_financeiro",
      ],
      risk_level: ["baixo", "moderado", "alto", "critico"],
      session_status: ["scheduled", "in_progress", "completed", "cancelled"],
      subscription_status: ["active", "cancelled", "expired", "pending"],
    },
  },
} as const
