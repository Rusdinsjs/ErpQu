import { api } from './http';

export interface HrLoanType {
    id: string;
    name: string;
    code: string;
    description?: string;
    max_amount: number;
    max_tenure_months: number;
    interest_percentage: number;
}

export interface HrEmployeeLoan {
    id: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    loan_type_id: string;
    loan_type_name?: string;
    loan_amount: number;
    monthly_installment: number;
    tenure_months: number;
    start_date: string;
    status: 'pending' | 'approved' | 'disbursed' | 'rejected' | 'closed';
    total_paid: number;
    remaining_balance: number;
    reason: string;
    approved_at?: string;
    rejection_reason?: string;
    disbursed_at?: string;
    created_at: string;
}

export interface HrLoanRepaymentSchedule {
    id: string;
    loan_id: string;
    installment_no: number;
    due_date: string;
    installment_amount: number;
    paid_amount: number;
    status: 'unpaid' | 'paid' | 'payroll_deducted';
    paid_at?: string;
}

export interface HrExpenseClaimType {
    id: string;
    name: string;
    code: string;
    description?: string;
    max_amount_per_claim?: number;
}

export interface HrExpenseClaim {
    id: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    claim_type_id: string;
    claim_type_name?: string;
    claim_date: string;
    total_amount: number;
    description: string;
    receipt_url?: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid' | 'included_in_payroll';
    approved_at?: string;
    rejection_reason?: string;
    payment_method?: string;
    payment_date?: string;
    created_at: string;
}

export interface HrAppraisalTemplate {
    id: string;
    title: string;
    code: string;
    department_id?: string;
    department_name?: string;
    description?: string;
}

export interface HrAppraisalTemplateItem {
    id: string;
    template_id: string;
    kpi_criteria: string;
    weight_percentage: number;
    target_description?: string;
}

export interface HrEmployeeAppraisal {
    id: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    template_id: string;
    template_title?: string;
    cycle_title: string;
    start_date: string;
    end_date: string;
    evaluator_id?: string;
    self_score?: number;
    manager_score?: number;
    final_score?: number;
    final_rating?: 'A' | 'B' | 'C' | 'D';
    feedback?: string;
    recommendation?: string;
    status: string;
    created_at: string;
}

export const hrLoansClaimsKpiApi = {
    // Loans
    listLoanTypes: () => api.get<HrLoanType[]>('/hr/loan-types').then(r => r.data),
    listEmployeeLoans: (params?: any) => api.get<HrEmployeeLoan[]>('/hr/employee-loans', { params }).then(r => r.data),
    applyLoan: (data: any) => api.post('/hr/employee-loans', data).then(r => r.data),
    reviewLoan: (id: string, data: any) => api.post(`/hr/employee-loans/${id}/review`, data).then(r => r.data),
    listSchedules: (loanId: string) => api.get<HrLoanRepaymentSchedule[]>(`/hr/employee-loans/${loanId}/schedules`).then(r => r.data),

    // Expense Claims
    listExpenseClaimTypes: () => api.get<HrExpenseClaimType[]>('/hr/expense-claim-types').then(r => r.data),
    listExpenseClaims: (params?: any) => api.get<HrExpenseClaim[]>('/hr/expense-claims', { params }).then(r => r.data),
    createExpenseClaim: (data: any) => api.post('/hr/expense-claims', data).then(r => r.data),
    reviewExpenseClaim: (id: string, data: any) => api.post(`/hr/expense-claims/${id}/review`, data).then(r => r.data),

    // Appraisal & KPI
    listAppraisalTemplates: () => api.get<HrAppraisalTemplate[]>('/hr/appraisal-templates').then(r => r.data),
    listTemplateItems: (templateId: string) => api.get<HrAppraisalTemplateItem[]>(`/hr/appraisal-templates/${templateId}/items`).then(r => r.data),
    listEmployeeAppraisals: (params?: any) => api.get<HrEmployeeAppraisal[]>('/hr/employee-appraisals', { params }).then(r => r.data),
    submitAppraisal: (data: any) => api.post('/hr/employee-appraisals', data).then(r => r.data),
};
