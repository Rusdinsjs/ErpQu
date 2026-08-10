import { api } from './http';

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
    // Categories
    listCategories: async () => {
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

    // Items
    listItems: async (params?: any) => {
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
    deleteWarehouse: async (id: string) => {
        const response = await api.delete(`/inventory/warehouses/${id}`);
        return response.data.data;
    },

    // Stock Entries
    listStockEntries: async (companyId: string) => {
        const response = await api.get(`/inventory/stock-entries/company/${companyId}`);
        return response.data.data;
    },
    getStockEntry: async (id: string) => {
        const response = await api.get(`/inventory/stock-entries/${id}`);
        return response.data.data;
    },
    createStockEntry: async (data: any) => {
        const response = await api.post('/inventory/stock-entries', data);
        return response.data.data;
    },
    submitStockEntry: async (id: string) => {
        const response = await api.post(`/inventory/stock-entries/${id}/submit`);
        return response.data.data;
    },

    // Material Requests
    listMaterialRequests: async (companyId: string) => {
        const response = await api.get(`/inventory/material-requests/company/${companyId}`);
        return response.data.data;
    },
    getMaterialRequest: async (id: string) => {
        const response = await api.get(`/inventory/material-requests/${id}`);
        return response.data.data;
    },
    createMaterialRequest: async (data: any) => {
        const response = await api.post('/inventory/material-requests', data);
        return response.data.data;
    },
    approveMaterialRequest: async (id: string) => {
        const response = await api.post(`/inventory/material-requests/${id}/approve`);
        return response.data.data;
    },

    // Product Bundles
    createProductBundle: async (data: any) => {
        const response = await api.post('/inventory/product-bundles', data);
        return response.data.data;
    },
    getProductBundle: async (parentItemId: string) => {
        const response = await api.get(`/inventory/product-bundles/parent/${parentItemId}`);
        return response.data.data;
    },

    // Item Alternatives
    addItemAlternative: async (data: any) => {
        const response = await api.post('/inventory/item-alternatives', data);
        return response.data.data;
    },
    getItemAlternatives: async (itemId: string) => {
        const response = await api.get(`/inventory/item-alternatives/item/${itemId}`);
        return response.data.data;
    },

    // Warehouse Bins & Location Ledger
    createWarehouseBin: async (data: any) => {
        const response = await api.post('/inventory/warehouses/bins', data);
        return response.data.data;
    },
    getWarehouseBin: async (id: string) => {
        const response = await api.get(`/inventory/warehouses/bins/${id}`);
        return response.data.data;
    },
    listWarehouseBins: async (warehouseId: string) => {
        const response = await api.get(`/inventory/warehouses/${warehouseId}/bins`);
        return response.data.data;
    },
    deleteWarehouseBin: async (id: string) => {
        const response = await api.delete(`/inventory/warehouses/bins/${id}`);
        return response.data.data;
    },
    listBinBalances: async (warehouseBinId: string) => {
        const response = await api.get(`/inventory/warehouses/bins/${warehouseBinId}/balances`);
        return response.data.data;
    },
    listBinBalancesByItem: async (itemId: string) => {
        const response = await api.get(`/inventory/items/${itemId}/bin-balances`);
        return response.data.data;
    },
};

export interface InventoryDocument {
    id: string;
    item_id: string;
    name: string;
    type: string;
    file_path: string;
    mime_type: string | null;
    size_bytes: number | null;
    expiry_date: string | null;
    notes: string | null;
    uploaded_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface InventoryMovement {
    id: string;
    item_id: string;
    movement_type: 'IN_PURCHASE' | 'IN_ADJUSTMENT' | 'OUT_USAGE' | 'OUT_ADJUSTMENT' | 'OUT_TRANSFER';
    quantity: number;
    unit_price: number;
    total_value: number;
    reference_id?: string;
    reference_number?: string;
    notes?: string;
    created_by?: string;
    created_at: string;
}

export interface BatchInventoryAdjustmentRequest {
    items: InventoryAdjustmentItem[];
    notes?: string;
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
