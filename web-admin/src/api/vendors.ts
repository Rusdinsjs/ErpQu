import { api } from './http';

export interface Vendor {
    id: string;
    code: string;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CreateVendorRequest {
    code?: string;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    is_active?: boolean;
}

export const vendorApi = {
    listVendors: async (page = 1, perPage = 100): Promise<{ data: Vendor[]; total: number }> => {
        const response = await api.get('/vendors', { params: { page, per_page: perPage } });
        if (response.data && Array.isArray(response.data.data)) {
            return { data: response.data.data, total: response.data.total || response.data.data.length };
        }
        if (Array.isArray(response.data)) {
            return { data: response.data, total: response.data.length };
        }
        return { data: [], total: 0 };
    },

    getVendor: async (id: string): Promise<Vendor> => {
        const response = await api.get(`/vendors/${id}`);
        return response.data?.data || response.data;
    },

    createVendor: async (data: CreateVendorRequest): Promise<Vendor> => {
        const response = await api.post('/vendors', data);
        return response.data?.data || response.data;
    },

    updateVendor: async (id: string, data: Partial<CreateVendorRequest>): Promise<Vendor> => {
        const response = await api.put(`/vendors/${id}`, data);
        return response.data?.data || response.data;
    },

    deleteVendor: async (id: string): Promise<void> => {
        await api.delete(`/vendors/${id}`);
    }
};
