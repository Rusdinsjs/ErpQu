import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi, type QualityInspection } from '../api/ops-quality-trip';
import { inventoryApi } from '../../inventory/api/inventory';
import { useAuthStore } from '../../../store/useAuthStore';
import {
    Plus, Search, ClipboardCheck, X
} from 'lucide-react';
import { showToast } from '../../../components/ui/Toast';
import {
    Card, Button, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty, TableSkeleton, PageHeader, SearchInput
} from '../../../components/ui';

const QualityInspectionsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const activeCompanyId = useAuthStore(s => s.activeCompanyId) || 'c0000000-0000-0000-0000-000000000001';
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form states
    const [inspectionType, setInspectionType] = useState<'INCOMING' | 'IN_PROCESS' | 'OUTGOING'>('INCOMING');
    const [itemId, setItemId] = useState('');
    const [batchNo, setBatchNo] = useState('');
    const [sampleSize, setSampleSize] = useState(1);
    const [status, setStatus] = useState<'PENDING' | 'PASSED' | 'REJECTED' | 'QUALITY_HOLD'>('PENDING');

    // Queries
    const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
        queryKey: ['quality-inspections', activeCompanyId],
        queryFn: () => opsApi.listQualityInspections(activeCompanyId)
    });

    const { data: rawItems = [] } = useQuery({
        queryKey: ['items'],
        queryFn: () => inventoryApi.listItems()
    });
    const items: any[] = (rawItems as any[]) || [];

    // Mutations
    const createMut = useMutation({
        mutationFn: opsApi.createQualityInspection,
        onSuccess: () => {
            showToast('Quality Inspection created successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['quality-inspections'] });
            setIsCreateOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            showToast(err.response?.data?.error || 'Failed to create Quality Inspection', 'error');
        }
    });

    const updateStatusMut = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            opsApi.updateQualityInspectionStatus(id, status),
        onSuccess: () => {
            showToast('Inspection status updated successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['quality-inspections'] });
        },
        onError: (err: any) => {
            showToast(err.response?.data?.error || 'Failed to update inspection status', 'error');
        }
    });

    const resetForm = () => {
        setInspectionType('INCOMING');
        setItemId('');
        setBatchNo('');
        setSampleSize(1);
        setStatus('PENDING');
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemId) {
            showToast('Please select an item', 'error');
            return;
        }
        createMut.mutate({
            company_id: activeCompanyId,
            inspection_type: inspectionType,
            item_id: itemId,
            batch_no: batchNo || undefined,
            sample_size: sampleSize,
            status,
        });
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'PASSED':
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'REJECTED':
                return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
            case 'QUALITY_HOLD':
                return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
            default:
                return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        }
    };

    const filteredInspections = inspections.filter((ins: QualityInspection) => {
        const item = items.find((i: any) => i.id === ins.item_id);
        const itemName = item?.name || '';
        return (
            ins.inspection_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ins.batch_no && ins.batch_no.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Quality Inspections"
                description="Quality control validation logs for incoming and outgoing products."
                action={
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        leftIcon={<Plus className="h-4 w-4" />}
                    >
                        Create Inspection
                    </Button>
                }
            />

            <Card className="p-6 bg-card/40 backdrop-blur-md border-border/40">
                <div className="mb-4 max-w-sm">
                    <SearchInput
                        placeholder="Search by number, item, batch..."
                        value={searchTerm}
                        onChange={setSearchTerm}
                    />
                </div>

                {inspectionsLoading ? (
                    <TableSkeleton cols={7} rows={5} />
                ) : filteredInspections.length === 0 ? (
                    <TableEmpty colSpan={7} message="No quality inspections found." />
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Number</TableTh>
                                <TableTh>Item</TableTh>
                                <TableTh>Type</TableTh>
                                <TableTh>Batch No</TableTh>
                                <TableTh>Sample Size</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh className="text-right">Actions</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredInspections.map((ins: QualityInspection) => {
                                const item = items.find((i: any) => i.id === ins.item_id);
                                return (
                                    <TableRow key={ins.id}>
                                        <TableTd className="font-mono text-sm">{ins.inspection_number}</TableTd>
                                        <TableTd>
                                            <div>
                                                <div className="font-semibold">{item?.name || 'Loading item...'}</div>
                                                <div className="text-xs text-muted-foreground">{item?.sku}</div>
                                            </div>
                                        </TableTd>
                                        <TableTd>
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                                                {ins.inspection_type}
                                            </span>
                                        </TableTd>
                                        <TableTd className="text-sm font-mono">{ins.batch_no || '-'}</TableTd>
                                        <TableTd className="text-sm">{ins.sample_size}</TableTd>
                                        <TableTd>
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusBadgeClass(ins.status)}`}>
                                                {ins.status}
                                            </span>
                                        </TableTd>
                                        <TableTd className="text-right">
                                            {ins.status === 'PENDING' && (
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => updateStatusMut.mutate({ id: ins.id, status: 'PASSED' })}
                                                        className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                                                    >
                                                        Pass
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => updateStatusMut.mutate({ id: ins.id, status: 'QUALITY_HOLD' })}
                                                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                                    >
                                                        Hold
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => updateStatusMut.mutate({ id: ins.id, status: 'REJECTED' })}
                                                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </TableTd>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {isCreateOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg p-6 bg-card border border-border/80 shadow-2xl relative">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCreateOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <ClipboardCheck className="h-5 w-5 text-blue-400" /> Create Quality Inspection
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Inspection Type</label>
                                <select
                                    value={inspectionType}
                                    onChange={(e: any) => setInspectionType(e.target.value)}
                                    className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none"
                                >
                                    <option value="INCOMING">Incoming Receipt</option>
                                    <option value="IN_PROCESS">In Process Production</option>
                                    <option value="OUTGOING">Outgoing Shipment</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Item to Inspect</label>
                                <select
                                    value={itemId}
                                    onChange={(e) => setItemId(e.target.value)}
                                    className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none"
                                >
                                    <option value="">Select Item...</option>
                                    {items.map((i: any) => (
                                        <option key={i.id} value={i.id}>
                                            {i.name} ({i.sku})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Batch Number (Optional)</label>
                                <input
                                    type="text"
                                    value={batchNo}
                                    onChange={(e) => setBatchNo(e.target.value)}
                                    placeholder="e.g. BATCH-2026-08A"
                                    className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Sample Size</label>
                                <input
                                    type="number"
                                    value={sampleSize}
                                    onChange={(e) => setSampleSize(parseInt(e.target.value) || 1)}
                                    min="1"
                                    className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Initial Status</label>
                                <select
                                    value={status}
                                    onChange={(e: any) => setStatus(e.target.value)}
                                    className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none"
                                >
                                    <option value="PENDING">PENDING</option>
                                    <option value="PASSED">PASSED</option>
                                    <option value="QUALITY_HOLD">QUALITY_HOLD</option>
                                    <option value="REJECTED">REJECTED</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMut.isPending} className="bg-blue-600 hover:bg-blue-700">
                                    Save Inspection
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default QualityInspectionsPage;
