import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, type MaterialRequest, type InventoryItem } from'../api/inventory';
import {
    Plus, Search, RefreshCw, CheckCircle2, Trash2, X, Eye, AlertCircle
} from 'lucide-react';
import { showToast } from'../../../components/ui/Toast';
import {
    Card, Button, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty, TableSkeleton
} from'../../../components/ui';

const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

const MaterialRequestPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);

    // Form states
    const [requestType, setRequestType] = useState<'PURCHASE' | 'MATERIAL_TRANSFER' | 'MATERIAL_ISSUE'>('PURCHASE');
    const [requiredByDate, setRequiredByDate] = useState('');
    const [remarks, setRemarks] = useState('');
    const [itemsList, setItemsList] = useState<Array<{ item_id: string; qty: number; warehouse_id: string }>>([
        { item_id: '', qty: 1, warehouse_id: '' }
    ]);

    // Queries
    const { data: requests = [], isLoading: requestsLoading } = useQuery({
        queryKey: ['material-requests'],
        queryFn: () => inventoryApi.listMaterialRequests(DEFAULT_COMPANY_ID)
    });

    const { data: warehouses = [] } = useQuery({
        queryKey: ['warehouses'],
        queryFn: () => inventoryApi.listWarehouses()
    });

    const { data: items = [] } = useQuery({
        queryKey: ['inventory-items'],
        queryFn: () => inventoryApi.listItems()
    });

    // Mutations
    const createMut = useMutation({
        mutationFn: inventoryApi.createMaterialRequest,
        onSuccess: () => {
            showToast('Material Request created successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['material-requests'] });
            setIsCreateOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            showToast(err.response?.data?.error || 'Failed to create Material Request', 'error');
        }
    });

    const approveMut = useMutation({
        mutationFn: inventoryApi.approveMaterialRequest,
        onSuccess: () => {
            showToast('Material Request approved successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['material-requests'] });
            setSelectedRequest(null);
        },
        onError: (err: any) => {
            showToast(err.response?.data?.error || 'Failed to approve Material Request', 'error');
        }
    });

    const resetForm = () => {
        setRequestType('PURCHASE');
        setRequiredByDate('');
        setRemarks('');
        setItemsList([{ item_id: '', qty: 1, warehouse_id: '' }]);
    };

    const handleAddItemRow = () => {
        setItemsList(prev => [...prev, { item_id: '', qty: 1, warehouse_id: '' }]);
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
            } else if (field === 'qty') {
                updated[index].qty = Math.max(0.01, parseFloat(value) || 0);
            } else if (field === 'warehouse_id') {
                updated[index].warehouse_id = value;
            }
            return updated;
        });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validItems = itemsList.filter(i => i.item_id && i.qty > 0);
        if (validItems.length === 0) {
            showToast('Please add at least one valid item with quantity', 'error');
            return;
        }

        const payload = {
            company_id: DEFAULT_COMPANY_ID,
            transaction_date: new Date().toISOString().split('T')[0],
            voucher_no: `MR-${Date.now()}`,
            material_request_type: requestType,
            required_by_date: requiredByDate || null,
            remarks: remarks || null,
            items: validItems.map(i => ({
                item_id: i.item_id,
                qty: i.qty,
                warehouse_id: i.warehouse_id || null,
            }))
        };

        createMut.mutate(payload);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/100/10 text-emerald-400 border border-emerald-500/20 rounded-full">APPROVED</span>;
            case 'REJECTED':
                return <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">REJECTED</span>;
            case 'PENDING_APPROVAL':
                return <span className="px-2.5 py-1 text-xs font-bold bg-amber-500/100/10 text-amber-400 border border-amber-500/20 rounded-full">PENDING APPROVAL</span>;
            case 'CANCELLED':
                return <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">CANCELLED</span>;
            default:
                return <span className="px-2.5 py-1 text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">DRAFT</span>;
        }
    };

    const filteredRequests = requests.filter((r: MaterialRequest) =>
        r.voucher_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.remarks && r.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Material Requests</h1>
                    <p className="text-muted-foreground mt-2">Manage purchase requisitions and stock requests</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        leftIcon={<RefreshCw size={18} />}
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['material-requests'] })}
                        className="rounded-xl"
                    >
                        Refresh
                    </Button>
                    <Button
                        leftIcon={<Plus size={18} />}
                        onClick={() => setIsCreateOpen(true)}
                        className="rounded-xl bg-primary hover:bg-primary/90 text-white border-none cursor-pointer"
                    >
                        Create Request
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
                    {requestsLoading ? (
                        <div className="p-4"><TableSkeleton rows={5} cols={5} /></div>
                    ) : (
                        <Table className="border-none">
                            <TableHead>
                                <TableRow className="bg-muted/20 border-border">
                                    <TableTh>Voucher No</TableTh>
                                    <TableTh>Type</TableTh>
                                    <TableTh>Required By Date</TableTh>
                                    <TableTh>Status</TableTh>
                                    <TableTh align="center">Actions</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRequests.map((req: MaterialRequest) => (
                                    <TableRow key={req.id} className="border-border hover:bg-muted/40 transition-colors">
                                        <TableTd className="font-semibold text-foreground">{req.voucher_no}</TableTd>
                                        <TableTd>
                                            <span className="font-medium text-foreground/80">{req.material_request_type}</span>
                                        </TableTd>
                                        <TableTd>{req.required_by_date || '-'}</TableTd>
                                        <TableTd>{getStatusBadge(req.status)}</TableTd>
                                        <TableTd align="center">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedRequest(req)}
                                                leftIcon={<Eye size={14} />}
                                                className="rounded-lg py-1 px-2.5 hover:bg-primary/10 text-primary border-primary/20"
                                            >
                                                Details
                                            </Button>
                                        </TableTd>
                                    </TableRow>
                                ))}
                                {filteredRequests.length === 0 && (
                                    <TableEmpty colSpan={5} message="No material requests found." />
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
                                <h2 className="text-xl font-bold text-foreground">Create Material Request</h2>
                                <p className="text-sm text-muted-foreground mt-1">Initiate a requisition for inventory purchase or transfer</p>
                            </div>
                            <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-foreground">Request Type</label>
                                    <select
                                        className="p-2.5 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                                        value={requestType}
                                        onChange={e => setRequestType(e.target.value as any)}
                                    >
                                        <option value="PURCHASE">Purchase Request</option>
                                        <option value="MATERIAL_TRANSFER">Material Transfer Request</option>
                                        <option value="MATERIAL_ISSUE">Material Issue Request</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-semibold text-foreground">Required By Date</label>
                                    <input
                                        type="date"
                                        className="p-2.5 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                                        value={requiredByDate}
                                        onChange={e => setRequiredByDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-foreground">Remarks / Note</label>
                                <textarea
                                    className="p-2.5 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
                                    rows={2}
                                    placeholder="Explanation of request requirements..."
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
                                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-muted/10 p-4 rounded-xl border border-border">
                                            <div className="col-span-12 sm:col-span-5 flex flex-col gap-1.5">
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

                                            <div className="col-span-12 sm:col-span-2 flex flex-col gap-1.5">
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

                                            <div className="col-span-12 sm:col-span-4 flex flex-col gap-1.5">
                                                <label className="text-xs font-semibold text-muted-foreground">Target Warehouse (Optional)</label>
                                                <select
                                                    className="p-2 bg-background border border-border rounded-lg text-foreground focus:outline-none w-full"
                                                    value={item.warehouse_id}
                                                    onChange={e => handleItemChange(idx, 'warehouse_id', e.target.value)}
                                                >
                                                    <option value="">Select Warehouse...</option>
                                                    {warehouses.map((w: any) => (
                                                        <option key={w.id} value={w.id}>{w.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-span-12 sm:col-span-1 flex justify-end pb-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveItemRow(idx)}
                                                    className="p-2 hover:bg-rose-500/100/10 text-rose-500 rounded-lg hover:border-rose-500/20 border border-transparent"
                                                    disabled={itemsList.length === 1}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border flex justify-end gap-3 bg-background sticky bottom-0">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMut.isPending} className="rounded-xl bg-primary text-white border-none cursor-pointer">
                                    {createMut.isPending ? 'Submitting...' : 'Create Draft'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Details & Approve Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-foreground">{selectedRequest.voucher_no}</h2>
                                    {getStatusBadge(selectedRequest.status)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Details and actions for Material Request</p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-muted rounded-lg text-muted-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/10 p-4 rounded-xl border border-border">
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase font-bold">Request Type</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">{selectedRequest.material_request_type}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs uppercase font-bold">Transaction Date</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">{selectedRequest.transaction_date}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-muted-foreground block text-xs uppercase font-bold">Required By Date</span>
                                    <span className="font-semibold text-foreground mt-0.5 block">{selectedRequest.required_by_date || '-'}</span>
                                </div>
                            </div>

                            {selectedRequest.remarks && (
                                <div>
                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Remarks</span>
                                    <p className="text-sm text-foreground bg-muted/10 p-3 rounded-lg border border-border">{selectedRequest.remarks}</p>
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Workflow & Approvals</h3>
                                <div className="text-xs text-muted-foreground bg-muted/5 border border-border rounded-xl p-4 flex items-center gap-3">
                                    <AlertCircle size={18} className="text-blue-400" />
                                    <span>Approval is required to transition this Material Request to a purchase order or transfer order.</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setSelectedRequest(null)} className="rounded-xl">
                                Close
                            </Button>
                            {selectedRequest.status === 'DRAFT' && (
                                <Button
                                    onClick={() => {
                                        if (confirm('Approve this Material Request? This will allow procurement and stock creation.')) {
                                            approveMut.mutate(selectedRequest.id);
                                        }
                                    }}
                                    disabled={approveMut.isPending}
                                    leftIcon={<CheckCircle2 size={18} />}
                                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none cursor-pointer"
                                >
                                    {approveMut.isPending ? 'Approving...' : 'Approve Request'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MaterialRequestPage;
