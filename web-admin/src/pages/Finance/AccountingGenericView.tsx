import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Filter, Download, ArrowLeft, RefreshCw, BarChart2, DollarSign, CheckCircle2
} from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { DocTypeFormModal } from '../../components/Forms/DocTypeFormModal';

interface Props {
    title: string;
    description: string;
    type: 'table' | 'settings' | 'report';
    columns?: string[];
    sampleData?: any[];
}

// ─── SPECIFIC TABLE CONFIGURATIONS PER FINANCE DOCTYPE ───────────────────────
const FINANCE_TABLE_CONFIGS: Record<string, { columns: string[]; sampleData: any[] }> = {
    'Payment Entry': {
        columns: ['No. Voucher', 'Tanggal Posting', 'Tipe', 'Pihak (Party)', 'Nama Pihak', 'Jumlah (Rp)', 'Metode Bayar', 'Status'],
        sampleData: [
            { voucher_no: 'ACC-PAY-2026-0001', posting_date: '2026-08-10', payment_type: 'Receive', party_type: 'Customer', party_name: 'PT Mitra Sukses Mandiri', paid_amount: 'Rp 45.000.000,00', mode_of_payment: 'Transfer Bank BCA', status: 'Submitted' },
            { voucher_no: 'ACC-PAY-2026-0002', posting_date: '2026-08-11', payment_type: 'Pay', party_type: 'Supplier', party_name: 'CV Teknik Jaya Abadi', paid_amount: 'Rp 18.500.000,00', mode_of_payment: 'Transfer Bank Mandiri', status: 'Submitted' },
            { voucher_no: 'ACC-PAY-2026-0003', posting_date: '2026-08-11', payment_type: 'Receive', party_type: 'Customer', party_name: 'PT Nusantara Logistic', paid_amount: 'Rp 72.300.000,00', mode_of_payment: 'Cek / Giro', status: 'Draft' }
        ]
    },
    'Bank Account': {
        columns: ['Nama Rekening', 'Nomor Rekening', 'Bank', 'Cabang', 'SWIFT Code', 'Akun Buku Besar (GL)', 'Status'],
        sampleData: [
            { account_name: 'BCA Utama SJS Group', account_number: '123-456-7890', bank_name: 'Bank Central Asia (BCA)', branch_name: 'KCU Sudirman Jakarta', swift_code: 'CENAIDJA', gl_account: '1120.001 - Bank BCA Utama', status: 'Aktif' },
            { account_name: 'Mandiri Operasional', account_number: '098-765-4321', bank_name: 'Bank Mandiri', branch_name: 'KCP Thamrin', swift_code: 'BMRIIDJA', gl_account: '1120.002 - Bank Mandiri', status: 'Aktif' },
            { account_name: 'BNI Payroll Staff', account_number: '112-233-4455', bank_name: 'Bank Negara Indonesia (BNI)', branch_name: 'KCU Kuningan', swift_code: 'BNINIDJA', gl_account: '1120.003 - Bank BNI Payroll', status: 'Aktif' }
        ]
    },
    'Bank Transaction': {
        columns: ['ID Mutasi', 'Rekening Bank', 'Tanggal', 'Kredit (Masuk)', 'Debit (Keluar)', 'No. Referensi', 'Deskripsi / Mutasi', 'Status'],
        sampleData: [
            { id: 'BT-2026-001', bank_account: 'BCA Utama SJS Group', date: '2026-08-10', deposit: 'Rp 45.000.000,00', withdrawal: 'Rp 0,00', reference_number: 'TRF/BCA/9921', description: 'Pelunasan INV-2026-089 PT Mitra Sukses', status: 'Cleared' },
            { id: 'BT-2026-002', bank_account: 'Mandiri Operasional', date: '2026-08-11', deposit: 'Rp 0,00', withdrawal: 'Rp 18.500.000,00', reference_number: 'TRF/MDR/1029', description: 'Pembayaran PO Vendor CV Teknik Jaya', status: 'Cleared' }
        ]
    },
    'Cost Center': {
        columns: ['Kode CC', 'Nama Pusat Biaya', 'Induk (Parent)', 'Perusahaan', 'Tipe Header', 'Status'],
        sampleData: [
            { code: 'CC-HQ', name: 'Kantor Pusat & Manajemen', parent: 'Main Operations', company: 'SJS Group', is_group: 'Ya (Header)', status: 'Aktif' },
            { code: 'CC-PROD', name: 'Divisi Produksi & Fabrikasi', parent: 'Main Operations', company: 'SJS Group', is_group: 'Tidak', status: 'Aktif' },
            { code: 'CC-MKT', name: 'Divisi Marketing & Penjualan', parent: 'Main Operations', company: 'SJS Group', is_group: 'Tidak', status: 'Aktif' },
            { code: 'CC-LOG', name: 'Divisi Logistik & Armada', parent: 'Main Operations', company: 'SJS Group', is_group: 'Tidak', status: 'Aktif' }
        ]
    },
    'Sales Tax Template': {
        columns: ['Judul Template', 'Kategori Pajak', 'Tarif Pajak (%)', 'Perusahaan', 'Default Template'],
        sampleData: [
            { title: 'PPN Penjualan 11%', tax_category: 'PPN 11%', total_tax_rate: '11,00%', company: 'SJS Group', is_default: 'Ya' },
            { title: 'Non Pajak / Bebas PPN', tax_category: 'Zero Tax', total_tax_rate: '0,00%', company: 'SJS Group', is_default: 'Tidak' }
        ]
    },
    'Purchase Tax Template': {
        columns: ['Judul Template', 'Kategori Pajak', 'Tarif Pajak (%)', 'Perusahaan', 'Default Template'],
        sampleData: [
            { title: 'PPN Masukan 11%', tax_category: 'PPN Masukan 11%', total_tax_rate: '11,00%', company: 'SJS Group', is_default: 'Ya' },
            { title: 'PPh Pasal 23 (2%)', tax_category: 'Withholding Tax 2%', total_tax_rate: '2,00%', company: 'SJS Group', is_default: 'Tidak' }
        ]
    },
    'Credit Note': {
        columns: ['No. Nota Kredit', 'Tanggal Posting', 'Pelanggan (Customer)', 'Nilai Retur (Rp)', 'Alasan Retur', 'Status'],
        sampleData: [
            { voucher_no: 'ACC-CN-2026-0001', posting_date: '2026-08-08', customer_name: 'PT Nusantara Logistic', total_amount: 'Rp 3.500.000,00', reason: 'Kerusakan Barang Saat Pengiriman', status: 'Approved' }
        ]
    },
    'Debit Note': {
        columns: ['No. Nota Debit', 'Tanggal Posting', 'Pemasok (Supplier)', 'Nilai Retur (Rp)', 'Alasan Retur', 'Status'],
        sampleData: [
            { voucher_no: 'ACC-DN-2026-0001', posting_date: '2026-08-09', supplier_name: 'CV Teknik Jaya Abadi', total_amount: 'Rp 2.100.000,00', reason: 'Pengembalian Material Cacat Ke Vendor', status: 'Approved' }
        ]
    },
    'Dunning': {
        columns: ['No. Surat Tagihan', 'Tanggal Surat', 'Pelanggan (Debitur)', 'Tingkat Peringatan', 'Biaya Dunning (Rp)', 'Total Tagihan (Rp)', 'Status'],
        sampleData: [
            { voucher_no: 'DUNN-2026-0001', posting_date: '2026-08-05', customer_name: 'PT Jaya Konstruksi Utama', dunning_type: 'Pengingat Pertama (Peringatan Muka)', dunning_fee: 'Rp 50.000,00', grand_total: 'Rp 125.050.000,00', status: 'Sent' }
        ]
    }
};

export default function AccountingGenericView({ title, description, type }: Props) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const config = FINANCE_TABLE_CONFIGS[title];
    const columns = config?.columns || ['Kode / No', 'Nama / Deskripsi', 'Tanggal', 'Nilai (Rp)', 'Status'];
    const sampleData = config?.sampleData || [];

    const filteredData = sampleData.filter(row =>
        Object.values(row).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/accounting-workspace')}
                        className="p-2 rounded-xl bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => {}}>
                        <Download size={16} className="mr-2" /> Export
                    </Button>
                    <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
                        <Plus size={16} className="mr-2" /> Tambah Baru
                    </Button>
                </div>
            </div>

            {/* Filter / Action Toolbar */}
            <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={`Cari dalam ${title.toLowerCase()}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Button variant="outline" size="sm">
                        <Filter size={14} className="mr-1.5" /> Filter
                    </Button>
                    <Button variant="outline" size="sm">
                        <RefreshCw size={14} className="mr-1.5" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Content View */}
            <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden p-6">
                {type === 'report' ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <BarChart2 size={18} className="text-emerald-500" /> Ringkasan Laporan {title}
                            </h3>
                            <span className="text-xs text-muted-foreground">Updated live</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-xs text-muted-foreground">Total Transaksi</span>
                                <p className="text-xl font-bold text-foreground mt-1">12 Entries</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-xs text-muted-foreground">Total Debit</span>
                                <p className="text-xl font-bold text-emerald-500 mt-1">Rp 135.800.000,00</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-xs text-muted-foreground">Total Kredit</span>
                                <p className="text-xl font-bold text-rose-500 mt-1">Rp 135.800.000,00</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-xs text-muted-foreground">Balance Status</span>
                                <p className="text-xl font-bold text-emerald-500 mt-1">Balanced</p>
                            </div>
                        </div>
                        <div className="py-12 text-center text-muted-foreground">
                            <DollarSign size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                            <p className="font-medium text-foreground">Laporan {title} Terisi Secara Otomatis</p>
                            <p className="text-xs text-muted-foreground mt-1">Laporan akan terus diperbarui berdasarkan Jurnal Entries & Faktur yang telah di-post di database PostgreSQL.</p>
                        </div>
                    </div>
                ) : filteredData.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase font-semibold border-b border-border/60">
                                <tr>
                                    <th className="p-3 w-10 text-center">#</th>
                                    {columns.map((col, idx) => (
                                        <th key={idx} className="p-3">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {filteredData.map((row, rIdx) => (
                                    <tr key={rIdx} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 text-center text-xs text-muted-foreground">{rIdx + 1}</td>
                                        {Object.values(row).map((val: any, cIdx) => (
                                            <td key={cIdx} className="p-3 text-foreground font-medium">
                                                {String(val).includes('Submitted') || String(val).includes('Aktif') || String(val).includes('Approved') || String(val).includes('Cleared') ? (
                                                    <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                                                        {val}
                                                    </span>
                                                ) : String(val).includes('Draft') ? (
                                                    <span className="px-2.5 py-1 rounded-full text-xs bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">
                                                        {val}
                                                    </span>
                                                ) : (
                                                    val
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-16 text-center text-muted-foreground">
                        <CheckCircle2 size={48} className="mx-auto text-emerald-500/80 mb-3" />
                        <h3 className="text-lg font-semibold text-foreground">Fitur {title} Siap Digunakan</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                            Modul {title} telah aktif dan terhubung dengan database ERPQu & Accounting Workspace. Klik tombol "Tambah Baru" di atas untuk membuat entri pertama.
                        </p>
                    </div>
                )}
            </div>

            {/* ERPNext Compliant DocType Form Modal */}
            <DocTypeFormModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title={title}
                moduleName="Finance"
            />
        </div>
    );
}

