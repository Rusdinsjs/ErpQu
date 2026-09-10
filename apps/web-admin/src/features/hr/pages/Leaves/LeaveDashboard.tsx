import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus, Check, X, Calendar, Search, Filter, Clock, FileText,
    AlertCircle, User, ShieldCheck, CheckCircle2, XCircle, Info, Paperclip
} from 'lucide-react';
import dayjs from 'dayjs';
import { hrLeavesApi, type HrLeaveApplication, type HrLeaveType, type LeaveBalanceSummary } from'../../api/hr-leaves';
import { employeeApi, type Employee } from'../../api/employee';
import { profileApi } from'../../../../api/profile';
import {
    Button, Card, CardHeader, CardTitle, CardContent,
    Badge, Modal, Table, TableHead, TableRow, TableTh, TableBody, TableTd, TableEmpty,
    Input, Select, Textarea, useToast, LoadingOverlay, Tabs, TabsList, TabsTrigger, TabsContent, PageHeader,
} from '../../../../components/ui';

export default function LeaveDashboard() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState<'my-leaves' | 'approvals' | 'all-leaves' | 'balance'>('my-leaves');
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<HrLeaveApplication | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Profile & Employee Data
    const { data: profile } = useQuery({
        queryKey: ['profile'],
        queryFn: profileApi.getProfile,
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const currentEmployee = useMemo(() => {
        if (!profile?.email || !Array.isArray(employees)) return null;
        return employees.find(e => e.email?.toLowerCase() === profile.email?.toLowerCase()) || employees[0] || null;
    }, [profile, employees]);

    // Master Leave Types
    const { data: leaveTypes = [] } = useQuery({
        queryKey: ['hr-leave-types'],
        queryFn: hrLeavesApi.listTypes,
    });

    // Form State
    const [formData, setFormData] = useState({
        employee_id: '',
        leave_type_id: '',
        from_date: dayjs().format('YYYY-MM-DD'),
        to_date: dayjs().format('YYYY-MM-DD'),
        is_half_day: false,
        half_day_session: 'morning', // morning / afternoon
        backup_employee_id: '',
        contact_number: '',
        reason: '',
        attachment_url: '',
    });

    // Selected Employee for Balance
    const selectedEmployeeId = formData.employee_id || currentEmployee?.id || '';

    // Balances
    const { data: balances = [] } = useQuery({
        queryKey: ['hr-leave-balance', selectedEmployeeId],
        queryFn: () => hrLeavesApi.getBalance(selectedEmployeeId),
        enabled: Boolean(selectedEmployeeId),
    });

    // Selected Leave Type Balance Info
    const selectedTypeBalance = useMemo(() => {
        if (!formData.leave_type_id) return null;
        return balances.find(b => b.leave_type_id === formData.leave_type_id) || null;
    }, [formData.leave_type_id, balances]);

    // Applications Query
    const { data: allApplications = [], isLoading: loadingApps } = useQuery({
        queryKey: ['hr-leave-applications'],
        queryFn: () => hrLeavesApi.listApplications(),
    });

    // Filtered lists
    const myApplications = useMemo(() => {
        if (!currentEmployee?.id) return allApplications;
        return allApplications.filter(a => a.employee_id === currentEmployee.id);
    }, [allApplications, currentEmployee]);

    const pendingApprovals = useMemo(() => {
        return allApplications.filter(a => a.status === 'pending');
    }, [allApplications]);

    // Calculate working days diff
    const calculatedDays = useMemo(() => {
        if (formData.is_half_day) return 0.5;
        if (!formData.from_date || !formData.to_date) return 0;
        const s = dayjs(formData.from_date);
        const e = dayjs(formData.to_date);
        const diff = e.diff(s, 'day') + 1;
        return diff > 0 ? diff : 0;
    }, [formData.from_date, formData.to_date, formData.is_half_day]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: hrLeavesApi.createApplication,
        onSuccess: () => {
            success('Permohonan cuti berhasil diajukan');
            setIsRequestModalOpen(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['hr-leave-applications'] });
            queryClient.invalidateQueries({ queryKey: ['hr-leave-balance'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Gagal mengajukan permohonan cuti');
        },
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
            hrLeavesApi.reviewApplication(id, status, reason),
        onSuccess: () => {
            success('Status permohonan cuti berhasil diperbarui');
            setIsReviewModalOpen(false);
            setSelectedApplication(null);
            setRejectionReason('');
            queryClient.invalidateQueries({ queryKey: ['hr-leave-applications'] });
            queryClient.invalidateQueries({ queryKey: ['hr-leave-balance'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Gagal memperbarui status permohonan');
        },
    });

    const resetForm = () => {
        setFormData({
            employee_id: currentEmployee?.id || '',
            leave_type_id: leaveTypes[0]?.id || '',
            from_date: dayjs().format('YYYY-MM-DD'),
            to_date: dayjs().format('YYYY-MM-DD'),
            is_half_day: false,
            half_day_session: 'morning',
            backup_employee_id: '',
            contact_number: '',
            reason: '',
            attachment_url: '',
        });
    };

    const openRequestModal = () => {
        resetForm();
        setIsRequestModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const empId = formData.employee_id || currentEmployee?.id;
        if (!empId) {
            showError('Pilih karyawan pemohon cuti');
            return;
        }
        if (!formData.leave_type_id) {
            showError('Pilih jenis cuti');
            return;
        }
        if (!formData.reason.trim()) {
            showError('Alasan cuti wajib diisi');
            return;
        }

        createMutation.mutate({
            employee_id: empId,
            leave_type_id: formData.leave_type_id,
            from_date: formData.from_date,
            to_date: formData.is_half_day ? formData.from_date : formData.to_date,
            is_half_day: formData.is_half_day,
            half_day_date: formData.is_half_day ? formData.from_date : undefined,
            reason: formData.backup_employee_id
                ? `${formData.reason} [Backup: ${employees.find(e => e.id === formData.backup_employee_id)?.name || '-'}]`
                : formData.reason,
            attachment_url: formData.attachment_url || undefined,
        });
    };

    const openReview = (app: HrLeaveApplication) => {
        setSelectedApplication(app);
        setRejectionReason('');
        setIsReviewModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge variant="success">Disetujui</Badge>;
            case 'rejected': return <Badge variant="danger">Ditolak</Badge>;
            case 'cancelled': return <Badge variant="neutral">Dibatalkan</Badge>;
            default: return <Badge variant="warning">Menunggu Review</Badge>;
        }
    };

    const employeeOptions = [
        { value: '', label: 'Pilih Karyawan Pemohon...' },
        ...(Array.isArray(employees) ? employees : []).map(e => ({
            value: e.id,
            label: `${e.nik} - ${e.name} (${e.department_name || 'Umum'})`,
        })),
    ];

    const backupOptions = [
        { value: '', label: 'Pilih Rekan Kerja Pengganti (Opsional)...' },
        ...(Array.isArray(employees) ? employees : [])
            .filter(e => e.id !== formData.employee_id)
            .map(e => ({
                value: e.id,
                label: `${e.nik} - ${e.name}`,
            })),
    ];

    const leaveTypeOptions = [
        { value: '', label: 'Pilih Tipe Cuti / Izin...' },
        ...(Array.isArray(leaveTypes) ? leaveTypes : []).map(t => ({
            value: t.id,
            label: `${t.name} (Maks ${t.max_days_allowed} hari/thn)`,
        })),
    ];

    const renderTable = (items: HrLeaveApplication[], showEmployee: boolean = false) => {
        const safeItems = Array.isArray(items) ? items : [];
        const filtered = safeItems.filter(a => {
            const matchesSearch =
                (a.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
                (a.employee_nik || '').toLowerCase().includes(search.toLowerCase()) ||
                (a.leave_type_name || '').toLowerCase().includes(search.toLowerCase()) ||
                (a.reason || '').toLowerCase().includes(search.toLowerCase());
            const matchesStatus = !statusFilter || a.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        return (
            <div className="relative">
                {loadingApps && <LoadingOverlay />}
                <Table>
                    <TableHead>
                        <TableRow>
                            {showEmployee && <TableTh>Karyawan</TableTh>}
                            <TableTh>Tipe Cuti</TableTh>
                            <TableTh>Tanggal Mulai</TableTh>
                            <TableTh>Tanggal Selesai</TableTh>
                            <TableTh>Total Hari</TableTh>
                            <TableTh>Alasan & Lampiran</TableTh>
                            <TableTh>Status</TableTh>
                            <TableTh>Tanggal Pengajuan</TableTh>
                            <TableTh className="text-right">Aksi</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableEmpty colSpan={showEmployee ? 9 : 8} message="Tidak ada data pengajuan cuti" />
                        ) : filtered.map(app => (
                            <TableRow key={app.id}>
                                {showEmployee && (
                                    <TableTd>
                                        <div className="font-medium text-foreground">{app.employee_name}</div>
                                        <div className="text-xs text-muted-foreground">{app.employee_nik}</div>
                                    </TableTd>
                                )}
                                <TableTd className="font-semibold text-foreground">{app.leave_type_name}</TableTd>
                                <TableTd className="text-foreground">{dayjs(app.from_date).format('DD MMM YYYY')}</TableTd>
                                <TableTd className="text-foreground">{dayjs(app.to_date).format('DD MMM YYYY')}</TableTd>
                                <TableTd>
                                    <Badge variant="neutral">{app.total_leave_days} Hari{app.is_half_day ? ' (1/2 Hari)' : ''}</Badge>
                                </TableTd>
                                <TableTd className="max-w-xs truncate text-muted-foreground text-xs" title={app.reason}>
                                    {app.reason}
                                    {app.attachment_url && (
                                        <a href={app.attachment_url} target="_blank" rel="noreferrer" className="ml-1 text-primary hover:underline inline-flex items-center">
                                            <Paperclip className="h-3 w-3" />
                                        </a>
                                    )}
                                </TableTd>
                                <TableTd>{getStatusBadge(app.status)}</TableTd>
                                <TableTd className="text-xs text-muted-foreground">{dayjs(app.created_at).format('DD MMM YYYY, HH:mm')}</TableTd>
                                <TableTd className="text-right">
                                    {app.status === 'pending' ? (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => openReview(app)}
                                            className="text-xs"
                                        >
                                            Review
                                        </Button>
                                    ) : (
                                        <span className="text-xs text-muted-foreground font-medium">
                                            {app.approver_name ? `Oleh: ${app.approver_name}` : 'Selesai'}
                                        </span>
                                    )}
                                </TableTd>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    const balancesList = Array.isArray(balances) ? balances : [];

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Cuti & Izin (Leave Management)"
                subtitle="Kelola permohonan cuti karyawan, persetujuan atasan, dan pemantauan sisa saldo kuota"
                icon={<Calendar className="h-6 w-6 text-primary" />}
                actions={
                    <Button onClick={openRequestModal} leftIcon={<Plus className="h-4 w-4" />} variant="primary">
                        Minta Cuti / Izin
                    </Button>
                }
            />

            {/* Quick Balance Cards for Current Employee */}
            {balancesList.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {balancesList.map(b => (
                        <div key={b.leave_type_id} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold text-gray-300 truncate" title={b.leave_type_name}>{b.leave_type_name}</span>
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.leave_type_color || '#10B981' }} />
                            </div>
                            <div className="text-lg font-bold text-white">{b.remaining_days} <span className="text-xs font-normal text-gray-400">Hari</span></div>
                            <div className="text-[10px] text-gray-400 mt-1 flex justify-between">
                                <span>Total: {b.allocated_days}</span>
                                <span>Pakai: {b.used_days}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Main Tabs Container */}
            <Card>
                <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex gap-2">
                        <Button
                            variant={activeTab === 'my-leaves' ? 'filled' : 'ghost'}
                            color={activeTab === 'my-leaves' ? 'emerald' : undefined}
                            onClick={() => setActiveTab('my-leaves')}
                            size="sm"
                        >
                            Pengajuan Saya ({myApplications.length})
                        </Button>
                        <Button
                            variant={activeTab === 'approvals' ? 'filled' : 'ghost'}
                            color={activeTab === 'approvals' ? 'emerald' : undefined}
                            onClick={() => setActiveTab('approvals')}
                            size="sm"
                            className="relative"
                        >
                            Persetujuan Cuti
                            {pendingApprovals.length > 0 && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-black font-bold">
                                    {pendingApprovals.length}
                                </span>
                            )}
                        </Button>
                        <Button
                            variant={activeTab === 'all-leaves' ? 'filled' : 'ghost'}
                            color={activeTab === 'all-leaves' ? 'emerald' : undefined}
                            onClick={() => setActiveTab('all-leaves')}
                            size="sm"
                        >
                            Semua Riwayat ({allApplications.length})
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        <Input
                            placeholder="Cari karyawan / jenis cuti..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            leftIcon={<Search className="h-4 w-4" />}
                            className="max-w-xs"
                        />
                        <div className="w-44">
                            <Select
                                value={statusFilter}
                                onChange={v => setStatusFilter(v)}
                                options={[
                                    { value: '', label: 'Semua Status' },
                                    { value: 'pending', label: 'Menunggu Review' },
                                    { value: 'approved', label: 'Disetujui' },
                                    { value: 'rejected', label: 'Ditolak' },
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {activeTab === 'my-leaves' && renderTable(myApplications, false)}
                {activeTab === 'approvals' && renderTable(pendingApprovals, true)}
                {activeTab === 'all-leaves' && renderTable(allApplications, true)}
            </Card>

            {/* Modal Form Minta Cuti / Izin (Enhanced Left Image) */}
            <Modal isOpen={isRequestModalOpen} opened={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Formulir Minta Cuti / Izin" size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Pemilihan Karyawan */}
                    <Select
                        label="Karyawan Pemohon *"
                        value={formData.employee_id || currentEmployee?.id || ''}
                        onChange={v => setFormData(p => ({ ...p, employee_id: v }))}
                        options={employeeOptions}
                    />

                    {/* Tipe Cuti & Saldo Indicator */}
                    <div>
                        <Select
                            label="Tipe Cuti / Izin *"
                            value={formData.leave_type_id}
                            onChange={v => setFormData(p => ({ ...p, leave_type_id: v }))}
                            options={leaveTypeOptions}
                        />

                        {selectedTypeBalance && (
                            <div className="mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs">
                                <span className="text-emerald-300 font-medium">Sisa Kuota: <strong>{selectedTypeBalance.remaining_days} Hari</strong> (Total: {selectedTypeBalance.allocated_days} Hari, Terpakai: {selectedTypeBalance.used_days} Hari)</span>
                                {selectedTypeBalance.remaining_days <= 0 && !selectedTypeBalance.is_unpaid && (
                                    <span className="text-red-400 font-bold flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5" /> Saldo Habis
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tanggal Mulai & Tanggal Selesai */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Start Date (Tanggal Mulai) *"
                            value={formData.from_date}
                            onChange={e => setFormData(p => ({ ...p, from_date: e.target.value }))}
                        />
                        <Input
                            type="date"
                            label="End Date (Tanggal Selesai) *"
                            value={formData.is_half_day ? formData.from_date : formData.to_date}
                            onChange={e => setFormData(p => ({ ...p, to_date: e.target.value }))}
                            disabled={formData.is_half_day}
                        />
                    </div>

                    {/* Setengah Hari Checkbox */}
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_half_day"
                                checked={formData.is_half_day}
                                onChange={e => setFormData(p => ({ ...p, is_half_day: e.target.checked }))}
                                className="w-4 h-4 accent-emerald-500 cursor-pointer"
                            />
                            <label htmlFor="is_half_day" className="text-sm font-medium text-gray-200 cursor-pointer">
                                Ambil Cuti Setengah Hari (Half Day Leave - 0.5 Hari)
                            </label>
                        </div>
                        {formData.is_half_day && (
                            <select
                                value={formData.half_day_session}
                                onChange={e => setFormData(p => ({ ...p, half_day_session: e.target.value }))}
                                className="px-3 py-1 bg-black/40 border border-white/20 rounded text-xs text-white"
                            >
                                <option value="morning">Sesi Pagi (08:00 - 12:00)</option>
                                <option value="afternoon">Sesi Siang (13:00 - 17:00)</option>
                            </select>
                        )}
                    </div>

                    {/* Total Hari Kalkulasi */}
                    <div className="p-3 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">Total Hari Kerja yang Diajukan:</span>
                        <span className="text-sm font-bold text-white bg-emerald-600/30 px-3 py-1 rounded border border-emerald-500/40">
                            {calculatedDays} Hari
                        </span>
                    </div>

                    {/* Backup Rekan Kerja & Kontak Darurat */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select
                            label="Karyawan Pengganti (Backup/Handover)"
                            value={formData.backup_employee_id}
                            onChange={v => setFormData(p => ({ ...p, backup_employee_id: v }))}
                            options={backupOptions}
                        />
                        <Input
                            label="Nomor Kontak Selama Cuti (Opsional)"
                            placeholder="cth. 081234567890"
                            value={formData.contact_number}
                            onChange={e => setFormData(p => ({ ...p, contact_number: e.target.value }))}
                        />
                    </div>

                    {/* Alasan */}
                    <Textarea
                        label="Alasan Pengajuan Cuti *"
                        placeholder="Jelaskan alasan atau keperluan cuti secara jelas..."
                        value={formData.reason}
                        onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                        rows={3}
                    />

                    {/* Link Lampiran / SKD Dokter */}
                    <Input
                        label="Link Dokumen / Surat Dokter (Jika Sakit)"
                        placeholder="https://..."
                        value={formData.attachment_url}
                        onChange={e => setFormData(p => ({ ...p, attachment_url: e.target.value }))}
                    />

                    {/* Tombol Aksi */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                        <Button type="button" variant="outline" onClick={() => setIsRequestModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="filled" color="emerald" loading={createMutation.isPending}>
                            Submit Request
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Review & Persetujuan (Enhanced Approvals) */}
            <Modal isOpen={isReviewModalOpen} opened={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Review & Persetujuan Permohonan Cuti" size="md">
                {selectedApplication && (
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Pemohon:</span>
                                <span className="font-bold text-white">{selectedApplication.employee_name} ({selectedApplication.employee_nik})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Jenis Cuti:</span>
                                <span className="font-semibold text-emerald-400">{selectedApplication.leave_type_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Periode:</span>
                                <span className="font-medium text-white">{dayjs(selectedApplication.from_date).format('DD MMM YYYY')} s/d {dayjs(selectedApplication.to_date).format('DD MMM YYYY')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Durasi Terpotong:</span>
                                <span className="font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded text-xs">{selectedApplication.total_leave_days} Hari</span>
                            </div>
                            <div className="pt-2 border-t border-white/10">
                                <span className="text-xs text-gray-400 block mb-1">Alasan Cuti:</span>
                                <p className="text-gray-200 bg-black/30 p-2.5 rounded text-xs leading-relaxed">{selectedApplication.reason}</p>
                            </div>
                        </div>

                        <Textarea
                            label="Catatan / Alasan Penolakan (Wajib diisi jika ditolak)"
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Tuliskan catatan persetujuan atau alasan penolakan..."
                            rows={2}
                        />

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="filled"
                                color="green"
                                onClick={() => reviewMutation.mutate({ id: selectedApplication.id, status: 'approved' })}
                                loading={reviewMutation.isPending}
                                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                                className="flex-1"
                            >
                                Setujui Cuti (Approve)
                            </Button>
                            <Button
                                variant="filled"
                                color="red"
                                onClick={() => {
                                    if (!rejectionReason.trim()) {
                                        showError('Wajib menuliskan alasan penolakan');
                                        return;
                                    }
                                    reviewMutation.mutate({ id: selectedApplication.id, status: 'rejected', reason: rejectionReason });
                                }}
                                loading={reviewMutation.isPending}
                                leftIcon={<XCircle className="h-4 w-4" />}
                            >
                                Tolak (Reject)
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
