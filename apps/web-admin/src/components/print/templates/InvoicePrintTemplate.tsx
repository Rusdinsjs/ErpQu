import React from 'react';
import { OfficialLetterhead, type LetterheadProps } from '../OfficialLetterhead';
import { OfficialDocumentFooter } from '../OfficialDocumentFooter';
import { terbilang } from '../../../utils/terbilang';
import dayjs from 'dayjs';

export interface InvoiceItem {
    description: string;
    quantity: number;
    uom?: string;
    unitPrice: number;
    amount: number;
}

export interface InvoicePrintProps {
    letterhead?: Partial<LetterheadProps>;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    status?: string;
    client: {
        name: string;
        address?: string;
        phone?: string;
        taxId?: string;
    };
    items: InvoiceItem[];
    subtotal: number;
    discount?: number;
    taxAmount?: number;
    taxRate?: number;
    totalAmount: number;
    paidAmount?: number;
    bankInfo?: {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    };
    notes?: string;
}

export const InvoicePrintTemplate: React.FC<InvoicePrintProps> = ({
    letterhead,
    invoiceNumber,
    invoiceDate,
    dueDate,
    status,
    client,
    items,
    subtotal,
    discount = 0,
    taxAmount = 0,
    taxRate = 11,
    totalAmount,
    paidAmount = 0,
    bankInfo = {
        bankName: 'Bank Central Asia (BCA)',
        accountNumber: '883-0912-888',
        accountHolder: 'PT SJS GROUP INDONESIA'
    },
    notes = 'Pembayaran mohon ditransfer sebelum tanggal jatuh tempo. Cantumkan nomor invoice pada berita transfer.'
}) => {
    const sisaTagihan = Math.max(0, totalAmount - paidAmount);
    const terbilangStr = terbilang(totalAmount);

    return (
        <div id="official-printable-doc" className="bg-white text-slate-900 p-8 max-w-[210mm] min-h-[297mm] mx-auto shadow-sm text-[11px] font-sans flex flex-col justify-between">
            <div>
                {/* Kop Surat Resmi */}
                <OfficialLetterhead
                    {...letterhead}
                    documentTitle="FAKTUR PENJUALAN"
                    documentNumber={invoiceNumber}
                    documentDate={invoiceDate ? dayjs(invoiceDate).format('DD MMMM YYYY') : undefined}
                    statusBadge={status}
                />

                {/* Info Pembeli & Jatuh Tempo */}
                <div className="grid grid-cols-2 gap-4 mt-4 py-2 border-b border-slate-200">
                    <div className="space-y-0.5">
                        <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Kepada Yth. (Pelanggan):</p>
                        <h3 className="font-bold text-slate-900 text-[12px]">{client.name}</h3>
                        {client.address && <p className="text-slate-600 leading-tight">{client.address}</p>}
                        <div className="flex gap-4 text-[10px] text-slate-600 pt-0.5">
                            {client.phone && <span>Telp: {client.phone}</span>}
                            {client.taxId && <span>NPWP: {client.taxId}</span>}
                        </div>
                    </div>

                    <div className="text-right space-y-1">
                        <div className="inline-block text-left space-y-1 border border-slate-200 bg-slate-50/70 rounded p-2 text-[10px]">
                            <div className="flex justify-between gap-6">
                                <span className="text-slate-500">Tgl Faktur:</span>
                                <span className="font-bold text-slate-800">{invoiceDate ? dayjs(invoiceDate).format('DD/MM/YYYY') : '-'}</span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-slate-500">Jatuh Tempo:</span>
                                <span className="font-bold text-red-600">{dueDate ? dayjs(dueDate).format('DD/MM/YYYY') : '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Line Items */}
                <div className="mt-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-y-2 border-slate-900 bg-slate-100 text-[10px] font-bold text-slate-800 uppercase">
                                <th className="py-1.5 px-2 w-8 text-center">No</th>
                                <th className="py-1.5 px-2">Deskripsi Barang / Jasa</th>
                                <th className="py-1.5 px-2 text-center w-14">Qty</th>
                                <th className="py-1.5 px-2 text-center w-14">Satuan</th>
                                <th className="py-1.5 px-2 text-right w-28">Harga (Rp)</th>
                                <th className="py-1.5 px-2 text-right w-32">Total (Rp)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-4 text-center text-slate-400">Tidak ada item rincian faktur</td>
                                </tr>
                            ) : items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-2 text-center text-slate-500">{idx + 1}</td>
                                    <td className="py-2 px-2 font-medium text-slate-900">{item.description}</td>
                                    <td className="py-2 px-2 text-center font-mono">{item.quantity}</td>
                                    <td className="py-2 px-2 text-center text-slate-600">{item.uom || 'Unit'}</td>
                                    <td className="py-2 px-2 text-right font-mono">{Number(item.unitPrice || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">{Number(item.amount || (item.quantity * item.unitPrice)).toLocaleString('id-ID')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Calculation Summary */}
                <div className="mt-3 flex justify-end">
                    <div className="w-72 space-y-1 text-[11px] border-t border-slate-900 pt-2">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal:</span>
                            <span className="font-mono font-medium">Rp {Number(subtotal || 0).toLocaleString('id-ID')}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-slate-600">
                                <span>Potongan Diskon:</span>
                                <span className="font-mono text-red-600">- Rp {Number(discount).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        {taxAmount > 0 && (
                            <div className="flex justify-between text-slate-600">
                                <span>PPN ({taxRate}%):</span>
                                <span className="font-mono font-medium">Rp {Number(taxAmount).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-slate-900 pt-1 text-[12px] font-black text-slate-900">
                            <span>TOTAL FAKTUR:</span>
                            <span className="font-mono">Rp {Number(totalAmount || 0).toLocaleString('id-ID')}</span>
                        </div>
                        {paidAmount > 0 && (
                            <>
                                <div className="flex justify-between text-emerald-700 pt-0.5">
                                    <span>Telah Dibayar:</span>
                                    <span className="font-mono">Rp {Number(paidAmount).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between border-t border-dashed border-slate-300 pt-0.5 font-bold text-slate-800">
                                    <span>Sisa Tagihan:</span>
                                    <span className="font-mono text-red-600">Rp {Number(sisaTagihan).toLocaleString('id-ID')}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Resmi */}
            <OfficialDocumentFooter
                terbilangText={terbilangStr}
                bankInfo={bankInfo}
                notes={notes}
                signatures={[
                    { title: 'Dibuat Oleh,', role: 'Staff Billing / Finance' },
                    { title: 'Disetujui Oleh,', role: 'Finance Manager' },
                    { title: 'Diterima Oleh,', name: client.name, role: 'Pelanggan' }
                ]}
                qrCodeValue={`INVOICE:${invoiceNumber}|TOTAL:${totalAmount}|DATE:${invoiceDate}|ERPQU`}
                qrCodeLabel="Otentikasi Faktur"
            />
        </div>
    );
};
