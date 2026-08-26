import { api } from'../../../api/http';

export interface MaintenanceType {
    id: number;
    code: string;
    name: string;
    description: string | null;
    is_active: boolean;
    is_preventive: boolean;
    category?: string;
    trigger_type?: string;
    interval_value?: string;
    estimated_cost?: number;
}

export const maintenanceTypeApi = {
    list: async () => {
        const response = await api.get<MaintenanceType[]>('/maintenance-types');
        return response.data;
    },
    
    get: async (id: number) => {
        const response = await api.get<MaintenanceType>(`/maintenance-types/${id}`);
        return response.data;
    },
    
    create: async (data: Partial<MaintenanceType>) => {
        const response = await api.post<MaintenanceType>('/maintenance-types', data);
        return response.data;
    },
    
    update: async (id: number, data: Partial<MaintenanceType>) => {
        const response = await api.put<MaintenanceType>(`/maintenance-types/${id}`, data);
        return response.data;
    },
    
    delete: async (id: number) => {
        const response = await api.delete(`/maintenance-types/${id}`);
        return response.data;
    }
};
