import React from 'react';
import { OfficialLetterhead, type LetterheadProps } from '../OfficialLetterhead';
import { OfficialDocumentFooter } from '../OfficialDocumentFooter';
import { terbilang } from '../../../utils/terbilang';
import dayjs from 'dayjs';

export interface POItem {
    itemCode?: string;
    description: string;
    quantity: number;
    uom?: string;
    unitPrice: number;
    amount: number;
    requiredDate?: string;
}

export interface PurchaseOrderPrintProps {
    letterhead?: Partial<LetterheadProps>;
    poNumber: string;
    poDate: string;
    deliveryDate?: string;
    paymentTerms?: string;
    status?: string;
    supplier: {
        name: string;
        address?: string;
        phone?: string;
        email?: string;
        taxId?: string;
    };
    items: POItem[];
    subtotal: number;
    taxAmount?: number;
    totalAmount: number;
    notes?: string;
}

export const PurchaseOrderPrintTemplate: React.FC<PurchaseOrderPrintProps> = ({
    letterhead,
    poNumber,
    poDate,
    deliveryDate,
    paymentTerms = 'Net 30 Hari',
    status,
    supplier,
    items,
    subtotal,
    taxAmount = 0,
    totalAmount,
    notes = 'Mohon melampirkan salinan Purchase Order ini beserta Surat Jalan saat pengiriman barang.'
}) => {
    const terbilangStr = terbilang(totalAmount);

    return (
        <div id="official-printable-doc" className="bg-white text-slate-900 p-8 max-w-[210mm] min-h-[297mm] mx-auto shadow-sm text-[11px] font-sans flex flex-col justify-between">
            <div>
                {/* Kop Surat Resmi */}
                <OfficialLetterhead
                    {...letterhead}
                    documentTitle="SURAT PESANAN (PURCHASE ORDER)"
                    documentNumber={poNumber}
                    documentDate={poDate ? dayjs(poDate).format('DD MMMM YYYY') : undefined}
                    statusBadge={status || 'DISETUJUI'}
                />

                {/* Vendor/Supplier & Ketentuan Order */}
                <div className="grid grid-cols-2 gap-4 mt-4 py-2 border-b border-slate-200">
                    <div className="space-y-0.5">
                        <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Dipesan Kepada (Vendor / Supplier):</p>
                        <h3 className="font-bold text-slate-900 text-[12px]">{supplier.name}</h3>
                        {supplier.address && <p className="text-slate-600 leading-tight">{supplier.address}</p>}
                        <div className="flex gap-4 text-[10px] text-slate-600 pt-0.5">
                            {supplier.phone && <span>Telp: {supplier.phone}</span>}
                            {supplier.email && <span>Email: {supplier.email}</span>}
                        </div>
                        {supplier.taxId && <p className="text-[10px] text-slate-600">NPWP: {supplier.taxId}</p>}
                    </div>

                    <div className="space-y-1 text-right">
                        <div className="inline-block text-left space-y-1 border border-slate-200 bg-slate-50/70 rounded p-2 text-[10px]">
                            <div className="flex justify-between gap-6">
                                <span className="text-slate-500">Tanggal PO:</span>
                                <span className="font-bold text-slate-800">{poDate ? dayjs(poDate).format('DD/MM/YYYY') : '-'}</span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-slate-500">Target Kirim:</span>
                                <span className="font-bold text-slate-800">{deliveryDate ? dayjs(deliveryDate).format('DD/MM/YYYY') : '-'}</span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-slate-500">Term Pembayaran:</span>
                                <span className="font-semibold text-slate-900">{paymentTerms}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Barang PO */}
                <div className="mt-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-y-2 border-slate-900 bg-slate-100 text-[10px] font-bold text-slate-800 uppercase">
                                <th className="py-1.5 px-2 w-8 text-center">No</th>
                                <th className="py-1.5 px-2 w-24">Kode</th>
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
                                    <td colSpan={7} className="py-4 text-center text-slate-400">Tidak ada item PO</td>
                                </tr>
                            ) : items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-2 text-center text-slate-500">{idx + 1}</td>
                                    <td className="py-2 px-2 font-mono text-slate-600">{item.itemCode || '-'}</td>
                                    <td className="py-2 px-2 font-medium text-slate-900">{item.description}</td>
                                    <td className="py-2 px-2 text-center font-bold font-mono">{item.quantity}</td>
                                    <td className="py-2 px-2 text-center text-slate-600">{item.uom || 'Unit'}</td>
                                    <td className="py-2 px-2 text-right font-mono">{Number(item.unitPrice || 0).toLocaleString('id-ID')}</td>
                                    <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">{Number(item.amount).toLocaleString('id-ID')}</td>
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
                        {taxAmount > 0 && (
                            <div className="flex justify-between text-slate-600">
                                <span>Pajak PPN:</span>
                                <span className="font-mono font-medium">Rp {Number(taxAmount).toLocaleString('id-ID')}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-slate-900 pt-1 text-[12px] font-black text-slate-900">
                            <span>TOTAL PESANAN:</span>
                            <span className="font-mono">Rp {Number(totalAmount || 0).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer PO */}
            <OfficialDocumentFooter
                terbilangText={terbilangStr}
                notes={notes}
                signatures={[
                    { title: 'Dipesan Oleh,', role: 'Staff Pengadaan (Buyer)' },
                    { title: 'Disetujui Oleh,', role: 'Head of Procurement' },
                    { title: 'Konfirmasi Supplier,', name: supplier.name, role: 'Tanda Tangan & Cap' }
                ]}
                qrCodeValue={`PO:${poNumber}|SUPPLIER:${supplier.name}|TOTAL:${totalAmount}|ERPQU`}
                qrCodeLabel="Otorisasi PO"
            />
        </div>
    );
};
