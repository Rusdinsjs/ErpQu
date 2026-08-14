import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, DollarSign, Calendar, CheckCircle2, History, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { hrPayrollApi, type HrPayrollEntry } from '../../../api/hr-payroll';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, useToast, LoadingOverlay
} from '../../../components/ui';

export default function PayrollProcessingView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({
        title: `Gaji Karyawan Bulan ${dayjs().format('MMMM YYYY')}`,
        start_date: dayjs().startOf('month').format('YYYY-MM-DD'),
        end_date: dayjs().endOf('month').format('YYYY-MM-DD'),
    });

    const { data: entries = [], isLoading } = useQuery({
        queryKey: ['hr-payroll-entries'],
        queryFn: hrPayrollApi.listPayrollEntries,
    });

    const runMutation = useMutation({
        mutationFn: hrPayrollApi.runPayroll,
        onSuccess: () => {
            success('Pemrosesan penggajian massal berhasil dijalankan');
            qc.invalidateQueries({ queryKey: ['hr-payroll-entries'] });
            qc.invalidateQueries({ queryKey: ['hr-salary-slips'] });
            setModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal memproses penggajian'),
    });

    const handleRun = () => {
        if (!form.title || !form.start_date || !form.end_date) {
            showError('Lengkapi judul dan rentang periode gaji');
            return;
        }
        runMutation.mutate(form);
    };

    const formatRp = (num: number) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <DollarSign className="h-6 w-6 text-emerald-400" />
                        Pemrosesan Penggajian (Payroll Entry)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Eksekusi batch kalkulasi gaji massal bulanan, pemotongan BPJS, dan PPh 21 TER</p>
                </div>
                <Button onClick={() => setModalOpen(true)} leftIcon={<Play className="h-4 w-4" />} variant="filled" color="emerald">
                    Jalankan Penggajian Bulanan
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold">
                        <History className="h-5 w-5 text-emerald-400" />
                        Riwayat Batch Penggajian (Payroll Runs)
                    </div>
                    <Badge color="blue">{entries.length} Periode Diproses</Badge>
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Nama Batch</TableTh>
                                <TableTh>Tanggal Posting</TableTh>
                                <TableTh>Periode Gaji</TableTh>
                                <TableTh>Total Karyawan</TableTh>
                                <TableTh>Total Bruto</TableTh>
                                <TableTh>Total Potongan</TableTh>
                                <TableTh>Total Net Disalurkan</TableTh>
                                <TableTh>Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {entries.length === 0 ? (
                                <TableEmpty colSpan={8} message="Belum ada riwayat batch penggajian" />
                            ) : entries.map(e => (
                                <TableRow key={e.id}>
                                    <TableTd className="font-bold text-white">{e.title}</TableTd>
                                    <TableTd className="text-sm text-gray-300 font-mono">{e.posting_date}</TableTd>
                                    <TableTd className="text-sm text-gray-300">{e.start_date} s/d {e.end_date}</TableTd>
                                    <TableTd className="font-semibold text-white">{e.total_employees} Karyawan</TableTd>
                                    <TableTd className="font-semibold text-white">{formatRp(e.total_gross_pay)}</TableTd>
                                    <TableTd className="text-red-400 font-medium">{formatRp(e.total_deductions)}</TableTd>
                                    <TableTd className="font-bold text-emerald-400 text-base">{formatRp(e.total_net_pay)}</TableTd>
                                    <TableTd><Badge color="green">Selesai Dihitung</Badge></TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Wizard Payroll Run */}
            <Modal isOpen={modalOpen} opened={modalOpen} onClose={() => setModalOpen(false)} title="Wizard Pemrosesan Penggajian Bulanan" size="md">
                <div className="space-y-4">
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Otomatis Menghitung:</div>
                        <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                            <li>Gaji Pokok + Tunjangan Tetap & Tunjangan Tidak Tetap</li>
                            <li>Iuran BPJS Kesehatan (1%) & Ketenagakerjaan (2% JHT + 1% JP)</li>
                            <li>Tarif Efektif Rata-Rata (TER) PPh 21 PP No. 58/2023</li>
                            <li>Penghasilan Bersih (Take Home Pay) & Slip Gaji Karyawan</li>
                        </ul>
                    </div>

                    <Input
                        label="Judul Batch Penggajian *"
                        value={form.title}
                        onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="cth. Gaji Karyawan Bulan Agustus 2026"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Tanggal Awal Periode *"
                            value={form.start_date}
                            onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                        />
                        <Input
                            type="date"
                            label="Tanggal Akhir Periode *"
                            value={form.end_date}
                            onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                        />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="emerald" onClick={handleRun} loading={runMutation.isPending} className="flex-1">
                            Kalkulasi Gaji Sekarang
                        </Button>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
