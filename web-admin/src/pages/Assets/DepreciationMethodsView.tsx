import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Filter, ArrowLeft, RefreshCw, Eye, Edit2, Trash2, CheckCircle2, TrendingDown, DollarSign, FileText, Layers, Link2, Sparkles, Check
} from 'lucide-react';
import { Button, Input, Select, Textarea, Modal, Badge, useToast, MultiSelect } from '../../components/ui';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { depreciationApi } from '../../api/depreciation';
import type { DepreciationMethod } from '../../api/depreciation';

// Note: linked_categories was local mock data. We map it temporarily.


const CATEGORY_OPTIONS = [
    { value: 'Bangunan & Infrastruktur', label: 'Bangunan & Infrastruktur' },
    { value: 'Mesin & Peralatan Pabrik', label: 'Mesin & Peralatan Pabrik' },
    { value: 'Kendaraan Operasional', label: 'Kendaraan Operasional' },
    { value: 'Alat Berat & Excavator', label: 'Alat Berat & Excavator' },
    { value: 'Furniture & Peralatan Kantor', label: 'Furniture & Peralatan Kantor' },
    { value: 'Perangkat Komputer & IT', label: 'Perangkat Komputer & IT' },
    { value: 'Aset Tanah (Land)', label: 'Aset Tanah (Land)' }
];

export default function DepreciationMethodsView() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    // Modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingMethod, setEditingMethod] = useState<DepreciationMethod | null>(null);
    const [viewingMethod, setViewingMethod] = useState<DepreciationMethod | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<DepreciationMethod>>({
        code: '',
        method_name: '',
        annual_rate: '20%',
        frequency_months: '12 Bulan (Bulanan)',
        linked_categories: [],
        is_active: true,
        description: ''
    });

    // Helper: Read category rules from Asset Settings
    const getCategoryRules = () => {
        try {
            const raw = localStorage.getItem('erp_asset_settings');
            const parsed = raw ? JSON.parse(raw) : null;
            return parsed?.category_rules || [
                { category_name: 'Bangunan & Infrastruktur', useful_life_months: 240, depreciation_method: 'Garis Lurus (Straight Line)', residual_percent: 10 },
                { category_name: 'Mesin & Peralatan Pabrik', useful_life_months: 120, depreciation_method: 'Garis Lurus (Straight Line)', residual_percent: 5 },
                { category_name: 'Kendaraan Operasional', useful_life_months: 60, depreciation_method: 'Saldo Menurun (Declining Balance)', residual_percent: 5 },
                { category_name: 'Alat Berat & Excavator', useful_life_months: 96, depreciation_method: 'Saldo Menurun (Declining Balance)', residual_percent: 5 },
                { category_name: 'Perangkat Komputer & IT', useful_life_months: 36, depreciation_method: 'Jumlah Angka Tahun (Sum of Years Digits)', residual_percent: 0 },
                { category_name: 'Furniture & Peralatan Kantor', useful_life_months: 48, depreciation_method: 'Garis Lurus (Straight Line)', residual_percent: 5 },
                { category_name: 'Aset Tanah (Land)', useful_life_months: 0, depreciation_method: 'Manual / Non-Depresiasi', residual_percent: 100 },
            ];
        } catch {
            return [];
        }
    };

    // Calculate dynamic annual rate based on linked category useful life in Asset Settings
    const getDynamicRateForMethod = (method: Partial<DepreciationMethod>) => {
        if (method.code === 'MANUAL') return '0%';
        const rules = getCategoryRules();

        const matched = rules.filter((r: any) =>
            (method.linked_categories || []).some((cat: string) =>
                cat.toLowerCase().includes(r.category_name.toLowerCase()) ||
                r.category_name.toLowerCase().includes(cat.toLowerCase())
            )
        );

        if (matched.length === 0) return method.annual_rate || 'Pilih Kategori Terlebih Dahulu';

        const calculatedRates = matched.map((r: any) => {
            if (r.useful_life_months <= 0) return 0;
            const years = r.useful_life_months / 12;
            if (method.code === 'DBM') {
                return Math.round((2 / years) * 100);
            } else {
                return Number(((1 / years) * 100).toFixed(1));
            }
        }).filter((rate: number) => rate > 0);

        if (calculatedRates.length === 0) return '0%';
        const minRate = Math.min(...calculatedRates);
        const maxRate = Math.max(...calculatedRates);

        if (minRate === maxRate) {
            return `${minRate}% / thn`;
        }
        return `${minRate}% - ${maxRate}% / thn`;
    };

    // Computed rate inside Modal Form based on selected linked_categories
    const modalComputedRate = useMemo(() => {
        if (!formData.linked_categories || formData.linked_categories.length === 0) {
            return 'Silakan pilih Kategori Aset Terkait terlebih dahulu...';
        }
        return getDynamicRateForMethod(formData);
    }, [formData.linked_categories, formData.code]);

    // Fetch from Backend
    const { data: serverMethods = [], isLoading } = useQuery({
        queryKey: ['depreciation-methods'],
        queryFn: () => depreciationApi.list()
    });

    const methods = serverMethods.map(m => ({
        ...m,
        annual_rate: m.annual_rate || '',
        frequency_months: m.frequency_months || '',
        description: m.description || '',
        linked_categories: [] // Future improvement: fetch linked categories from categories API
    }));

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: Partial<DepreciationMethod>) => depreciationApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['depreciation-methods'] });
            success('Metode Depresiasi Ditambahkan', 'Berhasil dibuat.');
            setIsFormModalOpen(false);
        },
        onError: () => showError('Gagal Menambahkan', 'Terjadi kesalahan saat menghubungi server.')
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<DepreciationMethod>) => depreciationApi.update(data.id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['depreciation-methods'] });
            success('Metode Depresiasi Diperbarui', 'Berhasil diubah.');
            setIsFormModalOpen(false);
        },
        onError: () => showError('Gagal Memperbarui', 'Terjadi kesalahan saat menghubungi server.')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => depreciationApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['depreciation-methods'] });
            success('Metode Dihapus', 'Berhasil dihapus dari daftar.');
        },
        onError: () => showError('Gagal Menghapus', 'Terjadi kesalahan saat menghubungi server.')
    });

    const handleOpenCreateModal = () => {
        setEditingMethod(null);
        setFormData({
            code: '',
            method_name: '',
            annual_rate: '20%',
            frequency_months: '12 Bulan (Bulanan)',
            linked_categories: ['Mesin & Peralatan Pabrik'],
            is_active: true,
            description: ''
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (method: DepreciationMethod) => {
        setEditingMethod(method);
        setFormData({ ...method });
        setIsFormModalOpen(true);
    };

    const handleSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code || !formData.method_name) {
            showError('Data Tidak Lengkap', 'Kode dan Nama Metode Depresiasi wajib diisi.');
            return;
        }

        const computedRate = getDynamicRateForMethod(formData);

        const payload = {
            ...formData,
            code: formData.code!.toUpperCase(),
            annual_rate: computedRate,
            frequency_months: formData.frequency_months || '12 Bulan (Bulanan)',
            is_active: formData.is_active ?? true,
        };

        if (editingMethod) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus metode depresiasi "${name}"?`)) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleStatus = (id: string) => {
        const method = methods.find(m => m.id === id);
        if (method) {
            updateMutation.mutate({ ...method, is_active: !method.is_active });
        }
    };

    // Filtered methods
    const filteredMethods = methods.filter(m => {
        const matchesSearch = m.method_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'active' ? m.is_active : !m.is_active;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/assets-workspace')}
                        className="p-2 rounded-xl bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <TrendingDown className="text-amber-500" size={24} /> Depreciation Methods
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Master data metode & tarif penyusutan terhubung langsung dengan umur ekonomis kategori di Asset Settings
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="default" onClick={handleOpenCreateModal} className="rounded-xl font-semibold">
                        <Plus size={16} className="mr-2" /> Tambah Metode Baru
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari kode, nama metode, deskripsi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-40"
                    >
                        <option value="all">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="inactive">Non-Aktif</option>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => { setMethods([...methods]); success('Refreshed', 'Daftar metode depresiasi ter-update.'); }}>
                        <RefreshCw size={14} className="mr-1.5" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Table Area */}
            <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden p-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm text-left">
                        <thead className="text-[11px] font-bold text-muted-foreground uppercase bg-muted/40 border-b border-border/60 tracking-wider">
                            <tr>
                                <th className="px-5 py-3.5 w-12 text-center">#</th>
                                <th className="px-5 py-3.5 font-semibold">Kode</th>
                                <th className="px-5 py-3.5 font-semibold">Nama Metode</th>
                                <th className="px-5 py-3.5 font-semibold text-amber-500">Tarif Tahunan (Terhitung)</th>
                                <th className="px-5 py-3.5 font-semibold">Frekuensi</th>
                                <th className="px-5 py-3.5 font-semibold">Kategori Terkait</th>
                                <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                                <th className="px-5 py-3.5 w-28 text-center font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 bg-card">
                            {filteredMethods.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                                        Tidak ada metode depresiasi yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredMethods.map((m, idx) => {
                                    const computedRate = getDynamicRateForMethod(m);
                                    return (
                                        <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-3.5 text-center font-mono text-xs text-muted-foreground">{idx + 1}</td>
                                            <td className="px-5 py-3.5 font-bold font-mono text-primary">{m.code}</td>
                                            <td className="px-5 py-3.5 font-semibold text-foreground">{m.method_name}</td>
                                            <td className="px-5 py-3.5 font-bold text-amber-500 flex items-center gap-1.5">
                                                <Link2 size={13} className="text-amber-500" /> {computedRate}
                                            </td>
                                            <td className="px-5 py-3.5 text-muted-foreground">{m.frequency_months}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-wrap gap-1">
                                                    {m.linked_categories.slice(0, 2).map((cat, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-muted font-medium text-muted-foreground border border-border/40">
                                                            {cat}
                                                        </span>
                                                    ))}
                                                    {m.linked_categories.length > 2 && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-bold">
                                                            +{m.linked_categories.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(m.id)}
                                                    className="cursor-pointer inline-block"
                                                    title="Klik untuk ubah status"
                                                >
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                        m.is_active
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                            : 'bg-muted text-muted-foreground border-border'
                                                    }`}>
                                                        {m.is_active ? 'Aktif' : 'Non-Aktif'}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => setViewingMethod(m)}
                                                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditModal(m)}
                                                        className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                                        title="Edit Metode"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(m.id, m.method_name)}
                                                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                        title="Hapus Metode"
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

            {/* Add / Edit Form Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingMethod ? 'Edit Metode Depresiasi' : 'Tambah Metode Depresiasi Baru'}
            >
                <form onSubmit={handleSubmitForm} className="space-y-4 pt-2">
                    {/* Row 1: Code & Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Kode Metode *</label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="Contoh: SLM / DBM"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Nama Metode Depresiasi *</label>
                            <Input
                                value={formData.method_name}
                                onChange={(e) => setFormData({ ...formData, method_name: e.target.value })}
                                placeholder="Contoh: Garis Lurus (Straight Line)"
                                required
                            />
                        </div>
                    </div>

                    {/* Row 2: Linked Categories FIRST */}
                    <div className="bg-muted/30 p-4 rounded-2xl border border-border/60 space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                <span>1. Pilih Kategori Aset Terkait *</span>
                                <span className="text-[10px] text-muted-foreground font-normal normal-case">Pilih kategori untuk kalkulasi tarif otomatis</span>
                            </label>
                            <MultiSelect
                                options={CATEGORY_OPTIONS}
                                value={formData.linked_categories || []}
                                onChange={(selected) => setFormData({ ...formData, linked_categories: selected })}
                                placeholder="Pilih satu atau lebih kategori aset..."
                            />
                        </div>

                        {/* Row 3: Computed Annual Depreciation Rate AFTER category selection */}
                        <div className="pt-2 border-t border-border/40">
                            <label className="block text-xs font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-amber-500" /> 2. Tarif Depresiasi Tahunan (Terhitung Otomatis)
                            </label>
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between">
                                <span className="text-sm font-bold text-amber-500 font-mono">
                                    {modalComputedRate}
                                </span>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                    <Link2 size={12} className="text-amber-500" /> Otomatis dari Asset Settings
                                </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Tarif depresiasi dihitung otomatis dari estimasi umur ekonomis kategori yang dipilih pada menu <strong>Asset Settings</strong>.
                            </p>
                        </div>
                    </div>

                    {/* Row 4: Frequency & Active Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Frekuensi Kalkulasi</label>
                            <Select
                                value={formData.frequency_months}
                                onChange={(e) => setFormData({ ...formData, frequency_months: e.target.value })}
                            >
                                <option value="12 Bulan (Bulanan)">12 Bulan (Bulanan)</option>
                                <option value="12 Bulan (Tahunan)">12 Bulan (Tahunan)</option>
                                <option value="Tidak Ada">Tidak Ada (Manual)</option>
                            </Select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Status Keaktifan</label>
                            <Select
                                value={formData.is_active ? 'active' : 'inactive'}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                            >
                                <option value="active">Aktif</option>
                                <option value="inactive">Non-Aktif</option>
                            </Select>
                        </div>
                    </div>

                    {/* Row 5: Description */}
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Deskripsi & Catatan Kalkulasi</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Jelaskan aturan dan rumus kalkulasi penyusutan aset..."
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                        <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" variant="default" className="font-semibold">
                            {editingMethod ? 'Simpan Perubahan' : 'Buat Metode'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Detail Modal */}
            {viewingMethod && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border/80 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <FileText size={18} className="text-amber-500" /> Detail Metode {viewingMethod.code}
                            </h3>
                            <button onClick={() => setViewingMethod(null)} className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1">
                                ✕
                            </button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-1.5 border-b border-border/40">
                                <span className="text-muted-foreground font-medium">Nama Metode</span>
                                <span className="font-bold text-foreground">{viewingMethod.method_name}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-border/40">
                                <span className="text-muted-foreground font-medium">Tarif Depresiasi Terhitung</span>
                                <span className="font-bold text-amber-500">{getDynamicRateForMethod(viewingMethod)}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-border/40">
                                <span className="text-muted-foreground font-medium">Frekuensi</span>
                                <span className="font-medium text-foreground">{viewingMethod.frequency_months}</span>
                            </div>
                            <div className="py-1.5 border-b border-border/40">
                                <span className="text-muted-foreground font-medium block mb-1">Kategori Terkait & Umur Ekonomis</span>
                                <div className="space-y-1.5">
                                    {viewingMethod.linked_categories.map((c, i) => {
                                        const rules = getCategoryRules();
                                        const rule = rules.find((r: any) => r.category_name.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(r.category_name.toLowerCase()));
                                        const lifeMonths = rule ? rule.useful_life_months : 60;
                                        const rate = lifeMonths > 0 ? (viewingMethod.code === 'DBM' ? (2 / (lifeMonths / 12) * 100).toFixed(0) : (1 / (lifeMonths / 12) * 100).toFixed(1)) : 0;
                                        return (
                                            <div key={i} className="flex justify-between items-center text-xs bg-muted/60 p-2 rounded-lg border border-border/40">
                                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                                    <Layers size={13} className="text-amber-500" /> {c}
                                                </span>
                                                <span className="font-medium text-muted-foreground">
                                                    {lifeMonths} Bln ({(lifeMonths / 12).toFixed(1)} Thn) &rarr; <strong className="text-amber-500">{rate}% / thn</strong>
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="py-1.5">
                                <span className="text-muted-foreground font-medium block mb-1">Deskripsi</span>
                                <p className="text-xs text-foreground bg-muted/40 p-3 rounded-xl border border-border/40 leading-relaxed">
                                    {viewingMethod.description || 'Tidak ada deskripsi.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setViewingMethod(null)}>
                                Tutup
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
