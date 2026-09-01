import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ClipboardCheck, Plus, Search, CheckCircle2, AlertTriangle, XCircle,
    ShieldAlert, Check, X, Truck, User, Calendar, Gauge, Wrench,
    FileText, ArrowUpRight, Activity, Filter, RefreshCw, Eye
} from 'lucide-react';
import dayjs from 'dayjs';
import { hrDriverP2hSafetyApi, type HrP2hInspection } from '../../api/hr-driver-p2h-safety';
import { employeeApi } from '../../api/employee';
import { assetApi } from '../../../assets/api/assets';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, ActionIcon, useToast, LoadingOverlay,
    Tabs, TabsList, TabsTrigger, TabsContent
} from '../../../../components/ui';

export default function P2hInspectionView() {
    const qc = useQueryClient();
    const navigate = useNavigate();
    const { success, error: showError } = useToast();

    // Filters & View State
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('');
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedP2h, setSelectedP2h] = useState<HrP2hInspection | null>(null);

    // Form state
    const [form, setForm] = useState({
        employee_id: '',
        asset_id: '',
        inspection_date: dayjs().format('YYYY-MM-DD'),
        odometer_reading: 0,
        hour_meter_reading: 0,
        oil_coolant_ok: true,
        brakes_ok: true,
        tires_ok: true,
        lights_horn_ok: true,
        safety_gear_ok: true,
        notes_defect: '',
        inspector_signature: 'Pemeriksaan Lapangan Mandiri Driver',
    });

    // Queries
    const { data: inspections = [], isLoading } = useQuery({
        queryKey: ['hr-p2h-inspections'],
        queryFn: () => hrDriverP2hSafetyApi.listP2hInspections(),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const { data: assets = [] } = useQuery({
        queryKey: ['assets'],
        queryFn: () => assetApi.list({ per_page: 100 } as any).then(r => r.data || []),
    });

    // Calculated derived stats
    const stats = useMemo(() => {
        const total = inspections.length;
        const fit = inspections.filter(i => i.overall_status === 'fit_to_operate').length;
        const minor = inspections.filter(i => i.overall_status === 'needs_minor_repair').length;
        const grounded = inspections.filter(i => i.overall_status === 'grounded_unsafe').length;
        const passRate = total > 0 ? Math.round((fit / total) * 100) : 100;
        return { total, fit, minor, grounded, passRate };
    }, [inspections]);

    // Filtered data
    const filteredInspections = useMemo(() => {
        return inspections.filter(item => {
            const matchesSearch =
                (item.asset_name || '').toLowerCase().includes(search.toLowerCase()) ||
                (item.asset_code || '').toLowerCase().includes(search.toLowerCase()) ||
                (item.employee_name || '').toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'all' || item.overall_status === statusFilter;
            const matchesDate = !dateFilter || item.inspection_date.startsWith(dateFilter);

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [inspections, search, statusFilter, dateFilter]);

    // Mutation
    const submitMutation = useMutation({
        mutationFn: hrDriverP2hSafetyApi.submitP2hInspection,
        onSuccess: () => {
            success('Checklist inspeksi harian P2H berhasil disimpan');
            qc.invalidateQueries({ queryKey: ['hr-p2h-inspections'] });
            setModalOpen(false);
            // Reset form
            setForm({
                employee_id: '',
                asset_id: '',
                inspection_date: dayjs().format('YYYY-MM-DD'),
                odometer_reading: 0,
                hour_meter_reading: 0,
                oil_coolant_ok: true,
                brakes_ok: true,
                tires_ok: true,
                lights_horn_ok: true,
                safety_gear_ok: true,
                notes_defect: '',
                inspector_signature: 'Pemeriksaan Lapangan Mandiri Driver',
            });
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menyimpan P2H'),
    });

    const handleSubmit = () => {
        if (!form.employee_id || !form.asset_id) {
            showError('Pilih Driver dan Unit Kendaraan terlebih dahulu!');
            return;
        }

        const isFullySafe = form.brakes_ok && form.tires_ok && form.oil_coolant_ok && form.lights_horn_ok && form.safety_gear_ok;
        const isCriticalBreach = !form.brakes_ok || !form.tires_ok;

        let overall_status: 'fit_to_operate' | 'needs_minor_repair' | 'grounded_unsafe' = 'fit_to_operate';
        if (isCriticalBreach) {
            overall_status = 'grounded_unsafe';
        } else if (!isFullySafe) {
            overall_status = 'needs_minor_repair';
        }

        submitMutation.mutate({
            ...form,
            overall_status,
        });
    };

    const employeeOptions = employees.map((e: any) => ({
        value: e.id,
        label: `${e.first_name || ''} ${e.last_name || ''} (${e.employee_code || e.id.substring(0, 6)})`.trim()
    }));

    const assetOptions = assets.map((a: any) => ({
        value: a.id,
        label: `[${a.asset_code}] ${a.name}`
    }));

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'fit_to_operate':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Laik Operasi (Fit)
                    </span>
                );
            case 'needs_minor_repair':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        Perbaikan Ringan
                    </span>
                );
            case 'grounded_unsafe':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-500/20">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        Grounded (Bahaya)
                    </span>
                );
            default:
                return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Quick Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <ClipboardCheck size={24} />
                        </div>
                        Pemeriksaan Harian P2H & Keselamatan
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Pemeriksaan Pra-Operasi (Pelaksanaan Pemeliharaan Harian) unit kendaraan & alat berat tambang/lapangan
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="filled"
                        onClick={() => setModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Input Lembar P2H Baru
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-muted-foreground">Total Inspeksi P2H</span>
                        <div className="text-2xl font-bold text-foreground mt-1">{stats.total}</div>
                        <span className="text-[11px] text-emerald-400 font-medium">Pass Rate {stats.passRate}%</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <Activity size={20} />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-emerald-400">Laik Operasi (Fit)</span>
                        <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.fit} Unit</div>
                        <span className="text-[11px] text-emerald-500/80">Aman beroperasi penuh</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-amber-400">Butuh Perbaikan Ringan</span>
                        <div className="text-2xl font-bold text-amber-300 mt-1">{stats.minor} Unit</div>
                        <span className="text-[11px] text-amber-500/80">Perlu monitoring / WO</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <AlertTriangle size={20} />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-rose-400">Grounded (Kritis Unsafe)</span>
                        <div className="text-2xl font-bold text-rose-300 mt-1">{stats.grounded} Unit</div>
                        <span className="text-[11px] text-rose-400 font-semibold animate-pulse">Dilarang beroperasi!</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <ShieldAlert size={20} />
                    </div>
                </div>
            </div>

            {/* Main Table & Filter */}
            <Card className="border border-border/60 bg-card shadow-sm rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border/40 flex flex-col md:flex-row gap-3 items-center justify-between">
                    <div className="flex flex-1 items-center gap-3 w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                placeholder="Cari unit kode, nama alat berat, atau nama driver..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-muted/40 border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                            className="bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
                            {[
                                { id: 'all', label: 'Semua' },
                                { id: 'fit_to_operate', label: 'Fit' },
                                { id: 'needs_minor_repair', label: 'Minor Defect' },
                                { id: 'grounded_unsafe', label: 'Grounded' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setStatusFilter(tab.id)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                        statusFilter === tab.id
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {(search || statusFilter !== 'all' || dateFilter) && (
                            <button
                                onClick={() => { setSearch(''); setStatusFilter('all'); setDateFilter(''); }}
                                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                title="Reset Filter"
                            >
                                <RefreshCw size={15} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="relative overflow-x-auto">
                    <LoadingOverlay visible={isLoading} />
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Tanggal & Waktu</TableTh>
                                <TableTh>Unit Aset</TableTh>
                                <TableTh>Driver / Operator</TableTh>
                                <TableTh>Odometer / HM</TableTh>
                                <TableTh>Checklist K3 Safety</TableTh>
                                <TableTh>Status Kelayakan</TableTh>
                                <TableTh>Temuan Defect</TableTh>
                                <TableTh align="center">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredInspections.length === 0 ? (
                                <TableEmpty colSpan={8} message="Belum ada riwayat lembar pemeriksaan P2H" />
                            ) : (
                                filteredInspections.map((p2h) => (
                                    <TableRow key={p2h.id} className="hover:bg-muted/30 transition-colors">
                                        <TableTd>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-muted-foreground" />
                                                <div>
                                                    <span className="font-semibold text-foreground text-xs block">
                                                        {dayjs(p2h.inspection_date).format('DD MMM YYYY')}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {dayjs(p2h.created_at).format('HH:mm')} WITA
                                                    </span>
                                                </div>
                                            </div>
                                        </TableTd>
                                        <TableTd>
                                            <div className="flex items-center gap-2">
                                                <Truck size={16} className="text-cyan-400" />
                                                <div>
                                                    <span className="font-semibold text-foreground text-xs block">{p2h.asset_name}</span>
                                                    <span className="font-mono text-[10px] text-muted-foreground">{p2h.asset_code}</span>
                                                </div>
                                            </div>
                                        </TableTd>
                                        <TableTd>
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-muted-foreground" />
                                                <span className="text-xs text-foreground font-medium">{p2h.employee_name || 'Driver Mandiri'}</span>
                                            </div>
                                        </TableTd>
                                        <TableTd>
                                            <div className="text-xs font-mono">
                                                {p2h.odometer_reading ? (
                                                    <span className="text-foreground">{p2h.odometer_reading.toLocaleString()} KM</span>
                                                ) : p2h.hour_meter_reading ? (
                                                    <span className="text-foreground">{p2h.hour_meter_reading} HM</span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </div>
                                        </TableTd>
                                        <TableTd>
                                            <div className="flex gap-1">
                                                <span title="Rem" className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${p2h.brakes_ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>R</span>
                                                <span title="Ban" className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${p2h.tires_ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>B</span>
                                                <span title="Oli" className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${p2h.oil_coolant_ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>O</span>
                                                <span title="Lampu" className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${p2h.lights_horn_ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>L</span>
                                                <span title="Safety" className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${p2h.safety_gear_ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>S</span>
                                            </div>
                                        </TableTd>
                                        <TableTd>
                                            {getStatusBadge(p2h.overall_status)}
                                        </TableTd>
                                        <TableTd>
                                            <p className="text-xs text-muted-foreground max-w-[200px] truncate" title={p2h.notes_defect}>
                                                {p2h.notes_defect || <span className="text-muted-foreground/50 italic">Tidak ada defect</span>}
                                            </p>
                                        </TableTd>
                                        <TableTd align="center">
                                            <div className="flex items-center justify-center gap-1">
                                                <ActionIcon
                                                    onClick={() => {
                                                        setSelectedP2h(p2h);
                                                        setDetailModalOpen(true);
                                                    }}
                                                    title="Lihat Detail P2H"
                                                    variant="subtle"
                                                >
                                                    <Eye size={16} />
                                                </ActionIcon>
                                                {p2h.overall_status !== 'fit_to_operate' && (
                                                    <ActionIcon
                                                        onClick={() => navigate(`/work-orders?asset_id=${p2h.asset_id}&wo_type=corrective`)}
                                                        title="Buat Work Order dari Temuan P2H"
                                                        variant="subtle"
                                                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                                    >
                                                        <Wrench size={16} />
                                                    </ActionIcon>
                                                )}
                                            </div>
                                        </TableTd>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Input Lembar P2H Baru */}
            <Modal
                isOpen={modalOpen}
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Lembar Pemeriksaan Harian (P2H) Kendaraan & Alat Berat"
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            label="Driver / Operator Lapangan *"
                            value={form.employee_id}
                            onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                            options={employeeOptions}
                            placeholder="Pilih Driver..."
                        />
                        <Select
                            label="Unit Kendaraan / Alat Berat *"
                            value={form.asset_id}
                            onChange={v => setForm(p => ({ ...p, asset_id: v }))}
                            options={assetOptions}
                            placeholder="Pilih Unit Aset..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                            type="date"
                            label="Tanggal Pemeriksaan *"
                            value={form.inspection_date}
                            onChange={e => setForm(p => ({ ...p, inspection_date: e.target.value }))}
                        />
                        <Input
                            type="number"
                            label="Odometer (KM)"
                            value={form.odometer_reading}
                            onChange={e => setForm(p => ({ ...p, odometer_reading: parseFloat(e.target.value) || 0 }))}
                            placeholder="Contoh: 45200"
                        />
                        <Input
                            type="number"
                            label="Hour Meter (HM)"
                            value={form.hour_meter_reading}
                            onChange={e => setForm(p => ({ ...p, hour_meter_reading: parseFloat(e.target.value) || 0 }))}
                            placeholder="Contoh: 1850"
                        />
                    </div>

                    {/* Visual Checklist Sections */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
                            Item Checklist K3 & Keselamatan Operasi
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {/* Brakes */}
                            <div
                                onClick={() => setForm(p => ({ ...p, brakes_ok: !p.brakes_ok }))}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                    form.brakes_ok
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-lg">🛑</span>
                                    <div>
                                        <span className="text-xs font-semibold block">Sistem Pengereman</span>
                                        <span className="text-[11px] text-muted-foreground">Service, emergency & parking brake</span>
                                    </div>
                                </div>
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                    form.brakes_ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}>
                                    {form.brakes_ok ? '✓' : '✕'}
                                </span>
                            </div>

                            {/* Tires */}
                            <div
                                onClick={() => setForm(p => ({ ...p, tires_ok: !p.tires_ok }))}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                    form.tires_ok
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-lg">🛞</span>
                                    <div>
                                        <span className="text-xs font-semibold block">Kondisi Roda & Ban/Track</span>
                                        <span className="text-[11px] text-muted-foreground">Tekanan angin, baut, keausan alur</span>
                                    </div>
                                </div>
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                    form.tires_ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}>
                                    {form.tires_ok ? '✓' : '✕'}
                                </span>
                            </div>

                            {/* Oil & Coolant */}
                            <div
                                onClick={() => setForm(p => ({ ...p, oil_coolant_ok: !p.oil_coolant_ok }))}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                    form.oil_coolant_ok
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-lg">💧</span>
                                    <div>
                                        <span className="text-xs font-semibold block">Oli & Cairan Pendingin</span>
                                        <span className="text-[11px] text-muted-foreground">Level oli mesin, radiator, hydraulic</span>
                                    </div>
                                </div>
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                    form.oil_coolant_ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}>
                                    {form.oil_coolant_ok ? '✓' : '✕'}
                                </span>
                            </div>

                            {/* Lights & Horn */}
                            <div
                                onClick={() => setForm(p => ({ ...p, lights_horn_ok: !p.lights_horn_ok }))}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                    form.lights_horn_ok
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-lg">💡</span>
                                    <div>
                                        <span className="text-xs font-semibold block">Lampu, Rotary & Klakson</span>
                                        <span className="text-[11px] text-muted-foreground">Lampu utama, sein, strobe, alarm mundur</span>
                                    </div>
                                </div>
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                    form.lights_horn_ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}>
                                    {form.lights_horn_ok ? '✓' : '✕'}
                                </span>
                            </div>

                            {/* Safety Gear */}
                            <div
                                onClick={() => setForm(p => ({ ...p, safety_gear_ok: !p.safety_gear_ok }))}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between sm:col-span-2 ${
                                    form.safety_gear_ok
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-foreground'
                                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-lg">🦺</span>
                                    <div>
                                        <span className="text-xs font-semibold block">Kelengkapan K3 & APAR Lapangan</span>
                                        <span className="text-[11px] text-muted-foreground">Sabuk pengaman (seatbelt), APAR bertekanan, radio komunikasi 2-way</span>
                                    </div>
                                </div>
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                    form.safety_gear_ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}>
                                    {form.safety_gear_ok ? '✓' : '✕'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">
                            Catatan Kerusakan / Temuan Defect Lapangan
                        </label>
                        <textarea
                            value={form.notes_defect}
                            onChange={e => setForm(p => ({ ...p, notes_defect: e.target.value }))}
                            rows={3}
                            placeholder="Tuliskan jika ada kejanggalan suara mesin, lampu putus, getaran, kebocoran, atau komponen aus..."
                            className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-border/40">
                        <Button
                            variant="filled"
                            onClick={handleSubmit}
                            loading={submitMutation.isPending}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-emerald-600/20"
                        >
                            Simpan Hasil Inspeksi P2H
                        </Button>
                        <Button variant="outline" onClick={() => setModalOpen(false)} className="rounded-xl">
                            Batal
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Detail P2H */}
            <Modal
                isOpen={detailModalOpen}
                opened={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title="Lembar Detail Hasil Inspeksi P2H"
                size="md"
            >
                {selectedP2h && (
                    <div className="space-y-4">
                        {/* Header banner */}
                        <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                            selectedP2h.overall_status === 'fit_to_operate'
                                ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border-emerald-500/30'
                                : selectedP2h.overall_status === 'needs_minor_repair'
                                ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 border-amber-500/30'
                                : 'bg-gradient-to-r from-rose-500/20 to-red-500/10 border-rose-500/40'
                        }`}>
                            <div>
                                <h3 className="font-bold text-foreground text-base">{selectedP2h.asset_name}</h3>
                                <span className="text-xs font-mono text-muted-foreground">{selectedP2h.asset_code}</span>
                            </div>
                            {getStatusBadge(selectedP2h.overall_status)}
                        </div>

                        {/* Metadata info */}
                        <div className="p-3 bg-muted/40 rounded-xl border border-border/40 space-y-2 text-xs">
                            <div className="flex justify-between border-b border-border/30 pb-2">
                                <span className="text-muted-foreground">Driver / Pemeriksa:</span>
                                <span className="font-semibold text-foreground">{selectedP2h.employee_name || 'Driver Mandiri'}</span>
                            </div>
                            <div className="flex justify-between border-b border-border/30 pb-2">
                                <span className="text-muted-foreground">Tanggal Pemeriksaan:</span>
                                <span className="font-semibold text-foreground">{dayjs(selectedP2h.inspection_date).format('DD MMMM YYYY')}</span>
                            </div>
                            <div className="flex justify-between border-b border-border/30 pb-2">
                                <span className="text-muted-foreground">Odometer / HM:</span>
                                <span className="font-mono text-foreground">
                                    {selectedP2h.odometer_reading ? `${selectedP2h.odometer_reading.toLocaleString()} KM` : ''}
                                    {selectedP2h.hour_meter_reading ? ` (${selectedP2h.hour_meter_reading} HM)` : ''}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-1">Catatan Defect / Rekomendasi:</span>
                                <p className="text-foreground p-2 rounded-lg bg-card/60 border border-border/40">
                                    {selectedP2h.notes_defect || 'Semua item diperiksa dalam kondisi prima dan aman beroperasi.'}
                                </p>
                            </div>
                        </div>

                        {/* Checklist breakdown */}
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Status Komponen K3</span>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className={`p-2 rounded-lg border flex items-center justify-between ${selectedP2h.brakes_ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/15 border-rose-500/30 text-rose-400'}`}>
                                    <span>🛑 Sistem Rem</span>
                                    <span>{selectedP2h.brakes_ok ? 'Normal' : 'Defect!'}</span>
                                </div>
                                <div className={`p-2 rounded-lg border flex items-center justify-between ${selectedP2h.tires_ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/15 border-rose-500/30 text-rose-400'}`}>
                                    <span>🛞 Roda & Ban</span>
                                    <span>{selectedP2h.tires_ok ? 'Normal' : 'Defect!'}</span>
                                </div>
                                <div className={`p-2 rounded-lg border flex items-center justify-between ${selectedP2h.oil_coolant_ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/15 border-rose-500/30 text-rose-400'}`}>
                                    <span>💧 Oli & Coolant</span>
                                    <span>{selectedP2h.oil_coolant_ok ? 'Normal' : 'Defect!'}</span>
                                </div>
                                <div className={`p-2 rounded-lg border flex items-center justify-between ${selectedP2h.lights_horn_ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/15 border-rose-500/30 text-rose-400'}`}>
                                    <span>💡 Lampu & Sirine</span>
                                    <span>{selectedP2h.lights_horn_ok ? 'Normal' : 'Defect!'}</span>
                                </div>
                                <div className={`p-2 rounded-lg border flex items-center justify-between col-span-2 ${selectedP2h.safety_gear_ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/15 border-rose-500/30 text-rose-400'}`}>
                                    <span>🦺 Sabuk Pengaman & APAR</span>
                                    <span>{selectedP2h.safety_gear_ok ? 'Lengkap & Prima' : 'Kurang / Expired!'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-3 border-t border-border/40">
                            {selectedP2h.overall_status !== 'fit_to_operate' && (
                                <Button
                                    variant="filled"
                                    onClick={() => {
                                        setDetailModalOpen(false);
                                        navigate(`/work-orders?asset_id=${selectedP2h.asset_id}&wo_type=corrective`);
                                    }}
                                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
                                >
                                    <Wrench size={16} />
                                    Buat Work Order Pemeliharaan
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => setDetailModalOpen(false)} className="rounded-xl">
                                Tutup
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
