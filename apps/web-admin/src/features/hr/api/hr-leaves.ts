import { api } from'../../../api/http';

export interface HrLeaveType {
    id: string;
    name: string;
    code: string;
    description?: string;
    max_days_allowed: number;
    applicable_after_working_days: number;
    is_carry_forward: boolean;
    max_carry_forward_days: number;
    is_encashable: boolean;
    is_earned_leave: boolean;
    is_unpaid: boolean;
    allow_half_day: boolean;
    color?: string;
    is_active: boolean;
}

export interface HrLeaveAllocation {
    id: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    leave_type_id: string;
    leave_type_name?: string;
    leave_type_code?: string;
    from_date: string;
    to_date: string;
    total_leaves_allocated: number;
    carry_forwarded_leaves: number;
    unused_leaves: number;
    notes?: string;
    is_active: boolean;
}

export interface HrLeaveApplication {
    id: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    leave_type_id: string;
    leave_type_name?: string;
    leave_type_color?: string;
    from_date: string;
    to_date: string;
    total_leave_days: number;
    is_half_day: boolean;
    half_day_date?: string;
    reason: string;
    attachment_url?: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    approved_by?: string;
    approver_name?: string;
    approved_at?: string;
    rejection_reason?: string;
    posting_date: string;
    created_at: string;
}

export interface LeaveBalanceSummary {
    leave_type_id: string;
    leave_type_name: string;
    leave_type_code: string;
    leave_type_color?: string;
    is_unpaid: boolean;
    allocated_days: number;
    used_days: number;
    pending_days: number;
    remaining_days: number;
}

export interface HrHolidayList {
    id: string;
    name: string;
    from_date: string;
    to_date: string;
    is_default: boolean;
    is_active: boolean;
    total_holidays?: number;
}

export interface HrHoliday {
    id: string;
    holiday_list_id: string;
    holiday_date: string;
    description: string;
    is_weekly_off: boolean;
}

export interface HrLeaveBlockList {
    id: string;
    name: string;
    description?: string;
    applies_to_all_departments: boolean;
    is_active: boolean;
}

// API CLIENT
export const hrLeavesApi = {
    // Leave Types
    listTypes: () => api.get<HrLeaveType[]>('/hr/leave-types').then(r => r.data),
    createType: (data: any) => api.post('/hr/leave-types', data).then(r => r.data),
    updateType: (id: string, data: any) => api.put(`/hr/leave-types/${id}`, data).then(r => r.data),
    deleteType: (id: string) => api.delete(`/hr/leave-types/${id}`).then(r => r.data),

    // Allocations
    listAllocations: (employeeId?: string) =>
        api.get<HrLeaveAllocation[]>('/hr/leave-allocations', { params: { employee_id: employeeId } }).then(r => r.data),
    createAllocation: (data: any) => api.post('/hr/leave-allocations', data).then(r => r.data),
    bulkAllocate: (data: any) => api.post('/hr/leave-allocations/bulk', data).then(r => r.data),
    getBalance: (employeeId: string) =>
        api.get<LeaveBalanceSummary[]>(`/hr/employees/${employeeId}/leave-balance`).then(r => r.data),

    // Applications
    listApplications: (params?: any) =>
        api.get<HrLeaveApplication[]>('/hr/leave-applications', { params }).then(r => r.data),
    getApplication: (id: string) =>
        api.get<HrLeaveApplication>(`/hr/leave-applications/${id}`).then(r => r.data),
    createApplication: (data: any) => api.post('/hr/leave-applications', data).then(r => r.data),
    reviewApplication: (id: string, status: string, rejectionReason?: string) =>
        api.post(`/hr/leave-applications/${id}/review`, { status, rejection_reason: rejectionReason }).then(r => r.data),

    // Holidays
    listHolidayLists: () => api.get<HrHolidayList[]>('/hr/holiday-lists').then(r => r.data),
    listHolidays: (listId: string) => api.get<HrHoliday[]>(`/hr/holiday-lists/${listId}/holidays`).then(r => r.data),
    addHoliday: (listId: string, data: any) => api.post(`/hr/holiday-lists/${listId}/holidays`, data).then(r => r.data),

    // Block lists
    listBlockLists: () => api.get<HrLeaveBlockList[]>('/hr/leave-block-lists').then(r => r.data),
};
