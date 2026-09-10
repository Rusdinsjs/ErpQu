import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, Plus, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';
import { hrOvertimeApi, type HrOvertimeRequest } from'../api/hr-shift-overtime';
import { employeeApi } from'../api/employee';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, ActionIcon, Modal, Input, Select, useToast, LoadingOverlay, DateInput, PageHeader,
} from '../../../components/ui';
import { formatCurrencyIDR } from '../../../utils/decimal';

export default function OvertimeManagementView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();

    const [modalOpen, setModalOpen] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedOvertime, setSelectedOvertime] = useState<HrOvertimeRequest | null>(null);

    const [form, setForm] = useState({
        employee_id: '',
        overtime_date: dayjs().format('YYYY-MM-DD'),
        start_time: '17:00',
        end_time: '20:00',
        planned_hours: '3.0',
        reason: '',
        task_description: '',
        is_holiday: false,
    });

    const [reviewForm, setReviewForm] = useState({
        status: 'approved' as 'approved' | 'rejected',
        actual_hours: '3.0',
        rejection_reason: '',
    });

    const { data: overtimes = [], isLoading } = useQuery({
        queryKey: ['hr-overtime-requests'],
        queryFn: () => hrOvertimeApi.list(),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const overtimeList = Array.isArray(overtimes) ? overtimes : [];
    const employeeList = Array.isArray(employees) ? employees : [];

    const createMutation = useMutation({
        mutationFn: hrOvertimeApi.create,
        onSuccess: () => {
            success('Surat perintah kerja lembur (SPKL) berhasil diajukan');
            qc.invalidateQueries({ queryKey: ['hr-overtime-requests'] });
            setModalOpen(false);
            setForm({ employee_id: '', overtime_date: dayjs().format('YYYY-MM-DD'), start_time: '17:00', end_time: '20:00', planned_hours: '3.0', reason: '', task_description: '', is_holiday: false });
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal mengajukan lembur'),
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hrOvertimeApi.review(id, data),
        onSuccess: () => {
            success('Persetujuan lembur & perhitungan upah lembur Depnaker selesai');
            qc.invalidateQueries({ queryKey: ['hr-overtime-requests'] });
            setReviewModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal memproses approval'),
    });

    const handleSubmit = () => {
        if (!form.employee_id) { showError('Pilih karyawan'); return; }
        if (!form.reason) { showError('Alasan lembur wajib diisi'); return; }
        createMutation.mutate({
            ...form,
            planned_hours: parseFloat(form.planned_hours) || 1.0,
            start_time: `${form.start_time}:00`,
            end_time: `${form.end_time}:00`,
        });
    };

    const handleOpenReview = (ov: HrOvertimeRequest) => {
        setSelectedOvertime(ov);
        setReviewForm({
            status: 'approved',
            actual_hours: String(ov.actual_hours || ov.planned_hours),
            rejection_reason: '',
        });
        setReviewModalOpen(true);
    };

    const handleSaveReview = () => {
        if (!selectedOvertime) return;
        reviewMutation.mutate({
            id: selectedOvertime.id,
            data: {
                status: reviewForm.status,
                actual_hours: parseFloat(reviewForm.actual_hours),
                rejection_reason: reviewForm.rejection_reason || undefined,
            },
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Persetujuan Lembur (SPKL & Depnaker)"
                description="Pengajuan Surat Perintah Kerja Lembur, verifikasi jam aktual, dan kalkulasi tarif upah lembur regulasi Depnaker"
                badge={`${overtimeList.length} Pengajuan`}
                action={
                    <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="primary">
                        Buat Pengajuan SPKL
                    </Button>
                }
            />

            <Card>
                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Tanggal Lembur</TableTh>
                                <TableTh>Karyawan</TableTh>
                                <TableTh>Jam Lembur</TableTh>
                                <TableTh>Durasi (Rencana/Aktual)</TableTh>
                                <TableTh>Kategori</TableTh>
                                <TableTh>Alasan & Tugas</TableTh>
                                <TableTh>Upah Lembur</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {overtimeList.length === 0 ? (
                                <TableEmpty colSpan={9} message="Belum ada pengajuan lembur" />
                            ) : overtimeList.map(ov => (
                                <TableRow key={ov.id}>
                                    <TableTd className="font-mono text-sm">{dayjs(ov.overtime_date).format('DD MMM YYYY')}</TableTd>
                                    <TableTd>
                                        <div className="font-medium text-foreground">{ov.employee_name}</div>
                                        <div className="text-xs text-muted-foreground">{ov.employee_nik}</div>
                                    </TableTd>
                                    <TableTd className="font-mono text-xs">{ov.start_time} - {ov.end_time}</TableTd>
                                    <TableTd className="font-mono text-xs">
                                        {ov.planned_hours} Jam {ov.actual_hours ? `(Aktual: ${ov.actual_hours} Jam)` : ''}
                                    </TableTd>
                                    <TableTd>
                                        {ov.is_holiday ? <Badge variant="danger">Hari Libur (2x-4x)</Badge> : <Badge variant="default">Hari Kerja (1.5x-2x)</Badge>}
                                    </TableTd>
                                    <TableTd className="text-xs text-muted-foreground max-w-xs truncate">
                                        {ov.reason}
                                    </TableTd>
                                    <TableTd className="font-mono font-bold text-foreground text-xs">
                                        {ov.calculated_overtime_pay ? formatCurrencyIDR(ov.calculated_overtime_pay) : '-'}
                                    </TableTd>
                                    <TableTd>
                                        <Badge variant={ov.status === 'approved' ? 'success' : ov.status === 'rejected' ? 'danger' : 'warning'}>
                                            {ov.status === 'approved' ? 'Disetujui' : ov.status === 'rejected' ? 'Ditolak' : 'Menunggu Approval'}
                                        </Badge>
                                    </TableTd>
                                    <TableTd className="text-right">
                                        {ov.status === 'pending' && (
                                            <Button size="sm" variant="outline" onClick={() => handleOpenReview(ov)}>
                                                Review
                                            </Button>
                                        )}
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Create SPKL */}
            <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Surat Perintah Kerja Lembur (SPKL)" size="md">
                <div className="space-y-4">
                    <Select
                        label="Pilih Karyawan *"
                        value={form.employee_id}
                        onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                        options={[{ value: '', label: 'Pilih Karyawan' }, ...employeeList.map(e => ({ value: e.id, label: `${e.nik} - ${e.name}` }))]}
                    />
                    <DateInput label="Tanggal Lembur *" value={form.overtime_date} onChange={v => setForm(p => ({ ...p, overtime_date: v }))} />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Jam Mulai *" type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} />
                        <Input label="Jam Selesai *" type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} />
                    </div>
                    <Input label="Rencana Durasi (Jam) *" type="number" step="0.5" value={form.planned_hours} onChange={e => setForm(p => ({ ...p, planned_hours: e.target.value }))} />
                    <Input label="Alasan Lembur *" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="cth. Pengerjaan closing laporan bulanan" />
                    <Input label="Rincian Tugas" value={form.task_description} onChange={e => setForm(p => ({ ...p, task_description: e.target.value }))} placeholder="Deskripsi pekerjaan yang diselesaikan..." />
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="hol" checked={form.is_holiday} onChange={e => setForm(p => ({ ...p, is_holiday: e.target.checked }))} className="w-4 h-4 accent-red-500 cursor-pointer" />
                        <label htmlFor="hol" className="text-sm text-foreground cursor-pointer">Lembur di Hari Libur Resmi / Akhir Pekan</label>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="primary" onClick={handleSubmit} loading={createMutation.isPending} className="flex-1">Ajukan SPKL</Button>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Review */}
            <Modal opened={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Persetujuan & Kalkulasi Upah Lembur" size="md">
                {selectedOvertime && (
                    <div className="space-y-4">
                        <div className="p-3 bg-muted/40 rounded-lg border border-border text-sm space-y-1">
                            <div className="flex justify-between"><span className="text-muted-foreground">Karyawan:</span><span className="font-semibold text-foreground">{selectedOvertime.employee_name}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Tanggal:</span><span className="text-foreground">{dayjs(selectedOvertime.overtime_date).format('DD MMM YYYY')}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Rencana:</span><span className="text-foreground">{selectedOvertime.planned_hours} Jam ({selectedOvertime.start_time} - {selectedOvertime.end_time})</span></div>
                        </div>
                        <Select
                            label="Keputusan *"
                            value={reviewForm.status}
                            onChange={v => setReviewForm(p => ({ ...p, status: v as any }))}
                            options={[{ value: 'approved', label: 'Disetujui' }, { value: 'rejected', label: 'Ditolak' }]}
                        />
                        {reviewForm.status === 'approved' ? (
                            <Input label="Realisasi Jam Lembur Aktual (Jam) *" type="number" step="0.5" value={reviewForm.actual_hours} onChange={e => setReviewForm(p => ({ ...p, actual_hours: e.target.value }))} />
                        ) : (
                            <Input label="Alasan Penolakan *" value={reviewForm.rejection_reason} onChange={e => setReviewForm(p => ({ ...p, rejection_reason: e.target.value }))} placeholder="Alasan lembur ditolak..." />
                        )}
                        <div className="flex gap-3 pt-2">
                            <Button variant={reviewForm.status === 'approved' ? 'primary' : 'danger'} onClick={handleSaveReview} loading={reviewMutation.isPending} className="flex-1">
                                {reviewForm.status === 'approved' ? 'Setujui & Hitung Tarif Depnaker' : 'Tolak Pengajuan'}
                            </Button>
                            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>Batal</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
