import { api } from './client';

export interface InventoryItem {
    id: string;
    item_code: string;
    name: string;
    category_id?: string;
    uom: string;
    standard_cost?: string | number;
    valuation_rate?: string | number;
    min_stock_level?: number;
    max_stock_level?: number;
    reorder_point?: number;
    current_stock?: number;
    is_active?: boolean;
    description?: string;
}

export const inventoryApi = {
    searchItems: async (search?: string): Promise<InventoryItem[]> => {
        const response = await api.get('/inventory/items', {
            params: search ? { search } : undefined,
        });
        return response.data.data || response.data || [];
    },

    getItemById: async (id: string): Promise<InventoryItem> => {
        const response = await api.get(`/inventory/items/${id}`);
        return response.data.data || response.data;
    },

    lookupByBarcode: async (barcode: string): Promise<InventoryItem> => {
        const response = await api.get('/inventory/items', {
            params: { search: barcode.trim() },
        });
        const items: InventoryItem[] = response.data.data || response.data || [];
        // Find exact match by code first, otherwise fallback to first match
        const exactMatch = items.find(
            (it) => it.item_code.toLowerCase() === barcode.trim().toLowerCase()
        );
        if (exactMatch) return exactMatch;
        if (items.length > 0) return items[0];

        throw new Error(`Barang dengan kode/barcode '${barcode}' tidak ditemukan`);
    },
};
