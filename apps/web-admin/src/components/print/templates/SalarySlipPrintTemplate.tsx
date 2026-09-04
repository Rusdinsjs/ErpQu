import React from 'react';
import { OfficialLetterhead, type LetterheadProps } from '../OfficialLetterhead';
import { OfficialDocumentFooter } from '../OfficialDocumentFooter';
import { terbilang } from '../../../utils/terbilang';
import dayjs from 'dayjs';

export interface SalarySlipPrintProps {
    letterhead?: Partial<LetterheadProps>;
    slipNumber?: string;
    payrollPeriod: string; // e.g. "Agustus 2026"
    paymentDate?: string;
    employee: {
        name: string;
        nik: string;
        department?: string;
        jobTitle?: string;
        ptkpStatus?: string;
        bankAccount?: string;
    };
    earnings: Array<{ label: string; amount: number }>;
    deductions: Array<{ label: string; amount: number }>;
    grossPay: number;
    totalDeductions: number;
    netPay: number;
    notes?: string;
}

export const SalarySlipPrintTemplate: React.FC<SalarySlipPrintProps> = ({
    letterhead,
    slipNumber,
    payrollPeriod,
    paymentDate,
    employee,
    earnings,
    deductions,
    grossPay,
    totalDeductions,
    netPay,
    notes = 'Slip gaji ini bersifat rahasia (CONFIDENTIAL). Diterbitkan otomatis oleh Departemen HRD ERPQu.'
}) => {
    const terbilangNet = terbilang(netPay);
    const slipId = slipNumber || `SLIP-${employee.nik}-${dayjs().format('YYYYMM')}`;

    return (
        <div id="official-printable-doc" className="bg-white text-slate-900 p-8 max-w-[210mm] min-h-[297mm] mx-auto shadow-sm text-[11px] font-sans flex flex-col justify-between">
            <div>
                {/* Kop Surat Resmi */}
                <OfficialLetterhead
                    {...letterhead}
                    documentTitle="SLIP GAJI KARYAWAN"
                    documentNumber={slipId}
                    documentDate={paymentDate ? dayjs(paymentDate).format('DD MMMM YYYY') : dayjs().format('DD MMMM YYYY')}
                    statusBadge="CONFIDENTIAL"
                />

                {/* Info Karyawan */}
                <div className="grid grid-cols-2 gap-4 mt-4 py-2.5 px-3 bg-slate-50 border border-slate-200 rounded">
                    <div className="space-y-1">
                        <div className="flex">
                            <span className="w-24 text-slate-500 font-medium">Nama:</span>
                            <span className="font-bold text-slate-900 uppercase">{employee.name}</span>
                        </div>
                        <div className="flex">
                            <span className="w-24 text-slate-500 font-medium">NIK:</span>
                            <span className="font-mono text-slate-800">{employee.nik}</span>
                        </div>
                        <div className="flex">
                            <span className="w-24 text-slate-500 font-medium">Departemen:</span>
                            <span className="text-slate-800">{employee.department || 'Operasional'}</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex">
                            <span className="w-28 text-slate-500 font-medium">Periode Gaji:</span>
                            <span className="font-bold text-slate-900">{payrollPeriod}</span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-500 font-medium">Jabatan:</span>
                            <span className="text-slate-800">{employee.jobTitle || 'Staf'}</span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-500 font-medium">Status PTKP:</span>
                            <span className="text-slate-800">{employee.ptkpStatus || 'TK/0'}</span>
                        </div>
                    </div>
                </div>

                {/* Rincian 2 Sisi: Penghasilan vs Potongan */}
                <div className="grid grid-cols-2 gap-6 mt-4">
                    {/* Penerimaan / Earnings */}
                    <div className="border border-slate-300 rounded overflow-hidden">
                        <div className="bg-slate-100 py-1.5 px-3 border-b border-slate-300 font-bold text-[11px] text-slate-800 uppercase tracking-wide">
                            PENGHASILAN (EARNINGS)
                        </div>
                        <div className="p-3 space-y-2">
                            {earnings.map((e, idx) => (
                                <div key={idx} className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                                    <span className="text-slate-700">{e.label}</span>
                                    <span className="font-mono font-medium">Rp {Number(e.amount || 0).toLocaleString('id-ID')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-50 py-1.5 px-3 border-t border-slate-300 flex justify-between font-bold text-slate-900">
                            <span>TOTAL PENGHASILAN BRUTO:</span>
                            <span className="font-mono">Rp {Number(grossPay || 0).toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    {/* Potongan / Deductions */}
                    <div className="border border-slate-300 rounded overflow-hidden">
                        <div className="bg-slate-100 py-1.5 px-3 border-b border-slate-300 font-bold text-[11px] text-slate-800 uppercase tracking-wide">
                            POTONGAN (DEDUCTIONS)
                        </div>
                        <div className="p-3 space-y-2">
                            {deductions.map((d, idx) => (
                                <div key={idx} className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                                    <span className="text-slate-700">{d.label}</span>
                                    <span className="font-mono text-red-600 font-medium">- Rp {Number(d.amount || 0).toLocaleString('id-ID')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-slate-50 py-1.5 px-3 border-t border-slate-300 flex justify-between font-bold text-slate-900">
                            <span>TOTAL POTONGAN:</span>
                            <span className="font-mono text-red-600">- Rp {Number(totalDeductions || 0).toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                </div>

                {/* Take Home Pay Box */}
                <div className="mt-5 p-3.5 bg-emerald-50 border-2 border-emerald-600 rounded flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">PENGHASILAN BERSIH DITERIMA</p>
                        <h2 className="text-lg font-black tracking-tight text-emerald-900">TAKE HOME PAY (THP)</h2>
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-black font-mono text-emerald-700">
                            Rp {Number(netPay || 0).toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer Slip Gaji */}
            <OfficialDocumentFooter
                terbilangText={terbilangNet}
                notes={notes}
                signatures={[
                    { title: 'Diterbitkan Oleh,', role: 'Staff Payroll HRD' },
                    { title: 'Disetujui Oleh,', role: 'HR & Finance Manager' },
                    { title: 'Diterima Oleh Karyawan,', name: employee.name, role: employee.jobTitle }
                ]}
                qrCodeValue={`SLIP:${slipId}|EMP:${employee.nik}|NET:${netPay}|DATE:${paymentDate || ''}|ERPQU`}
                qrCodeLabel="Otentikasi Slip Gaji"
            />
        </div>
    );
};
