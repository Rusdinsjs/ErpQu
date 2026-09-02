import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, type InventoryItem, type BatchInventoryAdjustmentRequest } from '../api/inventory';
import {
    Save, RefreshCw, Search, ClipboardCheck, AlertCircle, Package,
    FileSpreadsheet, ArrowUpDown, CheckCircle2, ShieldAlert, BarChart3,
    Filter, X, TrendingDown, TrendingUp
} from 'lucide-react';
import {
    Card,
    Button,
    Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    TableSkeleton,
    Badge,
    UniversalTableToolbar,
    type TableColumnOption,
    type FilterChip,
    useToast
} from '../../../components/ui';

const StockOpname: React.FC = () => {
    const queryClient = useQueryClient();
    const { success, error: showError, info } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState<'all' | 'discrepancy' | 'counted'>('all');
    const [physicalCounts, setPhysicalCounts] = useState<{ [itemId: string]: number }>({});
    const [globalNote, setGlobalNote] = useState('');

    // Column visibility state
    const [columns, setColumns] = useState<TableColumnOption[]>([
        { key: 'item', label: 'Nama Barang & SKU', visible: true },
        { key: 'system_qty', label: 'Stok Sistem', visible: true },
        { key: 'physical_qty', label: 'Hasil Hitung Fisik', visible: true },
        { key: 'diff_qty', label: 'Selisih Qty (+/-)', visible: true },
        { key: 'diff_val', label: 'Nilai Selisih (Rp)', visible: true },
    ]);

    const toggleColumn = (key: string) => {
        setColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
    };

    const isColVisible = (key: string) => {
        const col = columns.find(c => c.key === key);
        return col ? col.visible !== false : true;
    };

    // Fetch Inventory Items
    const { data: rawItems = [], isLoading } = useQuery({
        queryKey: ['inventory-items'],
        queryFn: () => inventoryApi.listItems()
    });
    const items: InventoryItem[] = (rawItems as any[]) || [];

    // Batch Adjustment Mutation
    const adjustMut = useMutation({
        mutationFn: inventoryApi.batchAdjust,
        onSuccess: () => {
            success('Rekonsiliasi Stock Opname berhasil disimpan ke sistem');
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
            setPhysicalCounts({});
            setGlobalNote('');
        },
        onError: () => showError('Gagal menyimpan penyesuaian stok opname')
    });

    const handleCountChange = (itemId: string, val: string) => {
        const num = parseFloat(val);
        if (!isNaN(num)) {
            setPhysicalCounts(prev => ({ ...prev, [itemId]: num }));
        } else if (val === '') {
            const newCounts = { ...physicalCounts };
            delete newCounts[itemId];
            setPhysicalCounts(newCounts);
        }
    };

    const changes = useMemo(() => {
        return (items as InventoryItem[]).filter((item: InventoryItem) => {
            const physical = physicalCounts[item.id];
            return physical !== undefined && physical !== parseFloat(item.current_quantity.toString());
        }).map((item: any) => {
            const physical = physicalCounts[item.id];
            const current = parseFloat(item.current_quantity.toString());
            const diff = physical - current;
            const avgCost = Number(item.average_cost || item.purchase_price || 0);
            return {
                ...item,
                physical,
                diff,
                diffVal: diff * avgCost
            };
        });
    }, [items, physicalCounts]);

    const handleSubmit = () => {
        if (changes.length === 0) {
            info('Tidak ada selisih stok yang perlu disesuaikan');
            return;
        }

        const payload: BatchInventoryAdjustmentRequest = {
            items: changes.map((c: any) => ({
                item_id: c.id,
                quantity: c.diff,
                unit_price: c.average_cost || 0,
            })),
            notes: globalNote || 'Rekonsiliasi Fisik Stock Opname'
        };

        if (confirm(`Konfirmasi penyesuaian stok untuk ${changes.length} item barang yang memiliki selisih?`)) {
            adjustMut.mutate(payload);
        }
    };

    const filteredItems = useMemo(() => {
        return (items as InventoryItem[]).filter((item: InventoryItem) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchTerm.toLowerCase());

            const current = parseFloat(item.current_quantity.toString());
            const physical = physicalCounts[item.id];
            const hasCount = physical !== undefined;
            const hasDiscrepancy = hasCount && physical !== current;

            if (!matchesSearch) return false;
            if (filterMode === 'discrepancy') return hasDiscrepancy;
            if (filterMode === 'counted') return hasCount;

            return true;
        });
    }, [items, searchTerm, filterMode, physicalCounts]);

    // Stats calculations
    const totalItems = items.length;
    const itemsCounted = Object.keys(physicalCounts).length;
    const itemsWithDiscrepancy = changes.length;
    const totalDiscrepancyValue = changes.reduce((acc, c) => acc + (c.diffVal || 0), 0);

    // Export dataset mapping
    const exportDataset = useMemo(() => {
        return items.map((item: any) => {
            const current = parseFloat(item.current_quantity.toString());
            const physical = physicalCounts[item.id];
            const diff = physical !== undefined ? physical - current : 0;
            const avgCost = Number(item.average_cost || item.purchase_price || 0);

            return {
                'SKU': item.sku,
                'Nama Barang': item.name,
                'Stok Sistem': current,
                'Stok Fisik Dihitung': physical !== undefined ? physical : '-',
                'Selisih Qty': physical !== undefined ? diff : 0,
                'Nilai Selisih (Rp)': physical !== undefined ? diff * avgCost : 0,
                'Status': physical === undefined ? 'Belum Dihitung' : diff === 0 ? 'Cocok (Match)' : diff > 0 ? 'Surplus (+)' : 'Defisit (-)'
            };
        });
    }, [items, physicalCounts]);

    const activeFilterChips = useMemo<FilterChip[]>(() => {
        if (filterMode === 'all') return [];
        return [{
            id: 'filterMode',
            label: 'Filter Tampilan',
            value: filterMode === 'discrepancy' ? 'Hanya Selisih' : 'Sudah Dihitung'
        }];
    }, [filterMode]);

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <ClipboardCheck size={24} />
                        </div>
                        Stock Opname & Rekonsiliasi Fisik Gudang
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pencocokan stok fisik lapangan dengan data sistem secara transparan dan auto-generate penyesuaian selisih
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="filled"
                        onClick={handleSubmit}
                        loading={adjustMut.isPending}
                        disabled={changes.length === 0}
                        className={`rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-lg transition-all ${
                            changes.length > 0
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                                : 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed'
                        }`}
                    >
                        <Save size={16} />
                        Posting Penyesuaian ({changes.length} Item)
                    </Button>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-muted-foreground">Total Master Barang</span>
                        <div className="text-2xl font-bold text-foreground mt-1">{totalItems} SKU</div>
                        <span className="text-[11px] text-muted-foreground">Persediaan terdaftar</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <Package size={20} />
                    </div>
                </div>

                <div
                    onClick={() => setFilterMode(filterMode === 'counted' ? 'all' : 'counted')}
                    className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
                        filterMode === 'counted'
                            ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30'
                            : 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40'
                    }`}
                >
                    <div>
                        <span className="text-xs font-medium text-emerald-400">Item Terhitung</span>
                        <div className="text-2xl font-bold text-emerald-300 mt-1">{itemsCounted} / {totalItems}</div>
                        <span className="text-[11px] text-emerald-500/80">Progres {Math.round((itemsCounted / (totalItems || 1)) * 100)}%</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                <div
                    onClick={() => setFilterMode(filterMode === 'discrepancy' ? 'all' : 'discrepancy')}
                    className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
                        filterMode === 'discrepancy'
                            ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30'
                            : 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
                    }`}
                >
                    <div>
                        <span className="text-xs font-medium text-amber-400">Item Selisih (Discrepancy)</span>
                        <div className="text-2xl font-bold text-amber-300 mt-1">{itemsWithDiscrepancy} SKU</div>
                        <span className="text-[11px] text-amber-500/80">Perlu penyesuaian</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <AlertCircle size={20} />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-muted-foreground">Nilai Nominal Selisih</span>
                        <div className={`text-2xl font-bold mt-1 font-mono ${totalDiscrepancyValue < 0 ? 'text-rose-400' : totalDiscrepancyValue > 0 ? 'text-emerald-400' : 'text-foreground'}`}>
                            Rp {Math.abs(totalDiscrepancyValue).toLocaleString('id-ID')}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                            {totalDiscrepancyValue < 0 ? 'Defisit kerugian' : totalDiscrepancyValue > 0 ? 'Surplus kelebihan' : 'Seimbang (Match)'}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <BarChart3 size={20} />
                    </div>
                </div>
            </div>

            {/* Note Input */}
            <div className="p-3.5 bg-muted/30 border border-border/60 rounded-2xl flex items-center gap-3">
                <span className="text-xs font-bold text-foreground whitespace-nowrap uppercase tracking-wider">
                    Catatan Opname:
                </span>
                <input
                    type="text"
                    placeholder="cth. Stock Opname Akhir Bulan Gudang Utama Samarinda..."
                    value={globalNote}
                    onChange={(e) => setGlobalNote(e.target.value)}
                    className="flex-1 bg-background/60 border border-border/40 rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                />
            </div>

            {/* Universal Table Toolbar */}
            <UniversalTableToolbar
                searchQuery={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder="Cari item barang atau SKU..."
                columns={columns}
                onToggleColumn={toggleColumn}
                activeFilterChips={activeFilterChips}
                onRemoveFilterChip={() => setFilterMode('all')}
                onResetAllFilters={() => { setSearchTerm(''); setFilterMode('all'); }}
                exportData={exportDataset}
                exportFilename="laporan_stock_opname_selisih"
                actions={
                    <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40 text-xs">
                        {[
                            { id: 'all', label: 'Semua' },
                            { id: 'counted', label: 'Terhitung' },
                            { id: 'discrepancy', label: 'Selisih Saja' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setFilterMode(tab.id as any)}
                                className={`px-2.5 py-1.5 font-semibold rounded-lg transition-all ${
                                    filterMode === tab.id
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                }
            />

            {/* Main Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <TableSkeleton rows={5} columns={5} />
                    ) : (
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-border/40 bg-muted/40">
                                    {isColVisible('item') && (
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                            Rincian Barang
                                        </th>
                                    )}
                                    {isColVisible('system_qty') && (
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                                            Stok Sistem
                                        </th>
                                    )}
                                    {isColVisible('physical_qty') && (
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right w-52">
                                            Input Hitung Fisik
                                        </th>
                                    )}
                                    {isColVisible('diff_qty') && (
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                                            Selisih Qty
                                        </th>
                                    )}
                                    {isColVisible('diff_val') && (
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                                            Nilai Selisih (Rp)
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                                            <Package size={40} className="mx-auto mb-3 opacity-20" />
                                            <p className="text-sm font-semibold">Tidak ada data item barang yang cocok</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item: any) => {
                                        const current = parseFloat(item.current_quantity.toString());
                                        const physical = physicalCounts[item.id];
                                        const diff = physical !== undefined ? physical - current : 0;
                                        const hasChange = physical !== undefined && physical !== current;
                                        const isCounted = physical !== undefined;
                                        const avgCost = Number(item.average_cost || item.purchase_price || 0);
                                        const diffVal = diff * avgCost;

                                        return (
                                            <tr
                                                key={item.id}
                                                className={`transition-colors ${
                                                    hasChange
                                                        ? 'bg-amber-500/10 hover:bg-amber-500/15'
                                                        : isCounted
                                                        ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                                                        : 'hover:bg-muted/30'
                                                }`}
                                            >
                                                {isColVisible('item') && (
                                                    <td className="px-5 py-3.5">
                                                        <div>
                                                            <span className="font-semibold text-foreground text-sm block">
                                                                {item.name}
                                                            </span>
                                                            <span className="text-[11px] font-mono text-muted-foreground">
                                                                SKU: {item.sku}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )}

                                                {isColVisible('system_qty') && (
                                                    <td className="px-5 py-3.5 text-right font-mono font-medium text-foreground">
                                                        {current.toLocaleString()} Unit
                                                    </td>
                                                )}

                                                {isColVisible('physical_qty') && (
                                                    <td className="px-5 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder={current.toString()}
                                                                value={physicalCounts[item.id] !== undefined ? physicalCounts[item.id] : ''}
                                                                onChange={(e) => handleCountChange(item.id, e.target.value)}
                                                                className={`w-28 px-3 py-1.5 text-right font-mono text-sm bg-background border rounded-xl focus:outline-none transition-all ${
                                                                    hasChange
                                                                        ? 'border-amber-500 ring-2 ring-amber-500/20 font-bold text-amber-300'
                                                                        : isCounted
                                                                        ? 'border-emerald-500 text-emerald-300 font-bold'
                                                                        : 'border-border/60 text-foreground focus:border-primary'
                                                                }`}
                                                            />
                                                            {isCounted && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCountChange(item.id, '')}
                                                                    className="text-muted-foreground hover:text-foreground"
                                                                    title="Reset input item ini"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}

                                                {isColVisible('diff_qty') && (
                                                    <td className="px-5 py-3.5 text-right font-mono">
                                                        {hasChange ? (
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                                                                diff > 0
                                                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                                                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                                            }`}>
                                                                {diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                                {diff > 0 ? `+${diff}` : diff}
                                                            </span>
                                                        ) : isCounted ? (
                                                            <span className="text-emerald-400 text-xs font-semibold">Cocok (0)</span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">-</span>
                                                        )}
                                                    </td>
                                                )}

                                                {isColVisible('diff_val') && (
                                                    <td className="px-5 py-3.5 text-right font-mono text-xs">
                                                        {hasChange ? (
                                                            <span className={`font-semibold ${diffVal < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                                                {diffVal < 0 ? '-' : '+'}Rp {Math.abs(diffVal).toLocaleString('id-ID')}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockOpname;
