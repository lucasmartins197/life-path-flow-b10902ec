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
      anchor_alerts: {
        Row: {
          alert_type: string
          contact_id: string | null
          created_at: string
          id: string
          message: string | null
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          alert_type: string
          contact_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          sent_at?: string
          status?: string
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
      anchor_settings: {
        Row: {
          created_at: string
          id: string
          notify_inactive: boolean
          notify_relapse: boolean
          notify_step_complete: boolean
          updated_at: string
          user_id: string
          weekly_report: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          notify_inactive?: boolean
          notify_relapse?: boolean
          notify_step_complete?: boolean
          updated_at?: string
          user_id: string
          weekly_report?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          notify_inactive?: boolean
          notify_relapse?: boolean
          notify_step_complete?: boolean
          updated_at?: string
          user_id?: string
          weekly_report?: boolean
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          meeting_link: string | null
          payment_id: string | null
          professional_id: string
          rating: number | null
          review_comment: string | null
          scheduled_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_link?: string | null
          payment_id?: string | null
          professional_id: string
          rating?: number | null
          review_comment?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          meeting_link?: string | null
          payment_id?: string | null
          professional_id?: string
          rating?: number | null
          review_comment?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_sites: {
        Row: {
          active: boolean
          created_at: string
          id: string
          is_default: boolean
          url: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          url: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          url?: string
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
      community_posts: {
        Row: {
          anonymous: boolean
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_hidden: boolean
          likes_count: number
          mood: string | null
          report_count: number
          user_id: string
          video_url: string | null
        }
        Insert: {
          anonymous?: boolean
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          likes_count?: number
          mood?: string | null
          report_count?: number
          user_id: string
          video_url?: string | null
        }
        Update: {
          anonymous?: boolean
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          likes_count?: number
          mood?: string | null
          report_count?: number
          user_id?: string
          video_url?: string | null
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
      daily_tasks: {
        Row: {
          categoria: string
          concluido: boolean
          concluido_em: string | null
          conteudo_ia: string
          created_at: string
          data: string
          descricao: string
          id: string
          progresso: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          concluido?: boolean
          concluido_em?: string | null
          conteudo_ia?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          progresso?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          concluido?: boolean
          concluido_em?: string | null
          conteudo_ia?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          progresso?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
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
      digital_guardian: {
        Row: {
          created_at: string
          guardian_email: string | null
          guardian_name: string
          guardian_phone: string | null
          id: string
          invite_sent_at: string | null
          notify_on_temptation: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guardian_email?: string | null
          guardian_name: string
          guardian_phone?: string | null
          id?: string
          invite_sent_at?: string | null
          notify_on_temptation?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guardian_email?: string | null
          guardian_name?: string
          guardian_phone?: string | null
          id?: string
          invite_sent_at?: string | null
          notify_on_temptation?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
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
      gambling_streak: {
        Row: {
          confirmation_date: string
          created_at: string
          id: string
          notes: string | null
          stayed_clean: boolean
          user_id: string
        }
        Insert: {
          confirmation_date: string
          created_at?: string
          id?: string
          notes?: string | null
          stayed_clean: boolean
          user_id: string
        }
        Update: {
          confirmation_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          stayed_clean?: boolean
          user_id?: string
        }
        Relationships: []
      }
      jornada_respostas: {
        Row: {
          created_at: string
          id: string
          passo_numero: number
          resposta: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          passo_numero: number
          resposta: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          passo_numero?: number
          resposta?: string
          updated_at?: string
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
          actor_id: string
          created_at: string | null
          id: string
          post_id: string | null
          reaction_type: string | null
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type?: string | null
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type?: string | null
          read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
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
      onboarding_clinico: {
        Row: {
          created_at: string
          family_aware: string | null
          gambling_types: Json
          id: string
          main_motivation: string | null
          mental_health_risk: string | null
          stop_attempts: string | null
          total_loss_range: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          family_aware?: string | null
          gambling_types?: Json
          id?: string
          main_motivation?: string | null
          mental_health_risk?: string | null
          stop_attempts?: string | null
          total_loss_range?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          family_aware?: string | null
          gambling_types?: Json
          id?: string
          main_motivation?: string | null
          mental_health_risk?: string | null
          stop_attempts?: string | null
          total_loss_range?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_profiles: {
        Row: {
          accepts_plan: boolean
          approach: Json | null
          availability: Json
          bio: string | null
          council_number: string | null
          council_state: string | null
          council_verified: boolean | null
          created_at: string
          credentials: string | null
          full_name: string | null
          gambling_specialist: boolean | null
          hourly_rate: number | null
          id: string
          is_approved: boolean | null
          is_online: boolean | null
          meeting_link: string | null
          payout_amount: number | null
          photo_url: string | null
          professional_email: string | null
          professional_type:
            | Database["public"]["Enums"]["professional_type"]
            | null
          rating: number | null
          specialties: Json | null
          specialty: string
          total_sessions: number | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          accepts_plan?: boolean
          approach?: Json | null
          availability?: Json
          bio?: string | null
          council_number?: string | null
          council_state?: string | null
          council_verified?: boolean | null
          created_at?: string
          credentials?: string | null
          full_name?: string | null
          gambling_specialist?: boolean | null
          hourly_rate?: number | null
          id?: string
          is_approved?: boolean | null
          is_online?: boolean | null
          meeting_link?: string | null
          payout_amount?: number | null
          photo_url?: string | null
          professional_email?: string | null
          professional_type?:
            | Database["public"]["Enums"]["professional_type"]
            | null
          rating?: number | null
          specialties?: Json | null
          specialty: string
          total_sessions?: number | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          accepts_plan?: boolean
          approach?: Json | null
          availability?: Json
          bio?: string | null
          council_number?: string | null
          council_state?: string | null
          council_verified?: boolean | null
          created_at?: string
          credentials?: string | null
          full_name?: string | null
          gambling_specialist?: boolean | null
          hourly_rate?: number | null
          id?: string
          is_approved?: boolean | null
          is_online?: boolean | null
          meeting_link?: string | null
          payout_amount?: number | null
          photo_url?: string | null
          professional_email?: string | null
          professional_type?:
            | Database["public"]["Enums"]["professional_type"]
            | null
          rating?: number | null
          specialties?: Json | null
          specialty?: string
          total_sessions?: number | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      professional_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          professional_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          professional_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          professional_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professional_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          complement: string | null
          country: string | null
          cpf: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          gambling_duration: string | null
          gender: string | null
          id: string
          is_public: boolean
          neighborhood: string | null
          notifications_enabled: boolean
          number: string | null
          onboarding_completed: boolean | null
          phone: string | null
          recovery_situation: string | null
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
          bio?: string | null
          city?: string | null
          complement?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gambling_duration?: string | null
          gender?: string | null
          id?: string
          is_public?: boolean
          neighborhood?: string | null
          notifications_enabled?: boolean
          number?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          recovery_situation?: string | null
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
          bio?: string | null
          city?: string | null
          complement?: string | null
          country?: string | null
          cpf?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gambling_duration?: string | null
          gender?: string | null
          id?: string
          is_public?: boolean
          neighborhood?: string | null
          notifications_enabled?: boolean
          number?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          recovery_situation?: string | null
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
      prontuarios: {
        Row: {
          created_at: string
          gerado_em: string
          id: string
          nivel_risco: string
          pontos_atencao: Json
          recomendacoes: Json
          resumo_clinico: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gerado_em?: string
          id?: string
          nivel_risco?: string
          pontos_atencao?: Json
          recomendacoes?: Json
          resumo_clinico?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gerado_em?: string
          id?: string
          nivel_risco?: string
          pontos_atencao?: Json
          recomendacoes?: Json
          resumo_clinico?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          livro_titulo: string
          pagina_atual: number
          paginas_por_dia: number
          total_paginas: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          livro_titulo: string
          pagina_atual?: number
          paginas_por_dia?: number
          total_paginas?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          livro_titulo?: string
          pagina_atual?: number
          paginas_por_dia?: number
          total_paginas?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recovery_commitments: {
        Row: {
          blocking_configured: boolean
          blocking_configured_at: string | null
          created_at: string
          id: string
          signature_name: string
          signed_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocking_configured?: boolean
          blocking_configured_at?: string | null
          created_at?: string
          id?: string
          signature_name: string
          signed_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blocking_configured?: boolean
          blocking_configured_at?: string | null
          created_at?: string
          id?: string
          signature_name?: string
          signed_at?: string
          updated_at?: string
          user_id?: string
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
      reported_content: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reason: string | null
          reporter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reason?: string | null
          reporter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reason?: string | null
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reported_content_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
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
      routine_preferences: {
        Row: {
          configurado: boolean
          created_at: string
          espiritualidade_ativo: boolean
          esporte_ativo: boolean
          esporte_dias: string[]
          esporte_nivel: string
          esporte_tempo: number
          esporte_tipo: string
          id: string
          lazer_ativo: boolean
          leitura_ativo: boolean
          leitura_tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          configurado?: boolean
          created_at?: string
          espiritualidade_ativo?: boolean
          esporte_ativo?: boolean
          esporte_dias?: string[]
          esporte_nivel?: string
          esporte_tempo?: number
          esporte_tipo?: string
          id?: string
          lazer_ativo?: boolean
          leitura_ativo?: boolean
          leitura_tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          configurado?: boolean
          created_at?: string
          espiritualidade_ativo?: boolean
          esporte_ativo?: boolean
          esporte_dias?: string[]
          esporte_nivel?: string
          esporte_tempo?: number
          esporte_tipo?: string
          id?: string
          lazer_ativo?: boolean
          leitura_ativo?: boolean
          leitura_tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_credits: {
        Row: {
          credits_remaining: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          credits_remaining?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          credits_remaining?: number
          id?: string
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
      temptation_events: {
        Row: {
          created_at: string
          guardian_notified: boolean
          id: string
          intensity: string | null
          notes: string | null
          outcome: string | null
          triggered_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guardian_notified?: boolean
          id?: string
          intensity?: string | null
          notes?: string | null
          outcome?: string | null
          triggered_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guardian_notified?: boolean
          id?: string
          intensity?: string | null
          notes?: string | null
          outcome?: string | null
          triggered_at?: string
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
      user_fitness_profile: {
        Row: {
          altura_cm: number | null
          created_at: string
          dias_semana: Json
          equipamento: string
          id: string
          modalidade: string
          nivel: string
          objetivo: string
          peso_kg: number | null
          restricoes: string | null
          tempo_disponivel: number
          updated_at: string
          user_id: string
        }
        Insert: {
          altura_cm?: number | null
          created_at?: string
          dias_semana?: Json
          equipamento?: string
          id?: string
          modalidade?: string
          nivel?: string
          objetivo?: string
          peso_kg?: number | null
          restricoes?: string | null
          tempo_disponivel?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          altura_cm?: number | null
          created_at?: string
          dias_semana?: Json
          equipamento?: string
          id?: string
          modalidade?: string
          nivel?: string
          objetivo?: string
          peso_kg?: number | null
          restricoes?: string | null
          tempo_disponivel?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_anonymous: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_anonymous?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_anonymous?: boolean
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
          description: string | null
          id: string
          is_live: boolean
          scheduled_at: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_live?: boolean
          scheduled_at?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_live?: boolean
          scheduled_at?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      weekly_workout_plan: {
        Row: {
          created_at: string
          day_letter: string
          exercises: Json
          id: string
          modalidade: string
          muscle_groups: string[]
          user_id: string
          week_number: number
        }
        Insert: {
          created_at?: string
          day_letter: string
          exercises?: Json
          id?: string
          modalidade?: string
          muscle_groups?: string[]
          user_id: string
          week_number: number
        }
        Update: {
          created_at?: string
          day_letter?: string
          exercises?: Json
          id?: string
          modalidade?: string
          muscle_groups?: string[]
          user_id?: string
          week_number?: number
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
      get_professional_meeting_link: {
        Args: { _professional_id: string }
        Returns: string
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
