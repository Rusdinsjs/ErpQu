import { api } from'../../../api/http';

export interface DepreciationMethod {
    id: string;
    code: string;
    method_name: string;
    annual_rate: string | null;
    frequency_months: string | null;
    description: string | null;
    is_active: boolean;
    linked_categories?: string[];
}

export const depreciationApi = {
    list: async () => {
        const response = await api.get<DepreciationMethod[]>('/depreciation-methods');
        return response.data;
    },
    
    get: async (id: string) => {
        const response = await api.get<DepreciationMethod>(`/depreciation-methods/${id}`);
        return response.data;
    },
    
    create: async (data: Partial<DepreciationMethod>) => {
        const response = await api.post<DepreciationMethod>('/depreciation-methods', data);
        return response.data;
    },
    
    update: async (id: string, data: Partial<DepreciationMethod>) => {
        const response = await api.put<DepreciationMethod>(`/depreciation-methods/${id}`, data);
        return response.data;
    },
    
    delete: async (id: string) => {
        const response = await api.delete(`/depreciation-methods/${id}`);
        return response.data;
    }
};
