import React from 'react';
import { Building2 } from 'lucide-react';

export interface LetterheadProps {
    companyName?: string;
    companyTagline?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    companyWebsite?: string;
    taxId?: string; // NPWP
    logoUrl?: string;
    documentTitle: string;
    documentNumber: string;
    documentDate?: string;
    statusBadge?: string;
}

export const OfficialLetterhead: React.FC<LetterheadProps> = ({
    companyName = 'PT SJS GROUP INDONESIA',
    companyTagline = 'Integrated Enterprise Resource & Supply Chain Solutions',
    companyAddress = 'Jl. Jenderal Sudirman Kav. 52-53, SCBD Lot 9, Jakarta Selatan 12190',
    companyPhone = '+62 (21) 515-8888',
    companyEmail = 'finance@sjsgroup.co.id',
    companyWebsite = 'www.sjsgroup.co.id',
    taxId = '01.345.678.9-012.000',
    logoUrl,
    documentTitle,
    documentNumber,
    documentDate,
    statusBadge,
}) => {
    return (
        <div className="w-full">
            {/* Header: Company Profile */}
            <div className="flex items-start justify-between pb-3">
                {/* Logo & Company Info */}
                <div className="flex items-start gap-4">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={companyName}
                            className="w-14 h-14 object-contain"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-lg bg-slate-900 text-white flex flex-col items-center justify-center shadow-sm">
                            <Building2 className="w-7 h-7 text-indigo-400" />
                            <span className="text-[8px] font-bold tracking-wider mt-0.5">ERPQU</span>
                        </div>
                    )}

                    <div className="space-y-0.5">
                        <h1 className="text-[16px] font-black tracking-tight text-slate-950 uppercase leading-none">
                            {companyName}
                        </h1>
                        <p className="text-[9.5px] font-semibold text-indigo-800 tracking-wide uppercase">
                            {companyTagline}
                        </p>
                        <p className="text-[9.5px] text-slate-600 leading-tight max-w-md pt-0.5">
                            {companyAddress}
                        </p>
                        <div className="flex flex-wrap gap-x-3 text-[9px] text-slate-500 pt-0.5">
                            {companyPhone && <span>Telp: <strong className="text-slate-700">{companyPhone}</strong></span>}
                            {companyEmail && <span>Email: <strong className="text-slate-700">{companyEmail}</strong></span>}
                            {companyWebsite && <span>Web: <strong className="text-slate-700">{companyWebsite}</strong></span>}
                            {taxId && <span>NPWP: <strong className="text-slate-700">{taxId}</strong></span>}
                        </div>
                    </div>
                </div>

                {/* Document Title & Number Badge */}
                <div className="text-right flex flex-col items-end">
                    <h2 className="text-[15px] font-black tracking-wider text-slate-900 uppercase">
                        {documentTitle}
                    </h2>
                    <div className="mt-1 px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px] font-bold text-slate-800">
                        {documentNumber}
                    </div>
                    {documentDate && (
                        <p className="text-[10px] text-slate-500 mt-1">
                            Tanggal: <strong className="text-slate-800">{documentDate}</strong>
                        </p>
                    )}
                    {statusBadge && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded border border-slate-300 bg-slate-50 text-slate-700 tracking-wider">
                            {statusBadge}
                        </span>
                    )}
                </div>
            </div>

            {/* Formal Corporate Double Line Separator */}
            <div className="w-full my-1">
                <div className="h-[2px] bg-slate-950 w-full" />
                <div className="h-[0.5px] bg-slate-400 w-full mt-[1.5px]" />
            </div>
        </div>
    );
};
