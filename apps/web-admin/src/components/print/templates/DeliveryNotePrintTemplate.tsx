import React from 'react';
import { OfficialLetterhead, type LetterheadProps } from '../OfficialLetterhead';
import { OfficialDocumentFooter } from '../OfficialDocumentFooter';
import dayjs from 'dayjs';

export interface DeliveryItem {
    itemCode?: string;
    itemName: string;
    quantityShipped: number;
    uom?: string;
    notes?: string;
}

export interface DeliveryNotePrintProps {
    letterhead?: Partial<LetterheadProps>;
    deliveryNumber: string;
    deliveryDate: string;
    salesOrderNumber?: string;
    status?: string;
    shipTo: {
        recipientName: string;
        companyName?: string;
        deliveryAddress: string;
        contactPhone?: string;
    };
    transport: {
        driverName?: string;
        vehiclePlate?: string;
        expeditionName?: string;
    };
    items: DeliveryItem[];
    notes?: string;
}

export const DeliveryNotePrintTemplate: React.FC<DeliveryNotePrintProps> = ({
    letterhead,
    deliveryNumber,
    deliveryDate,
    salesOrderNumber,
    status,
    shipTo,
    transport,
    items,
    notes = 'Barang telah diperiksa dan diterima dalam keadaan baik, cukup dan sesuai dengan pesanan.'
}) => {
    return (
        <div id="official-printable-doc" className="bg-white text-slate-900 p-8 max-w-[210mm] min-h-[297mm] mx-auto shadow-sm text-[11px] font-sans flex flex-col justify-between">
            <div>
                {/* Kop Surat Resmi */}
                <OfficialLetterhead
                    {...letterhead}
                    documentTitle="SURAT JALAN PENGIRIMAN"
                    documentNumber={deliveryNumber}
                    documentDate={deliveryDate ? dayjs(deliveryDate).format('DD MMMM YYYY') : undefined}
                    statusBadge={status || 'TERKIRIM'}
                />

                {/* Alamat Pengiriman & Informasi Armada */}
                <div className="grid grid-cols-2 gap-4 mt-4 py-2 border-b border-slate-200">
                    <div className="space-y-0.5">
                        <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Tujuan Pengiriman (Ship To):</p>
                        <h3 className="font-bold text-slate-900 text-[12px]">{shipTo.recipientName}</h3>
                        {shipTo.companyName && <p className="font-semibold text-slate-700">{shipTo.companyName}</p>}
                        <p className="text-slate-600 leading-tight">{shipTo.deliveryAddress}</p>
                        {shipTo.contactPhone && <p className="text-[10px] text-slate-600 pt-0.5">Kontak: {shipTo.contactPhone}</p>}
                    </div>

                    <div className="space-y-1 text-right">
                        <div className="inline-block text-left space-y-1 border border-slate-200 bg-slate-50/70 rounded p-2 text-[10px]">
                            {salesOrderNumber && (
                                <div className="flex justify-between gap-6">
                                    <span className="text-slate-500">Ref. Sales Order:</span>
                                    <span className="font-bold text-slate-800">{salesOrderNumber}</span>
                                </div>
                            )}
                            <div className="flex justify-between gap-6">
                                <span className="text-slate-500">Driver / Kurir:</span>
                                <span className="font-semibold text-slate-800">{transport.driverName || 'Armada Internal'}</span>
                            </div>
                            <div className="flex justify-between gap-6">
                                <span className="text-slate-500">No. Polisi Kendaraan:</span>
                                <span className="font-bold font-mono text-slate-900">{transport.vehiclePlate || '-'}</span>
                            </div>
                            {transport.expeditionName && (
                                <div className="flex justify-between gap-6">
                                    <span className="text-slate-500">Ekspedisi:</span>
                                    <span className="text-slate-800">{transport.expeditionName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table Barang Dikirim */}
                <div className="mt-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-y-2 border-slate-900 bg-slate-100 text-[10px] font-bold text-slate-800 uppercase">
                                <th className="py-1.5 px-2 w-8 text-center">No</th>
                                <th className="py-1.5 px-2 w-28">Kode Barang</th>
                                <th className="py-1.5 px-2">Nama Barang & Spesifikasi</th>
                                <th className="py-1.5 px-2 text-center w-20">Qty Kirim</th>
                                <th className="py-1.5 px-2 text-center w-16">Satuan</th>
                                <th className="py-1.5 px-2 w-36">Keterangan / Kondisi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-4 text-center text-slate-400">Tidak ada rincian barang</td>
                                </tr>
                            ) : items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="py-2 px-2 text-center text-slate-500">{idx + 1}</td>
                                    <td className="py-2 px-2 font-mono text-slate-700">{item.itemCode || '-'}</td>
                                    <td className="py-2 px-2 font-medium text-slate-900">{item.itemName}</td>
                                    <td className="py-2 px-2 text-center font-bold font-mono text-slate-900">{item.quantityShipped}</td>
                                    <td className="py-2 px-2 text-center text-slate-600">{item.uom || 'Unit'}</td>
                                    <td className="py-2 px-2 text-slate-600 text-[10px]">{item.notes || 'Kondisi Baik'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Surat Jalan (3 Pihak: Gudang, Driver, Penerima) */}
            <OfficialDocumentFooter
                notes={notes}
                signatures={[
                    { title: 'Pengirim (Gudang),', role: 'Staff Logistik' },
                    { title: 'Pengemudi (Kurir),', name: transport.driverName, role: 'Driver' },
                    { title: 'Penerima Barang,', name: shipTo.recipientName, role: 'Tanda Tangan & Cap' }
                ]}
                qrCodeValue={`SURAT_JALAN:${deliveryNumber}|DRIVER:${transport.driverName || '-'}|DATE:${deliveryDate}|ERPQU`}
                qrCodeLabel="Otentikasi Surat Jalan"
            />
        </div>
    );
};
