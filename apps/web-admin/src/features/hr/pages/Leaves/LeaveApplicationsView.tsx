import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, CheckCircle2, XCircle, Search, Filter, Clock, FileText, UserCheck } from 'lucide-react';
import { hrLeavesApi, type HrLeaveApplication } from'../../api/hr-leaves';
import { employeeApi } from'../../api/employee';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, ActionIcon, Modal, Input, Select, useToast, LoadingOverlay, Textarea,
} from'../../../../components/ui';

export default function LeaveApplicationsView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState<HrLeaveApplication | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const [form, setForm] = useState({
        employee_id: '',
        leave_type_id: '',
        from_date: new Date().toISOString().split('T')[0],
        to_date: new Date().toISOString().split('T')[0],
        is_half_day: false,
        reason: '',
    });

    const { data: applications = [], isLoading } = useQuery({
        queryKey: ['hr-leave-applications', statusFilter],
        queryFn: () => hrLeavesApi.listApplications(statusFilter ? { status: statusFilter } : undefined),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const { data: leaveTypes = [] } = useQuery({
        queryKey: ['hr-leave-types'],
        queryFn: hrLeavesApi.listTypes,
    });

    const { data: balances = [] } = useQuery({
        queryKey: ['hr-leave-balance', form.employee_id],
        queryFn: () => hrLeavesApi.getBalance(form.employee_id),
        enabled: Boolean(form.employee_id),
    });

    const createMutation = useMutation({
        mutationFn: hrLeavesApi.createApplication,
        onSuccess: () => {
            success('Permohonan cuti berhasil diajukan');
            qc.invalidateQueries({ queryKey: ['hr-leave-applications'] });
            qc.invalidateQueries({ queryKey: ['hr-leave-balance'] });
            setModalOpen(false);
            resetForm();
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal mengajukan cuti'),
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
            hrLeavesApi.reviewApplication(id, status, reason),
        onSuccess: () => {
            success('Status permohonan cuti berhasil diperbarui');
            qc.invalidateQueries({ queryKey: ['hr-leave-applications'] });
            qc.invalidateQueries({ queryKey: ['hr-leave-balance'] });
            setReviewModalOpen(false);
            setSelectedApp(null);
            setRejectionReason('');
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal memperbarui status cuti'),
    });

    const resetForm = () => {
        setForm({
            employee_id: '',
            leave_type_id: '',
            from_date: new Date().toISOString().split('T')[0],
            to_date: new Date().toISOString().split('T')[0],
            is_half_day: false,
            reason: '',
        });
    };

    const handleCreate = () => {
        if (!form.employee_id || !form.leave_type_id || !form.from_date || !form.to_date || !form.reason) {
            showError('Lengkapi seluruh data wajib');
            return;
        }
        createMutation.mutate(form);
    };

    const openReview = (app: HrLeaveApplication) => {
        setSelectedApp(app);
        setRejectionReason('');
        setReviewModalOpen(true);
    };

    const filtered = applications.filter(a =>
        (a.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.employee_nik || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.leave_type_name || '').toLowerCase().includes(search.toLowerCase()) ||
        a.reason.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved': return <Badge color="green">Disetujui</Badge>;
            case 'rejected': return <Badge color="red">Ditolak</Badge>;
            case 'cancelled': return <Badge color="gray">Dibatalkan</Badge>;
            default: return <Badge color="yellow">Menunggu Persetujuan</Badge>;
        }
    };

    const employeeOptions = [
        { value: '', label: 'Pilih Karyawan...' },
        ...(Array.isArray(employees) ? employees : []).map(e => ({
            value: e.id,
            label: `${e.nik} - ${e.name}`,
        })),
    ];

    const leaveTypeOptions = [
        { value: '', label: 'Pilih Jenis Cuti...' },
        ...(Array.isArray(leaveTypes) ? leaveTypes : []).map(lt => ({
            value: lt.id,
            label: `${lt.name} (Maks ${lt.max_days_allowed} hari)`,
        })),
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-emerald-400" />
                        Permohonan Cuti & Izin
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Pengajuan cuti karyawan dan workflow persetujuan atasan/HRD</p>
                </div>
                <Button onClick={() => { resetForm(); setModalOpen(true); }} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="emerald">
                    Ajukan Cuti
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 max-w-lg">
                        <Input
                            placeholder="Cari nama karyawan, NIK, alasan..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            leftIcon={<Search className="h-4 w-4" />}
                        />
                        <div className="w-52">
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

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Karyawan</TableTh>
                                <TableTh>Jenis Cuti</TableTh>
                                <TableTh>Periode Cuti</TableTh>
                                <TableTh>Durasi</TableTh>
                                <TableTh>Alasan</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableEmpty colSpan={7} message="Belum ada data pengajuan cuti" />
                            ) : filtered.map(a => (
                                <TableRow key={a.id}>
                                    <TableTd>
                                        <div className="font-medium text-white">{a.employee_name || 'Karyawan'}</div>
                                        <div className="text-xs text-gray-400 font-mono">{a.employee_nik || '-'}</div>
                                    </TableTd>
                                    <TableTd>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold" style={{ backgroundColor: `${a.leave_type_color || '#10B981'}20`, color: a.leave_type_color || '#10B981' }}>
                                            {a.leave_type_name}
                                        </span>
                                    </TableTd>
                                    <TableTd>
                                        <div className="text-sm text-gray-200">{a.from_date} s/d {a.to_date}</div>
                                        {a.is_half_day && <span className="text-xs text-yellow-400 font-medium">Setengah Hari (0.5d)</span>}
                                    </TableTd>
                                    <TableTd className="font-semibold text-white">{a.total_leave_days} Hari</TableTd>
                                    <TableTd className="max-w-xs truncate text-gray-300" title={a.reason}>{a.reason}</TableTd>
                                    <TableTd>{getStatusBadge(a.status)}</TableTd>
                                    <TableTd className="text-right">
                                        {a.status === 'pending' ? (
                                            <Button size="sm" variant="outline" onClick={() => openReview(a)} leftIcon={<UserCheck className="h-3.5 w-3.5" />}>
                                                Review
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-gray-500">Selesai</span>
                                        )}
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Ajukan Cuti */}
            <Modal isOpen={modalOpen} opened={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title="Formulir Pengajuan Cuti / Izin" size="lg">
                <div className="space-y-4">
                    <Select
                        label="Pilih Karyawan *"
                        value={form.employee_id}
                        onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                        options={employeeOptions}
                    />

                    {/* Ringkasan Saldo Karyawan */}
                    {form.employee_id && balances.length > 0 && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Sisa Kuota Cuti Karyawan:</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {balances.map(b => (
                                    <div key={b.leave_type_id} className="bg-white/5 p-2 rounded border border-white/5">
                                        <div className="text-xs text-gray-300 truncate">{b.leave_type_name}</div>
                                        <div className="text-sm font-bold text-white">{b.remaining_days} Hari</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Select
                        label="Jenis Cuti *"
                        value={form.leave_type_id}
                        onChange={v => setForm(p => ({ ...p, leave_type_id: v }))}
                        options={leaveTypeOptions}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Tanggal Mulai *"
                            value={form.from_date}
                            onChange={e => setForm(p => ({ ...p, from_date: e.target.value }))}
                        />
                        <Input
                            type="date"
                            label="Tanggal Selesai *"
                            value={form.to_date}
                            onChange={e => setForm(p => ({ ...p, to_date: e.target.value }))}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="half_day"
                            checked={form.is_half_day}
                            onChange={e => setForm(p => ({ ...p, is_half_day: e.target.checked }))}
                            className="w-4 h-4 accent-emerald-500"
                        />
                        <label htmlFor="half_day" className="text-sm text-gray-300">Cuti Setengah Hari (0.5 hari)</label>
                    </div>

                    <Textarea
                        label="Alasan Pengajuan Cuti *"
                        value={form.reason}
                        onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                        placeholder="Jelaskan alasan atau keperluan cuti..."
                        rows={3}
                    />

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="emerald" onClick={handleCreate} loading={createMutation.isPending} className="flex-1">
                            Kirim Permohonan
                        </Button>
                        <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Review / Approval */}
            <Modal isOpen={reviewModalOpen} opened={reviewModalOpen} onClose={() => { setReviewModalOpen(false); setSelectedApp(null); }} title="Persetujuan Permohonan Cuti" size="md">
                {selectedApp && (
                    <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-400">Karyawan:</span>
                                <span className="text-sm font-semibold text-white">{selectedApp.employee_name} ({selectedApp.employee_nik})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-400">Jenis Cuti:</span>
                                <span className="text-sm font-semibold text-emerald-400">{selectedApp.leave_type_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-400">Periode Cuti:</span>
                                <span className="text-sm font-medium text-white">{selectedApp.from_date} s/d {selectedApp.to_date} ({selectedApp.total_leave_days} hari)</span>
                            </div>
                            <div className="pt-2 border-t border-white/10">
                                <span className="text-xs text-gray-400 block mb-1">Alasan:</span>
                                <p className="text-sm text-gray-200 bg-black/20 p-2.5 rounded">{selectedApp.reason}</p>
                            </div>
                        </div>

                        <Textarea
                            label="Catatan / Alasan Penolakan (Jika ditolak)"
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            placeholder="Tuliskan alasan penolakan jika permohonan ditolak..."
                            rows={2}
                        />

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="filled"
                                color="green"
                                onClick={() => reviewMutation.mutate({ id: selectedApp.id, status: 'approved' })}
                                loading={reviewMutation.isPending}
                                leftIcon={<CheckCircle2 className="h-4 w-4" />}
                                className="flex-1"
                            >
                                Setujui Cuti
                            </Button>
                            <Button
                                variant="filled"
                                color="red"
                                onClick={() => {
                                    if (!rejectionReason) { showError('Mohon isi alasan penolakan'); return; }
                                    reviewMutation.mutate({ id: selectedApp.id, status: 'rejected', reason: rejectionReason });
                                }}
                                loading={reviewMutation.isPending}
                                leftIcon={<XCircle className="h-4 w-4" />}
                            >
                                Tolak
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
