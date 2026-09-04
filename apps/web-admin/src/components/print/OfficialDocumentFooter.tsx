import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface SignatureParty {
    title: string;
    name?: string;
    role?: string;
}

export interface BankInfo {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
}

export interface OfficialDocumentFooterProps {
    terbilangText?: string;
    bankInfo?: BankInfo;
    notes?: string;
    signatures: SignatureParty[];
    qrCodeValue: string;
    qrCodeLabel?: string;
}

export const OfficialDocumentFooter: React.FC<OfficialDocumentFooterProps> = ({
    terbilangText,
    bankInfo,
    notes,
    signatures,
    qrCodeValue,
    qrCodeLabel = 'Verifikasi Keaslian Dokumen'
}) => {
    return (
        <div className="w-full mt-6 space-y-4 pt-2 border-t border-slate-200">
            {/* Terbilang & Bank Info Grid */}
            {(terbilangText || bankInfo || notes) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                    {/* Left: Terbilang & Bank Info */}
                    <div className="space-y-2">
                        {terbilangText && (
                            <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                                <span className="text-slate-500 font-bold uppercase text-[8.5px] block">Terbilang:</span>
                                <p className="font-semibold italic text-slate-800 leading-snug">
                                    # {terbilangText} #
                                </p>
                            </div>
                        )}

                        {bankInfo && (
                            <div className="p-2 border border-dashed border-slate-300 rounded space-y-0.5 bg-slate-50/50">
                                <span className="text-slate-500 font-bold uppercase text-[8.5px] block">Informasi Rekening Pembayaran Resmi:</span>
                                <div className="text-[10px]">
                                    <span className="text-slate-600">Bank: </span>
                                    <strong className="text-slate-900">{bankInfo.bankName}</strong>
                                </div>
                                <div className="text-[10px]">
                                    <span className="text-slate-600">No. Rekening: </span>
                                    <strong className="text-slate-900 font-mono tracking-wide">{bankInfo.accountNumber}</strong>
                                </div>
                                <div className="text-[10px]">
                                    <span className="text-slate-600">A/N: </span>
                                    <strong className="text-slate-900">{bankInfo.accountHolder}</strong>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Notes */}
                    {notes && (
                        <div className="p-2 border border-slate-200 rounded bg-slate-50/30 flex flex-col justify-between">
                            <div>
                                <span className="text-slate-500 font-bold uppercase text-[8.5px] block mb-0.5">Catatan / Syarat & Ketentuan:</span>
                                <p className="text-slate-600 leading-relaxed text-[9.5px]">
                                    {notes}
                                </p>
                            </div>
                            <p className="text-[8px] text-slate-400 italic pt-1">
                                Dokumen ini dihasilkan secara terkomputerisasi melalui ERPQu Enterprise System dan sah tanpa stempel basah jika terverifikasi melalui kode QR.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Signatures & QR Code Section */}
            <div className="flex items-end justify-between pt-2">
                {/* Signatures Grid */}
                <div className="flex-1 grid grid-flow-col auto-cols-fr gap-4 pr-6">
                    {signatures.map((sig, idx) => (
                        <div key={idx} className="text-center flex flex-col justify-between h-28">
                            <p className="text-[10px] font-bold text-slate-700">{sig.title}</p>
                            <div className="space-y-1">
                                <div className="border-b border-slate-400 w-32 mx-auto" />
                                <p className="text-[10.5px] font-bold text-slate-900">
                                    {sig.name || '( .................................... )'}
                                </p>
                                {sig.role && (
                                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">
                                        {sig.role}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* QR Code Verification Box */}
                <div className="flex flex-col items-center justify-center p-2 bg-slate-50 border border-slate-200 rounded shadow-xs w-28 shrink-0">
                    <QRCodeSVG
                        value={qrCodeValue}
                        size={68}
                        level="M"
                        includeMargin={false}
                    />
                    <span className="text-[7.5px] font-bold text-slate-600 text-center uppercase tracking-tight mt-1 leading-tight">
                        {qrCodeLabel}
                    </span>
                    <span className="text-[6.5px] text-slate-400 font-mono mt-0.5">ERPQU VERIFIED</span>
                </div>
            </div>
        </div>
    );
};
