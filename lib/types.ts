export interface ExamDate {
  date: string
  note?: string
}

export interface University {
  id: string
  slug: string
  name: string
  short_name: string
  logo: string | null
  exam_name: string
  exam_fee: string | null
  application_start: string
  application_end: string
  application_status: "upcoming" | "ongoing" | "closed"
  exam_dates: ExamDate[]
  results_release: string
  test_locations: string[]
  requirements: string[]
  admission_link: string
  academic_year: string // Added academic_year field
  created_at: string
  updated_at: string
}

export interface UniversityInput {
  slug: string
  name: string
  short_name: string
  logo?: string | null
  exam_name: string
  exam_fee?: string | null
  application_start: string
  application_end: string
  application_status: "upcoming" | "ongoing" | "closed"
  exam_dates: ExamDate[]
  results_release: string
  test_locations: string[]
  requirements: string[]
  admission_link: string
  academic_year?: string // Added academic_year field
}

export interface Announcement {
  id: string
  title: string
  message: string
  type: "info" | "warning" | "success" | "urgent"
  link_url: string | null
  link_text: string | null
  is_active: boolean
  starts_at: string
  ends_at: string | null
  created_at: string
  updated_at: string
}

export interface AnnouncementInput {
  title: string
  message: string
  type: "info" | "warning" | "success" | "urgent"
  link_url?: string | null
  link_text?: string | null
  is_active?: boolean
  starts_at?: string
  ends_at?: string | null
}
