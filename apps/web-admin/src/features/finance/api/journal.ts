import { api } from'../../../api/http';
import type { DecimalString } from'../../../utils/decimal';

export type JournalStatus = 'draft' | 'submitted' | 'approved' | 'posted' | 'reversed' | 'cancelled';

export interface JournalLine {
    id: string;
    account_id: string;
    description?: string;
    debit: DecimalString;
    credit: DecimalString;
}

export interface JournalEntry {
    id: string;
    transaction_number: string;
    date: string;
    description: string;
    reference?: string;
    status: JournalStatus;
    company_id?: string;
    created_by?: string;
    created_at: string;
    reversed_by?: string;
    reversed_at?: string;
    reversal_reason?: string;
    reversal_source_id?: string;
}

export interface JournalEntryDetail {
    header: JournalEntry;
    lines: JournalLine[];
}

export interface CreateJournalLineRequest {
    account_id: string;
    description?: string;
    debit: DecimalString;
    credit: DecimalString;
}

export interface CreateJournalEntryRequest {
    date: string;
    description: string;
    reference?: string;
    lines: CreateJournalLineRequest[];
}

export interface ListJournalsParams {
    page?: number;
    limit?: number;
}

export interface ReverseJournalRequest {
    reason: string;
}

export const journalApi = {
    list: async (params?: ListJournalsParams) => {
        const response = await api.get<JournalEntry[]>('/finance/journals', { params });
        return response.data;
    },

    getDetails: async (id: string) => {
        const response = await api.get<JournalEntryDetail>(`/finance/journals/${id}`);
        return response.data;
    },

    create: async (data: CreateJournalEntryRequest) => {
        const response = await api.post<JournalEntryDetail>('/finance/journals', data);
        return response.data;
    },

    submit: async (id: string) => {
        const response = await api.post<JournalEntryDetail>(`/finance/journals/${id}/submit`);
        return response.data;
    },

    approve: async (id: string) => {
        const response = await api.post<JournalEntryDetail>(`/finance/journals/${id}/approve`);
        return response.data;
    },

    post: async (id: string) => {
        const response = await api.post<JournalEntryDetail>(`/finance/journals/${id}/post`);
        return response.data;
    },

    reverse: async (id: string, reason: string) => {
        const response = await api.post<JournalEntryDetail>(`/finance/journals/${id}/reverse`, { reason });
        return response.data;
    },

    cancel: async (id: string) => {
        const response = await api.post<JournalEntryDetail>(`/finance/journals/${id}/cancel`);
        return response.data;
    },
};
