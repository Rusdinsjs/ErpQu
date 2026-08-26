import { api } from'../../../api/http';

export interface HrSalaryComponent {
    id: string;
    name: string;
    code: string;
    description?: string;
    type: 'earning' | 'deduction';
    is_taxable: boolean;
    depends_on_payment_days: boolean;
    is_active: boolean;
}

export interface HrSalaryStructure {
    id: string;
    name: string;
    code: string;
    description?: string;
    payroll_frequency: string;
    currency: string;
    is_active: boolean;
}

export interface HrSalaryAssignment {
    id: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    department_name?: string;
    salary_structure_id: string;
    salary_structure_name?: string;
    from_date: string;
    base_salary: number;
    tunjangan_jabatan: number;
    tunjangan_transport: number;
    tunjangan_makan: number;
    ptkp_status: string;
    has_npwp: boolean;
    npwp_number?: string;
    bpjs_kes_number?: string;
    bpjs_tk_number?: string;
    bank_name?: string;
    bank_account?: string;
    bank_account_holder?: string;
    is_active: boolean;
}

export interface HrPayrollEntry {
    id: string;
    posting_date: string;
    start_date: string;
    end_date: string;
    department_id?: string;
    department_name?: string;
    title: string;
    status: 'draft' | 'calculated' | 'submitted' | 'cancelled';
    total_gross_pay: number;
    total_deductions: number;
    total_net_pay: number;
    total_employees: number;
    processed_by?: string;
    created_at: string;
}

export interface HrSalarySlip {
    id: string;
    payroll_entry_id?: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    department_name?: string;
    posting_date: string;
    start_date: string;
    end_date: string;
    
    // Earnings
    base_salary: number;
    tunjangan_jabatan: number;
    tunjangan_transport: number;
    tunjangan_makan: number;
    overtime_hours: number;
    overtime_pay: number;
    other_earnings: number;
    gross_pay: number;
    
    // BPJS
    bpjs_kes_employee: number;
    bpjs_kes_company: number;
    bpjs_jht_employee: number;
    bpjs_jht_company: number;
    bpjs_jp_employee: number;
    bpjs_jp_company: number;
    bpjs_jkk_company: number;
    bpjs_jkm_company: number;
    
    // PPh 21 TER
    ptkp_status: string;
    pph21_ter_category: string;
    pph21_ter_rate: number;
    pph21_amount: number;
    
    // Deductions & Net
    kasbon_deduction: number;
    unpaid_leave_deduction: number;
    total_deductions: number;
    net_pay: number;
    
    // Status & Bank
    status: string;
    bank_name?: string;
    bank_account?: string;
    bank_account_holder?: string;
    payment_date?: string;
    created_at: string;
}

export const hrPayrollApi = {
    // Salary Components
    listComponents: () => api.get<HrSalaryComponent[]>('/hr/salary-components').then(r => r.data),
    getComponent: (id: string) => api.get<HrSalaryComponent>(`/hr/salary-components/${id}`).then(r => r.data),
    createComponent: (data: any) => api.post('/hr/salary-components', data).then(r => r.data),
    updateComponent: (id: string, data: any) => api.put(`/hr/salary-components/${id}`, data).then(r => r.data),
    deleteComponent: (id: string) => api.delete(`/hr/salary-components/${id}`).then(r => r.data),
    
    // Salary Structures
    listStructures: () => api.get<HrSalaryStructure[]>('/hr/salary-structures').then(r => r.data),
    getStructure: (id: string) => api.get<HrSalaryStructure>(`/hr/salary-structures/${id}`).then(r => r.data),
    createStructure: (data: any) => api.post('/hr/salary-structures', data).then(r => r.data),
    updateStructure: (id: string, data: any) => api.put(`/hr/salary-structures/${id}`, data).then(r => r.data),
    deleteStructure: (id: string) => api.delete(`/hr/salary-structures/${id}`).then(r => r.data),
    
    // Salary Assignments
    listAssignments: () => api.get<HrSalaryAssignment[]>('/hr/salary-assignments').then(r => r.data),
    createAssignment: (data: any) => api.post('/hr/salary-assignments', data).then(r => r.data),
    
    // Payroll Entries
    listPayrollEntries: () => api.get<HrPayrollEntry[]>('/hr/payroll-entries').then(r => r.data),
    runPayroll: (data: any) => api.post('/hr/payroll-entries', data).then(r => r.data),
    
    // Salary Slips
    listSalarySlips: (params?: any) => api.get<HrSalarySlip[]>('/hr/salary-slips', { params }).then(r => r.data),
    getSalarySlip: (id: string) => api.get<HrSalarySlip>(`/hr/salary-slips/${id}`).then(r => r.data),
};
