import { api } from './http';

export interface HrDriverAssignment {
    id: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    asset_id: string;
    asset_name?: string;
    asset_code?: string;
    assigned_date: string;
    return_date?: string;
    start_odometer?: number;
    end_odometer?: number;
    sim_sio_verified: boolean;
    status: 'active' | 'returned';
    notes?: string;
    created_at: string;
}

export interface HrP2hInspection {
    id: string;
    assignment_id?: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    asset_id: string;
    asset_name?: string;
    asset_code?: string;
    inspection_date: string;
    odometer_reading?: number;
    hour_meter_reading?: number;
    oil_coolant_ok: boolean;
    brakes_ok: boolean;
    tires_ok: boolean;
    lights_horn_ok: boolean;
    safety_gear_ok: boolean;
    overall_status: 'fit_to_operate' | 'needs_minor_repair' | 'grounded_unsafe';
    notes_defect?: string;
    inspector_signature?: string;
    created_at: string;
}

export interface HrDriverSafetyIncident {
    id: string;
    employee_id: string;
    employee_name?: string;
    employee_nik?: string;
    asset_id?: string;
    asset_name?: string;
    incident_date: string;
    violation_type: 'overspeeding' | 'fatigue_sleep' | 'reckless_driving' | 'collision' | 'sop_k3_breach';
    severity: 'low' | 'medium' | 'high' | 'critical';
    location_site: string;
    speed_kmh?: number;
    damage_cost_estimate?: number;
    description: string;
    disciplinary_action_id?: string;
    status: 'investigating' | 'action_taken' | 'closed';
    created_at: string;
}

export interface HrVehicleHandover {
    id: string;
    asset_id: string;
    asset_name?: string;
    from_employee_id: string;
    from_employee_name?: string;
    to_employee_id: string;
    to_employee_name?: string;
    handover_date: string;
    odometer: number;
    fuel_level_fraction: string;
    body_condition: string;
    toolkit_complete: boolean;
    notes?: string;
    status: string;
}

export const hrDriverP2hSafetyApi = {
    // Driver Assignments
    listDriverAssignments: (params?: any) => api.get<HrDriverAssignment[]>('/hr/driver-assignments', { params }).then(r => r.data),
    createDriverAssignment: (data: any) => api.post('/hr/driver-assignments', data).then(r => r.data),
    returnDriverAssignment: (id: string, data: any) => api.post(`/hr/driver-assignments/${id}/return`, data).then(r => r.data),

    // P2H Inspections
    listP2hInspections: (params?: any) => api.get<HrP2hInspection[]>('/hr/p2h-inspections', { params }).then(r => r.data),
    submitP2hInspection: (data: any) => api.post('/hr/p2h-inspections', data).then(r => r.data),

    // Driver Safety Incidents
    listDriverSafetyIncidents: (params?: any) => api.get<HrDriverSafetyIncident[]>('/hr/driver-safety-incidents', { params }).then(r => r.data),
    createDriverSafetyIncident: (data: any) => api.post('/hr/driver-safety-incidents', data).then(r => r.data),

    // Vehicle Handovers
    listVehicleHandovers: (params?: any) => api.get<HrVehicleHandover[]>('/hr/vehicle-handovers', { params }).then(r => r.data),
    createVehicleHandover: (data: any) => api.post('/hr/vehicle-handovers', data).then(r => r.data),
};
