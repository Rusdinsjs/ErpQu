import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HandCoins, Plus, Search, Calendar, CheckCircle2, XCircle, AlertCircle, Eye, DollarSign } from 'lucide-react';
import dayjs from 'dayjs';
import { hrLoansClaimsKpiApi, type HrEmployeeLoan, type HrLoanRepaymentSchedule } from '../../../api/hr-loans-claims-kpi';
import { employeeApi } from '../../../api/employee';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, ActionIcon, useToast, LoadingOverlay
} from '../../../components/ui';

export default function EmployeeLoansView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState('');

    // Modals
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<HrEmployeeLoan | null>(null);
    const [schedules, setSchedules] = useState<HrLoanRepaymentSchedule[]>([]);

    // Form
    const [form, setForm] = useState({
        employee_id: '',
        loan_type_id: '',
        loan_amount: 3000000,
        tenure_months: 3,
        start_date: dayjs().format('YYYY-MM-DD'),
        reason: '',
    });

    const [reviewForm, setReviewForm] = useState({
        action: 'approve',
        rejection_reason: '',
    });

    // Queries
    const { data: loans = [], isLoading } = useQuery({
        queryKey: ['hr-employee-loans'],
        queryFn: () => hrLoansClaimsKpiApi.listEmployeeLoans(),
    });

    const { data: loanTypes = [] } = useQuery({
        queryKey: ['hr-loan-types'],
        queryFn: hrLoansClaimsKpiApi.listLoanTypes,
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    // Mutations
    const applyMutation = useMutation({
        mutationFn: hrLoansClaimsKpiApi.applyLoan,
        onSuccess: () => {
            success('Pengajuan kasbon/pinjaman berhasil dikirim');
            qc.invalidateQueries({ queryKey: ['hr-employee-loans'] });
            setApplyModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal mengajukan pinjaman'),
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hrLoansClaimsKpiApi.reviewLoan(id, data),
        onSuccess: () => {
            success('Status pinjaman berhasil diperbarui');
            qc.invalidateQueries({ queryKey: ['hr-employee-loans'] });
            setReviewModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal memproses review pinjaman'),
    });

    const handleApply = () => {
        if (!form.employee_id || !form.loan_type_id || !form.loan_amount || !form.reason) {
            showError('Lengkapi seluruh data pengajuan pinjaman');
            return;
        }
        applyMutation.mutate(form);
    };

    const handleReview = () => {
        if (!selectedLoan) return;
        reviewMutation.mutate({ id: selectedLoan.id, data: reviewForm });
    };

    const openSchedules = async (loan: HrEmployeeLoan) => {
        setSelectedLoan(loan);
        try {
            const data = await hrLoansClaimsKpiApi.listSchedules(loan.id);
            setSchedules(data);
            setScheduleModalOpen(true);
        } catch (e) {
            showError('Gagal memuat jadwal cicilan');
        }
    };

    const openReview = (loan: HrEmployeeLoan) => {
        setSelectedLoan(loan);
        setReviewForm({
            action: loan.status === 'pending' ? 'approve' : 'disburse',
            rejection_reason: '',
        });
        setReviewModalOpen(true);
    };

    const formatRp = (num: number) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`;

    const filtered = loans.filter(l =>
        (l.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.employee_nik || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.loan_type_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const employeeOptions = [
        { value: '', label: 'Pilih Karyawan Pemohon...' },
        ...(Array.isArray(employees) ? employees : []).map(e => ({
            value: e.id,
            label: `${e.nik} - ${e.name} (${e.department_name || 'Umum'})`,
        })),
    ];

    const loanTypeOptions = [
        { value: '', label: 'Pilih Jenis Pinjaman / Kasbon...' },
        ...loanTypes.map(t => ({
            value: t.id,
            label: `${t.name} (Maks ${formatRp(t.max_amount)}, Tenor Maks ${t.max_tenure_months} Bln)`,
        })),
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <HandCoins className="h-6 w-6 text-amber-400" />
                        Pinjaman Karyawan & Kasbon (Employee Loans)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Pengajuan kasbon darurat, amortisasi cicilan, dan auto-deduct ke slip gaji bulanan</p>
                </div>
                <Button onClick={() => setApplyModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="amber">
                    Ajukan Pinjaman / Kasbon
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <Input
                        placeholder="Cari karyawan, NIK, atau tipe kasbon..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-md"
                    />
                    <Badge color="amber">{loans.length} Pinjaman Terdata</Badge>
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Karyawan</TableTh>
                                <TableTh>Jenis Pinjaman</TableTh>
                                <TableTh>Nominal Pinjaman</TableTh>
                                <TableTh>Tenor & Cicilan</TableTh>
                                <TableTh>Sisa Saldo</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableEmpty colSpan={7} message="Belum ada data pengajuan pinjaman" />
                            ) : filtered.map(l => (
                                <TableRow key={l.id}>
                                    <TableTd>
                                        <div className="font-bold text-white">{l.employee_name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{l.employee_nik}</div>
                                    </TableTd>
                                    <TableTd className="font-medium text-amber-300">{l.loan_type_name}</TableTd>
                                    <TableTd className="font-bold text-white">{formatRp(l.loan_amount)}</TableTd>
                                    <TableTd className="text-xs text-gray-300">
                                        <div className="font-semibold text-white">{formatRp(l.monthly_installment)} / bln</div>
                                        <div>{l.tenure_months} Bulan Tenor</div>
                                    </TableTd>
                                    <TableTd className="font-bold text-emerald-400">
                                        {formatRp(l.remaining_balance)}
                                        <span className="block text-[10px] text-gray-400">Terbayar: {formatRp(l.total_paid)}</span>
                                    </TableTd>
                                    <TableTd>
                                        <Badge color={
                                            l.status === 'disbursed' ? 'green' :
                                            l.status === 'approved' ? 'blue' :
                                            l.status === 'closed' ? 'gray' :
                                            l.status === 'rejected' ? 'red' : 'amber'
                                        }>
                                            {l.status === 'disbursed' ? 'Dicairkan (Aktif)' :
                                             l.status === 'approved' ? 'Disetujui' :
                                             l.status === 'closed' ? 'Lunas' :
                                             l.status === 'rejected' ? 'Ditolak' : 'Menunggu Review'}
                                        </Badge>
                                    </TableTd>
                                    <TableTd className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {l.status === 'disbursed' && (
                                                <Button size="sm" variant="outline" onClick={() => openSchedules(l)} leftIcon={<Calendar className="h-3.5 w-3.5" />}>
                                                    Jadwal Cicilan
                                                </Button>
                                            )}
                                            {(l.status === 'pending' || l.status === 'approved') && (
                                                <Button size="sm" variant="filled" color="amber" onClick={() => openReview(l)}>
                                                    Review / Cairkan
                                                </Button>
                                            )}
                                        </div>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Ajukan Pinjaman */}
            <Modal isOpen={applyModalOpen} opened={applyModalOpen} onClose={() => setApplyModalOpen(false)} title="Form Pengajuan Pinjaman / Kasbon Karyawan" size="md">
                <div className="space-y-4">
                    <Select
                        label="Karyawan Pemohon *"
                        value={form.employee_id}
                        onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                        options={employeeOptions}
                    />

                    <Select
                        label="Jenis Pinjaman / Kasbon *"
                        value={form.loan_type_id}
                        onChange={v => setForm(p => ({ ...p, loan_type_id: v }))}
                        options={loanTypeOptions}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="number"
                            label="Nominal Pinjaman (Rp) *"
                            value={form.loan_amount}
                            onChange={e => setForm(p => ({ ...p, loan_amount: parseFloat(e.target.value) || 0 }))}
                        />
                        <Input
                            type="number"
                            label="Tenor (Jumlah Bulan Cicilan) *"
                            value={form.tenure_months}
                            onChange={e => setForm(p => ({ ...p, tenure_months: parseInt(e.target.value) || 1 }))}
                        />
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex justify-between">
                        <span>Estimasi Cicilan Bulanan:</span>
                        <strong className="text-sm font-bold text-white">
                            {formatRp(Math.round(form.loan_amount / (form.tenure_months || 1)))} / bulan
                        </strong>
                    </div>

                    <Input
                        type="date"
                        label="Tanggal Mulai Berlaku *"
                        value={form.start_date}
                        onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                    />

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Alasan Pengajuan Pinjaman *</label>
                        <textarea
                            value={form.reason}
                            onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                            rows={3}
                            placeholder="Jelaskan kebutuhan pengajuan kasbon/pinjaman..."
                            className="w-full bg-slate-900/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="amber" onClick={handleApply} loading={applyMutation.isPending} className="flex-1">
                            Kirim Pengajuan Kasbon
                        </Button>
                        <Button variant="outline" onClick={() => setApplyModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Review / Pencairan Pinjaman */}
            <Modal isOpen={reviewModalOpen} opened={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Persetujuan & Pencairan Pinjaman" size="md">
                {selectedLoan && (
                    <div className="space-y-4 text-white text-sm">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 text-xs">
                            <div>Pemohon: <strong>{selectedLoan.employee_name} ({selectedLoan.employee_nik})</strong></div>
                            <div>Nominal: <strong className="text-amber-400">{formatRp(selectedLoan.loan_amount)}</strong> ({selectedLoan.tenure_months} Bulan @ {formatRp(selectedLoan.monthly_installment)})</div>
                            <div>Alasan: <em>"{selectedLoan.reason}"</em></div>
                        </div>

                        <Select
                            label="Tindakan Keputusan *"
                            value={reviewForm.action}
                            onChange={v => setReviewForm(p => ({ ...p, action: v }))}
                            options={[
                                { value: 'approve', label: 'Setujui Pengajuan (Approve)' },
                                { value: 'disburse', label: 'Cairkan Dana & Bentuk Jadwal Cicilan (Disburse)' },
                                { value: 'reject', label: 'Tolak Pengajuan (Reject)' },
                            ]}
                        />

                        {reviewForm.action === 'reject' && (
                            <Input
                                label="Alasan Penolakan *"
                                value={reviewForm.rejection_reason}
                                onChange={e => setReviewForm(p => ({ ...p, rejection_reason: e.target.value }))}
                                placeholder="Jelaskan alasan penolakan..."
                            />
                        )}

                        <div className="flex gap-3 pt-3 border-t border-white/10">
                            <Button variant="filled" color="amber" onClick={handleReview} loading={reviewMutation.isPending} className="flex-1">
                                Proses Keputusan
                            </Button>
                            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>Batal</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Jadwal Cicilan (Amortisasi) */}
            <Modal isOpen={scheduleModalOpen} opened={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title="Jadwal Amortisasi Cicilan Pinjaman" size="lg">
                {selectedLoan && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs text-gray-300 pb-2 border-b border-white/10">
                            <div>Karyawan: <strong className="text-white">{selectedLoan.employee_name}</strong></div>
                            <div>Sisa Saldo: <strong className="text-emerald-400">{formatRp(selectedLoan.remaining_balance)}</strong></div>
                        </div>

                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableTh>Cicilan Ke-</TableTh>
                                    <TableTh>Jatuh Tempo Potong Gaji</TableTh>
                                    <TableTh>Nominal Cicilan</TableTh>
                                    <TableTh>Nominal Terbayar</TableTh>
                                    <TableTh>Status Pembayaran</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {schedules.map(s => (
                                    <TableRow key={s.id}>
                                        <TableTd className="font-bold text-white">Bulan #{s.installment_no}</TableTd>
                                        <TableTd className="font-mono text-gray-300">{dayjs(s.due_date).format('DD MMMM YYYY')}</TableTd>
                                        <TableTd className="font-bold text-amber-400">{formatRp(s.installment_amount)}</TableTd>
                                        <TableTd className="font-medium text-emerald-400">{formatRp(s.paid_amount)}</TableTd>
                                        <TableTd>
                                            <Badge color={s.status === 'payroll_deducted' || s.status === 'paid' ? 'green' : 'amber'}>
                                                {s.status === 'payroll_deducted' ? 'Auto-Deduct Slip Gaji' : s.status === 'paid' ? 'Lunas' : 'Menunggu Payroll'}
                                            </Badge>
                                        </TableTd>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Modal>
        </div>
    );
}
