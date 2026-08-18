import React, { useState } from 'react';
import { Button } from '../../components/ui';
import { UploadCloud, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SupplierInvoiceImportView() {
    const [fileName, setFileName] = useState<string | null>(null);

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileName) return toast.error('Silakan pilih file Excel / CSV faktur supplier terlebih dahulu.');
        toast.success(`File ${fileName} berhasil diunggah & diproses ke draft Purchase Invoice.`);
    };

    return (
        <div className="p-8 space-y-6 max-w-4xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <FileSpreadsheet className="text-blue-500" size={32} />
                        Impor Massal Faktur Supplier (Import Supplier Invoice)
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Pengunggah berkas Excel / CSV untuk membuat secara massal dokumen Purchase Invoice dan tagihan supplier.
                    </p>
                </div>
            </div>

            <form onSubmit={handleUpload} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-blue-500/50 transition-colors bg-muted/20">
                    <UploadCloud size={48} className="mx-auto text-blue-500 mb-3" />
                    <p className="font-bold text-foreground text-sm">Pilih berkas CSV atau XLSX Faktur Supplier</p>
                    <p className="text-xs text-muted-foreground mt-1">Format kolom: No Invoice, Supplier Code, Invoice Date, Total Amount, Items</p>
                    <input
                        type="file"
                        accept=".csv, .xlsx"
                        onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
                        className="hidden"
                        id="invoice-upload"
                    />
                    <label htmlFor="invoice-upload" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-accent text-foreground text-xs font-bold rounded-xl cursor-pointer border border-border">
                        Pilih Berkas Komputer
                    </label>
                    {fileName && <p className="mt-3 text-xs font-bold text-emerald-600">Berkas Terpilih: {fileName}</p>}
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold gap-2 px-6 rounded-xl">
                        Proses Impor Faktur Supplier
                    </Button>
                </div>
            </form>
        </div>
    );
}
