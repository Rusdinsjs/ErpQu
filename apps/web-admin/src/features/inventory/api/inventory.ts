export interface InventoryMovement {
    id: string;
    item_id: string;
    movement_type: string;
    quantity: number;
    unit_price?: number;
    reference_type?: string;
    reference_id?: string;
    reference_number?: string;
    notes?: string;
    created_at?: string;
}
export interface BatchInventoryAdjustmentItem {
    item_id: string;
    quantity: number;
    unit_price?: number;
}
export interface BatchInventoryAdjustmentRequest {
    items: BatchInventoryAdjustmentItem[];
    notes?: string;
}
import { api } from'../../../api/http';

export interface InventoryCategory {
    id: string;
    code: string;
    name: string;
    description: string | null;
    inventory_account_id: string | null;
    expense_account_id: string | null;
    item_count?: number; // Optional count from backend if available
    created_at: string;
    updated_at: string;
}

export interface InventoryItem {
    id: string;
    category_id: string;
    unit_id: number;
    sku: string;
    name: string;
    description: string | null;
    min_stock: number;
    max_stock: number;
    initial_quantity: number;
    current_quantity: number;
    purchase_price: number;
    average_cost: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    category_name?: string;
}

export interface CreateInventoryCategoryRequest {
    code: string;
    name: string;
    description?: string;
    inventory_account_id?: string;
    expense_account_id?: string;
}

export interface UpdateInventoryCategoryRequest {
    name?: string;
    description?: string;
    inventory_account_id?: string;
    expense_account_id?: string;
}

const extractArray = <T>(data: any): T[] => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    return [];
};

export const inventoryApi = {
    listStockEntries: async (companyId?: string) => {
        const response = await api.get('/inventory/stock-entries');
        return response.data?.data || response.data || [];
    },
    listWarehouseBins: async (warehouseId?: string) => {
        const response = await api.get('/inventory/warehouses');
        return response.data?.data || response.data || [];
    },
    getStockEntry: async (id: string) => {
        const response = await api.get(`/inventory/stock-entries/${id}`);
        return response.data?.data || response.data;
    },
    createStockEntry: async (data: any) => {
        const response = await api.post('/inventory/stock-entries', data);
        return response.data?.data || response.data;
    },
    submitStockEntry: async (id: string) => {
        const response = await api.post(`/inventory/stock-entries/${id}/submit`);
        return response.data?.data || response.data;
    },
    approveMaterialRequest: async (id: string) => {
        const response = await api.post(`/inventory/material-requests/${id}/approve`);
        return response.data?.data || response.data;
    },
    createMaterialRequest: async (data: any) => {
        const response = await api.post('/inventory/material-requests', data);
        return response.data?.data || response.data;
    },
    listMaterialRequests: async (companyId?: string) => {
        const response = await api.get('/inventory/material-requests');
        return response.data?.data || response.data || [];
    },
    listBinBalancesByItem: async (itemId?: string) => {
        const response = await api.get('/inventory/stock-balance');
        return response.data?.data || response.data || [];
    },
    listBinBalances: async (binId?: string) => {
        const response = await api.get('/inventory/stock-balance');
        return response.data?.data || response.data || [];
    },

    // Categories
    listCategories: async (): Promise<InventoryCategory[]> => {
        const response = await api.get('/inventory/categories');
        return extractArray(response.data);
    },
    getCategory: async (id: string) => {
        const response = await api.get(`/inventory/categories/${id}`);
        return response.data?.data || response.data;
    },
    createCategory: async (data: CreateInventoryCategoryRequest) => {
        const response = await api.post('/inventory/categories', data);
        return response.data?.data || response.data;
    },
    updateCategory: async (id: string, data: UpdateInventoryCategoryRequest) => {
        const response = await api.put(`/inventory/categories/${id}`, data);
        return response.data?.data || response.data;
    },
    deleteCategory: async (id: string) => {
        const response = await api.delete(`/inventory/categories/${id}`);
        return response.data?.data || response.data;
    },
    deleteWarehouse: async (id: string) => {
        const response = await api.delete(`/inventory/warehouses/${id}`);
        return response.data?.data || response.data;
    },
    getStockDashboardKpi: async (companyId: string) => {
        const response = await api.get(`/inventory/warehouses/company/${companyId}/kpi`);
        return response.data?.data || response.data;
    },

    // Items
    listItems: async (params?: any): Promise<InventoryItem[]> => {
        const response = await api.get('/inventory/items', { params });
        return extractArray(response.data);
    },
    getItem: async (id: string) => {
        const response = await api.get(`/inventory/items/${id}`);
        return response.data?.data || response.data;
    },
    createItem: async (data: any) => {
        const response = await api.post('/inventory/items', data);
        return response.data?.data || response.data;
    },
    updateItem: async (id: string, data: any) => {
        const response = await api.put(`/inventory/items/${id}`, data);
        return response.data?.data || response.data;
    },
    deleteItem: async (id: string) => {
        const response = await api.delete(`/inventory/items/${id}`);
        return response.data?.data || response.data;
    },
    listMovements: async (params?: { item_id?: string; limit?: number }) => {
        const response = await api.get('/inventory/movements', { params });
        return extractArray(response.data);
    },
    // Add other item methods as needed
    batchAdjust: async (data: BatchInventoryAdjustmentRequest) => {
        const response = await api.post('/inventory/adjust/batch', data);
        return response.data?.data || response.data;
    },

    bulkCreate: async (data: { items: any[] }) => {
        const response = await api.post('/inventory/items/bulk', data);
        return response.data.data;
    },

    exportPdf: async () => {
        const response = await api.get('/reports/inventory/pdf', {
            responseType: 'blob'
        });
        
        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'inventory_report.pdf');
        
        // Append to html link element page
        document.body.appendChild(link);
        
        // Start download
        link.click();
        
        // Clean up and remove the link
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    // Documents
    listDocuments: async (id: string) => {
        const response = await api.get(`/inventory/items/${id}/documents`);
        return response.data.data;
    },
    addDocument: async (id: string, data: any) => {
        const response = await api.post(`/inventory/items/${id}/documents`, data);
        return response.data.data;
    },
    uploadFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    listWarehouses: async () => {
        const response = await api.get('/inventory/warehouses');
        return response.data.data;
    },
    createWarehouse: async (data: any) => {
        const response = await api.post('/inventory/warehouses', data);
        return response.data.data;
    },

}

export interface InventoryAdjustmentItem {
    item_id: string;
    quantity: number;
    unit_price?: number;
}

export interface StockEntry {
    id: string;
    company_id: string;
    posting_date: string;
    posting_time: string;
    stock_entry_type: 'MATERIAL_RECEIPT' | 'MATERIAL_ISSUE' | 'MATERIAL_TRANSFER' | 'REPACK';
    voucher_no: string;
    purpose: string | null;
    source_warehouse_id: string | null;
    target_warehouse_id: string | null;
    status: 'DRAFT' | 'SUBMITTED' | 'CANCELLED';
    remarks: string | null;
    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string | null;
}

export interface StockEntryItem {
    id: string;
    stock_entry_id: string;
    item_id: string;
    source_warehouse_id: string | null;
    target_warehouse_id: string | null;
    qty: number;
    basic_rate: number;
    amount: number;
    batch_no: string | null;
    serial_no: string | null;
    created_at: string;
}

export interface MaterialRequest {
    id: string;
    company_id: string;
    transaction_date: string;
    material_request_type: 'PURCHASE' | 'MATERIAL_TRANSFER' | 'MATERIAL_ISSUE';
    voucher_no: string;
    required_by_date: string | null;
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PARTIALLY_ORDERED' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
    remarks: string | null;
    created_at: string;
    created_by: string | null;
    updated_at: string;
    updated_by: string | null;
}

export interface MaterialRequestItem {
    id: string;
    material_request_id: string;
    item_id: string;
    warehouse_id: string | null;
    qty: number;
    ordered_qty: number;
    received_qty: number;
    created_at: string;
}

export const uomApi = {
    // UOMs
    listUoms: async (companyId: string) => {
        const response = await api.get(`/inventory/uoms/company/${companyId}`);
        return response.data.data;
    },
    createUom: async (data: any) => {
        const response = await api.post('/inventory/uoms', data);
        return response.data.data;
    },
    deleteUom: async (id: string) => {
        const response = await api.delete(`/inventory/uoms/${id}`);
        return response.data.data;
    },

    // Conversions
    listConversions: async (companyId: string) => {
        const response = await api.get(`/inventory/uom-conversions/company/${companyId}`);
        return response.data.data;
    },
    createConversion: async (data: any) => {
        const response = await api.post('/inventory/uom-conversions', data);
        return response.data.data;
    },
    deleteConversion: async (id: string) => {
        const response = await api.delete(`/inventory/uom-conversions/${id}`);
        return response.data.data;
    },
};

export const itemTrackingApi = {
    // Serial Numbers
    listSerialNumbers: async (companyId: string) => {
        const response = await api.get(`/inventory/serial-numbers/company/${companyId}`);
        return response.data.data;
    },
    createSerialNumber: async (data: any) => {
        const response = await api.post('/inventory/serial-numbers', data);
        return response.data.data;
    },
    deleteSerialNumber: async (id: string) => {
        const response = await api.delete(`/inventory/serial-numbers/${id}`);
        return response.data.data;
    },

    // Batches
    listBatches: async (companyId: string) => {
        const response = await api.get(`/inventory/batches/company/${companyId}`);
        return response.data.data;
    },
    createBatch: async (data: any) => {
        const response = await api.post('/inventory/batches', data);
        return response.data.data;
    },
    deleteBatch: async (id: string) => {
        const response = await api.delete(`/inventory/batches/${id}`);
        return response.data.data;
    },
};

export const outboundLogisticsApi = {
    // 1. Delivery Notes
    createDeliveryNote: async (data: any) => {
        const response = await api.post('/inventory/delivery-notes', data);
        return response.data;
    },
    listDeliveryNotes: async (companyId: string) => {
        const response = await api.get(`/inventory/delivery-notes/company/${companyId}`);
        return response.data;
    },
    deleteDeliveryNote: async (id: string) => {
        await api.delete(`/inventory/delivery-notes/${id}`);
    },
    submitDeliveryNote: async (id: string) => {
        const response = await api.post(`/inventory/delivery-notes/${id}/submit`);
        return response.data;
    },

    // 2. Pick Lists
    createPickList: async (data: any) => {
        const response = await api.post('/inventory/pick-lists', data);
        return response.data;
    },
    listPickLists: async (companyId: string) => {
        const response = await api.get(`/inventory/pick-lists/company/${companyId}`);
        return response.data;
    },
    deletePickList: async (id: string) => {
        await api.delete(`/inventory/pick-lists/${id}`);
    },

    // 3. Delivery Trips
    createDeliveryTrip: async (data: any) => {
        const response = await api.post('/inventory/delivery-trips', data);
        return response.data;
    },
    listDeliveryTrips: async (companyId: string) => {
        const response = await api.get(`/inventory/delivery-trips/company/${companyId}`);
        return response.data;
    },
    deleteDeliveryTrip: async (id: string) => {
        await api.delete(`/inventory/delivery-trips/${id}`);
    },

    // 4. Installation Notes
    createInstallationNote: async (data: any) => {
        const response = await api.post('/inventory/installation-notes', data);
        return response.data;
    },
    listInstallationNotes: async (companyId: string) => {
        const response = await api.get(`/inventory/installation-notes/company/${companyId}`);
        return response.data;
    },
    deleteInstallationNote: async (id: string) => {
        await api.delete(`/inventory/installation-notes/${id}`);
    },

    // 5. Stock Reconciliations
    createStockReconciliation: async (data: any) => {
        const response = await api.post('/inventory/stock-reconciliations', data);
        return response.data;
    },
    listStockReconciliations: async (companyId: string) => {
        const response = await api.get(`/inventory/stock-reconciliations/company/${companyId}`);
        return response.data;
    },
    deleteStockReconciliation: async (id: string) => {
        await api.delete(`/inventory/stock-reconciliations/${id}`);
    },
};

export const masterDataExtendedApi = {
    // Manufacturers
    listManufacturers: async (companyId: string) => {
        const response = await api.get(`/inventory/manufacturers/company/${companyId}`);
        return response.data.data;
    },
    createManufacturer: async (data: any) => {
        const response = await api.post('/inventory/manufacturers', data);
        return response.data.data;
    },
    deleteManufacturer: async (id: string) => {
        const response = await api.delete(`/inventory/manufacturers/${id}`);
        return response.data.data;
    },

    // Brands
    listBrands: async (companyId: string) => {
        const response = await api.get(`/inventory/brands/company/${companyId}`);
        return response.data.data;
    },
    createBrand: async (data: any) => {
        const response = await api.post('/inventory/brands', data);
        return response.data.data;
    },
    deleteBrand: async (id: string) => {
        const response = await api.delete(`/inventory/brands/${id}`);
        return response.data.data;
    },

    // Item Attributes
    listAttributes: async (companyId: string) => {
        const response = await api.get(`/inventory/item-attributes/company/${companyId}`);
        return response.data.data;
    },
    createAttribute: async (data: any) => {
        const response = await api.post('/inventory/item-attributes', data);
        return response.data.data;
    },
    deleteAttribute: async (id: string) => {
        const response = await api.delete(`/inventory/item-attributes/${id}`);
        return response.data.data;
    },

    // Item Alternatives
    listAlternatives: async (companyId: string) => {
        const response = await api.get(`/inventory/item-alternatives-new/company/${companyId}`);
        return response.data.data;
    },
    createAlternative: async (data: any) => {
        const response = await api.post('/inventory/item-alternatives-new', data);
        return response.data.data;
    },
    deleteAlternative: async (id: string) => {
        const response = await api.delete(`/inventory/item-alternatives-new/${id}`);
        return response.data.data;
    },

    // Product Bundles
    listProductBundles: async (companyId: string) => {
        const response = await api.get(`/inventory/product-bundles/company/${companyId}`);
        return response.data.data;
    },
    createProductBundle: async (data: any) => {
        const response = await api.post('/inventory/product-bundles', data);
        return response.data.data;
    },
    deleteProductBundle: async (id: string) => {
        const response = await api.delete(`/inventory/product-bundles/${id}`);
        return response.data.data;
    },

    // Item Tax Templates
    createItemTaxTemplate: async (data: any) => {
        const response = await api.post('/inventory/item-tax-templates', data);
        return response.data.data;
    },
    getItemTaxTemplates: async (companyId: string) => {
        const response = await api.get(`/inventory/item-tax-templates/company/${companyId}`);
        return response.data.data;
    },
    deleteItemTaxTemplate: async (id: string) => {
        const response = await api.delete(`/inventory/item-tax-templates/${id}`);
        return response.data;
    },

    // Item Manufacturers
    createItemManufacturer: async (data: any) => {
        const response = await api.post('/inventory/item-manufacturers', data);
        return response.data.data;
    },
    getItemManufacturers: async (itemId: string) => {
        const response = await api.get(`/inventory/item-manufacturers/item/${itemId}`);
        return response.data.data;
    },
    deleteItemManufacturer: async (id: string) => {
        const response = await api.delete(`/inventory/item-manufacturers/${id}`);
        return response.data;
    },
};

export const qualityInspectionApi = {
    listInspections: async (companyId: string) => {
        const response = await api.get(`/inventory/quality-inspections/company/${companyId}`);
        return response.data.data;
    },
    createInspection: async (data: any) => {
        const response = await api.post('/inventory/quality-inspections', data);
        return response.data.data;
    },
    updateStatus: async (id: string, status: string) => {
        const response = await api.put(`/inventory/quality-inspections/${id}/status`, { status });
        return response.data.data;
    },
};

export const landedCostVoucherApi = {
    listVouchers: async (companyId: string) => {
        const response = await api.get(`/inventory/landed-cost-vouchers/company/${companyId}`);
        return response.data.data;
    },
    createVoucher: async (data: any) => {
        const response = await api.post('/inventory/landed-cost-vouchers', data);
        return response.data.data;
    },
    deleteVoucher: async (id: string) => {
        const response = await api.delete(`/inventory/landed-cost-vouchers/${id}`);
        return response.data.data;
    },
};

export const stockReportApi = {
    getStockLedger: async (companyId: string, params?: any) => {
        const response = await api.get(`/inventory/reports/stock-ledger/company/${companyId}`, { params });
        return response.data.data;
    },
    getStockBalance: async (companyId: string, params?: any) => {
        const response = await api.get(`/inventory/reports/stock-balance/company/${companyId}`, { params });
        return response.data.data;
    },
    getStockAgeing: async (companyId: string) => {
        const response = await api.get(`/inventory/reports/stock-ageing/company/${companyId}`);
        return response.data.data;
    },
    getStockProjectedQty: async (companyId: string) => {
        const response = await api.get(`/inventory/reports/stock-projected-qty/company/${companyId}`);
        return response.data.data;
    },
    getStockSummary: async (companyId: string) => {
        const response = await api.get(`/inventory/reports/stock-summary/company/${companyId}`);
        return response.data.data;
    },
    getBatchBalance: async (companyId: string) => {
        const response = await api.get(`/inventory/reports/batch-wise-balance/company/${companyId}`);
        return response.data.data;
    },
    getSerialNoStatus: async (companyId: string) => {
        const response = await api.get(`/inventory/reports/serial-no-status/company/${companyId}`);
        return response.data.data;
    },
    getItemShortage: async (companyId: string) => {
        const response = await api.get(`/inventory/reports/item-shortage/company/${companyId}`);
        return response.data.data;
    },
};

export const stockSettingsApi = {
    getSettings: async (companyId: string) => {
        const response = await api.get(`/inventory/stock-settings/company/${companyId}`);
        return response.data;
    },
    updateSettings: async (companyId: string, data: any) => {
        const response = await api.post(`/inventory/settings/company/${companyId}`, data);
        return response.data;
    },
    upsertSettings: async (companyId: string, data: { default_valuation_method: string, allow_negative_stock: boolean, auto_reorder_level: boolean }) => {
        const response = await api.put(`/inventory/stock-settings/company/${companyId}`, data);
        return response.data;
    }
};

export const stockAnalyticsApi = {
    getWarehouseValuations: async (companyId: string) => {
        const response = await api.get(`/inventory/analytics/warehouse-valuations/company/${companyId}`);
        return response.data.data;
    },
    getItemGroupValuations: async (companyId: string) => {
        const response = await api.get(`/inventory/analytics/item-group-valuations/company/${companyId}`);
        return response.data.data;
    },
    getMovementTrends: async (companyId: string, days: number = 30) => {
        const response = await api.get(`/inventory/analytics/movement-trends/company/${companyId}?days=${days}`);
        return response.data.data;
    }
};

export const stockReportsApi = stockReportApi;
