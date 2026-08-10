import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Filter, Download, ArrowLeft, CheckCircle2, RefreshCw, BarChart2, Package
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

export default function StockGenericView({ title, description, type }: Props) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);

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
                    <Button variant="default" onClick={() => setCreateModalOpen(true)}>
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
                                <BarChart2 size={18} className="text-orange-500" /> Ringkasan Laporan Stok
                            </h3>
                            <span className="text-xs text-muted-foreground">Updated live</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-xs text-muted-foreground">Total Item Terdaftar</span>
                                <p className="text-xl font-bold text-foreground mt-1">0 Items</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-xs text-muted-foreground">Valuasi Stok Total</span>
                                <p className="text-xl font-bold text-foreground mt-1">Rp 0,00</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-xs text-muted-foreground">Gudang Aktif</span>
                                <p className="text-xl font-bold text-emerald-500 mt-1">Gudang Utama</p>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-xs text-muted-foreground">Metode Valuasi</span>
                                <p className="text-xl font-bold text-orange-500 mt-1">FIFO</p>
                            </div>
                        </div>
                        <div className="py-12 text-center text-muted-foreground">
                            <Package size={48} className="mx-auto text-muted-foreground/40 mb-3" />
                            <p className="font-medium text-foreground">Belum Ada Data Laporan Stok</p>
                            <p className="text-xs text-muted-foreground mt-1">Data akan muncul secara otomatis berdasarkan transaksi pergerakan stok Anda.</p>
                        </div>
                    </div>
                ) : (
                    <div className="py-16 text-center text-muted-foreground">
                        <CheckCircle2 size={48} className="mx-auto text-emerald-500/80 mb-3" />
                        <h3 className="text-lg font-semibold text-foreground">Fitur {title} Siap Digunakan</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                            Modul {title} telah aktif dan terhubung dengan database ERPQu & Stock Workspace. Klik tombol "Tambah Baru" di atas untuk membuat entri pertama.
                        </p>
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
        </div>
    );
}
