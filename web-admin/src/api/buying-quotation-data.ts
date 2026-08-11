import { api } from './http';

export interface RequestForQuotation {
    id: string;
    company_id: string;
    rfq_number: string;
    transaction_date: string;
    status: string;
    tc_name?: string;
    terms?: string;
    created_at: string;
}

export interface SupplierQuotation {
    id: string;
    company_id: string;
    quotation_number: string;
    vendor_id: string;
    rfq_id?: string;
    transaction_date: string;
    valid_till?: string;
    subtotal: string | number;
    total_tax: string | number;
    grand_total: string | number;
    status: string;
    created_at: string;
}

export interface SubcontractingOrder {
    id: string;
    company_id: string;
    order_number: string;
    vendor_id: string;
    transaction_date: string;
    status?: string;
    created_at: string;
}

export const buyingQuotationDataApi = {
    // Request For Quotation
    getRequestsForQuotation: async () => {
        const response = await api.get('/buying-quotation/requests-for-quotation');
        return response.data.data;
    },
    createRequestForQuotation: async (data: Partial<RequestForQuotation>) => {
        const response = await api.post('/buying-quotation/requests-for-quotation', data);
        return response.data;
    },
    
    // Supplier Quotation
    getSupplierQuotations: async () => {
        const response = await api.get('/buying-quotation/supplier-quotations');
        return response.data.data;
    },
    createSupplierQuotation: async (data: Partial<SupplierQuotation>) => {
        const response = await api.post('/buying-quotation/supplier-quotations', data);
        return response.data;
    },

    // Subcontracting Order
    getSubcontractingOrders: async () => {
        const response = await api.get('/buying-quotation/subcontracting-orders');
        return response.data.data;
    },
    createSubcontractingOrder: async (data: Partial<SubcontractingOrder>) => {
        const response = await api.post('/buying-quotation/subcontracting-orders', data);
        return response.data;
    }
};
