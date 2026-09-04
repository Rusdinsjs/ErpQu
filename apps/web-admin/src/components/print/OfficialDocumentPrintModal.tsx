import React, { useRef, useState } from 'react';
import { Modal, Button, useToast } from '../ui';
import { Printer, Download, X, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import './printStyles.css';

export interface OfficialDocumentPrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentTitle: string;
    documentNumber: string;
    children: React.ReactNode;
}

export const OfficialDocumentPrintModal: React.FC<OfficialDocumentPrintModalProps> = ({
    isOpen,
    onClose,
    documentTitle,
    documentNumber,
    children
}) => {
    const printAreaRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const { success, error: toastError } = useToast();

    if (!isOpen) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        const targetElement = document.getElementById('official-printable-doc') || printAreaRef.current;
        if (!targetElement) return;

        setIsDownloading(true);
        try {
            const dataUrl = await toPng(targetElement, {
                quality: 0.98,
                pixelRatio: 2,
                backgroundColor: '#ffffff',
                cacheBust: true,
            });

            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            const safeFilename = `${documentTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${documentNumber}.pdf`;
            pdf.save(safeFilename);
            success('Dokumen PDF berhasil diunduh.', 'Download Selesai');
        } catch (err: any) {
            console.error('Failed to download PDF:', err);
            toastError('Gagal mengunduh dokumen PDF. Silakan gunakan tombol Cetak untuk menyimpan sebagai PDF.', 'Download Gagal');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="flex flex-col h-[90vh] -m-6 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden">
                {/* Top Action Toolbar */}
                <div className="px-6 py-4 bg-card border-b border-border flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-foreground">{documentTitle}</h2>
                            <p className="text-xs text-muted-foreground font-mono">No: {documentNumber}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="primary"
                            onClick={handlePrint}
                            className="rounded-xl flex items-center gap-1.5 text-xs font-semibold px-3 py-2 shadow-sm"
                        >
                            <Printer size={15} /> Cetak (Print)
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className="rounded-xl flex items-center gap-1.5 text-xs font-semibold px-3 py-2 bg-background hover:bg-muted"
                        >
                            {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                            {isDownloading ? 'Memproses...' : 'Unduh PDF'}
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Printable Document Scroll Area */}
                <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-200 dark:bg-slate-950">
                    <div ref={printAreaRef} className="shadow-2xl rounded-sm overflow-hidden bg-white">
                        {children}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
