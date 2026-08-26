import { api } from'../../../api/http';

export interface QualityInspection {
    id: string;
    company_id: string;
    inspection_number: string;
    inspection_type: 'INCOMING' | 'IN_PROCESS' | 'OUTGOING';
    item_id: string;
    batch_no: string | null;
    sample_size: number;
    status: 'PENDING' | 'PASSED' | 'REJECTED' | 'QUALITY_HOLD';
    inspected_by: string | null;
    created_at: string;
}

export interface DeliveryTrip {
    id: string;
    company_id: string;
    trip_number: string;
    driver_id: string | null;
    vehicle_id: string | null;
    status: 'DRAFT' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
    departure_time: string | null;
    arrival_time: string | null;
    created_at: string;
}

export interface DeliveryTripStop {
    id: string;
    trip_id: string;
    delivery_note_id: string;
    stop_order: number;
    status: 'PENDING' | 'DELIVERED' | 'FAILED';
}

export const opsApi = {
    // Quality Inspections
    listQualityInspections: async (companyId: string): Promise<QualityInspection[]> => {
        const response = await api.get(`/ops/quality-inspections/company/${companyId}`);
        return response.data.data;
    },
    createQualityInspection: async (data: {
        company_id: string;
        inspection_type: string;
        item_id: string;
        batch_no?: string;
        sample_size: number;
        status?: string;
        inspected_by?: string;
    }): Promise<QualityInspection> => {
        const response = await api.post('/ops/quality-inspections', data);
        return response.data.data;
    },
    updateQualityInspectionStatus: async (id: string, status: string): Promise<QualityInspection> => {
        const response = await api.put(`/ops/quality-inspections/${id}/status`, { status });
        return response.data.data;
    },

    // Delivery Trips
    listDeliveryTrips: async (companyId: string): Promise<DeliveryTrip[]> => {
        const response = await api.get(`/ops/delivery-trips/company/${companyId}`);
        return response.data.data;
    },
    createDeliveryTrip: async (data: {
        company_id: string;
        driver_id?: string;
        vehicle_id?: string;
        stops: { delivery_note_id: string; stop_order: number }[];
    }): Promise<[DeliveryTrip, DeliveryTripStop[]]> => {
        const response = await api.post('/ops/delivery-trips', data);
        return response.data.data;
    },
    getDeliveryTrip: async (id: string): Promise<[DeliveryTrip, DeliveryTripStop[]]> => {
        const response = await api.get(`/ops/delivery-trips/${id}`);
        return response.data.data;
    },
    updateDeliveryTripStatus: async (
        id: string,
        status: string,
        departureTime?: string,
        arrivalTime?: string
    ): Promise<DeliveryTrip> => {
        const response = await api.put(`/ops/delivery-trips/${id}/status`, {
            status,
            departure_time: departureTime,
            arrival_time: arrivalTime,
        });
        return response.data.data;
    },
    updateDeliveryTripStopStatus: async (
        tripId: string,
        stopId: string,
        status: string
    ): Promise<DeliveryTripStop> => {
        const response = await api.put(`/ops/delivery-trips/${tripId}/stops/${stopId}/status`, { status });
        return response.data.data;
    },
};
