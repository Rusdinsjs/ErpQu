import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi, type MaintenanceSchedule, type CreateMaintenanceScheduleRequest } from '../api/maintenance';
import { assetApi } from '../../assets/api/assets';
import {
    Plus, Calendar, Gauge, Wrench, Clock, CheckCircle, Play, Eye,
    Filter, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, ShieldCheck,
    RefreshCw, Layers
} from 'lucide-react';
import dayjs from 'dayjs';
import {
    Card,
    Button,
    Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Modal,
    StatusBadge,
    ActionIcon,
    TableSkeleton,
    SearchInput,
    Select,
    Badge,
    Input,
    Textarea
} from '../../../components/ui';
import { showToast } from '../../../components/ui/Toast';

const MaintenanceSchedules: React.FC = () => {
    const queryClient = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<MaintenanceSchedule | null>(null);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState<'title' | 'asset_name' | 'next_run_date' | 'is_active'>('next_run_date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Form state
    const [formData, setFormData] = useState<CreateMaintenanceScheduleRequest>({
        asset_id: '',
        title: '',
        description: '',
        interval_type: 'time',
        interval_value: 1,
        interval_unit: 'months',
        start_date: dayjs().format('YYYY-MM-DD')
    });

    // Queries
    const { data: schedules = [], isLoading } = useQuery({
        queryKey: ['maintenance-schedules'],
        queryFn: maintenanceApi.listSchedules
    });

    const { data: assetsData } = useQuery({
        queryKey: ['assets'],
        queryFn: () => assetApi.list({ page: 1, per_page: 100 })
    });

    const assets = assetsData?.data || [];

    // Computed Stats
    const stats = useMemo(() => {
        const list: MaintenanceSchedule[] = Array.isArray(schedules) ? schedules : [];
        const total = list.length;
        const active = list.filter(s => s.is_active).length;
        const now = Date.now();
        const dueSoon = list.filter(s => {
            if (!s.is_active || !s.next_run_date) return false;
            const diff = new Date(s.next_run_date).getTime() - now;
            return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
        }).length;
        const overdue = list.filter(s => {
            if (!s.is_active || !s.next_run_date) return false;
            return new Date(s.next_run_date).getTime() < now;
        }).length;
        return { total, active, dueSoon, overdue };
    }, [schedules]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: maintenanceApi.createSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
            setIsCreateModalOpen(false);
            setFormData({
                asset_id: '', title: '', description: '',
                interval_type: 'time', interval_value: 1, interval_unit: 'months', start_date: dayjs().format('YYYY-MM-DD')
            });
            showToast('Maintenance schedule created successfully', 'success');
        },
        onError: (err: any) => {
            showToast(err.message || 'Failed to create schedule', 'error');
        }
    });

    const runMutation = useMutation({
        mutationFn: maintenanceApi.runSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
            queryClient.invalidateQueries({ queryKey: ['work-orders'] });
            showToast('Maintenance schedule triggered & Work Order created!', 'success');
        },
        onError: (err: any) => {
            showToast(err.message || 'Failed to trigger schedule', 'error');
        }
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
            maintenanceApi.toggleSchedule(id, is_active),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
            showToast('Schedule status updated', 'success');
        },
        onError: (err: any) => {
            showToast(err.message || 'Failed to toggle schedule', 'error');
        }
    });

    const handleRunSchedule = (id: string, title: string) => {
        if (confirm(`Eksekusi jadwal "${title}" sekarang? Ini akan otomatis men-generate Work Order baru.`)) {
            runMutation.mutate(id);
        }
    };

    const handleSort = (field: 'title' | 'asset_name' | 'next_run_date' | 'is_active') => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.asset_id || !formData.title) {
            showToast('Unit Aset dan Judul Jadwal wajib diisi', 'error');
            return;
        }
        createMutation.mutate(formData);
    };

    const filteredSchedules = useMemo(() => {
        return (schedules as MaintenanceSchedule[]).filter((s: MaintenanceSchedule) => {
            if (search.trim()) {
                const query = search.toLowerCase().trim();
                const matches = (s.title || '').toLowerCase().includes(query) ||
                    (s.asset_name || '').toLowerCase().includes(query) ||
                    (s.description || '').toLowerCase().includes(query);
                if (!matches) return false;
            }

            if (statusFilter === 'active' && !s.is_active) return false;
            if (statusFilter === 'inactive' && s.is_active) return false;

            return true;
        }).sort((a: MaintenanceSchedule, b: MaintenanceSchedule) => {
            let valA: any = a[sortField] ?? '';
            let valB: any = b[sortField] ?? '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [schedules, search, statusFilter, sortField, sortDirection]);

    const getDueBadge = (nextDate?: string, isActive: boolean = true) => {
        if (!isActive) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"></span>
                    Nonaktif
                </span>
            );
        }
        if (!nextDate) return <span className="text-muted-foreground text-xs">-</span>;

        const diffDays = dayjs(nextDate).diff(dayjs(), 'day');
        if (diffDays < 0) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                    Overdue ({Math.abs(diffDays)} hari)
                </span>
            );
        }
        if (diffDays <= 7) {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Dalam {diffDays === 0 ? 'Hari Ini' : `${diffDays} hari`}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {diffDays} hari lagi
            </span>
        );
    };

    return (
        <div className="p-4 md:p-6 space-y-6 bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Calendar size={24} />
                        </div>
                        Jadwal Pemeliharaan Berkala (PM Schedules)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Otomatisasi jadwal servis preventif aset berdasarkan interval waktu atau pembacaan hour meter/kilometer
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="filled"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/20 rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Buat Jadwal PM Baru
                    </Button>
                </div>
            </div>

            {/* Top KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-muted-foreground">Total Jadwal PM</span>
                        <div className="text-2xl font-bold text-foreground mt-1">{stats.total}</div>
                        <span className="text-[11px] text-muted-foreground">Program terdaftar</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                        <Layers size={20} />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-emerald-400">Jadwal Aktif</span>
                        <div className="text-2xl font-bold text-emerald-300 mt-1">{stats.active}</div>
                        <span className="text-[11px] text-emerald-500/80">Berjalan otomatis</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle size={20} />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-amber-400">Due Minggu Ini</span>
                        <div className="text-2xl font-bold text-amber-300 mt-1">{stats.dueSoon}</div>
                        <span className="text-[11px] text-amber-500/80">Jadwal segera tiba</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Clock size={20} />
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-rose-400">Overdue (Terlewat)</span>
                        <div className="text-2xl font-bold text-rose-300 mt-1">{stats.overdue}</div>
                        <span className="text-[11px] text-rose-400 font-semibold">Perlu segera di-run</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <AlertTriangle size={20} />
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <Card className="border border-border/60 bg-card shadow-sm rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative flex-1 w-full max-w-md">
                        <SearchInput
                            placeholder="Cari program PM, unit aset, atau deskripsi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/40">
                            {[
                                { id: 'all', label: 'Semua' },
                                { id: 'active', label: 'Aktif' },
                                { id: 'inactive', label: 'Nonaktif' },
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
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <TableSkeleton rows={5} columns={6} />
                    ) : (
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableTh onClick={() => handleSort('title')} className="cursor-pointer">
                                        <div className="flex items-center gap-1">
                                            <span>Nama Jadwal PM</span>
                                            <ArrowUpDown size={12} className="opacity-50" />
                                        </div>
                                    </TableTh>
                                    <TableTh onClick={() => handleSort('asset_name')} className="cursor-pointer">
                                        <div className="flex items-center gap-1">
                                            <span>Unit Aset</span>
                                            <ArrowUpDown size={12} className="opacity-50" />
                                        </div>
                                    </TableTh>
                                    <TableTh>Interval Servis</TableTh>
                                    <TableTh>Terakhir Dijalankan</TableTh>
                                    <TableTh onClick={() => handleSort('next_run_date')} className="cursor-pointer">
                                        <div className="flex items-center gap-1">
                                            <span>Jadwal Berikutnya</span>
                                            <ArrowUpDown size={12} className="opacity-50" />
                                        </div>
                                    </TableTh>
                                    <TableTh>Status</TableTh>
                                    <TableTh align="center">Aksi</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredSchedules.length === 0 ? (
                                    <TableEmpty colSpan={7} message="Tidak ada jadwal maintenance yang sesuai filter" />
                                ) : (
                                    filteredSchedules.map((schedule) => (
                                        <TableRow key={schedule.id} className="hover:bg-muted/30 transition-colors">
                                            <TableTd>
                                                <div>
                                                    <span className="font-semibold text-foreground text-sm block">
                                                        {schedule.title}
                                                    </span>
                                                    {schedule.description && (
                                                        <span className="text-xs text-muted-foreground line-clamp-1">
                                                            {schedule.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableTd>
                                            <TableTd>
                                                <div className="flex items-center gap-2">
                                                    <Wrench size={14} className="text-cyan-400 flex-shrink-0" />
                                                    <span className="text-xs font-medium text-foreground">
                                                        {schedule.asset_name || 'Unit Spesifik'}
                                                    </span>
                                                </div>
                                            </TableTd>
                                            <TableTd>
                                                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                                                    {schedule.interval_type === 'time' ? (
                                                        <>
                                                            <Calendar size={13} className="text-primary" />
                                                            <span>Setiap {schedule.interval_value} {schedule.interval_unit}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Gauge size={13} className="text-amber-400" />
                                                            <span>Setiap {schedule.interval_value?.toLocaleString()} {schedule.interval_unit}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableTd>
                                            <TableTd>
                                                <div className="text-xs text-muted-foreground">
                                                    {schedule.last_run_date
                                                        ? dayjs(schedule.last_run_date).format('DD MMM YYYY')
                                                        : 'Belum pernah'}
                                                </div>
                                            </TableTd>
                                            <TableTd>
                                                <div>
                                                    <span className="text-xs font-semibold text-foreground block">
                                                        {schedule.next_run_date
                                                            ? dayjs(schedule.next_run_date).format('DD MMM YYYY')
                                                            : '-'}
                                                    </span>
                                                    <div className="mt-0.5">
                                                        {getDueBadge(schedule.next_run_date, schedule.is_active)}
                                                    </div>
                                                </div>
                                            </TableTd>
                                            <TableTd>
                                                <button
                                                    onClick={() => toggleMutation.mutate({ id: schedule.id, is_active: !schedule.is_active })}
                                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                                                        schedule.is_active
                                                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                                            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                                                    }`}
                                                >
                                                    {schedule.is_active ? 'Aktif' : 'Nonaktif'}
                                                </button>
                                            </TableTd>
                                            <TableTd align="center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <ActionIcon
                                                        onClick={() => handleRunSchedule(schedule.id, schedule.title)}
                                                        title="Eksekusi Sekarang (Buat Work Order)"
                                                        variant="subtle"
                                                        className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                                    >
                                                        <Play size={16} />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        onClick={() => {
                                                            setSelectedSchedule(schedule);
                                                            setViewModalOpen(true);
                                                        }}
                                                        title="Detail Jadwal"
                                                        variant="subtle"
                                                    >
                                                        <Eye size={16} />
                                                    </ActionIcon>
                                                </div>
                                            </TableTd>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </Card>

            {/* Modal Tambah Jadwal PM */}
            <Modal
                isOpen={isCreateModalOpen}
                opened={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Buat Program Pemeliharaan Berkala (PM Schedule)"
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Pilih Unit Aset *</label>
                        <Select
                            placeholder="Pilih Unit Kendaraan / Alat Berat..."
                            options={assets.map((a: any) => ({
                                value: a.id,
                                label: `[${a.asset_code}] ${a.name}`
                            }))}
                            value={formData.asset_id}
                            onChange={(val) => setFormData(p => ({ ...p, asset_id: val }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Judul Jadwal PM *</label>
                        <Input
                            placeholder="cth. Servis Berkala 250 Jam / Ganti Oli Rutin"
                            value={formData.title}
                            onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Deskripsi & Ruang Lingkup</label>
                        <Textarea
                            placeholder="Tuliskan komponen yang perlu diganti atau dicek..."
                            value={formData.description}
                            onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Tipe Interval</label>
                            <Select
                                options={[
                                    { value: 'time', label: 'Berdasarkan Waktu' },
                                    { value: 'usage', label: 'Berdasarkan Jam/KM (HM)' },
                                ]}
                                value={formData.interval_type}
                                onChange={(val: any) => setFormData(p => ({ ...p, interval_type: val }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Nilai Interval</label>
                            <Input
                                type="number"
                                min={1}
                                value={formData.interval_value}
                                onChange={(e) => setFormData(p => ({ ...p, interval_value: parseInt(e.target.value) || 1 }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Satuan</label>
                            <Select
                                options={
                                    formData.interval_type === 'time'
                                        ? [
                                            { value: 'days', label: 'Hari' },
                                            { value: 'weeks', label: 'Minggu' },
                                            { value: 'months', label: 'Bulan' },
                                            { value: 'years', label: 'Tahun' },
                                        ]
                                        : [
                                            { value: 'hours', label: 'Hour Meter (HM)' },
                                            { value: 'km', label: 'Kilometer (KM)' },
                                        ]
                                }
                                value={formData.interval_unit}
                                onChange={(val: any) => setFormData(p => ({ ...p, interval_unit: val }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">Mulai Berlaku Tanggal</label>
                        <Input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData(p => ({ ...p, start_date: e.target.value }))}
                        />
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-border/40 justify-end">
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="rounded-xl">
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant="filled"
                            loading={createMutation.isPending}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl"
                        >
                            Simpan Jadwal PM
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Detail Jadwal */}
            <Modal
                isOpen={viewModalOpen}
                opened={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                title="Rincian Jadwal Pemeliharaan"
                size="md"
            >
                {selectedSchedule && (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted/40 rounded-2xl border border-border/40 space-y-2 text-xs">
                            <div className="flex justify-between border-b border-border/30 pb-2">
                                <span className="text-muted-foreground">Judul Program:</span>
                                <span className="font-bold text-foreground text-sm">{selectedSchedule.title}</span>
                            </div>
                            <div className="flex justify-between border-b border-border/30 pb-2">
                                <span className="text-muted-foreground">Unit Terkait:</span>
                                <span className="font-semibold text-foreground">{selectedSchedule.asset_name || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-border/30 pb-2">
                                <span className="text-muted-foreground">Frekuensi:</span>
                                <span className="font-mono text-foreground">
                                    Setiap {selectedSchedule.interval_value} {selectedSchedule.interval_unit}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-border/30 pb-2">
                                <span className="text-muted-foreground">Jadwal Berikutnya:</span>
                                <span className="font-semibold text-amber-400">
                                    {selectedSchedule.next_run_date ? dayjs(selectedSchedule.next_run_date).format('DD MMMM YYYY') : '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block mb-1">Deskripsi / SOP:</span>
                                <p className="text-foreground p-2 rounded-lg bg-card border border-border/40">
                                    {selectedSchedule.description || 'Tidak ada catatan tambahan.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-3 border-t border-border/40">
                            <Button
                                variant="filled"
                                onClick={() => {
                                    setViewModalOpen(false);
                                    handleRunSchedule(selectedSchedule.id, selectedSchedule.title);
                                }}
                                className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl flex items-center gap-1.5"
                            >
                                <Play size={15} />
                                Eksekusi PM Sekarang
                            </Button>
                            <Button variant="outline" onClick={() => setViewModalOpen(false)} className="rounded-xl">
                                Tutup
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MaintenanceSchedules;
