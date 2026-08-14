import { api } from './http';

// ============================================================
// TYPES
// ============================================================

export interface HrDesignation {
    id: string;
    name: string;
    code?: string;
    description?: string;
    grade?: string;
    department_id?: string;
    department_name?: string;
    is_manager: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface HrEmploymentType {
    id: string;
    name: string;
    code: string;
    description?: string;
    max_contract_years?: number;
    is_eligible_bpjs: boolean;
    is_eligible_pph21: boolean;
    is_eligible_leave: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export type LifecycleEventType =
    | 'onboarding'
    | 'promotion'
    | 'transfer'
    | 'demotion'
    | 'warning_sp1'
    | 'warning_sp2'
    | 'warning_sp3'
    | 'resignation'
    | 'termination'
    | 'retirement'
    | 'contract_renewal'
    | 'confirmation';

export interface HrEmployeeLifecycle {
    id: string;
    employee_id: string;
    event_type: LifecycleEventType;
    effective_date: string;
    notes?: string;
    from_designation_id?: string;
    to_designation_id?: string;
    from_department_id?: string;
    to_department_id?: string;
    from_position?: string;
    to_position?: string;
    from_salary?: number;
    to_salary?: number;
    warning_level?: string;
    warning_expiry_date?: string;
    warning_reason?: string;
    last_working_date?: string;
    exit_reason?: string;
    exit_interview_notes?: string;
    document_url?: string;
    document_number?: string;
    performed_by?: string;
    // Joined
    employee_name?: string;
    employee_nik?: string;
    from_designation_name?: string;
    to_designation_name?: string;
    from_department_name?: string;
    to_department_name?: string;
    performed_by_name?: string;
    created_at: string;
    updated_at: string;
}

export interface HrEmployeeDocument {
    id: string;
    employee_id: string;
    document_type: string;
    document_name?: string;
    document_number?: string;
    document_url: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    expiry_date?: string;
    notes?: string;
    uploaded_by?: string;
    created_at: string;
    updated_at: string;
}

export interface HrEmployeeEducation {
    id: string;
    employee_id: string;
    level: string;
    institution_name: string;
    major?: string;
    graduation_year?: number;
    gpa?: number;
    is_highest: boolean;
    attachment_url?: string;
    created_at: string;
}

export interface WorkExperience {
    id: string;
    employee_id: string;
    company_name: string;
    position?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
    attachment_urls?: unknown;
    created_at: string;
}

export interface Employee360Response {
    employee: Record<string, unknown>;
    designation?: HrDesignation;
    employment_type?: HrEmploymentType;
    lifecycle_history: HrEmployeeLifecycle[];
    documents: HrEmployeeDocument[];
    education: HrEmployeeEducation[];
    work_experiences: WorkExperience[];
}

// ============================================================
// API FUNCTIONS
// ============================================================

// Designations
export const hrDesignationApi = {
    list: () => api.get<HrDesignation[]>('/hr/designations').then(r => r.data),
    get: (id: string) => api.get<HrDesignation>(`/hr/designations/${id}`).then(r => r.data),
    create: (data: Partial<HrDesignation>) => api.post<{ data: HrDesignation }>('/hr/designations', data).then(r => r.data.data),
    update: (id: string, data: Partial<HrDesignation>) => api.put<{ data: HrDesignation }>(`/hr/designations/${id}`, data).then(r => r.data.data),
    delete: (id: string) => api.delete(`/hr/designations/${id}`),
};

// Employment Types
export const hrEmploymentTypeApi = {
    list: () => api.get<HrEmploymentType[]>('/hr/employment-types').then(r => r.data),
    create: (data: Partial<HrEmploymentType>) => api.post<{ data: HrEmploymentType }>('/hr/employment-types', data).then(r => r.data.data),
};

// Lifecycle Events
export const hrLifecycleApi = {
    list: (employee_id?: string) =>
        api.get<HrEmployeeLifecycle[]>('/hr/lifecycle', { params: { employee_id } }).then(r => r.data),
    create: (data: Partial<HrEmployeeLifecycle>) =>
        api.post<{ data: HrEmployeeLifecycle }>('/hr/lifecycle', data).then(r => r.data.data),
};

// Employee Documents
export const hrDocumentApi = {
    list: (employee_id: string) =>
        api.get<HrEmployeeDocument[]>(`/hr/employees/${employee_id}/documents`).then(r => r.data),
    create: (data: Partial<HrEmployeeDocument>) =>
        api.post<{ data: HrEmployeeDocument }>(`/hr/employees/${data.employee_id}/documents`, data).then(r => r.data.data),
    delete: (id: string) => api.delete(`/hr/documents/${id}`),
};

// Employee Education
export const hrEducationApi = {
    list: (employee_id: string) =>
        api.get<HrEmployeeEducation[]>(`/hr/employees/${employee_id}/education`).then(r => r.data),
    create: (data: Partial<HrEmployeeEducation>) =>
        api.post<{ data: HrEmployeeEducation }>(`/hr/employees/${data.employee_id}/education`, data).then(r => r.data.data),
    delete: (id: string) => api.delete(`/hr/education/${id}`),
};

// Employee 360
export const hr360Api = {
    get: (employee_id: string) =>
        api.get<Employee360Response>(`/employees/${employee_id}/360`).then(r => r.data),
};

// Helper constants
export const LIFECYCLE_EVENT_LABELS: Record<string, string> = {
    onboarding: '🟢 Bergabung',
    promotion: '🔺 Promosi',
    transfer: '🔄 Mutasi',
    demotion: '🔻 Demosi',
    warning_sp1: '⚠️ SP-1',
    warning_sp2: '🟠 SP-2',
    warning_sp3: '🔴 SP-3',
    resignation: '🚪 Resign',
    termination: '❌ PHK',
    retirement: '🏁 Pensiun',
    contract_renewal: '📋 Perpanjang Kontrak',
    confirmation: '✅ Pengangkatan Tetap',
};

export const LIFECYCLE_EVENT_COLORS: Record<string, string> = {
    onboarding: 'green',
    promotion: 'blue',
    transfer: 'cyan',
    demotion: 'orange',
    warning_sp1: 'yellow',
    warning_sp2: 'orange',
    warning_sp3: 'red',
    resignation: 'gray',
    termination: 'red',
    retirement: 'purple',
    contract_renewal: 'teal',
    confirmation: 'green',
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    ktp: 'KTP',
    kk: 'Kartu Keluarga',
    npwp: 'NPWP',
    bpjs_kes: 'BPJS Kesehatan',
    bpjs_tk: 'BPJS Ketenagakerjaan',
    ijazah: 'Ijazah',
    kontrak_kerja: 'Kontrak Kerja',
    sk_pengangkatan: 'SK Pengangkatan',
    sertifikasi: 'Sertifikasi',
    other: 'Lainnya',
};
