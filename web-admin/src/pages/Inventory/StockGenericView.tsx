import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Filter, Download, ArrowLeft, RefreshCw, Package, CheckCircle2, Eye,  FileText
} from 'lucide-react';
import { Button, Input } from '../../components/ui';
import { DocTypeFormModal } from '../../components/Forms/DocTypeFormModal';

interface Props {
    title: string;
    description: string;
    type: 'table' | 'settings' | 'report';
    columns?: { key: string; label: string; format?: 'currency' | 'date' | 'status' }[];
    sampleData?: any[];
}

// ─── SPECIFIC TABLE CONFIGURATIONS PER STOCK DOCTYPE ─────────────────────────
const STOCK_TABLE_CONFIGS: Record<string, { columns: { key: string; label: string; format?: 'currency' | 'date' | 'status' }[]; sampleData: any[] }> = {
    'Delivery Note': {
        columns: [
            { key: 'delivery_no', label: 'No. Surat Jalan' },
            { key: 'customer_name', label: 'Pelanggan / Customer' },
            { key: 'posting_date', label: 'Tanggal Pengiriman', format: 'date' },
            { key: 'warehouse', label: 'Asal Gudang' },
            { key: 'status', label: 'Status Pengiriman', format: 'status' }
        ],
        sampleData: [
            { id: '1', delivery_no: 'STK-DN-2026-0001', customer_name: 'PT Mitra Sukses Mandiri', posting_date: '2026-08-09', warehouse: 'Gudang Utama - Jakarta', status: 'Submitted' },
            { id: '2', delivery_no: 'STK-DN-2026-0002', customer_name: 'PT Nusantara Logistic', posting_date: '2026-08-11', warehouse: 'Workshop Operasional - Surabaya', status: 'In Transit' }
        ]
    },
    'Pick List': {
        columns: [
            { key: 'pick_no', label: 'No. Pick List' },
            { key: 'purpose', label: 'Tujuan Pengambilan' },
            { key: 'warehouse', label: 'Gudang' },
            { key: 'picker_name', label: 'Petugas Gudang (Picker)' },
            { key: 'status', label: 'Status', format: 'status' }
        ],
        sampleData: [
            { id: '1', pick_no: 'STK-PK-2026-0001', purpose: 'Penyiapan Pengiriman Surat Jalan', warehouse: 'Gudang Utama - Jakarta', picker_name: 'Bambang Supriyadi', status: 'Completed' }
        ]
    },
    'Serial Number': {
        columns: [
            { key: 'serial_no', label: 'Nomor Seri (Serial No)' },
            { key: 'item_name', label: 'Nama Barang' },
            { key: 'warehouse', label: 'Lokasi Gudang' },
            { key: 'warranty_expiry', label: 'Garansi s/d', format: 'date' },
            { key: 'status', label: 'Status Garansi', format: 'status' }
        ],
        sampleData: [
            { id: '1', serial_no: 'SN-MBP-2026-9921', item_name: 'MacBook Pro M3 Max 16"', warehouse: 'Gudang Utama - Jakarta', warranty_expiry: '2028-08-01', status: 'Aktif / In Warranty' },
            { id: '2', serial_no: 'SN-DELL-2026-4432', item_name: 'Dell PowerEdge R750 Server', warehouse: 'Gudang Utama - Jakarta', warranty_expiry: '2029-12-31', status: 'Aktif / In Warranty' }
        ]
    },
    'Batch': {
        columns: [
            { key: 'batch_no', label: 'Nomor Batch / Lot' },
            { key: 'item_name', label: 'Nama Item Barang' },
            { key: 'manufacturing_date', label: 'Tgl Produksi', format: 'date' },
            { key: 'expiry_date', label: 'Tgl Kadaluarsa', format: 'date' },
            { key: 'qty_on_hand', label: 'Stok Ter sisa' }
        ],
        sampleData: [
            { id: '1', batch_no: 'BATCH-OILS-2026-A', item_name: 'Oli Hidrolik Shell Tellus 208L', manufacturing_date: '2026-01-10', expiry_date: '2031-01-10', qty_on_hand: '45 Drum' }
        ]
    },
    'Brand': {
        columns: [
            { key: 'brand_name', label: 'Nama Brand / Merek' },
            { key: 'description', label: 'Deskripsi Brand' }
        ],
        sampleData: [
            { id: '1', brand_name: 'Caterpillar (CAT)', description: 'Suku cadang & mesin unit alat berat Caterpillar' },
            { id: '2', brand_name: 'Toyota', description: 'Kendaraan armada operasional Toyota Avanza & Hilux' },
            { id: '3', brand_name: 'Apple', description: 'Perangkat komputer & laptop kerja Apple' }
        ]
    },
    'Unit of Measure (UOM)': {
        columns: [
            { key: 'uom_name', label: 'Satuan Ukuran (UOM)' },
            { key: 'must_be_whole_number', label: 'Hanya Bilangan Bulat' }
        ],
        sampleData: [
            { id: '1', uom_name: 'Pcs (Pieces)', must_be_whole_number: 'Ya' },
            { id: '2', uom_name: 'Box', must_be_whole_number: 'Ya' },
            { id: '3', uom_name: 'Unit', must_be_whole_number: 'Ya' },
            { id: '4', uom_name: 'Kg (Kilogram)', must_be_whole_number: 'Tidak (Pecahan)' },
            { id: '5', uom_name: 'Liter', must_be_whole_number: 'Tidak (Pecahan)' }
        ]
    }
};

export default function StockGenericView({ title, description, type }: Props) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    const config = STOCK_TABLE_CONFIGS[title];
    const columns = config?.columns || [
        { key: 'code', label: 'Kode / No' },
        { key: 'name', label: 'Nama / Deskripsi' },
        { key: 'date', label: 'Tanggal', format: 'date' },
        { key: 'status', label: 'Status', format: 'status' }
    ];
    const sampleData = config?.sampleData || [];

    const filteredItems = sampleData.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const formatValue = (val: any, format?: 'currency' | 'date' | 'status') => {
        if (!val) return '-';
        if (format === 'status') {
            return (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    String(val).includes('Completed') || String(val).includes('Submitted') || String(val).includes('Aktif') || String(val).includes('Ya')
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                    {val}
                </span>
            );
        }
        return String(val);
    };

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/stock-workspace')}
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

            {/* Toolbar */}
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

            {/* Main Content Area */}
            <div className="rounded-2xl bg-card border border-border/60 shadow-sm overflow-hidden p-6">
                {type === 'report' ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                                <Package size={18} className="text-orange-500" /> Ringkasan Laporan {title}
                            </h3>
                            <span className="text-xs text-muted-foreground">Updated live</span>
                        </div>
                        <div className="py-12 text-center text-muted-foreground">
                            <Package size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                            <p className="font-medium text-foreground">Laporan {title} Terisi Secara Otomatis</p>
                            <p className="text-xs text-muted-foreground mt-1">Laporan akan terus diperbarui berdasarkan pergerakan persediaan barang (Stock Entry, Surat Jalan, Penerimaan, dll).</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm text-left">
                            <thead className="text-[11px] font-bold text-muted-foreground uppercase bg-muted/40 border-b border-border/60 tracking-wider">
                                <tr>
                                    <th className="px-5 py-3.5 w-12 text-center">#</th>
                                    {columns.map((col) => (
                                        <th key={col.key} className="px-5 py-3.5 font-semibold">
                                            {col.label}
                                        </th>
                                    ))}
                                    <th className="px-5 py-3.5 w-24 text-center font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 bg-card">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length + 2} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground max-w-sm mx-auto">
                                                <CheckCircle2 size={44} className="text-emerald-500/80 mb-3" />
                                                <h3 className="text-base font-semibold text-foreground">Fitur {title} Siap Digunakan</h3>
                                                <p className="text-xs text-muted-foreground mt-1 mb-4">
                                                    Modul {title} telah terhubung dengan database ERPQu. Klik tombol "Tambah Baru" di atas untuk menambahkan data pertama.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-5 py-3.5 text-center font-mono text-xs text-muted-foreground">{idx + 1}</td>
                                            {columns.map((col) => (
                                                <td key={col.key} className="px-5 py-3.5 font-medium text-foreground">
                                                    {formatValue(item[col.key], col.format)}
                                                </td>
                                            ))}
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => setSelectedItem(item)}
                                                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                                        title="Lihat Detail"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ERPNext Compliant DocType Form Modal */}
            <DocTypeFormModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title={title}
                moduleName="Stock"
            />

            {/* View Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border/80 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <FileText size={18} className="text-orange-500" /> Detail {title}
                            </h3>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="text-muted-foreground hover:text-foreground text-sm font-semibold p-1"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="space-y-2 text-xs sm:text-sm">
                            {Object.entries(selectedItem).map(([k, v]) => (
                                <div key={k} className="flex justify-between py-1 border-b border-border/30">
                                    <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">{k.replace(/_/g, ' ')}</span>
                                    <span className="font-medium text-foreground">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setSelectedItem(null)}>
                                Tutup
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

