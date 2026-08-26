import { api } from'../../../api/http';

export interface SupplierGroup {
    id: string;
    company_id: string;
    group_name: string;
    parent_group_id?: string;
    created_at: string;
}

export interface SupplierContact {
    id: string;
    vendor_id: string;
    first_name: string;
    last_name?: string;
    email?: string;
    phone?: string;
    is_primary: boolean;
    created_at: string;
}

export interface SupplierAddress {
    id: string;
    vendor_id: string;
    address_title: string;
    address_line1: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    is_primary: boolean;
    created_at: string;
}

export interface BuyingSettings {
    id: string;
    company_id: string;
    po_required: boolean;
    pr_required: boolean;
    maintain_same_rate: boolean;
    created_at: string;
}

export interface PurchaseTaxesTemplate {
    id: string;
    company_id: string;
    title: string;
    rate: number;
    account_id?: string;
    is_default: boolean;
    created_at: string;
}

export const buyingMasterDataApi = {
    // Supplier Group
    getSupplierGroups: async () => {
        const response = await api.get('/buying-master/supplier-groups');
        return response.data.data;
    },
    createSupplierGroup: async (data: Partial<SupplierGroup>) => {
        const response = await api.post('/buying-master/supplier-groups', data);
        return response.data;
    },
    // Supplier Contact
    getSupplierContacts: async () => {
        const response = await api.get('/buying-master/supplier-contacts');
        return response.data.data;
    },
    createSupplierContact: async (data: Partial<SupplierContact>) => {
        const response = await api.post('/buying-master/supplier-contacts', data);
        return response.data;
    },
    // Supplier Address
    getSupplierAddresses: async () => {
        const response = await api.get('/buying-master/supplier-addresses');
        return response.data.data;
    },
    createSupplierAddress: async (data: Partial<SupplierAddress>) => {
        const response = await api.post('/buying-master/supplier-addresses', data);
        return response.data;
    },
    // Buying Settings
    getBuyingSettings: async () => {
        const response = await api.get('/buying-master/buying-settings');
        return response.data.data;
    },
    createBuyingSettings: async (data: Partial<BuyingSettings>) => {
        const response = await api.post('/buying-master/buying-settings', data);
        return response.data;
    },
    // Purchase Taxes Template
    getPurchaseTaxesTemplates: async () => {
        const response = await api.get('/buying-master/purchase-taxes-templates');
        return response.data.data;
    },
    createPurchaseTaxesTemplate: async (data: Partial<PurchaseTaxesTemplate>) => {
        const response = await api.post('/buying-master/purchase-taxes-templates', data);
        return response.data;
    }
};
