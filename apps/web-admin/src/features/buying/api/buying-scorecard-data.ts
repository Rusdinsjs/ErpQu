import { api } from'../../../api/http';

export interface SupplierScorecard {
    id: string;
    company_id: string;
    vendor_id: string;
    evaluation_date: string;
    score: string | number;
    status?: string;
    remarks?: string;
    created_at: string;
}

export interface SupplierScorecardVariable {
    id: string;
    company_id: string;
    name: string;
    param_type?: string;
    weight?: string | number;
    created_at: string;
}

export interface SupplierScorecardCriteria {
    id: string;
    company_id: string;
    criteria_name: string;
    max_score?: string | number;
    formula?: string;
    created_at: string;
}

export interface SupplierScorecardStanding {
    id: string;
    company_id: string;
    standing_name: string;
    min_score?: string | number;
    max_score?: string | number;
    prevent_po?: boolean;
    created_at: string;
}

export const buyingScorecardDataApi = {
    // Supplier Scorecard
    getSupplierScorecards: async () => {
        const response = await api.get('/buying-scorecard/supplier-scorecards');
        return response.data.data;
    },
    createSupplierScorecard: async (data: Partial<SupplierScorecard>) => {
        const response = await api.post('/buying-scorecard/supplier-scorecards', data);
        return response.data;
    },
    
    // Supplier Scorecard Variable
    getSupplierScorecardVariables: async () => {
        const response = await api.get('/buying-scorecard/supplier-scorecard-variables');
        return response.data.data;
    },
    createSupplierScorecardVariable: async (data: Partial<SupplierScorecardVariable>) => {
        const response = await api.post('/buying-scorecard/supplier-scorecard-variables', data);
        return response.data;
    },

    // Supplier Scorecard Criteria
    getSupplierScorecardCriteria: async () => {
        const response = await api.get('/buying-scorecard/supplier-scorecard-criteria');
        return response.data.data;
    },
    createSupplierScorecardCriteria: async (data: Partial<SupplierScorecardCriteria>) => {
        const response = await api.post('/buying-scorecard/supplier-scorecard-criteria', data);
        return response.data;
    },

    // Supplier Scorecard Standing
    getSupplierScorecardStandings: async () => {
        const response = await api.get('/buying-scorecard/supplier-scorecard-standings');
        return response.data.data;
    },
    createSupplierScorecardStanding: async (data: Partial<SupplierScorecardStanding>) => {
        const response = await api.post('/buying-scorecard/supplier-scorecard-standings', data);
        return response.data;
    }
};
