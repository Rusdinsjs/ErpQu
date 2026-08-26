import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, type StockEntry, type InventoryItem } from'../api/inventory';
import {
    Plus, Search, RefreshCw, CheckCircle2, AlertCircle, Trash2, X, Eye
} from 'lucide-react';
import { showToast } from'../../../components/ui/Toast';
import {
    Card, Button, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty, TableSkeleton
} from'../../../components/ui';

// Mock company ID (since we don't have multi-tenant company chooser yet, or we can use first company)
const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

const StockEntryPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<StockEntry | null>(null);

    // Form states
    const [entryType, setEntryType] = useState<'MATERIAL_RECEIPT' | 'MATERIAL_ISSUE' | 'MATERIAL_TRANSFER'>('MATERIAL_TRANSFER');
    const [sourceWarehouseId, setSourceWarehouseId] = useState('');
    const [targetWarehouseId, setTargetWarehouseId] = useState('');
    const [remarks, setRemarks] = useState('');
    const [itemsList, setItemsList] = useState<Array<{ 
        item_id: string; 
        qty: number; 
        basic_rate: number;
        source_bin_id?: string;
        target_bin_id?: string;
    }>>([
        { item_id: '', qty: 1, basic_rate: 0, source_bin_id: '', target_bin_id: '' }
    ]);

    // Queries
    const { data: entries = [], isLoading: entriesLoading } = useQuery({
        queryKey: ['stock-entries'],
        queryFn: () => inventoryApi.listStockEntries(DEFAULT_COMPANY_ID)
    });

    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses'],
        queryFn: () => inventoryApi.listWarehouses()
    });

    const { data: rawItems = [] } = useQuery({
        queryKey: ['inventory-items'],
        queryFn: () => inventoryApi.listItems()
    });
    const items: any[] = (rawItems as any[]) || [];
    

    // Bins for form selection
    const { data: sourceBins = [] } = useQuery({
        queryKey: ['warehouse-bins', sourceWarehouseId],
        queryFn: () => inventoryApi.listWarehouseBins(sourceWarehouseId),
        enabled: !!sourceWarehouseId
    });

    const { data: targetBins = [] } = useQuery({
        queryKey: ['warehouse-bins', targetWarehouseId],
        queryFn: () => inventoryApi.listWarehouseBins(targetWarehouseId),
        enabled: !!targetWarehouseId
    });

    // Details for selected entry
    const { data: fullEntryDetail } = useQuery({
        queryKey: ['stock-entry-detail', selectedEntry?.id],
        queryFn: () => inventoryApi.getStockEntry(selectedEntry!.id),
        enabled: !!selectedEntry?.id
    });

    const { data: detailSourceBins = [] } = useQuery({
        queryKey: ['warehouse-bins', selectedEntry?.source_warehouse_id],
        queryFn: () => inventoryApi.listWarehouseBins(selectedEntry!.source_warehouse_id!),
        enabled: !!selectedEntry?.source_warehouse_id
    });

    const { data: detailTargetBins = [] } = useQuery({
        queryKey: ['warehouse-bins', selectedEntry?.target_warehouse_id],
        queryFn: () => inventoryApi.listWarehouseBins(selectedEntry!.target_warehouse_id!),
        enabled: !!selectedEntry?.target_warehouse_id
    });

    // Mutations
    const createMut = useMutation({
        mutationFn: inventoryApi.createStockEntry,
        onSuccess: () => {
            showToast('Stock Entry created successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['stock-entries'] });
            setIsCreateOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            showToast(err.response?.data?.error || 'Failed to create Stock Entry', 'error');
        }
    });

    const submitMut = useMutation({
        mutationFn: inventoryApi.submitStockEntry,
        onSuccess: () => {
            showToast('Stock Entry submitted and stock levels updated successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['stock-entries'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
            setSelectedEntry(null);
        },
        onError: (err: any) => {
            showToast(err.response?.data?.error || 'Failed to submit Stock Entry', 'error');
        }
    });

    const resetForm = () => {
        setEntryType('MATERIAL_TRANSFER');
        setSourceWarehouseId('');
        setTargetWarehouseId('');
        setRemarks('');
        setItemsList([{ item_id: '', qty: 1, basic_rate: 0, source_bin_id: '', target_bin_id: '' }]);
    };

    const handleAddItemRow = () => {
        setItemsList(prev => [...prev, { item_id: '', qty: 1, basic_rate: 0, source_bin_id: '', target_bin_id: '' }]);
    };

    const handleRemoveItemRow = (index: number) => {
        if (itemsList.length > 1) {
            setItemsList(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        setItemsList(prev => {
            const updated = [...prev];
            if (field === 'item_id') {
                updated[index].item_id = value;
                const found = items.find((i: InventoryItem) => i.id === value);
                if (found) {
                    updated[index].basic_rate = parseFloat(found.average_cost.toString()) || parseFloat(found.purchase_price.toString()) || 0;
                }
            } else if (field === 'qty') {
                updated[index].qty = Math.max(0.01, parseFloat(value) || 0);
            } else if (field === 'basic_rate') {
                updated[index].basic_rate = Math.max(0, parseFloat(value) || 0);
            } else if (field === 'source_bin_id') {
                updated[index].source_bin_id = value || undefined;
            } else if (field === 'target_bin_id') {
                updated[index].target_bin_id = value || undefined;
            }
            return updated;
        });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validations
        if (entryType !== 'MATERIAL_RECEIPT' && !sourceWarehouseId) {
            showToast('Source Warehouse is required for issue/transfer', 'error');
            return;
        }
        if (entryType !== 'MATERIAL_ISSUE' && !targetWarehouseId) {
            showToast('Target Warehouse is required for receipt/transfer', 'error');
            return;
        }

        const validItems = itemsList.filter(i => i.item_id && i.qty > 0);
        if (validItems.length === 0) {
            showToast('Please add at least one valid item with quantity', 'error');
            return;
        }

        const payload = {
            company_id: DEFAULT_COMPANY_ID,
            posting_date: new Date().toISOString().split('T')[0],
            voucher_no: `STE-${Date.now()}`,
            stock_entry_type: entryType,
            source_warehouse_id: entryType === 'MATERIAL_RECEIPT' ? null : sourceWarehouseId,
            target_warehouse_id: entryType === 'MATERIAL_ISSUE' ? null : targetWarehouseId,
            purpose: remarks || 'Stock Entry via UI',
            remarks: remarks || null,
            items: validItems.map(i => ({
                item_id: i.item_id,
                qty: i.qty,
                basic_rate: i.basic_rate,
                source_warehouse_id: entryType === 'MATERIAL_RECEIPT' ? null : sourceWarehouseId,
                target_warehouse_id: entryType === 'MATERIAL_ISSUE' ? null : targetWarehouseId,
                source_bin_id: entryType === 'MATERIAL_RECEIPT' ? null : (i.source_bin_id || null),
                target_bin_id: entryType === 'MATERIAL_ISSUE' ? null : (i.target_bin_id || null),
            }))
        };

        createMut.mutate(payload);
    };

    const getWarehouseName = (id: string | null) => {
        if (!id) return '-';
        const wh = warehouses.find((w: any) => w.id === id);
        return wh ? wh.name : 'Unknown Warehouse';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUBMITTED':
                return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/100/10 text-emerald-400 border border-emerald-500/20 rounded-full">SUBMITTED</span>;
            case 'CANCELLED':
                return <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">CANCELLED</span>;
            default:
                return <span className="px-2.5 py-1 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">DRAFT</span>;
        }
    };

    const filteredEntries = entries.filter((e: StockEntry) =>
        e.voucher_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.remarks && e.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Stock Entries</h1>
                    <p className="text-muted-foreground mt-2">Manage warehouse transfers, receipts, and issues</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        leftIcon={<RefreshCw size={18} />}
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['stock-entries'] })}
                        className="rounded-xl"
                    >
                        Refresh
                    </Button>
                    <Button
                        leftIcon={<Plus size={18} />}
                        onClick={() => setIsCreateOpen(true)}
                        className="rounded-xl bg-primary hover:bg-primary/90 text-white border-none cursor-pointer"
                    >
                        Create Entry
                    </Button>
                </div>
            </div>

            {/* List Table */}
            <Card className="overflow-hidden p-0">
                <div className="p-4 border-b border-border bg-muted/20">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search by Voucher No..."
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {entriesLoading ? (
                        <div className="p-4"><TableSkeleton rows={5} cols={5} /></div>
                    ) : (
                        <Table className="border-none">
                            <TableHead>
                                <TableRow className="bg-muted/20 border-border">
                                    <TableTh>Voucher No</TableTh>
                                    <TableTh>Type</TableTh>
                                    <TableTh>Source Warehouse</TableTh>
                                    <TableTh>Target Warehouse</TableTh>
                                    <TableTh>Status</TableTh>
                                    <TableTh align="center">Actions</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredEntries.map((entry: StockEntry) => (
                                    <TableRow key={entry.id} className="border-border hover:bg-muted/40 transition-colors">
                                        <TableTd className="font-semibold text-foreground">{entry.voucher_no}</TableTd>
                                        <TableTd>
                                            <span className="font-medium text-foreground/80">{entry.stock_entry_type}</span>
                                        </TableTd>
                                        <TableTd>{getWarehouseName(entry.source_warehouse_id)}</TableTd>
                                        <TableTd>{getWarehouseName(entry.target_warehouse_id)}</TableTd>
                                        <TableTd>{getStatusBadge(entry.status)}</TableTd>
                                        <TableTd align="center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedEntry(entry)}
                                                leftIcon={<Eye size={14} />}
                                                className="rounded-lg py-1 px-2.5 hover:bg-primary/10 text-primary border-primary/20"
                                            >
                                                Details
                                            </Button>
                                        </TableTd>
                                    </TableRow>
                                ))}
                                {filteredEntries.length === 0 && (
                                    <TableEmpty colSpan={6} message="No stock entries found." />
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </Card>

            {/* Create Drawer/Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-3xl h-full bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Create Stock Entry</h2>
                                <p className="text-sm text-muted-foreground mt-1">Record a new material receipt, transfer, or issue</p>
                            </div>
                            <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-foreground">Entry Type</label>
                                    <select
                                        className="p-2.5 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                                        value={entryType}
                                        onChange={e => setEntryType(e.target.value as any)}
                                    >
                                        <option value="MATERIAL_TRANSFER">Material Transfer</option>
                                        <option value="MATERIAL_RECEIPT">Material Receipt</option>
                                        <option value="MATERIAL_ISSUE">Material Issue</option>
                                    </select>
                                </div>

                                {entryType !== 'MATERIAL_RECEIPT' && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-foreground">Source Warehouse</label>
                                        <select
                                            className="p-2.5 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                                            value={sourceWarehouseId}
                                            onChange={e => setSourceWarehouseId(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Warehouse...</option>
                                            {warehouses.map((w: any) => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {entryType !== 'MATERIAL_ISSUE' && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-foreground">Target Warehouse</label>
                                        <select
                                            className="p-2.5 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                                            value={targetWarehouseId}
                                            onChange={e => setTargetWarehouseId(e.target.value)}
                                            required
                                        >
                                            <option value="">Select Warehouse...</option>
                                            {warehouses.map((w: any) => (
                                                <option key={w.id} value={w.id}>{w.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-foreground">Remarks / Note</label>
                                <textarea
                                    className="p-2.5 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                                    rows={2}
                                    placeholder="Purpose or internal comment..."
                                    value={remarks}
                                    onChange={e => setRemarks(e.target.value)}
                                />
                            </div>

                            {/* Item Lines Section */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Item Details</h3>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        leftIcon={<Plus size={16} />}
                                        onClick={handleAddItemRow}
                                        className="rounded-lg"
                                    >
                                        Add Item
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {itemsList.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-end bg-muted/10 p-4 rounded-xl border border-border flex-wrap">
                                            <div className="flex-1 min-w-[200px] flex flex-col gap-2">
                                                <label className="text-xs font-semibold text-muted-foreground">Item Name</label>
                                                <select
                                                    className="p-2 bg-background border border-border rounded-lg text-foreground focus:outline-none w-full"
                                                    value={item.item_id}
                                                    onChange={e => handleItemChange(idx, 'item_id', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Item...</option>
                                                    {items.map((i: InventoryItem) => (
                                                        <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>
                                                     ))}
                                                </select>
                                            </div>

                                            {entryType !== 'MATERIAL_RECEIPT' && (
                                                <div className="w-40 flex flex-col gap-2">
                                                    <label className="text-xs font-semibold text-muted-foreground">Source Bin</label>
                                                    <select
                                                        className="p-2 bg-background border border-border rounded-lg text-foreground focus:outline-none"
                                                        value={item.source_bin_id || ''}
                                                        onChange={e => handleItemChange(idx, 'source_bin_id', e.target.value)}
                                                    >
                                                        <option value="">No Bin...</option>
                                                        {sourceBins.map((b: any) => (
                                                            <option key={b.id} value={b.id}>{b.bin_code}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {entryType !== 'MATERIAL_ISSUE' && (
                                                <div className="w-40 flex flex-col gap-2">
                                                    <label className="text-xs font-semibold text-muted-foreground">Target Bin</label>
                                                    <select
                                                        className="p-2 bg-background border border-border rounded-lg text-foreground focus:outline-none"
                                                        value={item.target_bin_id || ''}
                                                        onChange={e => handleItemChange(idx, 'target_bin_id', e.target.value)}
                                                    >
                                                        <option value="">No Bin...</option>
                                                        {targetBins.map((b: any) => (
                                                            <option key={b.id} value={b.id}>{b.bin_code}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div className="w-28 flex flex-col gap-2">
                                                <label className="text-xs font-semibold text-muted-foreground">Quantity</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    className="p-2 bg-background border border-border rounded-lg text-foreground text-right focus:outline-none w-full"
                                                    value={item.qty}
                                                    onChange={e => handleItemChange(idx, 'qty', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="w-32 flex flex-col gap-2">
                                                <label className="text-xs font-semibold text-muted-foreground">Basic Rate</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    className="p-2 bg-background border border-border rounded-lg text-foreground text-right focus:outline-none w-full"
                                                    value={item.basic_rate}
                                                    onChange={e => handleItemChange(idx, 'basic_rate', e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItemRow(idx)}
                                                className="p-2 hover:bg-rose-500/100/10 text-rose-500 rounded-lg hover:border-rose-500/20 border border-transparent self-end"
                                                disabled={itemsList.length === 1}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border flex justify-end gap-3 bg-background sticky bottom-0">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMut.isPending} className="rounded-xl bg-primary text-white border-none cursor-pointer">
                                    {createMut.isPending ? 'Creating...' : 'Create Draft'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details & Submission Modal */}
            {selectedEntry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-foreground">{selectedEntry.voucher_no}</h2>
                                    {getStatusBadge(selectedEntry.status)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Details and action for Stock Entry</p>
                            </div>
                            <button onClick={() => setSelectedEntry(null)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/10 p-4 rounded-xl border border-border">
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase font-bold">Stock Entry Type</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">{selectedEntry.stock_entry_type}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase font-bold">Posting Date & Time</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">{selectedEntry.posting_date} {selectedEntry.posting_time}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase font-bold">Source Warehouse</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">{getWarehouseName(selectedEntry.source_warehouse_id)}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase font-bold">Target Warehouse</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">{getWarehouseName(selectedEntry.target_warehouse_id)}</span>
                                </div>
                            </div>

                            {selectedEntry.remarks && (
                                <div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Remarks</span>
                                    <p className="text-sm text-foreground bg-muted/10 p-3 rounded-lg border border-border">{selectedEntry.remarks}</p>
                                </div>
                            )}

                            {/* Render items list inside detail */}
                            <div>
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Items</h3>
                                <div className="border border-border rounded-xl overflow-hidden mb-4 bg-card">
                                    <Table>
                                        <TableHead>
                                            <TableRow className="border-b border-border bg-muted/30">
                                                <TableTh>Item</TableTh>
                                                <TableTh align="right">Qty</TableTh>
                                                <TableTh align="right">Rate</TableTh>
                                                <TableTh>Source Bin</TableTh>
                                                <TableTh>Target Bin</TableTh>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {fullEntryDetail?.[1]?.map((item: any) => (
                                                <TableRow key={item.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                                                    <TableTd className="font-medium text-foreground">
                                                        {items.find((i: any) => i.id === item.item_id)?.name || item.item_id}
                                                    </TableTd>
                                                    <TableTd align="right" className="text-foreground">{parseFloat(item.qty).toLocaleString()}</TableTd>
                                                    <TableTd align="right" className="text-foreground">${parseFloat(item.basic_rate).toLocaleString()}</TableTd>
                                                    <TableTd className="text-foreground/80">
                                                        {detailSourceBins.find((b: any) => b.id === item.source_bin_id)?.bin_code || '-'}
                                                    </TableTd>
                                                    <TableTd className="text-foreground/80">
                                                        {detailTargetBins.find((b: any) => b.id === item.target_bin_id)?.bin_code || '-'}
                                                    </TableTd>
                                                </TableRow>
                                            ))}
                                            {(!fullEntryDetail?.[1] || fullEntryDetail[1].length === 0) && (
                                                <TableEmpty colSpan={5} message="No items in this entry." />
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="text-xs text-muted-foreground bg-muted/5 border border-border rounded-xl p-4 flex items-center gap-3">
                                    <AlertCircle size={18} className="text-blue-400" />
                                    <span>Posting is immutable. Submitting this entry will immediately impact the item inventory bins and generate accounting general ledger journal entries.</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setSelectedEntry(null)} className="rounded-xl">
                                Close
                            </Button>
                            {selectedEntry.status === 'DRAFT' && (
                                <Button
                                    onClick={() => {
                                        if (confirm('Submit this Stock Entry? This action is irreversible and updates stock levels.')) {
                                            submitMut.mutate(selectedEntry.id);
                                        }
                                    }}
                                    disabled={submitMut.isPending}
                                    leftIcon={<CheckCircle2 size={18} />}
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none cursor-pointer"
                                >
                                    {submitMut.isPending ? 'Submitting...' : 'Submit Entry'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockEntryPage;
