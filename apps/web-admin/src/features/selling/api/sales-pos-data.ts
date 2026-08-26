import { api } from'../../../api/http';

export interface PosProfile {
    id: string;
    profile_name: string;
    warehouse_id: string;
    cash_account_id: string;
    is_active?: boolean;
}

export interface PosSettings {
    id: string;
    allow_discount_change?: boolean;
    allow_rate_change?: boolean;
    auto_print_receipt?: boolean;
}

export interface PosOpeningEntry {
    id: string;
    pos_profile_id: string;
    user_id: string;
    period_start_date?: string;
    opening_amount: number;
    status?: string;
}

export interface PosClosingEntry {
    id: string;
    pos_profile_id: string;
    user_id: string;
    pos_opening_entry_id?: string;
    period_start_date: string;
    period_end_date?: string;
    grand_total: number;
    net_total: number;
    total_quantity: number;
    status?: string;
}

export interface LoyaltyProgram {
    id: string;
    program_name: string;
    auto_opt_in?: boolean;
    from_date?: string;
    to_date?: string;
    conversion_factor?: number;
    expiry_duration_in_days?: number;
}

export interface LoyaltyPointEntry {
    id: string;
    loyalty_program_id?: string;
    client_id: string;
    sales_invoice_id?: string;
    loyalty_points: number;
    purchase_amount?: number;
    expiry_date?: string;
    posting_date?: string;
}

export const salesPosDataApi = {
    // POS Profiles
    listPosProfiles: () => api.get('/api/sales-pos/pos-profiles').then(res => res.data),
    createPosProfile: (data: Partial<PosProfile>) => api.post('/api/sales-pos/pos-profiles', data).then(res => res.data),

    // POS Settings
    listPosSettings: () => api.get('/api/sales-pos/pos-settings').then(res => res.data),
    createPosSettings: (data: Partial<PosSettings>) => api.post('/api/sales-pos/pos-settings', data).then(res => res.data),

    // POS Opening Entries
    listPosOpeningEntries: () => api.get('/api/sales-pos/pos-opening-entries').then(res => res.data),
    createPosOpeningEntry: (data: Partial<PosOpeningEntry>) => api.post('/api/sales-pos/pos-opening-entries', data).then(res => res.data),

    // POS Closing Entries
    listPosClosingEntries: () => api.get('/api/sales-pos/pos-closing-entries').then(res => res.data),
    createPosClosingEntry: (data: Partial<PosClosingEntry>) => api.post('/api/sales-pos/pos-closing-entries', data).then(res => res.data),

    // Loyalty Programs
    listLoyaltyPrograms: () => api.get('/api/sales-pos/loyalty-programs').then(res => res.data),
    createLoyaltyProgram: (data: Partial<LoyaltyProgram>) => api.post('/api/sales-pos/loyalty-programs', data).then(res => res.data),

    // Loyalty Point Entries
    listLoyaltyPointEntries: () => api.get('/api/sales-pos/loyalty-point-entries').then(res => res.data),
    createLoyaltyPointEntry: (data: Partial<LoyaltyPointEntry>) => api.post('/api/sales-pos/loyalty-point-entries', data).then(res => res.data),
};
