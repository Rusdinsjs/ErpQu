import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Tag, Edit, Trash2, Eye, Search, CheckCircle2, DollarSign, ArrowLeftRight } from 'lucide-react';
import { hrPayrollApi, type HrSalaryComponent, type HrSalaryStructure } from '../../../api/hr-payroll';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, ActionIcon, useToast, LoadingOverlay
} from '../../../components/ui';

export default function SalaryStructuresView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState<'components' | 'structures'>('components');
    const [search, setSearch] = useState('');

    // Modals
    const [compModalOpen, setCompModalOpen] = useState(false);
    const [compModalMode, setCompModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedComp, setSelectedComp] = useState<HrSalaryComponent | null>(null);

    const [structModalOpen, setStructModalOpen] = useState(false);
    const [structModalMode, setStructModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedStruct, setSelectedStruct] = useState<HrSalaryStructure | null>(null);

    // Form States
    const [compForm, setCompForm] = useState({
        name: '',
        code: '',
        type: 'earning',
        description: '',
        is_taxable: true,
        depends_on_payment_days: false,
    });

    const [structForm, setStructForm] = useState({
        name: '',
        code: '',
        description: '',
        payroll_frequency: 'monthly',
        currency: 'IDR',
    });

    // Queries
    const { data: components = [], isLoading: loadC } = useQuery({
        queryKey: ['hr-salary-components'],
        queryFn: hrPayrollApi.listComponents,
    });

    const { data: structures = [], isLoading: loadS } = useQuery({
        queryKey: ['hr-salary-structures'],
        queryFn: hrPayrollApi.listStructures,
    });

    // Component Mutations
    const createCompMutation = useMutation({
        mutationFn: hrPayrollApi.createComponent,
        onSuccess: () => {
            success('Komponen gaji berhasil ditambahkan');
            qc.invalidateQueries({ queryKey: ['hr-salary-components'] });
            setCompModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menyimpan komponen gaji'),
    });

    const updateCompMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hrPayrollApi.updateComponent(id, data),
        onSuccess: () => {
            success('Komponen gaji berhasil diperbarui');
            qc.invalidateQueries({ queryKey: ['hr-salary-components'] });
            setCompModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal memperbarui komponen gaji'),
    });

    const deleteCompMutation = useMutation({
        mutationFn: hrPayrollApi.deleteComponent,
        onSuccess: () => {
            success('Komponen gaji berhasil dinonaktifkan/dihapus');
            qc.invalidateQueries({ queryKey: ['hr-salary-components'] });
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menghapus komponen gaji'),
    });

    // Structure Mutations
    const createStructMutation = useMutation({
        mutationFn: hrPayrollApi.createStructure,
        onSuccess: () => {
            success('Struktur gaji berhasil ditambahkan');
            qc.invalidateQueries({ queryKey: ['hr-salary-structures'] });
            setStructModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menyimpan struktur gaji'),
    });

    const updateStructMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hrPayrollApi.updateStructure(id, data),
        onSuccess: () => {
            success('Struktur gaji berhasil diperbarui');
            qc.invalidateQueries({ queryKey: ['hr-salary-structures'] });
            setStructModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal memperbarui struktur gaji'),
    });

    const deleteStructMutation = useMutation({
        mutationFn: hrPayrollApi.deleteStructure,
        onSuccess: () => {
            success('Struktur gaji berhasil dinonaktifkan/dihapus');
            qc.invalidateQueries({ queryKey: ['hr-salary-structures'] });
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menghapus struktur gaji'),
    });

    // Component Handlers
    const openCreateComp = () => {
        setCompForm({
            name: '',
            code: '',
            type: 'earning',
            description: '',
            is_taxable: true,
            depends_on_payment_days: false,
        });
        setCompModalMode('create');
        setCompModalOpen(true);
    };

    const openEditComp = (c: HrSalaryComponent) => {
        setSelectedComp(c);
        setCompForm({
            name: c.name,
            code: c.code,
            type: c.type,
            description: c.description || '',
            is_taxable: c.is_taxable,
            depends_on_payment_days: c.depends_on_payment_days,
        });
        setCompModalMode('edit');
        setCompModalOpen(true);
    };

    const openViewComp = (c: HrSalaryComponent) => {
        setSelectedComp(c);
        setCompForm({
            name: c.name,
            code: c.code,
            type: c.type,
            description: c.description || '',
            is_taxable: c.is_taxable,
            depends_on_payment_days: c.depends_on_payment_days,
        });
        setCompModalMode('view');
        setCompModalOpen(true);
    };

    const handleSaveComp = () => {
        if (!compForm.name || !compForm.code) {
            showError('Nama dan kode komponen wajib diisi');
            return;
        }
        if (compModalMode === 'create') {
            createCompMutation.mutate(compForm);
        } else if (compModalMode === 'edit' && selectedComp) {
            updateCompMutation.mutate({ id: selectedComp.id, data: compForm });
        }
    };

    // Structure Handlers
    const openCreateStruct = () => {
        setStructForm({
            name: '',
            code: '',
            description: '',
            payroll_frequency: 'monthly',
            currency: 'IDR',
        });
        setStructModalMode('create');
        setStructModalOpen(true);
    };

    const openEditStruct = (s: HrSalaryStructure) => {
        setSelectedStruct(s);
        setStructForm({
            name: s.name,
            code: s.code,
            description: s.description || '',
            payroll_frequency: s.payroll_frequency || 'monthly',
            currency: s.currency || 'IDR',
        });
        setStructModalMode('edit');
        setStructModalOpen(true);
    };

    const openViewStruct = (s: HrSalaryStructure) => {
        setSelectedStruct(s);
        setStructForm({
            name: s.name,
            code: s.code,
            description: s.description || '',
            payroll_frequency: s.payroll_frequency || 'monthly',
            currency: s.currency || 'IDR',
        });
        setStructModalMode('view');
        setStructModalOpen(true);
    };

    const handleSaveStruct = () => {
        if (!structForm.name || !structForm.code) {
            showError('Nama dan kode struktur gaji wajib diisi');
            return;
        }
        if (structModalMode === 'create') {
            createStructMutation.mutate(structForm);
        } else if (structModalMode === 'edit' && selectedStruct) {
            updateStructMutation.mutate({ id: selectedStruct.id, data: structForm });
        }
    };

    // Filter
    const filteredComps = components.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredStructs = structures.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        (s.description || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Layers className="h-6 w-6 text-cyan-400" />
                        Master Struktur & Komponen Gaji
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Kelola komponen pendapatan, potongan BPJS, PPh 21 TER, dan paket struktur gaji karyawan</p>
                </div>
                {activeTab === 'components' ? (
                    <Button onClick={openCreateComp} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="cyan">
                        Tambah Komponen Gaji
                    </Button>
                ) : (
                    <Button onClick={openCreateStruct} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="cyan">
                        Tambah Struktur Gaji
                    </Button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-2">
                <button
                    onClick={() => setActiveTab('components')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                        activeTab === 'components'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Tag className="h-4 w-4" />
                    Komponen Gaji (Salary Components)
                    <Badge color="cyan" size="sm">{components.length}</Badge>
                </button>
                <button
                    onClick={() => setActiveTab('structures')}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                        activeTab === 'structures'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Layers className="h-4 w-4" />
                    Struktur Gaji (Salary Structures)
                    <Badge color="cyan" size="sm">{structures.length}</Badge>
                </button>
            </div>

            {/* TAB 1: KOMPONEN GAJI */}
            {activeTab === 'components' && (
                <Card>
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <Input
                            placeholder="Cari komponen gaji..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            leftIcon={<Search className="h-4 w-4" />}
                            className="max-w-md"
                        />
                        <span className="text-xs text-gray-400">{filteredComps.length} Komponen Terdaftar</span>
                    </div>

                    <div className="relative">
                        {loadC && <LoadingOverlay />}
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableTh>Nama Komponen</TableTh>
                                    <TableTh>Kode</TableTh>
                                    <TableTh>Tipe</TableTh>
                                    <TableTh>Kena Pajak</TableTh>
                                    <TableTh>Tergantung Kehadiran</TableTh>
                                    <TableTh>Deskripsi</TableTh>
                                    <TableTh className="text-right">Aksi</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredComps.length === 0 ? (
                                    <TableEmpty colSpan={7} message="Belum ada komponen gaji" />
                                ) : filteredComps.map(c => (
                                    <TableRow key={c.id}>
                                        <TableTd className="font-bold text-white">{c.name}</TableTd>
                                        <TableTd><span className="font-mono text-xs bg-white/10 px-2 py-1 rounded text-cyan-300 font-semibold">{c.code}</span></TableTd>
                                        <TableTd>
                                            <Badge color={c.type === 'earning' ? 'green' : 'red'}>
                                                {c.type === 'earning' ? 'Pendapatan (Earning)' : 'Potongan (Deduction)'}
                                            </Badge>
                                        </TableTd>
                                        <TableTd><Badge color={c.is_taxable ? 'blue' : 'gray'}>{c.is_taxable ? 'Ya' : 'Tidak'}</Badge></TableTd>
                                        <TableTd><Badge color={c.depends_on_payment_days ? 'amber' : 'gray'}>{c.depends_on_payment_days ? 'Ya' : 'Tidak'}</Badge></TableTd>
                                        <TableTd className="text-xs text-gray-300 max-w-xs truncate">{c.description || '-'}</TableTd>
                                        <TableTd className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <ActionIcon title="Lihat Detail" onClick={() => openViewComp(c)}>
                                                    <Eye className="h-4 w-4 text-cyan-400" />
                                                </ActionIcon>
                                                <ActionIcon title="Edit Komponen" onClick={() => openEditComp(c)}>
                                                    <Edit className="h-4 w-4 text-amber-400" />
                                                </ActionIcon>
                                                <ActionIcon
                                                    title="Hapus Komponen"
                                                    onClick={() => {
                                                        if (confirm(`Yakin ingin menghapus komponen "${c.name}"?`)) {
                                                            deleteCompMutation.mutate(c.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-400" />
                                                </ActionIcon>
                                            </div>
                                        </TableTd>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* TAB 2: STRUKTUR GAJI */}
            {activeTab === 'structures' && (
                <Card>
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <Input
                            placeholder="Cari struktur gaji..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            leftIcon={<Search className="h-4 w-4" />}
                            className="max-w-md"
                        />
                        <span className="text-xs text-gray-400">{filteredStructs.length} Struktur Terdaftar</span>
                    </div>

                    <div className="relative">
                        {loadS && <LoadingOverlay />}
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableTh>Nama Struktur Gaji</TableTh>
                                    <TableTh>Kode</TableTh>
                                    <TableTh>Frekuensi</TableTh>
                                    <TableTh>Mata Uang</TableTh>
                                    <TableTh>Deskripsi</TableTh>
                                    <TableTh>Status</TableTh>
                                    <TableTh className="text-right">Aksi</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredStructs.length === 0 ? (
                                    <TableEmpty colSpan={7} message="Belum ada struktur gaji" />
                                ) : filteredStructs.map(s => (
                                    <TableRow key={s.id}>
                                        <TableTd className="font-bold text-white">{s.name}</TableTd>
                                        <TableTd><span className="font-mono text-xs bg-white/10 px-2 py-1 rounded text-purple-300 font-semibold">{s.code}</span></TableTd>
                                        <TableTd className="text-sm text-gray-300 capitalize">{s.payroll_frequency === 'monthly' ? 'Bulanan' : s.payroll_frequency}</TableTd>
                                        <TableTd className="font-semibold text-emerald-400">{s.currency || 'IDR'}</TableTd>
                                        <TableTd className="text-xs text-gray-300 max-w-xs truncate">{s.description || '-'}</TableTd>
                                        <TableTd><Badge color="green">Aktif</Badge></TableTd>
                                        <TableTd className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <ActionIcon title="Lihat Detail" onClick={() => openViewStruct(s)}>
                                                    <Eye className="h-4 w-4 text-cyan-400" />
                                                </ActionIcon>
                                                <ActionIcon title="Edit Struktur" onClick={() => openEditStruct(s)}>
                                                    <Edit className="h-4 w-4 text-amber-400" />
                                                </ActionIcon>
                                                <ActionIcon
                                                    title="Hapus Struktur"
                                                    onClick={() => {
                                                        if (confirm(`Yakin ingin menghapus struktur gaji "${s.name}"?`)) {
                                                            deleteStructMutation.mutate(s.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-400" />
                                                </ActionIcon>
                                            </div>
                                        </TableTd>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            {/* MODAL KOMPONEN GAJI */}
            <Modal
                isOpen={compModalOpen}
                opened={compModalOpen}
                onClose={() => setCompModalOpen(false)}
                title={
                    compModalMode === 'create'
                        ? 'Tambah Komponen Gaji Baru'
                        : compModalMode === 'edit'
                        ? 'Edit Komponen Gaji'
                        : 'Detail Komponen Gaji'
                }
                size="md"
            >
                <div className="space-y-4">
                    <Input
                        label="Nama Komponen Gaji *"
                        value={compForm.name}
                        disabled={compModalMode === 'view'}
                        onChange={e => setCompForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="cth. Tunjangan Komunikasi"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Kode Komponen *"
                            value={compForm.code}
                            disabled={compModalMode === 'view'}
                            onChange={e => setCompForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                            placeholder="cth. TUNJ_KOMUNIKASI"
                        />
                        <Select
                            label="Tipe Komponen *"
                            value={compForm.type}
                            disabled={compModalMode === 'view'}
                            onChange={v => setCompForm(p => ({ ...p, type: v as any }))}
                            options={[
                                { value: 'earning', label: 'Pendapatan (Earning)' },
                                { value: 'deduction', label: 'Potongan (Deduction)' },
                            ]}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-200">
                            <input
                                type="checkbox"
                                checked={compForm.is_taxable}
                                disabled={compModalMode === 'view'}
                                onChange={e => setCompForm(p => ({ ...p, is_taxable: e.target.checked }))}
                                className="rounded text-cyan-500 focus:ring-cyan-500"
                            />
                            Kena Pajak PPh 21
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-200">
                            <input
                                type="checkbox"
                                checked={compForm.depends_on_payment_days}
                                disabled={compModalMode === 'view'}
                                onChange={e => setCompForm(p => ({ ...p, depends_on_payment_days: e.target.checked }))}
                                className="rounded text-cyan-500 focus:ring-cyan-500"
                            />
                            Tergantung Kehadiran
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Deskripsi / Keterangan</label>
                        <textarea
                            value={compForm.description}
                            disabled={compModalMode === 'view'}
                            onChange={e => setCompForm(p => ({ ...p, description: e.target.value }))}
                            rows={3}
                            placeholder="Keterangan fungsi komponen penggajian..."
                            className="w-full bg-slate-900/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <Button variant="outline" onClick={() => setCompModalOpen(false)}>
                            {compModalMode === 'view' ? 'Tutup' : 'Batal'}
                        </Button>
                        {compModalMode !== 'view' && (
                            <Button
                                variant="filled"
                                color="cyan"
                                onClick={handleSaveComp}
                                loading={createCompMutation.isPending || updateCompMutation.isPending}
                            >
                                Simpan Komponen
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>

            {/* MODAL STRUKTUR GAJI */}
            <Modal
                isOpen={structModalOpen}
                opened={structModalOpen}
                onClose={() => setStructModalOpen(false)}
                title={
                    structModalMode === 'create'
                        ? 'Tambah Paket Struktur Gaji Baru'
                        : structModalMode === 'edit'
                        ? 'Edit Struktur Gaji'
                        : 'Detail Struktur Gaji'
                }
                size="md"
            >
                <div className="space-y-4">
                    <Input
                        label="Nama Paket Struktur Gaji *"
                        value={structForm.name}
                        disabled={structModalMode === 'view'}
                        onChange={e => setStructForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="cth. Struktur Gaji Sales & Marketing (G2)"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Kode Struktur *"
                            value={structForm.code}
                            disabled={structModalMode === 'view'}
                            onChange={e => setStructForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                            placeholder="cth. STR-MKT"
                        />
                        <Select
                            label="Frekuensi Pembayaran *"
                            value={structForm.payroll_frequency}
                            disabled={structModalMode === 'view'}
                            onChange={v => setStructForm(p => ({ ...p, payroll_frequency: v }))}
                            options={[
                                { value: 'monthly', label: 'Bulanan (Monthly)' },
                                { value: 'weekly', label: 'Mingguan (Weekly)' },
                                { value: 'bi-weekly', label: 'Dua Mingguan' },
                            ]}
                        />
                    </div>

                    <Input
                        label="Mata Uang (Currency)"
                        value={structForm.currency}
                        disabled={structModalMode === 'view'}
                        onChange={e => setStructForm(p => ({ ...p, currency: e.target.value }))}
                        placeholder="IDR"
                    />

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Deskripsi Paket Gaji</label>
                        <textarea
                            value={structForm.description}
                            disabled={structModalMode === 'view'}
                            onChange={e => setStructForm(p => ({ ...p, description: e.target.value }))}
                            rows={3}
                            placeholder="Rincian peruntukan dan kriteria struktur gaji..."
                            className="w-full bg-slate-900/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                        <Button variant="outline" onClick={() => setStructModalOpen(false)}>
                            {structModalMode === 'view' ? 'Tutup' : 'Batal'}
                        </Button>
                        {structModalMode !== 'view' && (
                            <Button
                                variant="filled"
                                color="cyan"
                                onClick={handleSaveStruct}
                                loading={createStructMutation.isPending || updateStructMutation.isPending}
                            >
                                Simpan Struktur
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
