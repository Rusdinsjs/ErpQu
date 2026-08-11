import { api } from './http';

export interface CustomerGroup {
    id: string;
    company_id: string;
    group_name: string;
    parent_group_id?: string;
    is_group?: boolean;
}

export interface CustomerContact {
    id: string;
    client_id: string;
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    is_primary?: boolean;
}

export interface CustomerAddress {
    id: string;
    client_id: string;
    address_title: string;
    address_line1: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    is_primary_billing?: boolean;
    is_primary_shipping?: boolean;
}

export interface Territory {
    id: string;
    company_id: string;
    territory_name: string;
    parent_territory_id?: string;
    target_amount?: number;
}

export interface SalesPartner {
    id: string;
    company_id: string;
    partner_name: string;
    partner_type?: string;
    commission_rate?: number;
    contact_person?: string;
    email?: string;
    phone?: string;
    status?: string;
}

export interface SalesPerson {
    id: string;
    company_id: string;
    sales_person_name: string;
    employee_id?: string;
    parent_sales_person_id?: string;
    commission_rate?: number;
    status?: string;
}

export const salesMasterDataApi = {
    // Customer Groups
    createCustomerGroup: async (data: any) => {
        const response = await api.post('/sales-master/customer-groups', data);
        return response.data;
    },
    listCustomerGroups: async () => {
        const response = await api.get('/sales-master/customer-groups');
        return response.data;
    },

    // Contacts
    createContact: async (data: any) => {
        const response = await api.post('/sales-master/contacts', data);
        return response.data;
    },
    listContacts: async () => {
        const response = await api.get('/sales-master/contacts');
        return response.data;
    },

    // Addresses
    createAddress: async (data: any) => {
        const response = await api.post('/sales-master/addresses', data);
        return response.data;
    },
    listAddresses: async () => {
        const response = await api.get('/sales-master/addresses');
        return response.data;
    },

    // Territories
    createTerritory: async (data: any) => {
        const response = await api.post('/sales-master/territories', data);
        return response.data;
    },
    listTerritories: async () => {
        const response = await api.get('/sales-master/territories');
        return response.data;
    },

    // Sales Partners
    createSalesPartner: async (data: any) => {
        const response = await api.post('/sales-master/sales-partners', data);
        return response.data;
    },
    listSalesPartners: async () => {
        const response = await api.get('/sales-master/sales-partners');
        return response.data;
    },

    // Sales Persons
    createSalesPerson: async (data: any) => {
        const response = await api.post('/sales-master/sales-persons', data);
        return response.data;
    },
    listSalesPersons: async () => {
        const response = await api.get('/sales-master/sales-persons');
        return response.data;
    }
};
