import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Package, Search, Plus, Filter,
    ArrowUpRight, ArrowDownRight, AlertTriangle,
    History, Edit2, Trash2, Box, BarChart2, Loader2, X,
    ExternalLink, Upload, FileText, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { inventoryApi } from '../api/inventory';
import type { InventoryItem, InventoryCategory, InventoryMovement } from '../api/inventory';
import {
    useToast, Button, Input, Badge, Modal, Tabs, TabsList, TabsTrigger, TabsContent,
    CurrencyInput, UniversalTableToolbar, type TableColumnOption, type FilterChip
} from '../../../components/ui';
import { format } from 'date-fns';
import { ImportInventoryModal } from '../components/ImportInventoryModal';
import { InventoryVisuals } from '../components/InventoryVisuals';

export default function InventoryItems() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedItemForHistory, setSelectedItemForHistory] = useState<InventoryItem | null>(null);
    const [importModalOpen, setImportModalOpen] = useState(false);

    // Column visibility state
    const [columns, setColumns] = useState<TableColumnOption[]>([
        { key: 'item', label: 'Barang & SKU', visible: true },
        { key: 'category', label: 'Kategori', visible: true },
        { key: 'stock', label: 'Level Stok', visible: true },
        { key: 'avg_cost', label: 'Harga Rata-rata', visible: true },
        { key: 'total_value', label: 'Total Nilai Persediaan', visible: true },
    ]);

    const toggleColumn = (key: string) => {
        setColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
    };

    const isColVisible = (key: string) => {
        const col = columns.find(c => c.key === key);
        return col ? col.visible !== false : true;
    };

    const queryClient = useQueryClient();
    const { success, error: showError, info } = useToast();

    // Queries
    const { data: items = [], isLoading: itemsLoading } = useQuery({
        queryKey: ['inventory-items', categoryFilter],
        queryFn: () => inventoryApi.listItems({ category_id: categoryFilter === 'all' ? undefined : categoryFilter })
    });

    const { data: categories = [] } = useQuery({
        queryKey: ['inventory-categories'],
        queryFn: inventoryApi.listCategories
    });

    const { data: movements = [], isLoading: movementsLoading } = useQuery({
        queryKey: ['inventory-movements', selectedItemForHistory?.id],
        queryFn: () => inventoryApi.listMovements({ item_id: selectedItemForHistory?.id }),
        enabled: historyModalOpen
    });

    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        category_id: '',
        unit_id: 1,
        description: '',
        min_stock: 0,
        max_stock: 0,
        initial_quantity: 0,
        purchase_price: 0
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: inventoryApi.createItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
            setModalOpen(false);
            success('Item baru berhasil disimpan');
        },
        onError: (err: any) => showError(err.response?.data?.message || 'Gagal membuat item')
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string, payload: any }) => inventoryApi.updateItem(data.id, data.payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
            setModalOpen(false);
            success('Data item berhasil diperbarui');
        },
        onError: (err: any) => showError(err.response?.data?.message || 'Gagal memperbarui item')
    });

    const deleteMutation = useMutation({
        mutationFn: inventoryApi.deleteItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
            success('Item berhasil dihapus');
        },
        onError: (err: any) => showError(err.response?.data?.message || 'Gagal menghapus item')
    });

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedItems = useMemo(() => {
        if (!Array.isArray(items)) return [];
        return [...items].sort((a, b) => {
            if (!sortConfig) return 0;
            const aValue = (a as any)[sortConfig.key] ?? '';
            const bValue = (b as any)[sortConfig.key] ?? '';

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [items, sortConfig]);

    const filteredItems = useMemo(() => {
        return sortedItems.filter(item => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchTerm.toLowerCase());

            const qty = Number(item.current_quantity) || 0;
            const min = Number(item.min_stock) || 0;

            let matchesStock = true;
            if (stockFilter === 'low') {
                matchesStock = qty <= min && qty > 0;
            } else if (stockFilter === 'out') {
                matchesStock = qty <= 0;
            }

            return matchesSearch && matchesStock;
        });
    }, [sortedItems, searchTerm, stockFilter]);

    const stats = useMemo(() => {
        if (!Array.isArray(items)) return { total: 0, low: 0, out: 0, value: 0 };
        return {
            total: items.length,
            low: items.filter(i => Number(i.current_quantity) <= Number(i.min_stock) && Number(i.current_quantity) > 0).length,
            out: items.filter(i => Number(i.current_quantity) <= 0).length,
            value: items.reduce((acc, i) => acc + (Number(i.current_quantity) * Number(i.average_cost || i.purchase_price || 0)), 0)
        };
    }, [items]);

    const handleOpenCreate = () => {
        setEditingItem(null);
        setFormData({
            sku: '',
            name: '',
            category_id: categories[0]?.id || '',
            unit_id: 1,
            description: '',
            min_stock: 0,
            max_stock: 0,
            initial_quantity: 0,
            purchase_price: 0
        });
        setModalOpen(true);
    };

    const handleOpenEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setFormData({
            sku: item.sku,
            name: item.name,
            category_id: item.category_id,
            unit_id: item.unit_id,
            description: item.description || '',
            min_stock: item.min_stock,
            max_stock: item.max_stock,
            initial_quantity: item.current_quantity,
            purchase_price: item.purchase_price || item.average_cost || 0
        });
        setModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.sku) {
            showError('Nama Barang dan SKU wajib diisi');
            return;
        }

        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, payload: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    // Filter Chips for UniversalTableToolbar
    const activeFilterChips = useMemo<FilterChip[]>(() => {
        const chips: FilterChip[] = [];
        if (categoryFilter !== 'all') {
            const cat = categories.find((c: any) => c.id === categoryFilter);
            chips.push({ id: 'category', label: 'Kategori', value: cat?.name || categoryFilter });
        }
        if (stockFilter !== 'all') {
            chips.push({
                id: 'stock',
                label: 'Status Stok',
                value: stockFilter === 'low' ? 'Stok Rendah' : 'Stok Habis'
            });
        }
        return chips;
    }, [categoryFilter, stockFilter, categories]);

    const handleRemoveFilterChip = (id: string) => {
        if (id === 'category') setCategoryFilter('all');
        if (id === 'stock') setStockFilter('all');
    };

    const handleResetAllFilters = () => {
        setSearchTerm('');
        setCategoryFilter('all');
        setStockFilter('all');
    };

    // Export dataset mapped
    const exportDataset = useMemo(() => {
        return filteredItems.map(item => ({
            'SKU': item.sku,
            'Nama Barang': item.name,
            'Kategori': categories.find((c: any) => c.id === item.category_id)?.name || '-',
            'Stok Saat Ini': Number(item.current_quantity) || 0,
            'Batas Min Stok': Number(item.min_stock) || 0,
            'Batas Max Stok': Number(item.max_stock) || 0,
            'Harga Pokok / Rata-rata (Rp)': Number(item.average_cost || item.purchase_price || 0),
            'Total Nilai Persediaan (Rp)': (Number(item.current_quantity) || 0) * (Number(item.average_cost || item.purchase_price || 0))
        }));
    }, [filteredItems, categories]);

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header + Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            <Package size={24} />
                        </div>
                        Katalog Barang & Persediaan (Inventory Items)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Kelola master suku cadang, pelumas, ban, barang konsumsi gudang, dan tingkat persediaan
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        onClick={() => setImportModalOpen(true)}
                        className="rounded-xl flex items-center gap-2 text-xs"
                    >
                        <Upload size={15} />
                        Import Excel
                    </Button>
                    <Button
                        variant="filled"
                        onClick={handleOpenCreate}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Tambah Barang Baru
                    </Button>
                </div>
            </div>

            {/* KPI Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-muted-foreground">Total Master Item</span>
                        <div className="text-2xl font-bold text-foreground mt-1">{stats.total}</div>
                        <span className="text-[11px] text-muted-foreground">SKU terdaftar</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <Package size={20} />
                    </div>
                </div>

                <div
                    onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
                    className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
                        stockFilter === 'low'
                            ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30'
                            : 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40'
                    }`}
                >
                    <div>
                        <span className="text-xs font-medium text-amber-400">Stok Rendah (Low)</span>
                        <div className="text-2xl font-bold text-amber-300 mt-1">{stats.low} SKU</div>
                        <span className="text-[11px] text-amber-500/80">Perlu reorder</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <AlertTriangle size={20} />
                    </div>
                </div>

                <div
                    onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
                    className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
                        stockFilter === 'out'
                            ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/30'
                            : 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40'
                    }`}
                >
                    <div>
                        <span className="text-xs font-medium text-rose-400">Stok Habis (Out)</span>
                        <div className="text-2xl font-bold text-rose-300 mt-1">{stats.out} SKU</div>
                        <span className="text-[11px] text-rose-500/80">Kritis 0 Qty</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <ShieldAlert size={20} />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-emerald-400">Total Nilai Persediaan</span>
                        <div className="text-2xl font-bold text-emerald-300 mt-1">
                            Rp {(stats.value / 1_000_000).toFixed(1)} Jt
                        </div>
                        <span className="text-[11px] text-emerald-500/80">Valuasi fisik gudang</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <BarChart2 size={20} />
                    </div>
                </div>
            </div>

            {/* Universal Table Toolbar + Quick Category Selector */}
            <div className="space-y-3">
                <UniversalTableToolbar
                    searchQuery={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Cari berdasarkan nama barang, SKU, atau kode part..."
                    columns={columns}
                    onToggleColumn={toggleColumn}
                    activeFilterChips={activeFilterChips}
                    onRemoveFilterChip={handleRemoveFilterChip}
                    onResetAllFilters={handleResetAllFilters}
                    exportData={exportDataset}
                    exportFilename="katalog_persediaan_barang"
                    actions={
                        <select
                            className="bg-muted/40 border border-border/60 text-foreground px-3 py-2 rounded-xl text-xs outline-none focus:border-primary transition-all font-medium"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">Semua Kategori</option>
                            {categories.map((cat: InventoryCategory) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    }
                />
            </div>

            {/* Main Data Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/40">
                                {isColVisible('item') && (
                                    <th
                                        className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                                        onClick={() => handleSort('name')}
                                    >
                                        Barang & SKU
                                    </th>
                                )}
                                {isColVisible('category') && (
                                    <th
                                        className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                                        onClick={() => handleSort('category_name')}
                                    >
                                        Kategori
                                    </th>
                                )}
                                {isColVisible('stock') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Level Stok & Batas Min
                                    </th>
                                )}
                                {isColVisible('avg_cost') && (
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Harga Rata-rata
                                    </th>
                                )}
                                {isColVisible('total_value') && (
                                    <th
                                        className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                                        onClick={() => handleSort('totalValue')}
                                    >
                                        Total Nilai
                                    </th>
                                )}
                                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                                        <Package size={40} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-semibold">Tidak ada barang yang sesuai kriteria pencarian</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => {
                                    const qty = Number(item.current_quantity) || 0;
                                    const min = Number(item.min_stock) || 0;
                                    const isLowStock = qty <= min && qty > 0;
                                    const isOutOfStock = qty <= 0;
                                    const avgCost = Number(item.average_cost || item.purchase_price || 0);
                                    const totalVal = qty * avgCost;

                                    return (
                                        <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                                            {isColVisible('item') && (
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-muted/60 border border-border/40 flex items-center justify-center text-cyan-400 group-hover:border-primary/40 transition-colors">
                                                            <Package size={18} />
                                                        </div>
                                                        <div
                                                            onClick={() => navigate(`/inventory-items/${item.id}`)}
                                                            className="cursor-pointer"
                                                        >
                                                            <span className="font-semibold text-foreground hover:text-primary transition-colors text-sm block">
                                                                {item.name}
                                                            </span>
                                                            <span className="text-[11px] font-mono text-muted-foreground">
                                                                SKU: {item.sku}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                            )}

                                            {isColVisible('category') && (
                                                <td className="px-5 py-3.5">
                                                    <Badge variant="outline" className="text-[11px]">
                                                        {categories.find((c: InventoryCategory) => c.id === item.category_id)?.name || '-'}
                                                    </Badge>
                                                </td>
                                            )}

                                            {isColVisible('stock') && (
                                                <td className="px-5 py-3.5">
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={`font-mono font-bold text-sm ${
                                                                isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'
                                                            }`}>
                                                                {qty.toLocaleString()} Unit
                                                            </span>
                                                            {isLowStock && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                                                    Min {min}
                                                                </span>
                                                            )}
                                                            {isOutOfStock && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                                                                    Habis
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            )}

                                            {isColVisible('avg_cost') && (
                                                <td className="px-5 py-3.5">
                                                    <span className="font-mono text-xs text-foreground">
                                                        Rp {avgCost.toLocaleString('id-ID')}
                                                    </span>
                                                </td>
                                            )}

                                            {isColVisible('total_value') && (
                                                <td className="px-5 py-3.5">
                                                    <span className="font-mono font-semibold text-xs text-emerald-400">
                                                        Rp {totalVal.toLocaleString('id-ID')}
                                                    </span>
                                                </td>
                                            )}

                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedItemForHistory(item);
                                                            setHistoryModalOpen(true);
                                                        }}
                                                        className="p-1.5 text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                                                        title="Riwayat Mutasi Barang"
                                                    >
                                                        <History size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="p-1.5 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                                                        title="Edit Barang"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (confirm(`Hapus item ${item.name}?`)) {
                                                                deleteMutation.mutate(item.id);
                                                            }
                                                        }}
                                                        className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                        title="Hapus Barang"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah / Edit Barang dengan CurrencyInput */}
            <Modal
                isOpen={modalOpen}
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingItem ? `Edit Barang: ${editingItem.name}` : 'Tambah Master Barang Baru'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Kode SKU *"
                            placeholder="cth. FLT-HYD-001"
                            value={formData.sku}
                            onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value }))}
                            required
                        />
                        <Input
                            label="Nama Barang *"
                            placeholder="cth. Filter Hydraulic Komatsu PC200"
                            value={formData.name}
                            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                                Kategori Barang *
                            </label>
                            <select
                                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors font-medium"
                                value={formData.category_id}
                                onChange={(e) => setFormData(p => ({ ...p, category_id: e.target.value }))}
                                required
                            >
                                <option value="">Pilih Kategori...</option>
                                {categories.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Real-Time Currency Input Masking */}
                        <CurrencyInput
                            label="Harga Beli / Pokok Rata-Rata"
                            placeholder="0"
                            value={formData.purchase_price}
                            onChange={(val) => setFormData(p => ({ ...p, purchase_price: val }))}
                            helperText="Format Rupiah otomatis berseparator titik"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                            type="number"
                            label="Batas Minimum Stok"
                            value={formData.min_stock}
                            onChange={(e) => setFormData(p => ({ ...p, min_stock: parseFloat(e.target.value) || 0 }))}
                        />
                        <Input
                            type="number"
                            label="Batas Maksimum Stok"
                            value={formData.max_stock}
                            onChange={(e) => setFormData(p => ({ ...p, max_stock: parseFloat(e.target.value) || 0 }))}
                        />
                        <Input
                            type="number"
                            label="Stok Awal"
                            disabled={!!editingItem}
                            value={formData.initial_quantity}
                            onChange={(e) => setFormData(p => ({ ...p, initial_quantity: parseFloat(e.target.value) || 0 }))}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                            Deskripsi / Spesifikasi Part
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Catatan kompatibilitas unit, nomor part pabrikan, dll..."
                            className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                            value={formData.description}
                            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                        />
                    </div>

                    <div className="flex gap-2 justify-end pt-3 border-t border-border/40">
                        <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="filled"
                            loading={createMutation.isPending || updateMutation.isPending}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl"
                        >
                            Simpan Barang
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Riwayat Mutasi Barang */}
            <Modal
                isOpen={historyModalOpen}
                opened={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                title={`Riwayat Mutasi: ${selectedItemForHistory?.name || ''}`}
                size="lg"
            >
                <div className="space-y-4">
                    {movementsLoading ? (
                        <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat riwayat pergerakan stok...</div>
                    ) : movements.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">Belum ada catatan mutasi pergerakan stok untuk barang ini.</div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-border/40 max-h-96">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/60 sticky top-0">
                                    <tr>
                                        <th className="p-2.5 font-bold">Waktu</th>
                                        <th className="p-2.5 font-bold">Tipe Mutasi</th>
                                        <th className="p-2.5 font-bold">Jumlah</th>
                                        <th className="p-2.5 font-bold">Referensi / Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {movements.map((m: any) => (
                                        <tr key={m.id} className="hover:bg-muted/20">
                                            <td className="p-2.5 text-muted-foreground">{m.created_at ? format(new Date(m.created_at), 'dd MMM yyyy HH:mm') : '-'}</td>
                                            <td className="p-2.5">
                                                <Badge variant={m.movement_type === 'in' ? 'success' : 'default'}>
                                                    {m.movement_type === 'in' ? 'MASUK' : 'KELUAR'}
                                                </Badge>
                                            </td>
                                            <td className="p-2.5 font-mono font-bold">
                                                {m.movement_type === 'in' ? `+${m.quantity}` : `-${m.quantity}`}
                                            </td>
                                            <td className="p-2.5 text-muted-foreground">{m.reference_number || m.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="flex justify-end pt-2">
                        <Button variant="outline" onClick={() => setHistoryModalOpen(false)} className="rounded-xl">
                            Tutup
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Import Inventory Modal */}
            <ImportInventoryModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
                    setImportModalOpen(false);
                }}
            />
        </div>
    );
}
