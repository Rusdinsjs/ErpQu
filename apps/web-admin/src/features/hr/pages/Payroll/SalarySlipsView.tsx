import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Printer, Search, Download, Building2, CheckCircle2, DollarSign, MessageSquare } from 'lucide-react';
import dayjs from 'dayjs';
import { hrPayrollApi, type HrSalarySlip } from '../../api/hr-payroll';
import { useAuthStore } from '../../../../store/useAuthStore';
import { fetchCompanies } from '../../../company/api/companyApi';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, ActionIcon, Modal, Input, Select, LoadingOverlay, PageHeader
} from '../../../../components/ui';
import { OfficialDocumentPrintModal } from '../../../../components/print/OfficialDocumentPrintModal';
import { SalarySlipPrintTemplate } from '../../../../components/print/templates/SalarySlipPrintTemplate';
import { SendWhatsAppModal } from '../../../../components/whatsapp/SendWhatsAppModal';

export default function SalarySlipsView() {
    const [search, setSearch] = useState('');
    const [selectedSlip, setSelectedSlip] = useState<HrSalarySlip | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [printSlip, setPrintSlip] = useState<HrSalarySlip | null>(null);
    const [whatsAppSlip, setWhatsAppSlip] = useState<HrSalarySlip | null>(null);

    const activeCompanyId = useAuthStore(s => s.activeCompanyId);
    const { data: companies = [] } = useQuery({
        queryKey: ['companies'],
        queryFn: fetchCompanies,
    });
    const companiesList = Array.isArray(companies) ? companies : [];
    const activeCompany = companiesList.find((c: any) => c.id === activeCompanyId) || companiesList[0];

    const { data: slips = [], isLoading } = useQuery({
        queryKey: ['hr-salary-slips'],
        queryFn: () => hrPayrollApi.listSalarySlips(),
    });

    const slipsList = Array.isArray(slips) ? slips : [];

    const openSlipDetail = (slip: HrSalarySlip) => {
        setSelectedSlip(slip);
        setModalOpen(true);
    };

    const handlePrint = () => {
        window.print();
    };

    const filtered = slipsList.filter(s =>
        (s.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.employee_nik || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.department_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const formatRp = (num: number) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Slip Gaji Karyawan (Salary Slips)"
                description="Daftar slip gaji resmi lengkap dengan rincian BPJS, PPh 21 TER, dan Take Home Pay"
                badge={`${filtered.length} Slip Gaji`}
            />

            <Card>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <Input
                        placeholder="Cari nama karyawan, NIK, divisi..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-md"
                    />
                    <Badge color="blue">{slips.length} Slip Gaji Terbit</Badge>
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Karyawan</TableTh>
                                <TableTh>Periode Gaji</TableTh>
                                <TableTh>Penghasilan Bruto</TableTh>
                                <TableTh>BPJS Pekerja</TableTh>
                                <TableTh>PPh 21 TER</TableTh>
                                <TableTh>Take Home Pay (Net)</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableEmpty colSpan={8} message="Belum ada data slip gaji" />
                            ) : filtered.map(s => {
                                const bpjsTotal = Number(s.bpjs_kes_employee) + Number(s.bpjs_jht_employee) + Number(s.bpjs_jp_employee);
                                return (
                                    <TableRow key={s.id}>
                                        <TableTd>
                                            <div className="font-bold text-white">{s.employee_name}</div>
                                            <div className="text-xs text-gray-400 font-mono">{s.employee_nik} • {s.department_name || 'Umum'}</div>
                                        </TableTd>
                                        <TableTd className="text-sm text-gray-300">
                                            {dayjs(s.start_date).format('DD MMM')} - {dayjs(s.end_date).format('DD MMM YYYY')}
                                        </TableTd>
                                        <TableTd className="font-semibold text-white">{formatRp(s.gross_pay)}</TableTd>
                                        <TableTd className="text-red-400 font-medium">{formatRp(bpjsTotal)}</TableTd>
                                        <TableTd className="text-amber-400 font-medium">
                                            {formatRp(s.pph21_amount)}
                                            <span className="block text-[10px] text-gray-400">TER {s.pph21_ter_category} ({(Number(s.pph21_ter_rate)*100).toFixed(2)}%)</span>
                                        </TableTd>
                                        <TableTd className="font-bold text-emerald-400 text-base">{formatRp(s.net_pay)}</TableTd>
                                        <TableTd><Badge color="green">Diproses</Badge></TableTd>
                                        <TableTd className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => openSlipDetail(s)} leftIcon={<FileText className="h-3.5 w-3.5" />}>
                                                    Lihat
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => setPrintSlip(s)} leftIcon={<Printer className="h-3.5 w-3.5" />}>
                                                    Cetak
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => setWhatsAppSlip(s)} className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" leftIcon={<MessageSquare className="h-3.5 w-3.5" />}>
                                                    WA
                                                </Button>
                                            </div>
                                        </TableTd>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Detail & Cetak Slip Gaji */}
            <Modal isOpen={modalOpen} opened={modalOpen} onClose={() => setModalOpen(false)} title="Slip Gaji Karyawan (Salary Slip)" size="lg">
                {selectedSlip && (
                    <div className="space-y-6 text-white" id="printable-slip">
                        {/* Company Header */}
                        <div className="border-b border-white/20 pb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-emerald-400">{activeCompany?.name || 'PT. NUSANTARA PERKASA MANDIRI'}</h2>
                                <p className="text-xs text-gray-400">{activeCompany?.address || 'Kawasan Industri & Pergudangan Terpadu'}</p>
                                <p className="text-xs text-gray-400">NPWP: {activeCompany?.tax_id || '01.234.567.8-011.000'}</p>
                            </div>
                            <div className="text-right">
                                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs font-bold uppercase">
                                    SLIP GAJI RESMI
                                </span>
                                <div className="text-xs text-gray-400 mt-2">Periode: {dayjs(selectedSlip.start_date).format('DD MMMM YYYY')} s/d {dayjs(selectedSlip.end_date).format('DD MMMM YYYY')}</div>
                            </div>
                        </div>

                        {/* Employee Bio */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white/5 border border-white/10 rounded-xl text-xs">
                            <div>
                                <span className="text-gray-400 block">Nama Karyawan:</span>
                                <span className="font-bold text-white text-sm">{selectedSlip.employee_name}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 block">Nomor Induk (NIK):</span>
                                <span className="font-mono text-white text-sm">{selectedSlip.employee_nik}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 block">Departemen:</span>
                                <span className="text-white text-sm">{selectedSlip.department_name || 'Umum'}</span>
                            </div>
                            <div>
                                <span className="text-gray-400 block">Status PTKP / TER:</span>
                                <span className="font-bold text-emerald-400 text-sm">{selectedSlip.ptkp_status} (Kategori {selectedSlip.pph21_ter_category})</span>
                            </div>
                        </div>

                        {/* Earnings & Deductions Tables */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* PENDAPATAN */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-emerald-500/30 pb-1">
                                    A. Pendapatan (Earnings)
                                </h3>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between py-1 border-b border-white/5">
                                        <span className="text-gray-300">Gaji Pokok:</span>
                                        <span className="font-semibold text-white">{formatRp(selectedSlip.base_salary)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-white/5">
                                        <span className="text-gray-300">Tunjangan Jabatan:</span>
                                        <span className="font-semibold text-white">{formatRp(selectedSlip.tunjangan_jabatan)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-white/5">
                                        <span className="text-gray-300">Tunjangan Transportasi:</span>
                                        <span className="font-semibold text-white">{formatRp(selectedSlip.tunjangan_transport)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-white/5">
                                        <span className="text-gray-300">Tunjangan Uang Makan:</span>
                                        <span className="font-semibold text-white">{formatRp(selectedSlip.tunjangan_makan)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-white/5">
                                        <span className="text-gray-300">Upah Lembur (SPKL):</span>
                                        <span className="font-semibold text-white">{formatRp(selectedSlip.overtime_pay)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 pt-3 font-bold text-sm bg-emerald-500/10 px-2 rounded">
                                        <span className="text-emerald-300">Total Penghasilan Bruto:</span>
                                        <span className="text-emerald-300">{formatRp(selectedSlip.gross_pay)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* POTONGAN */}
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider border-b border-red-500/30 pb-1">
                                    B. Potongan (Deductions)
                                </h3>
                                <div className="space-y-1.5 text-xs">
                                    <div className="flex justify-between py-1 border-b border-white/5">
                                        <span className="text-gray-300">BPJS Kesehatan (1% Pekerja):</span>
                                        <span className="font-semibold text-red-400">-{formatRp(selectedSlip.bpjs_kes_employee)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-white/5">
                                        <span className="text-gray-300">BPJS JHT (2% Pekerja):</span>
                                        <span className="font-semibold text-red-400">-{formatRp(selectedSlip.bpjs_jht_employee)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-white/5">
                                        <span className="text-gray-300">BPJS JP (1% Pensiun Pekerja):</span>
                                        <span className="font-semibold text-red-400">-{formatRp(selectedSlip.bpjs_jp_employee)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-white/5">
                                        <span className="text-gray-300">PPh 21 TER ({(Number(selectedSlip.pph21_ter_rate)*100).toFixed(2)}%):</span>
                                        <span className="font-semibold text-amber-400">-{formatRp(selectedSlip.pph21_amount)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-white/5">
                                        <span className="text-gray-300">Potongan Kasbon / Pinjaman:</span>
                                        <span className="font-semibold text-white">-{formatRp(selectedSlip.kasbon_deduction)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 pt-3 font-bold text-sm bg-red-500/10 px-2 rounded">
                                        <span className="text-red-300">Total Potongan:</span>
                                        <span className="text-red-300">-{formatRp(selectedSlip.total_deductions)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Net Pay Grand Summary */}
                        <div className="p-4 bg-gradient-to-r from-emerald-950/60 to-slate-900 border-2 border-emerald-500/40 rounded-xl flex items-center justify-between">
                            <div>
                                <span className="text-xs text-gray-400 uppercase tracking-wider block">Gaji Bersih Diterima (Take Home Pay)</span>
                                <div className="text-xs text-gray-300 mt-0.5">Ditransfer ke: <strong>{selectedSlip.bank_name || 'Bank'} - {selectedSlip.bank_account || '-'}</strong> a/n {selectedSlip.bank_account_holder || selectedSlip.employee_name}</div>
                            </div>
                            <div className="text-2xl font-black text-emerald-400">
                                {formatRp(selectedSlip.net_pay)}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2 border-t border-white/10 no-print">
                            <Button variant="outline" onClick={() => setModalOpen(false)}>Tutup</Button>
                            <Button
                                variant="filled"
                                color="emerald"
                                onClick={() => setPrintSlip(selectedSlip)}
                                leftIcon={<Printer className="h-4 w-4" />}
                            >
                                Cetak Slip Resmi
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Cetak Slip Gaji Resmi */}
            <OfficialDocumentPrintModal
                isOpen={!!printSlip}
                onClose={() => setPrintSlip(null)}
                documentTitle="Slip Gaji"
                documentNumber={printSlip ? `SLIP-${printSlip.employee_nik}-${dayjs(printSlip.end_date).format('YYYYMM')}` : ''}
            >
                {printSlip && (
                    <SalarySlipPrintTemplate
                        letterhead={{
                            companyName: activeCompany?.name || 'PT SJS GROUP INDONESIA',
                            companyAddress: activeCompany?.address || 'Kawasan Industri & Pergudangan Terpadu',
                            taxId: activeCompany?.tax_id || '01.234.567.8-011.000',
                        }}
                        slipNumber={`SLIP-${printSlip.employee_nik}-${dayjs(printSlip.end_date).format('YYYYMM')}`}
                        payrollPeriod={`${dayjs(printSlip.start_date).format('DD MMMM YYYY')} - ${dayjs(printSlip.end_date).format('DD MMMM YYYY')}`}
                        paymentDate={printSlip.payment_date || printSlip.end_date}
                        employee={{
                            name: printSlip.employee_name,
                            nik: printSlip.employee_nik,
                            department: printSlip.department_name || 'Umum',
                            jobTitle: (printSlip as any).job_title || 'Staff',
                            ptkpStatus: `${printSlip.ptkp_status} (Kategori TER ${printSlip.pph21_ter_category})`,
                            bankAccount: `${printSlip.bank_name || 'Bank'} - ${printSlip.bank_account || '-'} a/n ${printSlip.bank_account_holder || printSlip.employee_name}`
                        }}
                        earnings={[
                            { label: 'Gaji Pokok', amount: Number(printSlip.base_salary || 0) },
                            { label: 'Tunjangan Jabatan', amount: Number(printSlip.tunjangan_jabatan || 0) },
                            { label: 'Tunjangan Transportasi', amount: Number(printSlip.tunjangan_transport || 0) },
                            { label: 'Tunjangan Uang Makan', amount: Number(printSlip.tunjangan_makan || 0) },
                            { label: 'Upah Lembur (SPKL)', amount: Number(printSlip.overtime_pay || 0) }
                        ]}
                        deductions={[
                            { label: 'BPJS Kesehatan (1% Pekerja)', amount: Number(printSlip.bpjs_kes_employee || 0) },
                            { label: 'BPJS JHT (2% Pekerja)', amount: Number(printSlip.bpjs_jht_employee || 0) },
                            { label: 'BPJS JP (1% Pekerja)', amount: Number(printSlip.bpjs_jp_employee || 0) },
                            { label: `PPh 21 TER (${(Number(printSlip.pph21_ter_rate || 0) * 100).toFixed(2)}%)`, amount: Number(printSlip.pph21_amount || 0) },
                            { label: 'Potongan Kasbon / Pinjaman', amount: Number(printSlip.kasbon_deduction || 0) }
                        ]}
                        grossPay={Number(printSlip.gross_pay || 0)}
                        totalDeductions={Number(printSlip.total_deductions || 0)}
                        netPay={Number(printSlip.net_pay || 0)}
                        notes="Slip gaji ini bersifat RAHASIA (CONFIDENTIAL) dan diterbitkan secara otomatis oleh HR & Payroll System ERPQu."
                    />
                )}
            </OfficialDocumentPrintModal>

            {/* Modal Kirim Slip Gaji via WhatsApp */}
            {whatsAppSlip && (() => {
                const empName = whatsAppSlip.employee_name || 'Karyawan';
                const period = `${dayjs(whatsAppSlip.start_date).format('DD MMM')} - ${dayjs(whatsAppSlip.end_date).format('DD MMM YYYY')}`;
                const takeHomePay = formatRp(whatsAppSlip.net_pay);
                const grossPay = formatRp(whatsAppSlip.gross_pay);
                const pph21 = formatRp(whatsAppSlip.pph21_amount);

                const defaultMsg = `Halo *${empName}*,\n\nBerikut rincian Slip Gaji resmi Anda untuk periode *${period}*:\n\n` +
                    `👤 NIK: ${whatsAppSlip.employee_nik}\n` +
                    `🏢 Departemen: ${whatsAppSlip.department_name || 'Umum'}\n` +
                    `💰 Gaji Bruto: ${grossPay}\n` +
                    `📉 PPh 21: ${pph21}\n` +
                    `💵 *Take Home Pay (Diterima): ${takeHomePay}*\n\n` +
                    `Slip gaji ini bersifat rahasia (confidential). Hubungi divisi HR / Finance jika ada pertanyaan.\n\n` +
                    `Salam,\nHR & Payroll Team ERPQu`;

                return (
                    <SendWhatsAppModal
                        isOpen={!!whatsAppSlip}
                        onClose={() => setWhatsAppSlip(null)}
                        recipientName={empName}
                        documentType="SALARY_SLIP"
                        documentNumber={`SLIP-${whatsAppSlip.employee_nik}-${dayjs(whatsAppSlip.end_date).format('YYYYMM')}`}
                        defaultMessage={defaultMsg}
                    />
                );
            })()}
        </div>
    );
}
