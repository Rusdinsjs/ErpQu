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

const safeArray = <T>(res: any): T[] => {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    return [];
};

const safeData = <T>(res: any): T => {
    if (res && res.data !== undefined) return res.data;
    return res;
};

export const hrPayrollApi = {
    // Salary Components
    listComponents: () => api.get<any>('/hr/salary-components').then(r => safeArray<HrSalaryComponent>(r.data)),
    getComponent: (id: string) => api.get<any>(`/hr/salary-components/${id}`).then(r => safeData<HrSalaryComponent>(r.data)),
    createComponent: (data: any) => api.post('/hr/salary-components', data).then(r => safeData<any>(r.data)),
    updateComponent: (id: string, data: any) => api.put(`/hr/salary-components/${id}`, data).then(r => safeData<any>(r.data)),
    deleteComponent: (id: string) => api.delete(`/hr/salary-components/${id}`).then(r => safeData<any>(r.data)),
    
    // Salary Structures
    listStructures: () => api.get<any>('/hr/salary-structures').then(r => safeArray<HrSalaryStructure>(r.data)),
    getStructure: (id: string) => api.get<any>(`/hr/salary-structures/${id}`).then(r => safeData<HrSalaryStructure>(r.data)),
    createStructure: (data: any) => api.post('/hr/salary-structures', data).then(r => safeData<any>(r.data)),
    updateStructure: (id: string, data: any) => api.put(`/hr/salary-structures/${id}`, data).then(r => safeData<any>(r.data)),
    deleteStructure: (id: string) => api.delete(`/hr/salary-structures/${id}`).then(r => safeData<any>(r.data)),
    
    // Salary Assignments
    listAssignments: () => api.get<any>('/hr/salary-assignments').then(r => safeArray<HrSalaryAssignment>(r.data)),
    createAssignment: (data: any) => api.post('/hr/salary-assignments', data).then(r => safeData<any>(r.data)),
    
    // Payroll Entries
    listPayrollEntries: () => api.get<any>('/hr/payroll-entries').then(r => safeArray<HrPayrollEntry>(r.data)),
    runPayroll: (data: any) => api.post('/hr/payroll-entries', data).then(r => safeData<any>(r.data)),
    
    // Salary Slips
    listSalarySlips: (params?: any) => api.get<any>('/hr/salary-slips', { params }).then(r => safeArray<HrSalarySlip>(r.data)),
    getSalarySlip: (id: string) => api.get<any>(`/hr/salary-slips/${id}`).then(r => safeData<HrSalarySlip>(r.data)),
};
