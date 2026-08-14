import { api } from './http';

export interface HrJobOpening {
    id: string;
    title: string;
    department_id?: string;
    department_name?: string;
    designation_id?: string;
    designation_name?: string;
    employment_type: string;
    openings_count: number;
    min_experience_years: number;
    salary_min?: number;
    salary_max?: number;
    location?: string;
    description: string;
    requirements?: string;
    status: 'open' | 'in_progress' | 'closed';
    posted_date: string;
    closing_date?: string;
    applicant_count?: number;
    created_at: string;
}

export interface HrJobApplicant {
    id: string;
    job_opening_id: string;
    job_title?: string;
    full_name: string;
    email: string;
    phone: string;
    resume_url?: string;
    portfolio_url?: string;
    stage: 'applied' | 'screening' | 'interview_hr' | 'technical_test' | 'interview_user' | 'offering' | 'hired' | 'rejected';
    rating?: number;
    notes?: string;
    rejection_reason?: string;
    converted_employee_id?: string;
    created_at: string;
}

export interface HrTrainingProgram {
    id: string;
    title: string;
    code: string;
    description?: string;
    trainer_type: 'internal' | 'external';
    duration_hours: number;
    is_mandatory: boolean;
    is_active: boolean;
}

export interface HrTrainingEvent {
    id: string;
    program_id: string;
    program_title?: string;
    title: string;
    start_date: string;
    end_date: string;
    location: string;
    trainer_name: string;
    total_cost?: number;
    status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
    participant_count?: number;
    created_at: string;
}

export interface HrTrainingParticipant {
    id: string;
    event_id: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    attendance_status: 'registered' | 'attended' | 'absent';
    score?: number;
    certificate_issued: boolean;
    certificate_no?: string;
    valid_until?: string;
}

export interface HrEmployeeCertification {
    id: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    certificate_name: string;
    certificate_no: string;
    issuing_body: string;
    issue_date: string;
    expiry_date: string;
    document_url?: string;
    status: 'active' | 'expiring_soon' | 'expired';
}

export interface HrDisciplinaryAction {
    id: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    action_type: 'teguran' | 'sp1' | 'sp2' | 'sp3';
    infraction_category: string;
    incident_date: string;
    issue_date: string;
    valid_until: string;
    reason_details: string;
    action_plan?: string;
    status: 'active' | 'expired' | 'revoked';
    created_at: string;
}

export const hrRecruitmentTrainingDisciplineApi = {
    // Recruitment ATS
    listJobOpenings: () => api.get<HrJobOpening[]>('/hr/job-openings').then(r => r.data),
    createJobOpening: (data: any) => api.post('/hr/job-openings', data).then(r => r.data),
    listJobApplicants: (params?: any) => api.get<HrJobApplicant[]>('/hr/job-applicants', { params }).then(r => r.data),
    createJobApplicant: (data: any) => api.post('/hr/job-applicants', data).then(r => r.data),
    updateApplicantStage: (id: string, data: any) => api.post(`/hr/job-applicants/${id}/stage`, data).then(r => r.data),
    convertToEmployee: (id: string, data: any) => api.post(`/hr/job-applicants/${id}/convert-to-employee`, data).then(r => r.data),

    // Training & Certifications
    listTrainingPrograms: () => api.get<HrTrainingProgram[]>('/hr/training-programs').then(r => r.data),
    createTrainingProgram: (data: any) => api.post('/hr/training-programs', data).then(r => r.data),
    listTrainingEvents: () => api.get<HrTrainingEvent[]>('/hr/training-events').then(r => r.data),
    createTrainingEvent: (data: any) => api.post('/hr/training-events', data).then(r => r.data),
    listTrainingParticipants: (eventId: string) => api.get<HrTrainingParticipant[]>(`/hr/training-events/${eventId}/participants`).then(r => r.data),
    addTrainingParticipant: (eventId: string, data: any) => api.post(`/hr/training-events/${eventId}/participants`, data).then(r => r.data),
    listEmployeeCertifications: (params?: any) => api.get<HrEmployeeCertification[]>('/hr/employee-certifications', { params }).then(r => r.data),
    createEmployeeCertification: (data: any) => api.post('/hr/employee-certifications', data).then(r => r.data),

    // Disciplinary Actions
    listDisciplinaryActions: (params?: any) => api.get<HrDisciplinaryAction[]>('/hr/disciplinary-actions', { params }).then(r => r.data),
    issueDisciplinaryAction: (data: any) => api.post('/hr/disciplinary-actions', data).then(r => r.data),
};
