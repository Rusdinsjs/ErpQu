import { api } from'../../../api/http';
import type {
    ChartOfAccount,
    AccountType,
    NormalBalance,
    CreateAccountRequest,
    UpdateAccountRequest,
    GeneralLedgerEntry,
    TrialBalanceEntry,
    FinancialReportEntry,
    CreateCashBankTransactionRequest,
    SalesInvoice,
    SalesInvoiceItem,
    CreateInvoiceItemRequest,
    CreateSalesInvoiceRequest,
    UpdateSalesInvoiceRequest,
    PurchaseBill,
    CreatePurchaseBillRequest,
    Expense,
    CashBankTransaction
} from'../../../types';

export type {
    ChartOfAccount,
    AccountType,
    NormalBalance,
    CreateAccountRequest,
    UpdateAccountRequest,
    GeneralLedgerEntry,
    TrialBalanceEntry,
    FinancialReportEntry,
    CreateCashBankTransactionRequest,
    SalesInvoice,
    SalesInvoiceItem,
    CreateInvoiceItemRequest,
    CreateSalesInvoiceRequest,
    UpdateSalesInvoiceRequest,
    PurchaseBill,
    CreatePurchaseBillRequest,
    Expense,
    CashBankTransaction
};

const extractArray = <T>(data: any): T[] => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
};


// ─── EXTENDED ACCOUNTING TYPES & APIS ───────────────────────────────────────

export interface PaymentEntryReference {
    id?: string;
    payment_entry_id?: string;
    reference_doctype: 'Sales Invoice' | 'Purchase Bill';
    reference_id: string;
    reference_name?: string;
    total_amount: number | string;
    allocated_amount: number | string;
    outstanding_amount: number | string;
}

export interface PaymentEntry {
    id: string;
    entry_no: string;
    payment_type: 'Pay' | 'Receive';
    party_type?: 'Customer' | 'Supplier';
    party_id?: string;
    party_name?: string;
    posting_date: string;
    mode_of_payment: string;
    paid_from_account_id?: string;
    paid_to_account_id?: string;
    paid_amount: number | string;
    received_amount: number | string;
    reference_no?: string;
    reference_date?: string;
    status: string;
    created_at?: string;
}

export interface CreatePaymentEntryRequest {
    payment_type: 'Pay' | 'Receive';
    party_type?: 'Customer' | 'Supplier';
    party_id?: string;
    party_name?: string;
    posting_date: string;
    mode_of_payment?: string;
    paid_from_account_id?: string;
    paid_to_account_id?: string;
    amount: number;
    reference_no?: string;
    reference_date?: string;
    references?: Array<{
        reference_doctype: 'Sales Invoice' | 'Purchase Bill';
        reference_id: string;
        reference_name?: string;
        total_amount: number;
        allocated_amount: number;
        outstanding_amount: number;
    }>;
}

export interface CostCenter {
    id: string;
    cost_center_name: string;
    cost_center_number?: string;
    parent_cost_center_id?: string;
    is_group?: boolean;
    disabled?: boolean;
    created_at?: string;
}

export interface CreateCostCenterRequest {
    cost_center_name: string;
    cost_center_number?: string;
    parent_cost_center_id?: string;
    is_group?: boolean;
}

export interface Budget {
    id: string;
    cost_center_id?: string;
    fiscal_year: string;
    monthly_distribution?: string;
    action_if_annual_budget_exceeded?: string;
    created_at?: string;
}

export interface CreateBudgetRequest {
    cost_center_id?: string;
    fiscal_year: string;
    action_if_annual_budget_exceeded?: string;
    accounts: Array<{
        account_id: string;
        budget_amount: number;
    }>;
}

export interface BudgetVarianceReport {
    budget_id: string;
    cost_center_name: string;
    fiscal_year: string;
    account_id?: string;
    account_code: string;
    account_name: string;
    budget_amount: number;
    actual_spent: number;
    variance: number;
    utilization_percentage: number;
    status: string;
}

export interface AgingReportItem {
    party_id: string;
    party_name: string;
    total_outstanding: number;
    current_not_due: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    days_over_90: number;
    invoice_count: number;
}

export interface BankAccount {
    id: string;
    account_name: string;
    bank_name: string;
    bank_account_no: string;
    swift_code?: string;
    gl_account_id?: string;
    is_default?: boolean;
    created_at?: string;
}

export interface CreateBankAccountRequest {
    account_name: string;
    bank_name: string;
    bank_account_no: string;
    swift_code?: string;
    gl_account_id?: string;
    is_default?: boolean;
}

export interface CreditNote {
    id: string;
    credit_note_no: string;
    customer_id?: string;
    posting_date: string;
    reason?: string;
    total_amount: number | string;
    status: string;
    created_at?: string;
}

export interface CreateCreditNoteRequest {
    credit_note_no?: string;
    customer_id?: string;
    posting_date: string;
    reason?: string;
    total_amount: number;
}

export interface DebitNote {
    id: string;
    debit_note_no: string;
    supplier_id?: string;
    posting_date: string;
    reason?: string;
    total_amount: number | string;
    status: string;
    created_at?: string;
}

export interface CreateDebitNoteRequest {
    debit_note_no?: string;
    supplier_id?: string;
    posting_date: string;
    reason?: string;
    total_amount: number;
}

export interface TaxCategory {
    id: string;
    title: string;
    description?: string;
    created_at?: string;
}

export interface CashFlowItem {
    title: string;
    amount: number;
}

export interface CashFlowSection {
    category: string;
    total: number;
    items: CashFlowItem[];
}

export interface CashFlowStatement {
    period: string;
    operating_activities: CashFlowSection;
    investing_activities: CashFlowSection;
    financing_activities: CashFlowSection;
    net_cash_change: number;
    beginning_cash_balance: number;
    ending_cash_balance: number;
}


export const financeApi = {
    listAccounts: async (): Promise<ChartOfAccount[]> => {
        const response = await api.get('/finance/accounts');
        return extractArray<ChartOfAccount>(response.data);
    },

    listTree: async (): Promise<ChartOfAccount[]> => {
        const response = await api.get('/finance/accounts/tree');
        return extractArray<ChartOfAccount>(response.data);
    },

    createAccount: async (data: CreateAccountRequest): Promise<ChartOfAccount> => {
        const response = await api.post('/finance/accounts', data);
        return response.data?.data || response.data;
    },

    updateAccount: async (id: string, data: UpdateAccountRequest): Promise<ChartOfAccount> => {
        const response = await api.put(`/finance/accounts/${id}`, data);
        return response.data?.data || response.data;
    },

    getGeneralLedger: async (accountId: string, startDate?: string, endDate?: string): Promise<GeneralLedgerEntry[]> => {
        const response = await api.get(`/finance/reports/ledger/${accountId}`, {
            params: { start_date: startDate, end_date: endDate }
        });
        return extractArray<GeneralLedgerEntry>(response.data);
    },

    getTrialBalance: async (): Promise<TrialBalanceEntry[]> => {
        const response = await api.get('/finance/reports/trial-balance');
        return extractArray<TrialBalanceEntry>(response.data);
    },

    getBalanceSheet: async (): Promise<FinancialReportEntry[]> => {
        const response = await api.get('/finance/reports/balance-sheet');
        return extractArray<FinancialReportEntry>(response.data);
    },

    getIncomeStatement: async (): Promise<FinancialReportEntry[]> => {
        const response = await api.get('/finance/reports/income-statement');
        return extractArray<FinancialReportEntry>(response.data);
    },

    // Operational Finance
    listSalesInvoices: async (): Promise<SalesInvoice[]> => {
        const response = await api.get('/finance/sales/invoices');
        return extractArray<SalesInvoice>(response.data);
    },
    listPurchaseBills: async (): Promise<PurchaseBill[]> => {
        const response = await api.get('/finance/purchase/bills');
        return extractArray<PurchaseBill>(response.data);
    },
    listExpenses: async (): Promise<Expense[]> => {
        const response = await api.get('/finance/expenses');
        return extractArray<Expense>(response.data);
    },
    listCashBankTransactions: async (): Promise<CashBankTransaction[]> => {
        const response = await api.get('/finance/cash-bank');
        return extractArray<CashBankTransaction>(response.data);
    },

    createSalesInvoice: async (data: CreateSalesInvoiceRequest): Promise<SalesInvoice> => {
        const response = await api.post('/finance/sales/invoices', data);
        return response.data?.data || response.data;
    },
    getSalesInvoice: async (id: string): Promise<SalesInvoice> => {
        const response = await api.get(`/finance/sales/invoices/${id}`);
        return response.data?.data || response.data;
    },
    updateSalesInvoice: async (id: string, data: UpdateSalesInvoiceRequest): Promise<SalesInvoice> => {
        const response = await api.put(`/finance/sales/invoices/${id}`, data);
        return response.data?.data || response.data;
    },
    deleteSalesInvoice: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/finance/sales/invoices/${id}`);
        return response.data;
    },
    createPurchaseBill: async (data: CreatePurchaseBillRequest): Promise<PurchaseBill> => {
        const response = await api.post('/finance/purchase/bills', data);
        return response.data.data;
    },
    createExpense: async (data: any): Promise<Expense> => {
        const response = await api.post('/finance/expenses', data);
        return response.data.data;
    },
    // Sales Quotes
    listSalesQuotes: async (): Promise<any> => {
        const response = await api.get('/finance/sales/quotes');
        return response.data;
    },
    createSalesQuote: async (data: any): Promise<any> => {
        const response = await api.post('/finance/sales/quotes', data);
        return response.data;
    },

    // Sales Orders
    listSalesOrders: async (): Promise<any> => {
        const response = await api.get('/finance/sales/orders');
        return response.data;
    },
    createSalesOrder: async (data: any): Promise<any> => {
        const response = await api.post('/finance/sales/orders', data);
        return response.data;
    },

    // Sales Shipments
    listSalesShipments: async (): Promise<any> => {
        const response = await api.get('/finance/sales/shipments');
        return response.data.data;
    },
    createSalesShipment: async (data: any): Promise<any> => {
        const response = await api.post('/finance/sales/shipments', data);
        return response.data.data;
    },

    // Purchase Quotes
    listPurchaseQuotes: async (): Promise<any> => {
        const response = await api.get('/finance/purchase/quotes');
        return response.data;
    },
    createPurchaseQuote: async (data: any): Promise<any> => {
        const response = await api.post('/finance/purchase/quotes', data);
        return response.data;
    },

    // Purchase Orders
    listPurchaseOrders: async (): Promise<any> => {
        const response = await api.get('/finance/purchase/orders');
        return response.data;
    },
    createPurchaseOrder: async (data: any): Promise<any> => {
        const response = await api.post('/finance/purchase/orders', data);
        return response.data;
    },

    // Purchase Shipments
    listPurchaseShipments: async (): Promise<any> => {
        const response = await api.get('/finance/purchase/shipments');
        return response.data.data;
    },
    createPurchaseShipment: async (data: any): Promise<any> => {
        const response = await api.post('/finance/purchase/shipments', data);
        return response.data.data;
    },

    // Purchase Receipts (GRN)
    listPurchaseReceipts: async (companyId: string): Promise<any[]> => {
        const response = await api.get(`/finance/purchase/receipts/company/${companyId}`);
        return response.data.data;
    },
    createPurchaseReceipt: async (data: any): Promise<any> => {
        const response = await api.post('/finance/purchase/receipts', data);
        return response.data.data;
    },
    submitPurchaseReceipt: async (id: string): Promise<any> => {
        const response = await api.post(`/finance/purchase/receipts/${id}/submit`);
        return response.data.data;
    },

    // Sales Shipments Submit
    submitSalesShipment: async (id: string): Promise<any> => {
        const response = await api.post(`/finance/sales/shipments/${id}/submit`);
        return response.data.data;
    },

    createCashBankTransaction: async (data: CreateCashBankTransactionRequest): Promise<any> => {
        const response = await api.post('/finance/cash-bank', data);
        return response.data;
    },

    // ─── EXTENDED ACCOUNTING API METHODS ─────────────────────────────────────
    
    // 1. Payment Entries
    listPaymentEntries: async (): Promise<PaymentEntry[]> => {
        const response = await api.get('/finance/payments');
        return extractArray<PaymentEntry>(response.data);
    },
    getPaymentEntry: async (id: string): Promise<PaymentEntry> => {
        const response = await api.get(`/finance/payments/${id}`);
        return response.data?.data || response.data;
    },
    createPaymentEntry: async (data: CreatePaymentEntryRequest): Promise<PaymentEntry> => {
        const response = await api.post('/finance/payments', data);
        return response.data?.data || response.data;
    },

    // 2. Cost Centers & Budgets
    listCostCenters: async (): Promise<CostCenter[]> => {
        const response = await api.get('/finance/cost-centers');
        return extractArray<CostCenter>(response.data);
    },
    createCostCenter: async (data: CreateCostCenterRequest): Promise<CostCenter> => {
        const response = await api.post('/finance/cost-centers', data);
        return response.data?.data || response.data;
    },
    listBudgets: async (): Promise<Budget[]> => {
        const response = await api.get('/finance/budgets');
        return extractArray<Budget>(response.data);
    },
    createBudget: async (data: CreateBudgetRequest): Promise<Budget> => {
        const response = await api.post('/finance/budgets', data);
        return response.data?.data || response.data;
    },
    getBudgetVariance: async (): Promise<BudgetVarianceReport[]> => {
        const response = await api.get('/finance/budgets/variance');
        return extractArray<BudgetVarianceReport>(response.data);
    },

    // 3. Aging Reports
    getArAging: async (): Promise<AgingReportItem[]> => {
        const response = await api.get('/finance/reports/ar-aging');
        return extractArray<AgingReportItem>(response.data);
    },
    getApAging: async (): Promise<AgingReportItem[]> => {
        const response = await api.get('/finance/reports/ap-aging');
        return extractArray<AgingReportItem>(response.data);
    },

    // 4. Bank Accounts
    listBankAccounts: async (): Promise<BankAccount[]> => {
        const response = await api.get('/finance/bank-accounts');
        return extractArray<BankAccount>(response.data);
    },
    createBankAccount: async (data: CreateBankAccountRequest): Promise<BankAccount> => {
        const response = await api.post('/finance/bank-accounts', data);
        return response.data?.data || response.data;
    },

    // 5. Notes (Credit & Debit)
    listCreditNotes: async (): Promise<CreditNote[]> => {
        const response = await api.get('/finance/credit-notes');
        return extractArray<CreditNote>(response.data);
    },
    createCreditNote: async (data: CreateCreditNoteRequest): Promise<CreditNote> => {
        const response = await api.post('/finance/credit-notes', data);
        return response.data?.data || response.data;
    },
    listDebitNotes: async (): Promise<DebitNote[]> => {
        const response = await api.get('/finance/debit-notes');
        return extractArray<DebitNote>(response.data);
    },
    createDebitNote: async (data: CreateDebitNoteRequest): Promise<DebitNote> => {
        const response = await api.post('/finance/debit-notes', data);
        return response.data?.data || response.data;
    },

    // 6. Tax Categories
    listTaxCategories: async (): Promise<TaxCategory[]> => {
        const response = await api.get('/finance/tax-categories');
        return extractArray<TaxCategory>(response.data);
    },

    // 7. Cash Flow Statement
    getCashFlowStatement: async (): Promise<CashFlowStatement> => {
        const response = await api.get('/finance/reports/cash-flow');
        return response.data?.data || response.data;
    },

};
