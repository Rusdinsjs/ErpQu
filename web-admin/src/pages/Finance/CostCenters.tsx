import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi, type CostCenter, type CreateCostCenterRequest } from '../../api/finance';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal } from '../../components/ui';
import { Plus, Search, Layers, CheckCircle2, Building, FolderTree } from 'lucide-react';
import { toast } from 'sonner';

export default function CostCenters() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [parentId, setParentId] = useState('');
    const [isGroup, setIsGroup] = useState(false);

    const { data: costCenters, isLoading } = useQuery({
        queryKey: ['finance', 'cost-centers'],
        queryFn: financeApi.listCostCenters,
    });

    const createMutation = useMutation({
        mutationFn: financeApi.createCostCenter,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'cost-centers'] });
            setIsModalOpen(false);
            setName('');
            setCode('');
            setParentId('');
            setIsGroup(false);
            toast.success('Pusat Biaya (Cost Center) berhasil ditambahkan.');
        },
        onError: (err: any) => {
            toast.error('Gagal menambahkan Cost Center: ' + (err.message || 'Terjadi kesalahan'));
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Nama Pusat Biaya wajib diisi.');
            return;
        }
        createMutation.mutate({
            cost_center_name: name,
            cost_center_number: code || undefined,
            parent_cost_center_id: parentId || undefined,
            is_group: isGroup,
        });
    };

    const filtered = (costCenters || []).filter(c => 
        (c.cost_center_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.cost_center_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Layers className="text-indigo-500" size={32} />
                        Pusat Biaya (Cost Centers)
                    </h1>
                    <p className="text-muted-foreground mt-1">Hierarki alokasi anggaran, pembebanan biaya departemen, unit bisnis & proyek</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                    <Plus size={18} />
                    Tambah Cost Center
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-center shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nama atau kode Cost Center..."
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                </div>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <TableSkeleton rows={5} cols={5} />
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <Building className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada Cost Center</h3>
                        <p className="text-sm text-muted-foreground mt-1">Buat struktur pusat biaya untuk mengontrol anggaran operasional.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Kode Cost Center</TableTh>
                                <TableTh>Nama Pusat Biaya</TableTh>
                                <TableTh>Tipe Struktur</TableTh>
                                <TableTh>Tanggal Dibuat</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map(row => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.cost_center_number || '-'}</TableTd>
                                    <TableTd className="font-medium text-foreground flex items-center gap-2">
                                        {row.is_group ? <FolderTree size={16} className="text-indigo-500" /> : <Building size={16} className="text-muted-foreground" />}
                                        {row.cost_center_name}
                                    </TableTd>
                                    <TableTd>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${row.is_group ? 'bg-indigo-500/10 text-indigo-600' : 'bg-muted text-muted-foreground'}`}>
                                            {row.is_group ? 'Grup Induk (Header)' : 'Pusat Biaya Unit'}
                                        </span>
                                    </TableTd>
                                    <TableTd className="text-muted-foreground">{row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID') : '-'}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Aktif
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Pusat Biaya Baru">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Kode Pusat Biaya</label>
                        <Input placeholder="Contoh: CC-OP-01" value={code} onChange={(e) => setCode(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Pusat Biaya</label>
                        <Input placeholder="Contoh: Divisi Operasi & Pemeliharaan" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Induk (Parent Cost Center)</label>
                        <select
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                        >
                            <option value="">-- Tanpa Induk (Root Level) --</option>
                            {(costCenters || []).filter(c => c.is_group).map(c => (
                                <option key={c.id} value={c.id}>{c.cost_center_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isGroup"
                            checked={isGroup}
                            onChange={(e) => setIsGroup(e.target.checked)}
                            className="rounded border-border text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="isGroup" className="text-sm font-medium text-foreground cursor-pointer">
                            Jadikan sebagai Grup Induk (Header untuk sub-divisi)
                        </label>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {createMutation.isPending ? 'Menyimpan...' : 'Simpan Cost Center'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
