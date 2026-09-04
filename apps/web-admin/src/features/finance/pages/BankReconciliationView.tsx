import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/finance';
import {
    Card, Button, Badge, Modal, UniversalTableToolbar, useToast
} from '../../../components/ui';
import {
    RefreshCw, Upload, CheckCircle2, AlertTriangle, ArrowDownLeft, ArrowUpRight,
    Search, FileText, Check, ShieldCheck, Scale, History, Plus, Layers, Database
} from 'lucide-react';
import Papa from 'papaparse';
import dayjs from 'dayjs';

interface BankLine {
    transaction_date: string;
    description: string;
    reference_number?: string;
    amount: number;
}

export const BankReconciliationView: React.FC = () => {
    const queryClient = useQueryClient();
    const { success, error: toastError, warning } = useToast();
    const [activeTab, setActiveTab] = useState<'import' | 'matching' | 'history'>('matching');
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [selectedStatementId, setSelectedStatementId] = useState<string>('');

    // Import State
    const [refNumber, setRefNumber] = useState(`STMT-${dayjs().format('YYYYMMDD-HHmm')}`);
    const [statementDate, setStatementDate] = useState(dayjs().format('YYYY-MM-DD'));
    const [openingBal, setOpeningBal] = useState('0');
    const [closingBal, setClosingBal] = useState('0');
    const [parsedLines, setParsedLines] = useState<BankLine[]>([]);
    const [rawCsvText, setRawCsvText] = useState('');

    // Queries
    const { data: bankAccounts = [] } = useQuery({
        queryKey: ['finance', 'bank-accounts'],
        queryFn: financeApi.listBankAccounts,
    });

    const { data: statements = [], isLoading: loadingStatements } = useQuery({
        queryKey: ['finance', 'bank-statements'],
        queryFn: financeApi.listBankStatements,
    });

    const activeStatement = statements.find((s: any) => s.id === selectedStatementId) || statements[0];

    const { data: statementDetail, isLoading: loadingDetail } = useQuery({
        queryKey: ['finance', 'bank-statement', activeStatement?.id],
        queryFn: () => financeApi.getBankStatement(activeStatement.id),
        enabled: !!activeStatement?.id,
    });

    const { data: auditHistory = [], isLoading: loadingAudit } = useQuery({
        queryKey: ['finance', 'bank-reconciliations'],
        queryFn: financeApi.listBankReconciliations,
    });

    // Mutations
    const importMutation = useMutation({
        mutationFn: financeApi.importBankStatement,
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'bank-statements'] });
            success('Rekening koran berhasil diimpor.', 'Import Berhasil');
            setParsedLines([]);
            setRawCsvText('');
            if (data?.id) {
                setSelectedStatementId(data.id);
            }
            setActiveTab('matching');
        },
        onError: (err: any) => {
            toastError(err?.response?.data?.message || 'Gagal mengimpor rekening koran.', 'Import Gagal');
        },
    });

    const autoMatchMutation = useMutation({
        mutationFn: financeApi.autoMatchBankStatement,
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'bank-statement', activeStatement?.id] });
            success(`Berhasil mencocokkan ${res?.matched_count || 0} transaksi secara otomatis.`, 'Pencocokan Selesai');
        },
        onError: (err: any) => {
            toastError('Gagal menjalankan pencocokan otomatis.', 'Gagal');
        },
    });

    const reconcileMutation = useMutation({
        mutationFn: financeApi.reconcileBankStatement,
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'bank-statements'] });
            queryClient.invalidateQueries({ queryKey: ['finance', 'bank-statement', activeStatement?.id] });
            queryClient.invalidateQueries({ queryKey: ['finance', 'bank-reconciliations'] });
            success('Rekonsiliasi bank berhasil diselesaikan & dikunci.', 'Rekonsiliasi Selesai');
            setActiveTab('history');
        },
        onError: (err: any) => {
            toastError('Gagal menyelesaikan rekonsiliasi.', 'Gagal');
        },
    });

    // CSV Parsing (Supports BCA, Mandiri, BNI, and Standard Format)
    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data as string[][];
                if (rows.length === 0) return;

                const lines: BankLine[] = [];
                let detectedOpen = 0;
                let detectedClose = 0;

                // Process rows
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length < 3) continue;

                    // Standard format: [Tanggal, Deskripsi, Nominal, Tipe(CR/DB)]
                    // BCA format: [Date, Description, Branch, Amount, Type(CR/DB), Balance]
                    const firstCol = (row[0] || '').trim();
                    const secondCol = (row[1] || '').trim();
                    const thirdCol = (row[2] || '').trim();

                    // Parse Date
                    let dateStr = dayjs().format('YYYY-MM-DD');
                    if (/^\d{2}\/\d{2}\/\d{4}/.test(firstCol)) {
                        const parts = firstCol.split('/');
                        dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    } else if (/^\d{4}-\d{2}-\d{2}/.test(firstCol)) {
                        dateStr = firstCol;
                    } else if (/^\d{2}\/\d{2}/.test(firstCol)) {
                        dateStr = `${dayjs().year()}-${firstCol.replace('/', '-')}`;
                    }

                    // Parse Amount & Type
                    let rawAmount = 0;
                    let isCredit = false;

                    // Search for amount in columns
                    for (let c = 2; c < row.length; c++) {
                        const val = (row[c] || '').replace(/[^0-9.,-]/g, '').replace(/,/g, '');
                        const num = parseFloat(val);
                        if (!isNaN(num) && num > 0) {
                            rawAmount = num;
                            break;
                        }
                    }

                    const rowText = row.join(' ').toUpperCase();
                    if (rowText.includes(' CR') || rowText.includes('DEPOSIT') || rowText.includes('MASUK') || rowText.includes('SETOR')) {
                        isCredit = true;
                    } else if (rowText.includes(' DB') || rowText.includes('TARIK') || rowText.includes('KELUAR')) {
                        isCredit = false;
                    }

                    const finalAmount = isCredit ? rawAmount : -rawAmount;

                    if (rawAmount > 0) {
                        lines.push({
                            transaction_date: dateStr,
                            description: secondCol || thirdCol || 'Mutasi Bank',
                            reference_number: row[3] || undefined,
                            amount: finalAmount,
                        });
                    }
                }

                if (lines.length > 0) {
                    setParsedLines(lines);
                    success(`Berhasil mengekstrak ${lines.length} baris mutasi dari berkas CSV.`, 'CSV Terbaca');
                } else {
                    warning('Format CSV tidak dikenali atau tidak ada data baris transaksi.', 'Peringatan');
                }
            },
            error: (err) => {
                toastError('Gagal membaca file CSV: ' + err.message, 'Format Error');
            }
        });
    };

    const handleSaveStatement = () => {
        if (!selectedAccountId) {
            warning('Silakan pilih Rekening Kas/Bank terlebih dahulu.', 'Validasi');
            return;
        }
        if (parsedLines.length === 0) {
            warning('Belum ada data mutasi yang diunggah.', 'Validasi');
            return;
        }

        importMutation.mutate({
            account_id: selectedAccountId,
            statement_date: statementDate,
            reference_number: refNumber,
            opening_balance: parseFloat(openingBal) || 0,
            closing_balance: parseFloat(closingBal) || 0,
            lines: parsedLines,
        });
    };

    const linesList = statementDetail?.lines || [];
    const matchedLines = linesList.filter((l: any) => l.is_reconciled || l.matched_gl_entry_id);
    const unmatchedLines = linesList.filter((l: any) => !l.is_reconciled && !l.matched_gl_entry_id);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                        <Scale className="h-6 w-6 text-indigo-500" />
                        Rekonsiliasi Bank & Kas (Bank Statement & Reconciliation)
                    </h1>
                    <p className="text-slate-500 text-xs mt-1">
                        Otomatisasi pencocokan mutasi rekening koran bank dengan buku besar kas/bank, pencegahan selisih (*Zero Delta*), dan audit berkas
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={activeTab === 'matching' ? 'filled' : 'outline'}
                        onClick={() => setActiveTab('matching')}
                        size="sm"
                        className="flex items-center gap-1.5"
                    >
                        <RefreshCw className="w-4 h-4" /> Workspace Rekonsiliasi
                    </Button>
                    <Button
                        variant={activeTab === 'import' ? 'filled' : 'outline'}
                        onClick={() => setActiveTab('import')}
                        size="sm"
                        className="flex items-center gap-1.5"
                    >
                        <Upload className="w-4 h-4" /> Import Rekening Koran (CSV)
                    </Button>
                    <Button
                        variant={activeTab === 'history' ? 'filled' : 'outline'}
                        onClick={() => setActiveTab('history')}
                        size="sm"
                        className="flex items-center gap-1.5"
                    >
                        <History className="w-4 h-4" /> Riwayat Audit
                    </Button>
                </div>
            </div>

            {/* TAB 1: IMPORT CSV */}
            {activeTab === 'import' && (
                <Card className="p-6 space-y-6">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Upload className="w-5 h-5 text-indigo-500" /> Form Unggah Mutasi Rekening Koran Bank
                        </h2>
                        <p className="text-slate-500 text-xs mt-0.5">
                            Mendukung file ekspor mutasi CSV dari BCA KlikBCA Bisnis, Mandiri MCM, BNI Direct, BRI CMS, dan format CSV standar.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Rekening Bank / Kas Tujuan:
                            </label>
                            <select
                                value={selectedAccountId}
                                onChange={(e) => setSelectedAccountId(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                            >
                                <option value="">-- Pilih Akun Bank --</option>
                                {bankAccounts.map((b: any) => (
                                    <option key={b.id} value={b.account_id || b.id}>
                                        {b.bank_name || 'Bank'} - {b.account_name} ({b.account_number})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Nomor Referensi Rekening Koran:
                            </label>
                            <input
                                type="text"
                                value={refNumber}
                                onChange={(e) => setRefNumber(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                            />
                        </div>

                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Tanggal Laporan Rekening Koran:
                            </label>
                            <input
                                type="date"
                                value={statementDate}
                                onChange={(e) => setStatementDate(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Saldo Awal Rekening Koran (Rp):
                            </label>
                            <input
                                type="number"
                                value={openingBal}
                                onChange={(e) => setOpeningBal(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                            />
                        </div>

                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Saldo Akhir Rekening Koran (Rp):
                            </label>
                            <input
                                type="number"
                                value={closingBal}
                                onChange={(e) => setClosingBal(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
                            />
                        </div>

                        <div>
                            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                Pilih File CSV Mutasi Bank:
                            </label>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleCsvUpload}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                            />
                        </div>
                    </div>

                    {/* Preview Extracted Table */}
                    {parsedLines.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                    Pratinjau Data Mutasi ({parsedLines.length} Transaksi Terdeteksi):
                                </span>
                                <Button
                                    variant="filled"
                                    onClick={handleSaveStatement}
                                    disabled={importMutation.isPending}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs"
                                >
                                    <Check className="w-4 h-4" /> Simpan Dokumen Rekening Koran
                                </Button>
                            </div>

                            <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0">
                                        <tr>
                                            <th className="p-2.5">Tanggal</th>
                                            <th className="p-2.5">Keterangan / Berita Transfer</th>
                                            <th className="p-2.5 text-right">Mutasi Masuk (CR)</th>
                                            <th className="p-2.5 text-right">Mutasi Keluar (DB)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {parsedLines.map((l, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                                                <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400">{l.transaction_date}</td>
                                                <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">{l.description}</td>
                                                <td className="p-2.5 text-right font-mono text-emerald-600 font-semibold">
                                                    {l.amount > 0 ? `Rp ${Number(l.amount).toLocaleString('id-ID')}` : '-'}
                                                </td>
                                                <td className="p-2.5 text-right font-mono text-rose-600 font-semibold">
                                                    {l.amount < 0 ? `Rp ${Number(Math.abs(l.amount)).toLocaleString('id-ID')}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* TAB 2: SMART MATCHING WORKSPACE */}
            {activeTab === 'matching' && (
                <div className="space-y-6">
                    {/* Selector Bar */}
                    <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Dokumen Rekening Koran:
                            </label>
                            <select
                                value={activeStatement?.id || ''}
                                onChange={(e) => setSelectedStatementId(e.target.value)}
                                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
                            >
                                {statements.length === 0 ? (
                                    <option value="">Belum ada rekening koran diimpor</option>
                                ) : (
                                    statements.map((s: any) => (
                                        <option key={s.id} value={s.id}>
                                            {s.reference_number} ({dayjs(s.statement_date).format('DD MMM YYYY')}) - {s.status}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        {activeStatement && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => autoMatchMutation.mutate(activeStatement.id)}
                                    disabled={autoMatchMutation.isPending || activeStatement.status === 'RECONCILED'}
                                    size="sm"
                                    className="flex items-center gap-1.5 text-indigo-600 border-indigo-500/40 hover:bg-indigo-500/10 text-xs"
                                >
                                    <ShieldCheck className="w-4 h-4" /> Cocokkan Otomatis (Auto-Match)
                                </Button>
                                <Button
                                    variant="filled"
                                    onClick={() => reconcileMutation.mutate(activeStatement.id)}
                                    disabled={reconcileMutation.isPending || activeStatement.status === 'RECONCILED'}
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-semibold"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Selesaikan & Kunci Rekonsiliasi
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* Summary Statistics */}
                    {activeStatement && (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <Card className="p-4 border-l-4 border-l-indigo-500 space-y-1">
                                <span className="text-[11px] text-slate-500 uppercase font-bold">Saldo Akhir Bank</span>
                                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                                    Rp {Number(activeStatement.closing_balance || 0).toLocaleString('id-ID')}
                                </div>
                                <span className="text-[10px] text-slate-400">Berdasarkan mutasi rekening koran</span>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-emerald-500 space-y-1">
                                <span className="text-[11px] text-slate-500 uppercase font-bold">Transaksi Cocok</span>
                                <div className="text-lg font-bold font-mono text-emerald-600">
                                    {matchedLines.length} / {linesList.length} Baris
                                </div>
                                <span className="text-[10px] text-slate-400">Tercocokkan dengan Buku Kas/Bank</span>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-amber-500 space-y-1">
                                <span className="text-[11px] text-slate-500 uppercase font-bold">Belum Tercocok</span>
                                <div className="text-lg font-bold font-mono text-amber-600">
                                    {unmatchedLines.length} Baris
                                </div>
                                <span className="text-[10px] text-slate-400">Memerlukan verifikasi lanjutan</span>
                            </Card>

                            <Card className="p-4 border-l-4 border-l-cyan-500 space-y-1">
                                <span className="text-[11px] text-slate-500 uppercase font-bold">Status Rekonsiliasi</span>
                                <div className="text-lg font-bold text-slate-900 dark:text-white">
                                    <Badge variant={activeStatement.status === 'RECONCILED' ? 'success' : 'default'}>
                                        {activeStatement.status}
                                    </Badge>
                                </div>
                                <span className="text-[10px] text-slate-400">Ref: {activeStatement.reference_number}</span>
                            </Card>
                        </div>
                    )}

                    {/* Side by side Matching Table */}
                    <Card className="p-5 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-500" /> Rincian Mutasi Rekening Koran Bank
                            </h3>
                            <span className="text-xs text-slate-500">
                                Total: {linesList.length} Transaksi
                            </span>
                        </div>

                        {linesList.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 italic text-xs">
                                Belum ada data transaksi pada rekening koran ini. Silakan pilih tab "Import Rekening Koran (CSV)" untuk menambahkan data.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        <tr>
                                            <th className="p-2.5 w-24">Tanggal</th>
                                            <th className="p-2.5">Keterangan / Transaksi Bank</th>
                                            <th className="p-2.5 w-32 text-right">Nominal Mutasi</th>
                                            <th className="p-2.5 w-32 text-center">Status Cocok</th>
                                            <th className="p-2.5 w-44">Tautan Jurnal GL</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {linesList.map((line: any) => {
                                            const isMatched = line.is_reconciled || !!line.matched_gl_entry_id;
                                            return (
                                                <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                                                    <td className="p-2.5 font-mono text-slate-500">{line.transaction_date}</td>
                                                    <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                                                        {line.description}
                                                    </td>
                                                    <td className="p-2.5 text-right font-mono font-bold">
                                                        <span className={line.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                            {line.amount > 0 ? '+' : ''}Rp {Number(line.amount).toLocaleString('id-ID')}
                                                        </span>
                                                    </td>
                                                    <td className="p-2.5 text-center">
                                                        {isMatched ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                <CheckCircle2 className="w-3 h-3" /> Cocok (Matched)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                                                <AlertTriangle className="w-3 h-3" /> Unmatched
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-2.5 font-mono text-[10px] text-slate-500">
                                                        {line.matched_gl_entry_id ? (
                                                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                                                                <Database className="w-3 h-3" /> GL: {line.matched_gl_entry_id.slice(0, 8)}...
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Belum terhubung</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* TAB 3: AUDIT HISTORY */}
            {activeTab === 'history' && (
                <Card className="p-6 space-y-4">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-500" /> Riwayat Audit Rekonsiliasi Bank Selesai
                        </h2>
                        <p className="text-slate-500 text-xs mt-0.5">
                            Arsip permanen rekonsiliasi bank yang telah diverifikasi dan dikunci dengan saldo akhir buku besar (*General Ledger Balance*).
                        </p>
                    </div>

                    {auditHistory.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 italic text-xs">
                            Belum ada rekonsiliasi yang diselesaikan.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                    <tr>
                                        <th className="p-2.5">Tanggal As Of</th>
                                        <th className="p-2.5 text-right">Saldo Rekening Koran</th>
                                        <th className="p-2.5 text-right">Saldo Buku Besar (GL)</th>
                                        <th className="p-2.5 text-right">Selisih (Delta)</th>
                                        <th className="p-2.5 text-center">Status</th>
                                        <th className="p-2.5">Waktu Selesai</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                    {auditHistory.map((h: any) => (
                                        <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-850">
                                            <td className="p-2.5 font-mono text-slate-900 dark:text-slate-100 font-semibold">
                                                {h.as_of_date}
                                            </td>
                                            <td className="p-2.5 text-right font-mono font-medium">
                                                Rp {Number(h.statement_ending_balance || 0).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-2.5 text-right font-mono font-medium">
                                                Rp {Number(h.gl_ending_balance || 0).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-2.5 text-right font-mono font-bold">
                                                <span className={Number(h.unreconciled_difference || 0) === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                                    Rp {Number(h.unreconciled_difference || 0).toLocaleString('id-ID')}
                                                </span>
                                            </td>
                                            <td className="p-2.5 text-center">
                                                <Badge variant="success">COMPLETED</Badge>
                                            </td>
                                            <td className="p-2.5 text-slate-500 font-mono text-[10px]">
                                                {dayjs(h.reconciled_at).format('DD MMM YYYY, HH:mm')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
};

export default BankReconciliationView;
