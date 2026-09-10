import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, Plus, Search, CheckCircle2, XCircle, ExternalLink, DollarSign } from 'lucide-react';
import dayjs from 'dayjs';
import { hrLoansClaimsKpiApi, type HrExpenseClaim } from'../../api/hr-loans-claims-kpi';
import { employeeApi } from'../../api/employee';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, ActionIcon, useToast, LoadingOverlay, PageHeader,
} from '../../../../components/ui';

export default function ExpenseClaimsView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState('');
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<HrExpenseClaim | null>(null);

    const [form, setForm] = useState({
        employee_id: '',
        claim_type_id: '',
        claim_date: dayjs().format('YYYY-MM-DD'),
        total_amount: 250000,
        description: '',
        receipt_url: '',
        payment_method: 'payroll_transfer',
    });

    const [reviewAction, setReviewAction] = useState('approve');
    const [rejectionReason, setRejectionReason] = useState('');

    const { data: claims = [], isLoading } = useQuery({
        queryKey: ['hr-expense-claims'],
        queryFn: () => hrLoansClaimsKpiApi.listExpenseClaims(),
    });

    const { data: claimTypes = [] } = useQuery({
        queryKey: ['hr-expense-claim-types'],
        queryFn: hrLoansClaimsKpiApi.listExpenseClaimTypes,
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const applyMutation = useMutation({
        mutationFn: hrLoansClaimsKpiApi.createExpenseClaim,
        onSuccess: () => {
            success('Pengajuan klaim reimbursement berhasil dikirim');
            qc.invalidateQueries({ queryKey: ['hr-expense-claims'] });
            setApplyModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal mengajukan klaim'),
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hrLoansClaimsKpiApi.reviewExpenseClaim(id, data),
        onSuccess: () => {
            success('Status klaim berhasil diperbarui');
            qc.invalidateQueries({ queryKey: ['hr-expense-claims'] });
            setReviewModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal memproses review klaim'),
    });

    const handleApply = () => {
        if (!form.employee_id || !form.claim_type_id || !form.total_amount || !form.description) {
            showError('Lengkapi seluruh data klaim reimbursement');
            return;
        }
        applyMutation.mutate(form);
    };

    const handleReview = () => {
        if (!selectedClaim) return;
        reviewMutation.mutate({
            id: selectedClaim.id,
            data: { action: reviewAction, rejection_reason: rejectionReason },
        });
    };

    const formatRp = (num: number) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`;

    const claimsList = Array.isArray(claims) ? claims : [];
    const filtered = claimsList.filter(c =>
        (c.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.employee_nik || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.claim_type_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(search.toLowerCase())
    );

    const employeeOptions = [
        { value: '', label: 'Pilih Karyawan Pemohon...' },
        ...(Array.isArray(employees) ? employees : []).map(e => ({
            value: e.id,
            label: `${e.nik} - ${e.name} (${e.department_name || 'Umum'})`,
        })),
    ];

    const claimTypeOptions = [
        { value: '', label: 'Pilih Kategori Biaya Reimburse...' },
        ...(Array.isArray(claimTypes) ? claimTypes : []).map(t => ({
            value: t.id,
            label: `${t.name} (Plafon: ${t.max_amount_per_claim ? formatRp(t.max_amount_per_claim) : 'Sesuai Bukti'})`,
        })),
    ];

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Klaim Pengeluaran & Reimbursement (Expense Claims)"
                subtitle="Penggantian biaya operasional BBM, kesehatan, dinas luar, dan konsumsi lembur"
                icon={<Receipt className="h-6 w-6 text-primary" />}
                actions={
                    <Button onClick={() => setApplyModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="primary">
                        Ajukan Klaim Reimburse
                    </Button>
                }
            />

            <Card>
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <Input
                        placeholder="Cari klaim pengeluaran..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-md"
                    />
                    <Badge variant="neutral">{claimsList.length} Klaim Terdaftar</Badge>
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Tanggal</TableTh>
                                <TableTh>Karyawan</TableTh>
                                <TableTh>Kategori Biaya</TableTh>
                                <TableTh>Nominal Klaim</TableTh>
                                <TableTh>Keterangan & Bukti</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableEmpty colSpan={7} message="Belum ada pengajuan klaim reimbursement" />
                            ) : filtered.map(c => (
                                <TableRow key={c.id}>
                                    <TableTd className="text-xs text-muted-foreground font-mono">{dayjs(c.claim_date).format('DD MMM YYYY')}</TableTd>
                                    <TableTd>
                                        <div className="font-medium text-foreground">{c.employee_name}</div>
                                        <div className="text-xs text-muted-foreground">{c.employee_nik}</div>
                                    </TableTd>
                                    <TableTd className="font-medium text-foreground">{c.claim_type_name}</TableTd>
                                    <TableTd className="font-semibold text-foreground text-base">{formatRp(c.total_amount)}</TableTd>
                                    <TableTd className="text-xs text-muted-foreground max-w-xs">
                                        <div className="truncate">{c.description}</div>
                                        {c.receipt_url && (
                                            <a href={c.receipt_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 mt-0.5">
                                                <ExternalLink className="h-3 w-3" /> Bukti Kuitansi
                                            </a>
                                        )}
                                    </TableTd>
                                    <TableTd>
                                        <Badge variant={
                                            c.status === 'paid' ? 'success' :
                                            c.status === 'approved' ? 'info' :
                                            c.status === 'rejected' ? 'danger' : 'warning'
                                        }>
                                            {c.status === 'paid' ? 'Dicairkan' :
                                             c.status === 'approved' ? 'Disetujui' :
                                             c.status === 'rejected' ? 'Ditolak' : 'Menunggu Approval'}
                                        </Badge>
                                    </TableTd>
                                    <TableTd className="text-right">
                                        {(c.status === 'pending' || c.status === 'approved') && (
                                            <Button size="sm" variant="primary" onClick={() => {
                                                setSelectedClaim(c);
                                                setReviewAction(c.status === 'pending' ? 'approve' : 'mark_paid');
                                                setReviewModalOpen(true);
                                            }}>
                                                Review / Bayar
                                            </Button>
                                        )}
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Input Klaim */}
            <Modal isOpen={applyModalOpen} opened={applyModalOpen} onClose={() => setApplyModalOpen(false)} title="Form Pengajuan Klaim Reimbursement" size="md">
                <div className="space-y-4">
                    <Select
                        label="Karyawan Pemohon *"
                        value={form.employee_id}
                        onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                        options={employeeOptions}
                    />

                    <Select
                        label="Kategori Biaya Operasional *"
                        value={form.claim_type_id}
                        onChange={v => setForm(p => ({ ...p, claim_type_id: v }))}
                        options={claimTypeOptions}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Tanggal Kuitansi / Biaya *"
                            value={form.claim_date}
                            onChange={e => setForm(p => ({ ...p, claim_date: e.target.value }))}
                        />
                        <Input
                            type="number"
                            label="Total Biaya (Rp) *"
                            value={form.total_amount}
                            onChange={e => setForm(p => ({ ...p, total_amount: parseFloat(e.target.value) || 0 }))}
                        />
                    </div>

                    <Input
                        label="Tautan Dokumen / Kuitansi (URL)"
                        value={form.receipt_url}
                        onChange={e => setForm(p => ({ ...p, receipt_url: e.target.value }))}
                        placeholder="https://..."
                    />

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Rincian Keperluan Pengeluaran *</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            rows={3}
                            placeholder="cth. Pengisian BBM motor dinas kunjungan inspeksi lapangan Cilegon..."
                            className="w-full bg-slate-900/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="emerald" onClick={handleApply} loading={applyMutation.isPending} className="flex-1">
                            Kirim Klaim Reimbursement
                        </Button>
                        <Button variant="outline" onClick={() => setApplyModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Review Klaim */}
            <Modal isOpen={reviewModalOpen} opened={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Persetujuan Klaim Reimbursement" size="md">
                {selectedClaim && (
                    <div className="space-y-4 text-white text-sm">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 text-xs">
                            <div>Pemohon: <strong>{selectedClaim.employee_name} ({selectedClaim.employee_nik})</strong></div>
                            <div>Kategori: <strong>{selectedClaim.claim_type_name}</strong></div>
                            <div>Total: <strong className="text-emerald-400">{formatRp(selectedClaim.total_amount)}</strong></div>
                            <div>Keterangan: <em>"{selectedClaim.description}"</em></div>
                        </div>

                        <Select
                            label="Tindakan *"
                            value={reviewAction}
                            onChange={v => setReviewAction(v)}
                            options={[
                                { value: 'approve', label: 'Setujui Pengajuan (Approve)' },
                                { value: 'mark_paid', label: 'Tandai Sudah Dicairkan (Mark Paid)' },
                                { value: 'reject', label: 'Tolak Klaim (Reject)' },
                            ]}
                        />

                        {reviewAction === 'reject' && (
                            <Input
                                label="Alasan Penolakan *"
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="Alasan penolakan..."
                            />
                        )}

                        <div className="flex gap-3 pt-3 border-t border-white/10">
                            <Button variant="filled" color="emerald" onClick={handleReview} loading={reviewMutation.isPending} className="flex-1">
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
