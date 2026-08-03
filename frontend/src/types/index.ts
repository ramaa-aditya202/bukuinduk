export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin_tu' | 'guru' | 'wali_kelas';
  avatar?: string | null;
  is_sso?: boolean;
  created_at?: string;
}

export interface Student {
  id: string;
  name: string;
  nisn: string;
  nik: string;
  gender: 'L' | 'P';
  birth_place: string;
  birth_date: string;
  medical_history?: string | null;
  sibling_order: number;
  total_siblings: number;
  status: string[];
  tahun_masuk: number;
  guardian_type: 'ayah' | 'ibu' | 'orang_lain';
  entry_class_level?: string | null;
  student_status: 'aktif' | 'lulus' | 'pindah' | 'keluar' | 'nonaktif';
  photo_url?: string | null;
  current_class?: string;
  guardian_info?: GuardianInfo;
  academic_timeline?: AcademicTimelineEntry[];
  documents?: DocumentItem[];
  created_by?: User;
  updated_by?: User;
  created_at?: string;
  updated_at?: string;
}

export interface Guardian {
  id: string;
  student_id: string;
  type: 'ayah' | 'ibu' | 'wali';
  name: string;
  birth_place?: string | null;
  religion?: string | null;
  occupation?: string | null;
  income_per_month?: number | null;
  last_education?: string | null;
  phone_number?: string | null;
  address?: string | null;
  relationship_description?: string | null;
}

export interface GuardianInfo {
  type: 'ayah' | 'ibu' | 'orang_lain';
  label: string;
  name?: string;
  phone?: string;
  occupation?: string;
  relationship?: string;
}

export interface AcademicYear {
  id: string;
  label: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface ClassRoom {
  id: string;
  name: string;
  level: string;
  homeroom_teacher_id?: string | null;
  homeroom_teacher?: { id: string; name: string } | null;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  academic_year_id: string;
  status: 'naik_kelas' | 'tinggal_kelas' | 'lulus' | 'pindah' | null;
  student?: Student;
  classRoom?: ClassRoom;
  academicYear?: AcademicYear;
}

export interface AcademicTimelineEntry {
  id: string;
  academic_year: string;
  class_name: string;
  class_level: string;
  status: string | null;
  status_label: string;
}

export interface DocumentItem {
  id: string;
  doc_type: string;
  doc_type_label: string;
  original_filename: string;
  mime_type?: string;
  file_size?: number;
  signed_url?: string | null;
  uploaded_at?: string;
}

export interface DocumentChecklist {
  doc_type: string;
  label: string;
  completed: boolean;
  document?: DocumentItem | null;
}

export interface DashboardStats {
  total_siswa: number;
  siswa_aktif: number;
  siswa_lulus: number;
  siswa_pindah: number;
  gender_breakdown: {
    laki_laki: number;
    perempuan: number;
  };
  tahun_ajaran_aktif: string;
  per_angkatan: {
    tahun_masuk: number;
    label: string;
    total: number;
  }[];
  kelengkapan_dokumen: {
    percentage: number;
    detail: {
      doc_type: string;
      label: string;
      completed: number;
      total: number;
      percentage: number;
    }[];
  };
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user?: { id: string; name: string; email: string };
  entity_type: string;
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'export' | 'view_sensitive';
  changes?: Record<string, any> | null;
  created_at: string;
}

/* ── Form Types (Multi-step) ── */
export interface StudentFormData {
  // Step 1: Identitas
  name: string;
  nisn: string;
  nik: string;
  gender: 'L' | 'P';
  birth_place: string;
  birth_date: string;
  tahun_masuk: number;
  guardian_type: 'ayah' | 'ibu' | 'orang_lain';
  entry_class_level?: string;
  student_status?: string;
  status: string[];

  // Step 2: Keluarga
  father: GuardianFormData;
  mother: GuardianFormData;
  guardian?: GuardianFormData;

  // Step 3: Riwayat
  medical_history?: string;
  sibling_order: number;
  total_siblings: number;

  // Enrollment
  class_id?: string;
  academic_year_id?: string;
}

export interface GuardianFormData {
  name: string;
  birth_place?: string;
  religion?: string;
  occupation?: string;
  income_per_month?: number;
  last_education?: string;
  phone_number?: string;
  address?: string;
  relationship_description?: string;
}

/* ── API Response Types ── */
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
