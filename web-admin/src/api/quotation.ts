import { api } from './http';

export interface QuotationItem {
    item_id: string;
    qty: number;
    rate: number;
}

export interface Quotation {
    id: string;
    quotation_number: string;
    client_id: string;
    date: string;
    valid_until?: string;
    status: string;
    total_amount: number;
    notes?: string;
}

export const quotationApi = {
    create: async (data: {
        quotation_number: string;
        client_id: string;
        date: string;
        valid_until?: string;
        status?: string;
        notes?: string;
        items: QuotationItem[];
    }) => {
        const res = await api.post('/quotations', data);
        return res.data;
    },

    list: async () => {
        const res = await api.get('/quotations');
        return res.data;
    }
};
