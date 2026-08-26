import { api } from'../../../api/http';

export interface HrShiftType {
    id: string;
    name: string;
    code?: string;
    start_time: string; // "08:00:00"
    end_time: string;   // "17:00:00"
    late_tolerance_minutes: number;
    early_exit_tolerance_minutes: number;
    break_start_time?: string;
    break_end_time?: string;
    is_night_shift: boolean;
    color?: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface HrShiftAssignment {
    id: string;
    employee_id: string;
    shift_type_id: string;
    start_date: string;
    end_date?: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Joined
    employee_name?: string;
    employee_nik?: string;
    shift_name?: string;
    shift_code?: string;
    start_time?: string;
    end_time?: string;
    color?: string;
}

export interface HrAttendanceRequest {
    id: string;
    employee_id: string;
    request_type: 'correction' | 'on_duty' | 'wfh' | 'forgot_checkout';
    attendance_date: string;
    requested_check_in?: string;
    requested_check_out?: string;
    reason: string;
    attachment_url?: string;
    status: 'pending' | 'approved' | 'rejected';
    approved_by?: string;
    approved_at?: string;
    rejection_reason?: string;
    created_at: string;
    updated_at: string;
    // Joined
    employee_name?: string;
    employee_nik?: string;
    department_name?: string;
    approved_by_name?: string;
}

export interface HrOvertimeRequest {
    id: string;
    employee_id: string;
    overtime_date: string;
    start_time: string;
    end_time: string;
    planned_hours: number;
    actual_hours?: number;
    reason: string;
    task_description?: string;
    is_holiday: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    approved_by?: string;
    approved_at?: string;
    rejection_reason?: string;
    rate_multiplier?: number;
    hourly_rate?: number;
    calculated_overtime_pay?: number;
    created_at: string;
    updated_at: string;
    // Joined
    employee_name?: string;
    employee_nik?: string;
    department_name?: string;
    approved_by_name?: string;
}

export interface HrAttendanceDetail {
    id: string;
    employee_id: string;
    check_in_time?: string;
    check_out_time?: string;
    check_in_status?: string;
    check_out_status?: string;
    late_minutes?: number;
    early_exit_minutes?: number;
    work_hours?: number;
    overtime_hours?: number;
    attendance_status?: string;
    check_in_lat?: number;
    check_in_long?: number;
    check_out_lat?: number;
    check_out_long?: number;
    check_in_photo_url?: string;
    check_out_photo_url?: string;
    notes?: string;
    created_at?: string;
    // Joined
    employee_name?: string;
    employee_nik?: string;
    department_name?: string;
    shift_name?: string;
    shift_code?: string;
}

export interface EmployeeAttendanceRecap {
    employee_id: string;
    employee_name: string;
    employee_nik: string;
    department_name?: string;
    total_days: number;
    total_present: number;
    total_late: number;
    total_late_minutes: number;
    total_work_hours: number;
    total_overtime_hours: number;
    total_overtime_pay: number;
}

// API Functions
export const hrShiftApi = {
    listShifts: () => api.get<HrShiftType[]>('/hr/shifts').then(r => r.data),
    getShift: (id: string) => api.get<HrShiftType>(`/hr/shifts/${id}`).then(r => r.data),
    createShift: (data: Partial<HrShiftType>) => api.post<{ data: HrShiftType }>('/hr/shifts', data).then(r => r.data.data),
    updateShift: (id: string, data: Partial<HrShiftType>) => api.put<{ data: HrShiftType }>(`/hr/shifts/${id}`, data).then(r => r.data.data),
    deleteShift: (id: string) => api.delete(`/hr/shifts/${id}`),

    listAssignments: (employee_id?: string) => api.get<HrShiftAssignment[]>('/hr/shift-assignments', { params: { employee_id } }).then(r => r.data),
    createAssignment: (data: Partial<HrShiftAssignment>) => api.post<{ data: HrShiftAssignment }>('/hr/shift-assignments', data).then(r => r.data.data),
    bulkAssign: (data: { employee_ids: string[]; shift_type_id: string; start_date: string; end_date?: string; notes?: string }) =>
        api.post<{ data: HrShiftAssignment[] }>('/hr/shift-assignments/bulk', data).then(r => r.data.data),
    deleteAssignment: (id: string) => api.delete(`/hr/shift-assignments/${id}`),
};

export const hrAttendanceRequestApi = {
    list: (params?: { employee_id?: string; status?: string; request_type?: string }) =>
        api.get<HrAttendanceRequest[]>('/hr/attendance-requests', { params }).then(r => r.data),
    create: (data: Partial<HrAttendanceRequest>) =>
        api.post<{ data: HrAttendanceRequest }>('/hr/attendance-requests', data).then(r => r.data.data),
    review: (id: string, data: { status: 'approved' | 'rejected'; rejection_reason?: string }) =>
        api.post<{ data: HrAttendanceRequest }>(`/hr/attendance-requests/${id}/review`, data).then(r => r.data.data),
};

export const hrOvertimeApi = {
    list: (params?: { employee_id?: string; status?: string; start_date?: string; end_date?: string }) =>
        api.get<HrOvertimeRequest[]>('/hr/overtime-requests', { params }).then(r => r.data),
    create: (data: Partial<HrOvertimeRequest>) =>
        api.post<{ data: HrOvertimeRequest }>('/hr/overtime-requests', data).then(r => r.data.data),
    review: (id: string, data: { status: 'approved' | 'rejected'; actual_hours?: number; rejection_reason?: string }) =>
        api.post<{ data: HrOvertimeRequest }>(`/hr/overtime-requests/${id}/review`, data).then(r => r.data.data),
};

export const hrAttendanceLogsApi = {
    listLogs: (params?: { start_date?: string; end_date?: string; employee_id?: string; department_id?: string; attendance_status?: string }) =>
        api.get<HrAttendanceDetail[]>('/hr/attendance-logs', { params }).then(r => r.data),
    getRecap: (params: { start_date: string; end_date: string; department_id?: string }) =>
        api.get<EmployeeAttendanceRecap[]>('/hr/attendance-recap', { params }).then(r => r.data),
};
