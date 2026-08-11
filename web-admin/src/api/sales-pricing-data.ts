import { api } from './http';

export interface PriceList {
    id: string;
    price_list_name: string;
    currency?: string;
    buying?: boolean;
    selling?: boolean;
    enabled?: boolean;
}

export interface ItemPrice {
    id: string;
    price_list_id: string;
    item_id: string;
    price_list_rate: number;
    valid_from?: string;
    valid_upto?: string;
}

export interface ProductBundle {
    id: string;
    new_item_code: string;
    description?: string;
}

export interface PricingRule {
    id: string;
    title: string;
    apply_on?: string;
    discount_percentage?: number;
    margin_type?: string;
    margin_rate?: number;
    priority?: number;
    enabled?: boolean;
}

export interface PromotionalScheme {
    id: string;
    name: string;
    description?: string;
    discount_type?: string;
    discount_value?: number;
    min_qty?: number;
    from_date?: string;
    to_date?: string;
    enabled?: boolean;
}

export interface CouponCode {
    id: string;
    coupon_name: string;
    coupon_code: string;
    discount_percentage?: number;
    maximum_use?: number;
    used_count?: number;
    valid_from?: string;
    valid_upto?: string;
    used?: boolean;
}

export const salesPricingDataApi = {
    // Price Lists
    listPriceLists: () => api.get('/api/sales-pricing/price-lists').then(res => res.data),
    createPriceList: (data: Partial<PriceList>) => api.post('/api/sales-pricing/price-lists', data).then(res => res.data),

    // Item Prices
    listItemPrices: () => api.get('/api/sales-pricing/item-prices').then(res => res.data),
    createItemPrice: (data: Partial<ItemPrice>) => api.post('/api/sales-pricing/item-prices', data).then(res => res.data),

    // Product Bundles
    listProductBundles: () => api.get('/api/sales-pricing/product-bundles').then(res => res.data),
    createProductBundle: (data: Partial<ProductBundle>) => api.post('/api/sales-pricing/product-bundles', data).then(res => res.data),

    // Pricing Rules
    listPricingRules: () => api.get('/api/sales-pricing/pricing-rules').then(res => res.data),
    createPricingRule: (data: Partial<PricingRule>) => api.post('/api/sales-pricing/pricing-rules', data).then(res => res.data),

    // Promotional Schemes
    listPromotionalSchemes: () => api.get('/api/sales-pricing/promotional-schemes').then(res => res.data),
    createPromotionalScheme: (data: Partial<PromotionalScheme>) => api.post('/api/sales-pricing/promotional-schemes', data).then(res => res.data),

    // Coupon Codes
    listCouponCodes: () => api.get('/api/sales-pricing/coupon-codes').then(res => res.data),
    createCouponCode: (data: Partial<CouponCode>) => api.post('/api/sales-pricing/coupon-codes', data).then(res => res.data),
};
