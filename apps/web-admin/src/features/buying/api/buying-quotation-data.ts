import { api } from'../../../api/http';

export interface RequestForQuotation {
    id: string;
    company_id?: string;
    rfq_number?: string;
    transaction_date?: string;
    status?: string;
    tc_name?: string;
    terms?: string;
    created_at?: string;
}

export interface SupplierQuotation {
    id: string;
    company_id?: string;
    quotation_number?: string;
    quote_number?: string;
    vendor_id: string;
    rfq_id?: string;
    transaction_date?: string;
    date?: string;
    valid_till?: string;
    expiry_date?: string;
    subtotal?: string | number;
    total_tax?: string | number;
    grand_total?: string | number;
    total_amount?: string | number;
    status?: string;
    created_at?: string;
}

export interface SubcontractingOrder {
    id: string;
    company_id?: string;
    order_number?: string;
    vendor_id?: string;
    transaction_date?: string;
    status?: string;
    created_at?: string;
}

export const buyingQuotationDataApi = {
    // Request For Quotation
    getRequestsForQuotation: async (): Promise<RequestForQuotation[]> => {
        try {
            const response = await api.get('/buying-quotation/requests-for-quotation');
            if (Array.isArray(response.data?.data)) return response.data.data;
            if (Array.isArray(response.data)) return response.data;
            return [];
        } catch {
            return [];
        }
    },
    createRequestForQuotation: async (data: Partial<RequestForQuotation>) => {
        const response = await api.post('/buying-quotation/requests-for-quotation', data);
        return response.data;
    },
    
    // Supplier Quotation (Connects to /finance/purchase/quotes or /buying-quotation)
    getSupplierQuotations: async (): Promise<SupplierQuotation[]> => {
        try {
            const response = await api.get('/finance/purchase/quotes');
            if (Array.isArray(response.data?.data)) return response.data.data;
            if (Array.isArray(response.data)) return response.data;
        } catch {
            // fallback
        }

        try {
            const response = await api.get('/buying-quotation/supplier-quotations');
            if (Array.isArray(response.data?.data)) return response.data.data;
            if (Array.isArray(response.data)) return response.data;
        } catch {
            // fallback
        }

        return [];
    },
    createSupplierQuotation: async (data: Partial<SupplierQuotation>) => {
        try {
            const response = await api.post('/finance/purchase/quotes', {
                quote_number: data.quotation_number || data.quote_number || `SQ-${Date.now().toString().slice(-6)}`,
                vendor_id: data.vendor_id,
                date: data.transaction_date || data.date || new Date().toISOString().split('T')[0],
                expiry_date: data.valid_till || data.expiry_date,
                subject: 'Supplier Quotation',
                items: []
            });
            return response.data;
        } catch {
            const response = await api.post('/buying-quotation/supplier-quotations', data);
            return response.data;
        }
    },

    // Subcontracting Order
    getSubcontractingOrders: async (): Promise<SubcontractingOrder[]> => {
        try {
            const response = await api.get('/buying-quotation/subcontracting-orders');
            if (Array.isArray(response.data?.data)) return response.data.data;
            if (Array.isArray(response.data)) return response.data;
            return [];
        } catch {
            return [];
        }
    },
    createSubcontractingOrder: async (data: Partial<SubcontractingOrder>) => {
        const response = await api.post('/buying-quotation/subcontracting-orders', data);
        return response.data;
    }
};
