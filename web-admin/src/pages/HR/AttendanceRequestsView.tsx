import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Plus, CheckCircle, XCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { hrAttendanceRequestApi, type HrAttendanceRequest } from '../../api/hr-shift-overtime';
import { employeeApi } from '../../api/employee';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, useToast, LoadingOverlay, DateInput,
} from '../../components/ui';

const REQ_TYPES = [
    { value: 'correction', label: 'Koreksi Jam Kehadiran' },
    { value: 'on_duty', label: 'Dinas Luar Kota / Lapangan' },
    { value: 'wfh', label: 'Work From Home (WFH)' },
    { value: 'forgot_checkout', label: 'Lupa Check-out' },
];

export default function AttendanceRequestsView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();

    const [modalOpen, setModalOpen] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedReq, setSelectedReq] = useState<HrAttendanceRequest | null>(null);

    const [form, setForm] = useState({
        employee_id: '',
        request_type: 'correction' as any,
        attendance_date: dayjs().format('YYYY-MM-DD'),
        requested_check_in: `${dayjs().format('YYYY-MM-DD')}T08:00:00Z`,
        requested_check_out: `${dayjs().format('YYYY-MM-DD')}T17:00:00Z`,
        reason: '',
        attachment_url: '',
    });

    const [reviewForm, setReviewForm] = useState({
        status: 'approved' as 'approved' | 'rejected',
        rejection_reason: '',
    });

    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['hr-attendance-requests'],
        queryFn: () => hrAttendanceRequestApi.list(),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const createMutation = useMutation({
        mutationFn: hrAttendanceRequestApi.create,
        onSuccess: () => {
            success('Permohonan berhasil diajukan');
            qc.invalidateQueries({ queryKey: ['hr-attendance-requests'] });
            setModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal mengajukan permohonan'),
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hrAttendanceRequestApi.review(id, data),
        onSuccess: () => {
            success('Permohonan berhasil diproses');
            qc.invalidateQueries({ queryKey: ['hr-attendance-requests'] });
            setReviewModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal memproses permohonan'),
    });

    const handleSubmit = () => {
        if (!form.employee_id) { showError('Pilih karyawan'); return; }
        if (!form.reason) { showError('Alasan wajib diisi'); return; }
        createMutation.mutate(form);
    };

    const handleOpenReview = (r: HrAttendanceRequest) => {
        setSelectedReq(r);
        setReviewForm({ status: 'approved', rejection_reason: '' });
        setReviewModalOpen(true);
    };

    const handleSaveReview = () => {
        if (!selectedReq) return;
        reviewMutation.mutate({ id: selectedReq.id, data: reviewForm });
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6 text-teal-400" />
                        Koreksi Absensi & Dinas Luar
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Pengajuan dan persetujuan koreksi lupa absen, dinas luar lapangan, atau WFH</p>
                </div>
                <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="teal">
                    Ajukan Permohonan
                </Button>
            </div>

            <Card>
                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Tanggal Absensi</TableTh>
                                <TableTh>Karyawan</TableTh>
                                <TableTh>Jenis Pengajuan</TableTh>
                                <TableTh>Alasan</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableEmpty colSpan={6} message="Belum ada permohonan koreksi absensi" />
                            ) : requests.map(r => (
                                <TableRow key={r.id}>
                                    <TableTd className="font-mono text-sm">{dayjs(r.attendance_date).format('DD MMM YYYY')}</TableTd>
                                    <TableTd>
                                        <div className="font-medium text-white">{r.employee_name}</div>
                                        <div className="text-xs text-gray-400">{r.employee_nik}</div>
                                    </TableTd>
                                    <TableTd>
                                        <Badge color={r.request_type === 'on_duty' ? 'blue' : r.request_type === 'wfh' ? 'purple' : 'yellow'}>
                                            {REQ_TYPES.find(t => t.value === r.request_type)?.label || r.request_type}
                                        </Badge>
                                    </TableTd>
                                    <TableTd className="text-xs text-gray-300 max-w-xs truncate">{r.reason}</TableTd>
                                    <TableTd>
                                        <Badge color={r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'yellow'}>
                                            {r.status === 'approved' ? 'Disetujui' : r.status === 'rejected' ? 'Ditolak' : 'Menunggu Approval'}
                                        </Badge>
                                    </TableTd>
                                    <TableTd className="text-right">
                                        {r.status === 'pending' && (
                                            <Button size="sm" variant="filled" color="teal" onClick={() => handleOpenReview(r)}>
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

            {/* Modal Create */}
            <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Ajukan Koreksi / Dinas Luar" size="md">
                <div className="space-y-4">
                    <Select
                        label="Karyawan *"
                        value={form.employee_id}
                        onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                        options={[{ value: '', label: 'Pilih Karyawan' }, ...employees.map(e => ({ value: e.id, label: `${e.nik} - ${e.name}` }))]}
                    />
                    <Select
                        label="Jenis Permohonan *"
                        value={form.request_type}
                        onChange={v => setForm(p => ({ ...p, request_type: v as any }))}
                        options={REQ_TYPES}
                    />
                    <DateInput label="Tanggal Absensi *" value={form.attendance_date} onChange={v => setForm(p => ({ ...p, attendance_date: v }))} />
                    <Input label="Alasan / Keterangan *" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Jelaskan alasan koreksi/dinas..." />
                    <Input label="URL Lampiran Bukti (Opsional)" value={form.attachment_url} onChange={e => setForm(p => ({ ...p, attachment_url: e.target.value }))} placeholder="https://..." />
                    <div className="flex gap-3 pt-2">
                        <Button variant="filled" color="teal" onClick={handleSubmit} loading={createMutation.isPending} className="flex-1">Kirim Pengajuan</Button>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Review */}
            <Modal opened={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Persetujuan Koreksi Absensi" size="md">
                {selectedReq && (
                    <div className="space-y-4">
                        <div className="p-3 bg-white/5 rounded-lg border border-white/10 text-sm space-y-1">
                            <div><span className="text-gray-400">Karyawan: </span><span className="text-white font-semibold">{selectedReq.employee_name}</span></div>
                            <div><span className="text-gray-400">Alasan: </span><span className="text-white">{selectedReq.reason}</span></div>
                        </div>
                        <Select
                            label="Keputusan *"
                            value={reviewForm.status}
                            onChange={v => setReviewForm(p => ({ ...p, status: v as any }))}
                            options={[{ value: 'approved', label: 'Setujui' }, { value: 'rejected', label: 'Tolak' }]}
                        />
                        {reviewForm.status === 'rejected' && (
                            <Input label="Alasan Penolakan *" value={reviewForm.rejection_reason} onChange={e => setReviewForm(p => ({ ...p, rejection_reason: e.target.value }))} />
                        )}
                        <div className="flex gap-3 pt-2">
                            <Button variant="filled" color={reviewForm.status === 'approved' ? 'green' : 'red'} onClick={handleSaveReview} loading={reviewMutation.isPending} className="flex-1">
                                Simpan Keputusan
                            </Button>
                            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>Batal</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
