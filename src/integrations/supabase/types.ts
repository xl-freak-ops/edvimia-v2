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
      academic_sessions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_current: boolean
          name: string
          school_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          name: string
          school_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          name?: string
          school_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          ai_assistant_enabled: boolean
          ai_enabled: boolean
          ai_insights_enabled: boolean
          custom_instructions: string | null
          school_id: string
          tone: string
          updated_at: string
        }
        Insert: {
          ai_assistant_enabled?: boolean
          ai_enabled?: boolean
          ai_insights_enabled?: boolean
          custom_instructions?: string | null
          school_id: string
          tone?: string
          updated_at?: string
        }
        Update: {
          ai_assistant_enabled?: boolean
          ai_enabled?: boolean
          ai_insights_enabled?: boolean
          custom_instructions?: string | null
          school_id?: string
          tone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          is_emergency: boolean
          is_published: boolean
          published_at: string | null
          scheduled_at: string | null
          school_id: string
          sender_id: string | null
          target_arm_id: string | null
          target_class_id: string | null
          target_roles: string[]
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_emergency?: boolean
          is_published?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          school_id: string
          sender_id?: string | null
          target_arm_id?: string | null
          target_class_id?: string | null
          target_roles?: string[]
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_emergency?: boolean
          is_published?: boolean
          published_at?: string | null
          scheduled_at?: string | null
          school_id?: string
          sender_id?: string | null
          target_arm_id?: string | null
          target_class_id?: string | null
          target_roles?: string[]
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_sender_profile_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_target_arm_id_fkey"
            columns: ["target_arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_target_class_id_fkey"
            columns: ["target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_components: {
        Row: {
          code: string
          created_at: string
          display_order: number
          id: string
          is_enabled: boolean
          is_exam: boolean
          max_score: number
          name: string
          school_id: string
          updated_at: string
          weight: number
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          is_exam?: boolean
          max_score?: number
          name: string
          school_id: string
          updated_at?: string
          weight?: number
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          id?: string
          is_enabled?: boolean
          is_exam?: boolean
          max_score?: number
          name?: string
          school_id?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_components_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_maintenance_records: {
        Row: {
          asset_id: string
          cost: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          next_service_date: string | null
          school_id: string
          service_date: string
          vendor: string | null
        }
        Insert: {
          asset_id: string
          cost?: number
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          next_service_date?: string | null
          school_id: string
          service_date?: string
          vendor?: string | null
        }
        Update: {
          asset_id?: string
          cost?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          next_service_date?: string | null
          school_id?: string
          service_date?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_records_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_maintenance_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_tag: string
          assigned_to_staff_id: string | null
          category_id: string | null
          condition: Database["public"]["Enums"]["asset_condition"]
          created_at: string
          id: string
          location: string | null
          name: string
          notes: string | null
          purchase_cost: number | null
          purchase_date: string | null
          school_id: string
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status"]
          supplier_id: string | null
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_tag: string
          assigned_to_staff_id?: string | null
          category_id?: string | null
          condition?: Database["public"]["Enums"]["asset_condition"]
          created_at?: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          school_id: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          supplier_id?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_tag?: string
          assigned_to_staff_id?: string | null
          category_id?: string | null
          condition?: Database["public"]["Enums"]["asset_condition"]
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          school_id?: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          supplier_id?: string | null
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_to_staff_id_fkey"
            columns: ["assigned_to_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          new_status: Database["public"]["Enums"]["attendance_status"] | null
          note: string | null
          old_status: Database["public"]["Enums"]["attendance_status"] | null
          record_id: string
          school_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["attendance_status"] | null
          note?: string | null
          old_status?: Database["public"]["Enums"]["attendance_status"] | null
          record_id: string
          school_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          new_status?: Database["public"]["Enums"]["attendance_status"] | null
          note?: string | null
          old_status?: Database["public"]["Enums"]["attendance_status"] | null
          record_id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_audit_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "attendance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_audit_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          arm_id: string | null
          class_id: string | null
          created_at: string
          date: string
          edited_at: string | null
          edited_by: string | null
          id: string
          is_finalized: boolean
          marked_at: string
          marked_by: string | null
          remark: string | null
          school_id: string
          session_id: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          subject_id: string | null
          term_id: string | null
          updated_at: string
        }
        Insert: {
          arm_id?: string | null
          class_id?: string | null
          created_at?: string
          date: string
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          is_finalized?: boolean
          marked_at?: string
          marked_by?: string | null
          remark?: string | null
          school_id: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          subject_id?: string | null
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          arm_id?: string | null
          class_id?: string | null
          created_at?: string
          date?: string
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          is_finalized?: boolean
          marked_at?: string
          marked_by?: string | null
          remark?: string | null
          school_id?: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          subject_id?: string | null
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_arm_id_fkey"
            columns: ["arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          module: string
          school_id: string
          status: Database["public"]["Enums"]["audit_status"]
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          module: string
          school_id: string
          status?: Database["public"]["Enums"]["audit_status"]
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          module?: string
          school_id?: string
          status?: Database["public"]["Enums"]["audit_status"]
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          school_id: string
          size_bytes: number | null
          started_at: string
          status: Database["public"]["Enums"]["backup_job_status"]
          storage_path: string | null
          tables_included: string[] | null
          type: Database["public"]["Enums"]["backup_job_type"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          school_id: string
          size_bytes?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["backup_job_status"]
          storage_path?: string | null
          tables_included?: string[] | null
          type?: Database["public"]["Enums"]["backup_job_type"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          school_id?: string
          size_bytes?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["backup_job_status"]
          storage_path?: string | null
          tables_included?: string[] | null
          type?: Database["public"]["Enums"]["backup_job_type"]
        }
        Relationships: [
          {
            foreignKeyName: "backup_jobs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      branding_settings: {
        Row: {
          accent_color: string | null
          custom_domain: string | null
          favicon_url: string | null
          login_background_url: string | null
          primary_color: string | null
          school_id: string
          theme_mode: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          custom_domain?: string | null
          favicon_url?: string | null
          login_background_url?: string | null
          primary_color?: string | null
          school_id: string
          theme_mode?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          custom_domain?: string | null
          favicon_url?: string | null
          login_background_url?: string | null
          primary_color?: string | null
          school_id?: string
          theme_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branding_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_attempt_answers: {
        Row: {
          answer_text: string | null
          answered_at: string
          attempt_id: string
          graded_by: string | null
          id: string
          is_correct: boolean | null
          marks_awarded: number | null
          question_id: string
          school_id: string
        }
        Insert: {
          answer_text?: string | null
          answered_at?: string
          attempt_id: string
          graded_by?: string | null
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id: string
          school_id: string
        }
        Update: {
          answer_text?: string | null
          answered_at?: string
          attempt_id?: string
          graded_by?: string | null
          id?: string
          is_correct?: boolean | null
          marks_awarded?: number | null
          question_id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbt_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "cbt_exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "cbt_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_attempt_answers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_exam_attempts: {
        Row: {
          attempt_number: number
          auto_score: number | null
          created_at: string
          exam_id: string
          id: string
          needs_manual_grading: boolean
          question_order: Json | null
          school_id: string
          score: number | null
          started_at: string
          status: Database["public"]["Enums"]["cbt_attempt_status"]
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          attempt_number?: number
          auto_score?: number | null
          created_at?: string
          exam_id: string
          id?: string
          needs_manual_grading?: boolean
          question_order?: Json | null
          school_id: string
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["cbt_attempt_status"]
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          attempt_number?: number
          auto_score?: number | null
          created_at?: string
          exam_id?: string
          id?: string
          needs_manual_grading?: boolean
          question_order?: Json | null
          school_id?: string
          score?: number | null
          started_at?: string
          status?: Database["public"]["Enums"]["cbt_attempt_status"]
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cbt_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "cbt_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_exam_attempts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_exam_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_exam_questions: {
        Row: {
          display_order: number
          exam_id: string
          id: string
          marks_override: number | null
          question_id: string
          school_id: string
        }
        Insert: {
          display_order?: number
          exam_id: string
          id?: string
          marks_override?: number | null
          question_id: string
          school_id: string
        }
        Update: {
          display_order?: number
          exam_id?: string
          id?: string
          marks_override?: number | null
          question_id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbt_exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "cbt_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_exam_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "cbt_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_exam_questions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_exams: {
        Row: {
          allow_review: boolean
          arm_id: string | null
          class_id: string | null
          created_at: string
          created_by: string | null
          duration_minutes: number
          ends_at: string | null
          id: string
          instructions: string | null
          max_attempts: number
          pass_mark: number | null
          school_id: string
          show_results_immediately: boolean
          shuffle_options: boolean
          shuffle_questions: boolean
          starts_at: string | null
          status: Database["public"]["Enums"]["cbt_exam_status"]
          subject_id: string | null
          term_id: string | null
          title: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          allow_review?: boolean
          arm_id?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          ends_at?: string | null
          id?: string
          instructions?: string | null
          max_attempts?: number
          pass_mark?: number | null
          school_id: string
          show_results_immediately?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          starts_at?: string | null
          status?: Database["public"]["Enums"]["cbt_exam_status"]
          subject_id?: string | null
          term_id?: string | null
          title: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          allow_review?: boolean
          arm_id?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          ends_at?: string | null
          id?: string
          instructions?: string | null
          max_attempts?: number
          pass_mark?: number | null
          school_id?: string
          show_results_immediately?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          starts_at?: string | null
          status?: Database["public"]["Enums"]["cbt_exam_status"]
          subject_id?: string | null
          term_id?: string | null
          title?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbt_exams_arm_id_fkey"
            columns: ["arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_exams_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_exams_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_question_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          school_id: string
          subject_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          school_id: string
          subject_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cbt_question_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_question_categories_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      cbt_questions: {
        Row: {
          category_id: string | null
          correct_answer: string | null
          created_at: string
          created_by: string | null
          difficulty: string
          explanation: string | null
          id: string
          image_url: string | null
          is_active: boolean
          marks: number
          options: Json | null
          question_text: string
          question_type: Database["public"]["Enums"]["cbt_question_type"]
          school_id: string
          subject_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          correct_answer?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          marks?: number
          options?: Json | null
          question_text: string
          question_type?: Database["public"]["Enums"]["cbt_question_type"]
          school_id: string
          subject_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          correct_answer?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          marks?: number
          options?: Json | null
          question_text?: string
          question_type?: Database["public"]["Enums"]["cbt_question_type"]
          school_id?: string
          subject_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbt_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cbt_question_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_questions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbt_questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      class_arms: {
        Row: {
          class_id: string
          created_at: string
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_arms_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_arms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          school_id: string
          section_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          school_id: string
          section_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          school_id?: string
          section_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          head_staff_id: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          head_staff_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          head_staff_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_staff_id_fkey"
            columns: ["head_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
          notes: string | null
          receipt_url: string | null
          recurrence_note: string | null
          recurring: boolean
          school_id: string
          status: Database["public"]["Enums"]["expense_status"]
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          recurrence_note?: string | null
          recurring?: boolean
          school_id: string
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          recurrence_note?: string | null
          recurring?: boolean
          school_id?: string
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_categories: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          amount: number
          arm_id: string | null
          category_id: string
          class_id: string | null
          created_at: string
          description: string | null
          discount_amount: number
          due_date: string | null
          id: string
          is_active: boolean
          mandatory: boolean
          penalty_amount: number
          school_id: string
          session_id: string | null
          term_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          arm_id?: string | null
          category_id: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          is_active?: boolean
          mandatory?: boolean
          penalty_amount?: number
          school_id: string
          session_id?: string | null
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          arm_id?: string | null
          category_id?: string
          class_id?: string | null
          created_at?: string
          description?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          is_active?: boolean
          mandatory?: boolean
          penalty_amount?: number
          school_id?: string
          session_id?: string | null
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_arm_id_fkey"
            columns: ["arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_audit: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          detail: Json | null
          entity: string
          entity_id: string | null
          id: string
          school_id: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          detail?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
          school_id: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          detail?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_audit_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_scales: {
        Row: {
          created_at: string
          display_order: number
          grade: string
          id: string
          max_score: number
          min_score: number
          remark: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          grade: string
          id?: string
          max_score: number
          min_score: number
          remark?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          grade?: string
          id?: string
          max_score?: number
          min_score?: number
          remark?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_scales_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          arm_id: string | null
          class_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          is_published: boolean
          school_id: string
          subject_id: string
          teacher_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          arm_id?: string | null
          class_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          is_published?: boolean
          school_id: string
          subject_id: string
          teacher_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          arm_id?: string | null
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          is_published?: boolean
          school_id?: string
          subject_id?: string
          teacher_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_arm_id_fkey"
            columns: ["arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_submissions: {
        Row: {
          content: string | null
          feedback: string | null
          grade: string | null
          graded_at: string | null
          graded_by: string | null
          homework_id: string
          id: string
          school_id: string
          student_id: string
          submitted_at: string
        }
        Insert: {
          content?: string | null
          feedback?: string | null
          grade?: string | null
          graded_at?: string | null
          graded_by?: string | null
          homework_id: string
          id?: string
          school_id: string
          student_id: string
          submitted_at?: string
        }
        Update: {
          content?: string | null
          feedback?: string | null
          grade?: string | null
          graded_at?: string | null
          graded_by?: string | null
          homework_id?: string
          id?: string
          school_id?: string
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_allocations: {
        Row: {
          bed_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          notes: string | null
          school_id: string
          start_date: string
          status: Database["public"]["Enums"]["hostel_allocation_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          bed_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          school_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["hostel_allocation_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          bed_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          notes?: string | null
          school_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["hostel_allocation_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_allocations_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "hostel_beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_beds: {
        Row: {
          bed_code: string
          created_at: string
          id: string
          room_id: string
          school_id: string
          status: Database["public"]["Enums"]["hostel_bed_status"]
          updated_at: string
        }
        Insert: {
          bed_code: string
          created_at?: string
          id?: string
          room_id: string
          school_id: string
          status?: Database["public"]["Enums"]["hostel_bed_status"]
          updated_at?: string
        }
        Update: {
          bed_code?: string
          created_at?: string
          id?: string
          room_id?: string
          school_id?: string
          status?: Database["public"]["Enums"]["hostel_bed_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_beds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hostel_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_beds_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_fees: {
        Row: {
          amount: number
          created_at: string
          hostel_id: string | null
          id: string
          is_active: boolean
          school_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          hostel_id?: string | null
          id?: string
          is_active?: boolean
          school_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          hostel_id?: string | null
          id?: string
          is_active?: boolean
          school_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_fees_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_fees_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_rooms: {
        Row: {
          capacity: number
          created_at: string
          floor: string | null
          hostel_id: string
          id: string
          room_number: string
          school_id: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          floor?: string | null
          hostel_id: string
          id?: string
          room_number: string
          school_id: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          floor?: string | null
          hostel_id?: string
          id?: string
          room_number?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_rooms_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_rooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      hostels: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          type: Database["public"]["Enums"]["hostel_type"]
          updated_at: string
          warden_staff_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          type?: Database["public"]["Enums"]["hostel_type"]
          updated_at?: string
          warden_staff_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          type?: Database["public"]["Enums"]["hostel_type"]
          updated_at?: string
          warden_staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostels_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostels_warden_staff_id_fkey"
            columns: ["warden_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_providers: {
        Row: {
          category: Database["public"]["Enums"]["integration_category"]
          config: Json
          connected_at: string | null
          created_at: string
          display_name: string
          id: string
          is_enabled: boolean
          provider_key: string
          school_id: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["integration_category"]
          config?: Json
          connected_at?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_enabled?: boolean
          provider_key: string
          school_id: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["integration_category"]
          config?: Json
          connected_at?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_enabled?: boolean
          provider_key?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_providers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          discount: number
          fee_structure_id: string | null
          id: string
          invoice_id: string
          penalty: number
          quantity: number
          school_id: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description: string
          discount?: number
          fee_structure_id?: string | null
          id?: string
          invoice_id: string
          penalty?: number
          quantity?: number
          school_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          discount?: number
          fee_structure_id?: string | null
          id?: string
          invoice_id?: string
          penalty?: number
          quantity?: number
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          arm_id: string | null
          balance: number | null
          class_id: string | null
          created_at: string
          created_by: string | null
          discount_total: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          penalty_total: number
          school_id: string
          session_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          subtotal: number
          term_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          arm_id?: string | null
          balance?: number | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_total?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          penalty_total?: number
          school_id: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          subtotal?: number
          term_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          arm_id?: string | null
          balance?: number | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_total?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          penalty_total?: number
          school_id?: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id?: string
          subtotal?: number
          term_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_arm_id_fkey"
            columns: ["arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      library_authors: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_authors_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      library_book_copies: {
        Row: {
          book_id: string
          condition_note: string | null
          copy_code: string
          created_at: string
          id: string
          school_id: string
          status: Database["public"]["Enums"]["library_copy_status"]
          updated_at: string
        }
        Insert: {
          book_id: string
          condition_note?: string | null
          copy_code: string
          created_at?: string
          id?: string
          school_id: string
          status?: Database["public"]["Enums"]["library_copy_status"]
          updated_at?: string
        }
        Update: {
          book_id?: string
          condition_note?: string | null
          copy_code?: string
          created_at?: string
          id?: string
          school_id?: string
          status?: Database["public"]["Enums"]["library_copy_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_book_copies_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "library_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_book_copies_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      library_books: {
        Row: {
          author_id: string | null
          category_id: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          edition: string | null
          id: string
          isbn: string | null
          publication_year: number | null
          publisher: string | null
          school_id: string
          shelf_location: string | null
          title: string
          total_copies: number
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          edition?: string | null
          id?: string
          isbn?: string | null
          publication_year?: number | null
          publisher?: string | null
          school_id: string
          shelf_location?: string | null
          title: string
          total_copies?: number
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          edition?: string | null
          id?: string
          isbn?: string | null
          publication_year?: number | null
          publisher?: string | null
          school_id?: string
          shelf_location?: string | null
          title?: string
          total_copies?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_books_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "library_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_books_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "library_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_books_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      library_borrowings: {
        Row: {
          book_id: string
          borrowed_at: string
          borrower_type: Database["public"]["Enums"]["library_borrower_type"]
          copy_id: string
          created_at: string
          due_date: string
          fine_amount: number
          fine_paid: boolean
          id: string
          issued_by: string | null
          notes: string | null
          returned_at: string | null
          school_id: string
          staff_id: string | null
          status: Database["public"]["Enums"]["library_borrowing_status"]
          student_id: string | null
          updated_at: string
        }
        Insert: {
          book_id: string
          borrowed_at?: string
          borrower_type: Database["public"]["Enums"]["library_borrower_type"]
          copy_id: string
          created_at?: string
          due_date: string
          fine_amount?: number
          fine_paid?: boolean
          id?: string
          issued_by?: string | null
          notes?: string | null
          returned_at?: string | null
          school_id: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["library_borrowing_status"]
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          borrowed_at?: string
          borrower_type?: Database["public"]["Enums"]["library_borrower_type"]
          copy_id?: string
          created_at?: string
          due_date?: string
          fine_amount?: number
          fine_paid?: boolean
          id?: string
          issued_by?: string | null
          notes?: string | null
          returned_at?: string | null
          school_id?: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["library_borrowing_status"]
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_borrowings_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "library_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_borrowings_copy_id_fkey"
            columns: ["copy_id"]
            isOneToOne: false
            referencedRelation: "library_book_copies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_borrowings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_borrowings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_borrowings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      library_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          parent_message_id: string | null
          read_at: string | null
          recipient_id: string
          school_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          parent_message_id?: string | null
          read_at?: string | null
          recipient_id: string
          school_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          parent_message_id?: string | null
          read_at?: string | null
          recipient_id?: string
          school_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          digest_frequency: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          school_id: string
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          digest_frequency?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          school_id: string
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          digest_frequency?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          school_id?: string
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["template_channel"]
          created_at: string
          event_key: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          channel: Database["public"]["Enums"]["template_channel"]
          created_at?: string
          event_key: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["template_channel"]
          created_at?: string
          event_key?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          metadata: Json | null
          read_at: string | null
          school_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          read_at?: string | null
          school_id: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          read_at?: string | null
          school_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_student_links: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          parent_user_id: string
          relationship: string | null
          school_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          parent_user_id: string
          relationship?: string | null
          school_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          parent_user_id?: string
          relationship?: string | null
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_student_links_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_student_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          cashier_id: string | null
          created_at: string
          id: string
          invoice_id: string | null
          metadata: Json | null
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string
          payment_code: string
          reference: string | null
          school_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          cashier_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          payment_code: string
          reference?: string | null
          school_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          cashier_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json | null
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          payment_code?: string
          reference?: string | null
          school_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          balance_after: number
          id: string
          invoice_id: string | null
          issued_at: string
          issued_by: string | null
          payment_id: string
          receipt_number: string
          school_id: string
          student_id: string
          verification_token: string
        }
        Insert: {
          amount: number
          balance_after?: number
          id?: string
          invoice_id?: string | null
          issued_at?: string
          issued_by?: string | null
          payment_id: string
          receipt_number: string
          school_id: string
          student_id: string
          verification_token?: string
        }
        Update: {
          amount?: number
          balance_after?: number
          id?: string
          invoice_id?: string | null
          issued_at?: string
          issued_by?: string | null
          payment_id?: string
          receipt_number?: string
          school_id?: string
          student_id?: string
          verification_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      result_audit: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          from_status:
            | Database["public"]["Enums"]["result_workflow_status"]
            | null
          id: string
          note: string | null
          school_id: string
          sheet_id: string | null
          student_id: string | null
          to_status:
            | Database["public"]["Enums"]["result_workflow_status"]
            | null
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["result_workflow_status"]
            | null
          id?: string
          note?: string | null
          school_id: string
          sheet_id?: string | null
          student_id?: string | null
          to_status?:
            | Database["public"]["Enums"]["result_workflow_status"]
            | null
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          from_status?:
            | Database["public"]["Enums"]["result_workflow_status"]
            | null
          id?: string
          note?: string | null
          school_id?: string
          sheet_id?: string | null
          student_id?: string | null
          to_status?:
            | Database["public"]["Enums"]["result_workflow_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "result_audit_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_audit_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "result_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_audit_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      result_meta: {
        Row: {
          arm_id: string | null
          attendance_absent: number | null
          attendance_present: number | null
          attendance_total: number | null
          class_id: string | null
          created_at: string
          form_teacher_comment: string | null
          id: string
          is_published: boolean
          next_resumption: string | null
          principal_comment: string | null
          promotion: Database["public"]["Enums"]["promotion_status"] | null
          published_at: string | null
          published_by: string | null
          school_id: string
          session_id: string | null
          student_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          arm_id?: string | null
          attendance_absent?: number | null
          attendance_present?: number | null
          attendance_total?: number | null
          class_id?: string | null
          created_at?: string
          form_teacher_comment?: string | null
          id?: string
          is_published?: boolean
          next_resumption?: string | null
          principal_comment?: string | null
          promotion?: Database["public"]["Enums"]["promotion_status"] | null
          published_at?: string | null
          published_by?: string | null
          school_id: string
          session_id?: string | null
          student_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          arm_id?: string | null
          attendance_absent?: number | null
          attendance_present?: number | null
          attendance_total?: number | null
          class_id?: string | null
          created_at?: string
          form_teacher_comment?: string | null
          id?: string
          is_published?: boolean
          next_resumption?: string | null
          principal_comment?: string | null
          promotion?: Database["public"]["Enums"]["promotion_status"] | null
          published_at?: string | null
          published_by?: string | null
          school_id?: string
          session_id?: string | null
          student_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "result_meta_arm_id_fkey"
            columns: ["arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_meta_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_meta_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_meta_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_meta_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_meta_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      result_scores: {
        Row: {
          arm_id: string | null
          class_id: string | null
          component_id: string
          created_at: string
          entered_by: string | null
          id: string
          school_id: string
          score: number | null
          session_id: string | null
          sheet_id: string | null
          student_id: string
          subject_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          arm_id?: string | null
          class_id?: string | null
          component_id: string
          created_at?: string
          entered_by?: string | null
          id?: string
          school_id: string
          score?: number | null
          session_id?: string | null
          sheet_id?: string | null
          student_id: string
          subject_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          arm_id?: string | null
          class_id?: string | null
          component_id?: string
          created_at?: string
          entered_by?: string | null
          id?: string
          school_id?: string
          score?: number | null
          session_id?: string | null
          sheet_id?: string | null
          student_id?: string
          subject_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "result_scores_arm_id_fkey"
            columns: ["arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_scores_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_scores_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "assessment_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_scores_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_scores_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "result_sheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_scores_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_scores_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      result_sheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          arm_id: string | null
          class_id: string | null
          created_at: string
          created_by: string | null
          id: string
          published_at: string | null
          published_by: string | null
          rejected_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_id: string
          session_id: string | null
          status: Database["public"]["Enums"]["result_workflow_status"]
          subject_id: string | null
          submitted_at: string | null
          submitted_by: string | null
          teacher_comment: string | null
          term_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          arm_id?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          published_by?: string | null
          rejected_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["result_workflow_status"]
          subject_id?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          teacher_comment?: string | null
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          arm_id?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          published_at?: string | null
          published_by?: string | null
          rejected_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id?: string
          session_id?: string | null
          status?: Database["public"]["Enums"]["result_workflow_status"]
          subject_id?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          teacher_comment?: string | null
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "result_sheets_arm_id_fkey"
            columns: ["arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_sheets_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_sheets_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_sheets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_sheets_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "result_sheets_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      school_settings: {
        Row: {
          attendance: Json
          created_at: string
          email: Json
          promotion: Json
          results: Json
          school_id: string
          sms: Json
          updated_at: string
        }
        Insert: {
          attendance?: Json
          created_at?: string
          email?: Json
          promotion?: Json
          results?: Json
          school_id: string
          sms?: Json
          updated_at?: string
        }
        Update: {
          attendance?: Json
          created_at?: string
          email?: Json
          promotion?: Json
          results?: Json
          school_id?: string
          sms?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          administrator_name: string | null
          closing_date: string | null
          country: string
          cover_url: string | null
          created_at: string
          currency: string | null
          email: string | null
          id: string
          lga: string | null
          logo_url: string | null
          motto: string | null
          name: string
          phone: string | null
          primary_color: string | null
          principal_name: string | null
          resumption_date: string | null
          school_time_end: string | null
          school_time_start: string | null
          school_type: string
          secondary_color: string | null
          state: string | null
          timezone: string | null
          updated_at: string
          vice_principal_name: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          administrator_name?: string | null
          closing_date?: string | null
          country: string
          cover_url?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          lga?: string | null
          logo_url?: string | null
          motto?: string | null
          name: string
          phone?: string | null
          primary_color?: string | null
          principal_name?: string | null
          resumption_date?: string | null
          school_time_end?: string | null
          school_time_start?: string | null
          school_type: string
          secondary_color?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          vice_principal_name?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          administrator_name?: string | null
          closing_date?: string | null
          country?: string
          cover_url?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          lga?: string | null
          logo_url?: string | null
          motto?: string | null
          name?: string
          phone?: string | null
          primary_color?: string | null
          principal_name?: string | null
          resumption_date?: string | null
          school_time_end?: string | null
          school_time_start?: string | null
          school_type?: string
          secondary_color?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          vice_principal_name?: string | null
          website?: string | null
        }
        Relationships: []
      }
      sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employment_date: string | null
          full_name: string
          gender: Database["public"]["Enums"]["staff_gender"] | null
          id: string
          is_teaching: boolean
          metadata: Json
          phone: string | null
          photo_url: string | null
          position: Database["public"]["Enums"]["staff_position"]
          qualification: string | null
          salary: number | null
          school_id: string
          specialization: string | null
          staff_code: string
          status: Database["public"]["Enums"]["staff_status"]
          status_changed_at: string | null
          status_note: string | null
          updated_at: string
          user_id: string | null
          username: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_date?: string | null
          full_name: string
          gender?: Database["public"]["Enums"]["staff_gender"] | null
          id?: string
          is_teaching?: boolean
          metadata?: Json
          phone?: string | null
          photo_url?: string | null
          position?: Database["public"]["Enums"]["staff_position"]
          qualification?: string | null
          salary?: number | null
          school_id: string
          specialization?: string | null
          staff_code: string
          status?: Database["public"]["Enums"]["staff_status"]
          status_changed_at?: string | null
          status_note?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employment_date?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["staff_gender"] | null
          id?: string
          is_teaching?: boolean
          metadata?: Json
          phone?: string | null
          photo_url?: string | null
          position?: Database["public"]["Enums"]["staff_position"]
          qualification?: string | null
          salary?: number | null
          school_id?: string
          specialization?: string | null
          staff_code?: string
          status?: Database["public"]["Enums"]["staff_status"]
          status_changed_at?: string | null
          status_note?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_assignments: {
        Row: {
          assignment_type: string
          class_arm_id: string | null
          class_id: string | null
          club_name: string | null
          created_at: string
          department: string | null
          id: string
          school_id: string
          session_id: string | null
          staff_id: string
          subject_id: string | null
          updated_at: string
        }
        Insert: {
          assignment_type: string
          class_arm_id?: string | null
          class_id?: string | null
          club_name?: string | null
          created_at?: string
          department?: string | null
          id?: string
          school_id: string
          session_id?: string | null
          staff_id: string
          subject_id?: string | null
          updated_at?: string
        }
        Update: {
          assignment_type?: string
          class_arm_id?: string | null
          class_id?: string | null
          club_name?: string | null
          created_at?: string
          department?: string | null
          id?: string
          school_id?: string
          session_id?: string | null
          staff_id?: string
          subject_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_assignments_class_arm_id_fkey"
            columns: ["class_arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          attendance_date: string
          check_in: string | null
          check_out: string | null
          created_at: string
          id: string
          note: string | null
          school_id: string
          staff_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        Insert: {
          attendance_date: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          id?: string
          note?: string | null
          school_id: string
          staff_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          id?: string
          note?: string | null
          school_id?: string
          staff_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_documents: {
        Row: {
          created_at: string
          file_path: string
          id: string
          kind: string | null
          mime_type: string | null
          school_id: string
          size_bytes: number | null
          staff_id: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          kind?: string | null
          mime_type?: string | null
          school_id: string
          size_bytes?: number | null
          staff_id: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          kind?: string | null
          mime_type?: string | null
          school_id?: string
          size_bytes?: number | null
          staff_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_documents_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_id: string
          staff_id: string
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id: string
          staff_id: string
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id?: string
          staff_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_leave_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_leave_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      student_documents: {
        Row: {
          content_type: string | null
          created_at: string
          doc_type: string
          id: string
          name: string
          school_id: string
          size_bytes: number | null
          storage_path: string
          student_id: string
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          doc_type: string
          id?: string
          name: string
          school_id: string
          size_bytes?: number | null
          storage_path: string
          student_id: string
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          doc_type?: string
          id?: string
          name?: string
          school_id?: string
          size_bytes?: number | null
          storage_path?: string
          student_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_emergency: boolean
          is_primary: boolean
          occupation: string | null
          phone: string | null
          relationship: string
          school_id: string
          student_id: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_emergency?: boolean
          is_primary?: boolean
          occupation?: string | null
          phone?: string | null
          relationship: string
          school_id: string
          student_id: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_emergency?: boolean
          is_primary?: boolean
          occupation?: string | null
          phone?: string | null
          relationship?: string
          school_id?: string
          student_id?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_guardians_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_status_history: {
        Row: {
          action: string
          created_at: string
          from_class_id: string | null
          from_status: Database["public"]["Enums"]["student_status"] | null
          id: string
          note: string | null
          performed_by: string | null
          school_id: string
          student_id: string
          to_class_id: string | null
          to_status: Database["public"]["Enums"]["student_status"] | null
        }
        Insert: {
          action: string
          created_at?: string
          from_class_id?: string | null
          from_status?: Database["public"]["Enums"]["student_status"] | null
          id?: string
          note?: string | null
          performed_by?: string | null
          school_id: string
          student_id: string
          to_class_id?: string | null
          to_status?: Database["public"]["Enums"]["student_status"] | null
        }
        Update: {
          action?: string
          created_at?: string
          from_class_id?: string | null
          from_status?: Database["public"]["Enums"]["student_status"] | null
          id?: string
          note?: string | null
          performed_by?: string | null
          school_id?: string
          student_id?: string
          to_class_id?: string | null
          to_status?: Database["public"]["Enums"]["student_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "student_status_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_status_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          admission_date: string
          admission_number: string
          arm_id: string | null
          blood_group: string | null
          class_id: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          disabilities: string | null
          email: string | null
          first_name: string
          gender: Database["public"]["Enums"]["student_gender"]
          genotype: string | null
          home_address: string | null
          hostel: string | null
          house: string | null
          id: string
          lga: string | null
          medical_conditions: string | null
          middle_name: string | null
          nationality: string | null
          photo_url: string | null
          previous_school: string | null
          religion: string | null
          school_id: string
          state_of_origin: string | null
          status: Database["public"]["Enums"]["student_status"]
          status_changed_at: string | null
          status_note: string | null
          student_code: string
          surname: string
          transport_route: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admission_date?: string
          admission_number: string
          arm_id?: string | null
          blood_group?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          disabilities?: string | null
          email?: string | null
          first_name: string
          gender: Database["public"]["Enums"]["student_gender"]
          genotype?: string | null
          home_address?: string | null
          hostel?: string | null
          house?: string | null
          id?: string
          lga?: string | null
          medical_conditions?: string | null
          middle_name?: string | null
          nationality?: string | null
          photo_url?: string | null
          previous_school?: string | null
          religion?: string | null
          school_id: string
          state_of_origin?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          status_changed_at?: string | null
          status_note?: string | null
          student_code: string
          surname: string
          transport_route?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admission_date?: string
          admission_number?: string
          arm_id?: string | null
          blood_group?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          disabilities?: string | null
          email?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["student_gender"]
          genotype?: string | null
          home_address?: string | null
          hostel?: string | null
          house?: string | null
          id?: string
          lga?: string | null
          medical_conditions?: string | null
          middle_name?: string | null
          nationality?: string | null
          photo_url?: string | null
          previous_school?: string | null
          religion?: string | null
          school_id?: string
          state_of_origin?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          status_changed_at?: string | null
          status_note?: string | null
          student_code?: string
          surname?: string
          transport_route?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_arm_id_fkey"
            columns: ["arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          category: Database["public"]["Enums"]["subject_category"]
          code: string | null
          created_at: string
          department: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["subject_category"]
          code?: string | null
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["subject_category"]
          code?: string | null
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_current: boolean
          name: string
          school_id: string
          session_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          name: string
          school_id: string
          session_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          name?: string
          school_id?: string
          session_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_periods: {
        Row: {
          arm_id: string | null
          class_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          day_of_week: number
          end_time: string
          id: string
          kind: Database["public"]["Enums"]["period_kind"]
          note: string | null
          period_index: number
          room: string | null
          school_id: string
          session_id: string | null
          start_time: string
          subject_id: string | null
          teacher_id: string | null
          term_id: string | null
          updated_at: string
        }
        Insert: {
          arm_id?: string | null
          class_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          day_of_week: number
          end_time: string
          id?: string
          kind?: Database["public"]["Enums"]["period_kind"]
          note?: string | null
          period_index: number
          room?: string | null
          school_id: string
          session_id?: string | null
          start_time: string
          subject_id?: string | null
          teacher_id?: string | null
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          arm_id?: string | null
          class_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          kind?: Database["public"]["Enums"]["period_kind"]
          note?: string | null
          period_index?: number
          room?: string | null
          school_id?: string
          session_id?: string | null
          start_time?: string
          subject_id?: string | null
          teacher_id?: string | null
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_periods_arm_id_fkey"
            columns: ["arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_periods_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_periods_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_periods_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_periods_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_periods_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_periods_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_versions: {
        Row: {
          arm_id: string | null
          class_id: string | null
          created_at: string
          created_by: string | null
          id: string
          label: string | null
          school_id: string
          session_id: string | null
          snapshot: Json
          term_id: string | null
        }
        Insert: {
          arm_id?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          school_id: string
          session_id?: string | null
          snapshot: Json
          term_id?: string | null
        }
        Update: {
          arm_id?: string | null
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string | null
          school_id?: string
          session_id?: string | null
          snapshot?: Json
          term_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_versions_arm_id_fkey"
            columns: ["arm_id"]
            isOneToOne: false
            referencedRelation: "class_arms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_versions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_versions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_versions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_versions_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_drivers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          license_expiry: string | null
          license_number: string | null
          phone: string | null
          photo_url: string | null
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          license_expiry?: string | null
          license_number?: string | null
          phone?: string | null
          photo_url?: string | null
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          license_expiry?: string | null
          license_number?: string | null
          phone?: string | null
          photo_url?: string | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_drivers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_fee_structures: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_active: boolean
          route_id: string | null
          school_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_active?: boolean
          route_id?: string | null
          school_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          route_id?: string | null
          school_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_fee_structures_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_fee_structures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_fee_structures_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_fuel_logs: {
        Row: {
          cost: number
          created_at: string
          created_by: string | null
          id: string
          litres: number
          logged_date: string
          odometer_reading: number | null
          school_id: string
          vehicle_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          created_by?: string | null
          id?: string
          litres: number
          logged_date?: string
          odometer_reading?: number | null
          school_id: string
          vehicle_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          created_by?: string | null
          id?: string
          litres?: number
          logged_date?: string
          odometer_reading?: number | null
          school_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_fuel_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_maintenance_records: {
        Row: {
          cost: number
          created_at: string
          created_by: string | null
          description: string
          id: string
          next_service_date: string | null
          school_id: string
          service_date: string
          vehicle_id: string
          vendor: string | null
        }
        Insert: {
          cost?: number
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          next_service_date?: string | null
          school_id: string
          service_date?: string
          vehicle_id: string
          vendor?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          next_service_date?: string | null
          school_id?: string
          service_date?: string
          vehicle_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_maintenance_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_routes: {
        Row: {
          created_at: string
          departure_time: string | null
          driver_id: string | null
          id: string
          is_active: boolean
          name: string
          return_time: string | null
          school_id: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          departure_time?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          return_time?: string | null
          school_id: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          departure_time?: string | null
          driver_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          return_time?: string | null
          school_id?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "transport_drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_routes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_routes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "transport_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_stops: {
        Row: {
          created_at: string
          display_order: number
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          pickup_time: string | null
          route_id: string
          school_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          pickup_time?: string | null
          route_id: string
          school_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          pickup_time?: string | null
          route_id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_stops_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_student_assignments: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          route_id: string
          school_id: string
          start_date: string
          status: Database["public"]["Enums"]["transport_assignment_status"]
          stop_id: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          route_id: string
          school_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["transport_assignment_status"]
          stop_id?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          route_id?: string
          school_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["transport_assignment_status"]
          stop_id?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_student_assignments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_student_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_student_assignments_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "transport_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_student_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_vehicles: {
        Row: {
          capacity: number
          created_at: string
          id: string
          make: string | null
          model: string | null
          name: string
          notes: string | null
          plate_number: string
          school_id: string
          status: Database["public"]["Enums"]["transport_vehicle_status"]
          updated_at: string
          year: number | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          make?: string | null
          model?: string | null
          name: string
          notes?: string | null
          plate_number: string
          school_id: string
          status?: Database["public"]["Enums"]["transport_vehicle_status"]
          updated_at?: string
          year?: number | null
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          make?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          plate_number?: string
          school_id?: string
          status?: Database["public"]["Enums"]["transport_vehicle_status"]
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_vehicles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_assign_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _school_id: string
          _user_id: string
        }
        Returns: undefined
      }
      admin_list_school_users: {
        Args: { _school_id: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          roles: Database["public"]["Enums"]["app_role"][]
          user_id: string
        }[]
      }
      admin_revoke_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _school_id: string
          _user_id: string
        }
        Returns: undefined
      }
      can_manage_cbt: { Args: { _school_id: string }; Returns: boolean }
      can_manage_finance: { Args: { _school_id: string }; Returns: boolean }
      can_manage_hostel: { Args: { _school_id: string }; Returns: boolean }
      can_manage_inventory: { Args: { _school_id: string }; Returns: boolean }
      can_manage_library: { Args: { _school_id: string }; Returns: boolean }
      can_manage_settings: { Args: { _school_id: string }; Returns: boolean }
      can_manage_transport: { Args: { _school_id: string }; Returns: boolean }
      cbt_start_attempt: {
        Args: { _exam_id: string; _student_id: string }
        Returns: string
      }
      cbt_submit_attempt: { Args: { _attempt_id: string }; Returns: number }
      create_school_workspace: {
        Args: {
          _address?: string
          _country?: string
          _email?: string
          _name: string
          _phone?: string
          _school_type?: string
          _state?: string
        }
        Returns: string
      }
      ensure_my_workspace: { Args: { _school_name?: string }; Returns: string }
      generate_invoices_for_class: {
        Args: {
          _arm_id?: string
          _class_id: string
          _school_id: string
          _term_id: string
        }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_parent_of: { Args: { _student_id: string }; Returns: boolean }
      is_school_admin_of: { Args: { _school_id: string }; Returns: boolean }
      is_school_member: { Args: { _school_id: string }; Returns: boolean }
      is_student_user: { Args: { _student_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      library_borrow_book: {
        Args: {
          _borrower_type: Database["public"]["Enums"]["library_borrower_type"]
          _copy_id: string
          _due_date?: string
          _staff_id?: string
          _student_id?: string
        }
        Returns: string
      }
      library_return_book: {
        Args: { _borrowing_id: string; _fine_per_day?: number }
        Returns: undefined
      }
      link_parent_to_student: {
        Args: {
          _parent_email: string
          _relationship?: string
          _school_id: string
          _student_id: string
        }
        Returns: string
      }
      log_audit_event: {
        Args: {
          _action: string
          _entity_id?: string
          _entity_type?: string
          _metadata?: Json
          _module: string
          _school_id: string
          _status?: Database["public"]["Enums"]["audit_status"]
        }
        Returns: string
      }
      publish_announcement: {
        Args: { _announcement_id: string }
        Returns: undefined
      }
      seed_default_assessments: {
        Args: { _school_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "school_admin"
        | "principal"
        | "vice_principal"
        | "form_teacher"
        | "subject_teacher"
        | "bursar"
        | "account_officer"
        | "librarian"
        | "receptionist"
        | "other_staff"
        | "parent"
        | "student"
      asset_condition: "new" | "good" | "fair" | "poor" | "damaged"
      asset_status: "in_use" | "in_store" | "under_repair" | "disposed" | "lost"
      attendance_status:
        | "present"
        | "absent"
        | "late"
        | "excused"
        | "remote"
        | "medical"
        | "half_day"
      audit_status: "success" | "failure"
      backup_job_status: "pending" | "running" | "completed" | "failed"
      backup_job_type: "manual" | "scheduled"
      cbt_attempt_status:
        | "in_progress"
        | "submitted"
        | "auto_submitted"
        | "graded"
      cbt_exam_status:
        | "draft"
        | "scheduled"
        | "active"
        | "completed"
        | "archived"
      cbt_question_type: "mcq" | "true_false" | "theory" | "fill_blank"
      expense_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "paid"
      hostel_allocation_status: "active" | "ended" | "transferred"
      hostel_bed_status: "available" | "occupied" | "maintenance"
      hostel_type: "boys" | "girls" | "mixed"
      integration_category:
        | "payments"
        | "email"
        | "sms"
        | "calendar"
        | "storage"
        | "ai"
        | "other"
      invoice_status:
        | "draft"
        | "issued"
        | "partial"
        | "paid"
        | "overdue"
        | "cancelled"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      library_borrower_type: "student" | "staff"
      library_borrowing_status: "active" | "returned" | "overdue" | "lost"
      library_copy_status:
        | "available"
        | "borrowed"
        | "reserved"
        | "lost"
        | "damaged"
        | "retired"
      payment_method:
        | "cash"
        | "bank_transfer"
        | "pos"
        | "card"
        | "online"
        | "cheque"
        | "scholarship"
        | "waiver"
        | "discount"
      period_kind: "class" | "break" | "lunch" | "assembly" | "free"
      promotion_status:
        | "promoted"
        | "repeat"
        | "conditional"
        | "graduated"
        | "pending"
      result_workflow_status:
        | "draft"
        | "pending_review"
        | "approved"
        | "published"
        | "rejected"
      staff_gender: "male" | "female" | "other"
      staff_position:
        | "principal"
        | "vice_principal"
        | "school_admin"
        | "form_teacher"
        | "subject_teacher"
        | "account_officer"
        | "receptionist"
        | "librarian"
        | "bursar"
        | "other"
      staff_status:
        | "active"
        | "on_leave"
        | "suspended"
        | "terminated"
        | "archived"
      student_gender: "male" | "female" | "other"
      student_status:
        | "active"
        | "graduated"
        | "transferred"
        | "suspended"
        | "withdrawn"
        | "archived"
      subject_category: "core" | "elective" | "practical"
      template_channel: "email" | "sms" | "in_app"
      transport_assignment_status: "active" | "suspended" | "ended"
      transport_vehicle_status: "active" | "maintenance" | "retired"
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
      app_role: [
        "super_admin",
        "school_admin",
        "principal",
        "vice_principal",
        "form_teacher",
        "subject_teacher",
        "bursar",
        "account_officer",
        "librarian",
        "receptionist",
        "other_staff",
        "parent",
        "student",
      ],
      asset_condition: ["new", "good", "fair", "poor", "damaged"],
      asset_status: ["in_use", "in_store", "under_repair", "disposed", "lost"],
      attendance_status: [
        "present",
        "absent",
        "late",
        "excused",
        "remote",
        "medical",
        "half_day",
      ],
      audit_status: ["success", "failure"],
      backup_job_status: ["pending", "running", "completed", "failed"],
      backup_job_type: ["manual", "scheduled"],
      cbt_attempt_status: [
        "in_progress",
        "submitted",
        "auto_submitted",
        "graded",
      ],
      cbt_exam_status: [
        "draft",
        "scheduled",
        "active",
        "completed",
        "archived",
      ],
      cbt_question_type: ["mcq", "true_false", "theory", "fill_blank"],
      expense_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "paid",
      ],
      hostel_allocation_status: ["active", "ended", "transferred"],
      hostel_bed_status: ["available", "occupied", "maintenance"],
      hostel_type: ["boys", "girls", "mixed"],
      integration_category: [
        "payments",
        "email",
        "sms",
        "calendar",
        "storage",
        "ai",
        "other",
      ],
      invoice_status: [
        "draft",
        "issued",
        "partial",
        "paid",
        "overdue",
        "cancelled",
      ],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      library_borrower_type: ["student", "staff"],
      library_borrowing_status: ["active", "returned", "overdue", "lost"],
      library_copy_status: [
        "available",
        "borrowed",
        "reserved",
        "lost",
        "damaged",
        "retired",
      ],
      payment_method: [
        "cash",
        "bank_transfer",
        "pos",
        "card",
        "online",
        "cheque",
        "scholarship",
        "waiver",
        "discount",
      ],
      period_kind: ["class", "break", "lunch", "assembly", "free"],
      promotion_status: [
        "promoted",
        "repeat",
        "conditional",
        "graduated",
        "pending",
      ],
      result_workflow_status: [
        "draft",
        "pending_review",
        "approved",
        "published",
        "rejected",
      ],
      staff_gender: ["male", "female", "other"],
      staff_position: [
        "principal",
        "vice_principal",
        "school_admin",
        "form_teacher",
        "subject_teacher",
        "account_officer",
        "receptionist",
        "librarian",
        "bursar",
        "other",
      ],
      staff_status: [
        "active",
        "on_leave",
        "suspended",
        "terminated",
        "archived",
      ],
      student_gender: ["male", "female", "other"],
      student_status: [
        "active",
        "graduated",
        "transferred",
        "suspended",
        "withdrawn",
        "archived",
      ],
      subject_category: ["core", "elective", "practical"],
      template_channel: ["email", "sms", "in_app"],
      transport_assignment_status: ["active", "suspended", "ended"],
      transport_vehicle_status: ["active", "maintenance", "retired"],
    },
  },
} as const
