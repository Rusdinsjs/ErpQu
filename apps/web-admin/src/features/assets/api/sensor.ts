import { api } from'../../../api/http';

export interface SensorReading {
    time: string;
    asset_id: string;
    sensor_id: string;
    temperature?: number;
    humidity?: number;
    vibration_x?: number;
    vibration_y?: number;
    vibration_z?: number;
    pressure?: number;
    power_consumption?: number;
    custom_value?: number;
    unit?: string;
    status_code?: number;
    quality?: string;
}

export interface SensorThreshold {
    asset_id: string;
    sensor_type: string;
    min_value?: number;
    max_value?: number;
    warning_min?: number;
    warning_max?: number;
}

export interface SensorAlert {
    id: string;
    asset_id: string;
    sensor_id: string;
    threshold_id?: string;
    alert_type: string;
    severity: string;
    sensor_value?: number;
    threshold_value?: number;
    status: string;
    acknowledged_by?: string;
    acknowledged_at?: string;
    resolved_by?: string;
    resolved_at?: string;
    resolution_notes?: string;
    created_at: string;
}

export interface DateRangeParams {
    start: string;
    end: string;
    sensor_id: string;
}

export interface ThresholdPayload {
    sensor_type: string;
    min_value?: number;
    max_value?: number;
    warning_min?: number;
    warning_max?: number;
}

export const sensorApi = {
    getLatestReadings: async (assetId: string) => {
        const response = await api.get<SensorReading[]>(`/assets/${assetId}/sensors/readings`);
        return response.data;
    },

    getReadingsInRange: async (assetId: string, params: DateRangeParams) => {
        const response = await api.get<SensorReading[]>(`/assets/${assetId}/sensors/readings/range`, { params });
        return response.data;
    },

    setThreshold: async (assetId: string, payload: ThresholdPayload) => {
        const response = await api.post<{ data: SensorThreshold }>(`/assets/${assetId}/sensors/thresholds`, payload);
        return response.data.data;
    },

    listActiveAlerts: async () => {
        const response = await api.get<SensorAlert[]>('/sensors/alerts');
        return response.data;
    },

    acknowledgeAlert: async (alertId: string) => {
        const response = await api.post<{ data: any }>(`/sensors/alerts/${alertId}/acknowledge`);
        return response.data;
    }
};
