import { api } from'../../../api/http';

export interface BlanketOrder {
    id: string;
    order_number: string;
    client_id: string;
    from_date: string;
    to_date: string;
    tc_name?: string;
    terms?: string;
    status: string;
}

export interface ShippingRule {
    id: string;
    name: string;
    shipping_amount: number;
    calculate_based_on?: string;
    account_id?: string;
}

export interface SellingSettings {
    id: string;
    so_required?: boolean;
    dn_required?: boolean;
    allow_negative_stock?: boolean;
    default_price_list_id?: string;
}

export interface TermsAndConditionsTemplate {
    id: string;
    title: string;
    terms_content: string;
    disabled?: boolean;
}

export interface SalesTaxesTemplate {
    id: string;
    title: string;
    rate: number;
    account_id?: string;
    is_default?: boolean;
}

export interface UtmSource {
    id: string;
    name: string;
    medium?: string;
    description?: string;
}

export interface Campaign {
    id: string;
    campaign_name: string;
    utm_source_id?: string;
    start_date?: string;
    end_date?: string;
    budget?: number;
    actual_cost?: number;
    description?: string;
}

export const salesSetupDataApi = {
    // Blanket Orders
    listBlanketOrders: () => api.get('/api/sales-setup/blanket-orders').then(res => res.data),
    createBlanketOrder: (data: Partial<BlanketOrder>) => api.post('/api/sales-setup/blanket-orders', data).then(res => res.data),

    // Shipping Rules
    listShippingRules: () => api.get('/api/sales-setup/shipping-rules').then(res => res.data),
    createShippingRule: (data: Partial<ShippingRule>) => api.post('/api/sales-setup/shipping-rules', data).then(res => res.data),

    // Selling Settings
    listSellingSettings: () => api.get('/api/sales-setup/selling-settings').then(res => res.data),
    createSellingSettings: (data: Partial<SellingSettings>) => api.post('/api/sales-setup/selling-settings', data).then(res => res.data),

    // Terms and Conditions Templates
    listTermsAndConditionsTemplates: () => api.get('/api/sales-setup/terms-templates').then(res => res.data),
    createTermsAndConditionsTemplate: (data: Partial<TermsAndConditionsTemplate>) => api.post('/api/sales-setup/terms-templates', data).then(res => res.data),

    // Sales Taxes Templates
    listSalesTaxesTemplates: () => api.get('/api/sales-setup/tax-templates').then(res => res.data),
    createSalesTaxesTemplate: (data: Partial<SalesTaxesTemplate>) => api.post('/api/sales-setup/tax-templates', data).then(res => res.data),

    // UTM Sources
    listUtmSources: () => api.get('/api/sales-setup/utm-sources').then(res => res.data),
    createUtmSource: (data: Partial<UtmSource>) => api.post('/api/sales-setup/utm-sources', data).then(res => res.data),

    // Campaigns
    listCampaigns: () => api.get('/api/sales-setup/campaigns').then(res => res.data),
    createCampaign: (data: Partial<Campaign>) => api.post('/api/sales-setup/campaigns', data).then(res => res.data),
};
