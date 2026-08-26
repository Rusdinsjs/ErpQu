import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Filter, ArrowLeft, RefreshCw, Eye, Edit2, Trash2, CheckCircle2, Wrench, FileText, Clock
} from 'lucide-react';
import { Button, Input, Select, Textarea, Modal, useToast } from'../../../components/ui';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceTypeApi } from'../../work-orders/api/maintenance-types';
import type { MaintenanceType } from'../../work-orders/api/maintenance-types';



export default function MaintenanceTypesView() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [localTypes, setLocalTypes] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<MaintenanceType | null>(null);
    const [viewingType, setViewingType] = useState<MaintenanceType | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<MaintenanceType>>({
        code: '',
        name: '',
        category: 'Preventif Terencana',
        trigger_type: 'Jam Kerja (Operating Hours)',
        interval_value: '500 Jam',
        estimated_cost: 1500000,
        is_active: true,
        description: ''
    });

    const { data: types = [], isLoading } = useQuery({
        queryKey: ['maintenance-types'],
        queryFn: () => maintenanceTypeApi.list()
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<MaintenanceType>) => maintenanceTypeApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-types'] });
            success('Tipe Pemeliharaan Ditambahkan', 'Berhasil dibuat.');
            setIsFormModalOpen(false);
        },
        onError: () => showError('Gagal Menambahkan', 'Terjadi kesalahan saat menghubungi server.')
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<MaintenanceType>) => maintenanceTypeApi.update(data.id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-types'] });
            success('Tipe Pemeliharaan Diperbarui', 'Berhasil diubah.');
            setIsFormModalOpen(false);
        },
        onError: () => showError('Gagal Memperbarui', 'Terjadi kesalahan saat menghubungi server.')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => maintenanceTypeApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-types'] });
            success('Tipe Pemeliharaan Dihapus', 'Telah dihapus dari daftar.');
        },
        onError: () => showError('Gagal Menghapus', 'Terjadi kesalahan saat menghubungi server.')
    });

    const handleOpenCreateModal = () => {
        setEditingType(null);
        setFormData({
            code: '',
            name: '',
            category: 'Preventif Terencana',
            trigger_type: 'Jam Kerja (Operating Hours)',
            interval_value: '500 Jam',
            estimated_cost: 1500000,
            is_active: true,
            description: ''
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (item: MaintenanceType) => {
        setEditingType(item);
        setFormData({ ...item });
        setIsFormModalOpen(true);
    };

    const handleSubmitForm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code || !formData.name) {
            showError('Data Tidak Lengkap', 'Kode Tipe dan Nama Pemeliharaan wajib diisi.');
            return;
        }

        const payload = {
            ...formData,
            code: formData.code!.toUpperCase(),
            estimated_cost: Number(formData.estimated_cost) || 0,
        };

        if (editingType) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleDelete = (id: number, name: string) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus tipe pemeliharaan "${name}"?`)) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleStatus = (id: number) => {
        const item = types.find(t => t.id === id);
        if (item) {
            updateMutation.mutate({ ...item, is_active: !item.is_active });
        }
    };

    const filteredTypes = types.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.description || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = categoryFilter === 'all' ? true : t.category === categoryFilter;
        return matchesSearch && matchesCat;
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

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
                            <Wrench className="text-blue-500" size={24} /> Maintenance Types
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Klasifikasi tipe pemeliharaan, standar interval service & estimasi biaya perawatan
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="default" onClick={handleOpenCreateModal} className="rounded-xl font-semibold">
                        <Plus size={16} className="mr-2" /> Tambah Tipe Pemeliharaan
                    </Button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari kode, nama tipe, instruksi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-48"
                    >
                        <option value="all">Semua Kategori</option>
                        <option value="Preventif Terencana">Preventif Terencana</option>
                        <option value="Korektif / Darurat">Korektif / Darurat</option>
                        <option value="Inspeksi & Kalibrasi">Inspeksi & Kalibrasi</option>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => { setLocalTypes([...types]); success('Refreshed', 'Daftar tipe pemeliharaan diperbarui.'); }}>
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
                                <th className="px-5 py-3.5 font-semibold">Nama Pemeliharaan</th>
                                <th className="px-5 py-3.5 font-semibold">Kategori</th>
                                <th className="px-5 py-3.5 font-semibold">Standar Interval</th>
                                <th className="px-5 py-3.5 font-semibold">Est. Biaya</th>
                                <th className="px-5 py-3.5 font-semibold text-center">Status</th>
                                <th className="px-5 py-3.5 w-28 text-center font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 bg-card">
                            {filteredTypes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                                        Tidak ada tipe pemeliharaan yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredTypes.map((t, idx) => (
                                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-5 py-3.5 text-center font-mono text-xs text-muted-foreground">{idx + 1}</td>
                                        <td className="px-5 py-3.5 font-bold font-mono text-blue-500">{t.code}</td>
                                        <td className="px-5 py-3.5 font-semibold text-foreground">{t.name}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2.5 py-0.5 rounded text-[11px] font-medium border ${
                                                t.category === 'Preventif Terencana'
                                                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                    : t.category === 'Korektif / Darurat'
                                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    : 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                            }`}>
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-muted-foreground font-medium flex items-center gap-1.5">
                                            <Clock size={13} className="text-muted-foreground" /> {t.interval_value}
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-emerald-500">{formatCurrency(t.estimated_cost)}</td>
                                        <td className="px-5 py-3.5 text-center">
                                            <button
                                                onClick={() => handleToggleStatus(t.id)}
                                                className="cursor-pointer inline-block"
                                                title="Klik untuk ubah status"
                                            >
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                    t.is_active
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : 'bg-muted text-muted-foreground border-border'
                                                }`}>
                                                    {t.is_active ? 'Aktif' : 'Non-Aktif'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => setViewingType(t)}
                                                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                                                    title="Lihat Detail"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditModal(t)}
                                                    className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit Tipe"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id, t.name)}
                                                    className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Hapus Tipe"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Form Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={editingType ? 'Edit Tipe Pemeliharaan' : 'Tambah Tipe Pemeliharaan Baru'}
            >
                <form onSubmit={handleSubmitForm} className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Kode Tipe *</label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                placeholder="Contoh: PM-RUTIN / OVERHAUL"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Kategori Pemeliharaan</label>
                            <Select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                            >
                                <option value="Preventif Terencana">Preventif Terencana</option>
                                <option value="Korektif / Darurat">Korektif / Darurat</option>
                                <option value="Inspeksi & Kalibrasi">Inspeksi & Kalibrasi</option>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Nama Pemeliharaan *</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Contoh: Servis Berkala PM 500 Jam"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Standar Nilai Interval</label>
                            <Input
                                value={formData.interval_value}
                                onChange={(e) => setFormData({ ...formData, interval_value: e.target.value })}
                                placeholder="Contoh: 500 Jam / 5.000 KM"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Estimasi Biaya Standar (Rp)</label>
                            <Input
                                type="number"
                                value={formData.estimated_cost}
                                onChange={(e) => setFormData({ ...formData, estimated_cost: Number(e.target.value) })}
                                placeholder="Contoh: 1500000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Instruksi & Ruang Lingkup SOP</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Deskripsikan item pekerjaan, penggantian komponen, dan cek kelayakan..."
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                        <Button type="button" variant="outline" onClick={() => setIsFormModalOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" variant="default" className="font-semibold">
                            {editingType ? 'Simpan Perubahan' : 'Buat Tipe'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Detail Modal */}
            {viewingType && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border/80 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <FileText size={18} className="text-blue-500" /> Detail Tipe {viewingType.code}
                            </h3>
                            <button onClick={() => setViewingType(null)} className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1">
                                ✕
                            </button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-1.5 border-b border-border/40">
                                <span className="text-muted-foreground font-medium">Nama Pemeliharaan</span>
                                <span className="font-bold text-foreground">{viewingType.name}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-border/40">
                                <span className="text-muted-foreground font-medium">Kategori</span>
                                <span className="font-semibold text-blue-500">{viewingType.category}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-border/40">
                                <span className="text-muted-foreground font-medium">Standar Interval</span>
                                <span className="font-medium text-foreground">{viewingType.interval_value}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-border/40">
                                <span className="text-muted-foreground font-medium">Estimasi Biaya</span>
                                <span className="font-bold text-emerald-500">{formatCurrency(viewingType.estimated_cost)}</span>
                            </div>
                            <div className="py-1.5">
                                <span className="text-muted-foreground font-medium block mb-1">Instruksi & SOP</span>
                                <p className="text-xs text-foreground bg-muted/40 p-3 rounded-xl border border-border/40 leading-relaxed">
                                    {viewingType.description || 'Tidak ada deskripsi.'}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setViewingType(null)}>
                                Tutup
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
