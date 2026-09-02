import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { financeApi, type Account } from '../api/finance';
import { journalApi, type CreateJournalEntryRequest } from '../api/journal';
import { Card, Button, CurrencyInput, useToast } from '../../../components/ui';
import {
    Plus, Trash2, ArrowLeft, Save, CheckCircle2, AlertTriangle,
    BookOpen, Scale, Sparkles, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface JournalLineItem {
    account_id: string;
    description: string;
    debit: number;
    credit: number;
}

export default function JournalEntryForm() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reference, setReference] = useState('');
    const [description, setDescription] = useState('');
    const [lines, setLines] = useState<JournalLineItem[]>([
        { account_id: '', description: '', debit: 0, credit: 0 },
        { account_id: '', description: '', debit: 0, credit: 0 },
    ]);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            const data = await financeApi.listAccounts();
            setAccounts(data);
        } catch {
            toast.error('Gagal memuat bagan akun (COA)');
        }
    };

    const addLine = () => {
        setLines([...lines, { account_id: '', description: '', debit: 0, credit: 0 }]);
    };

    const removeLine = (index: number) => {
        if (lines.length <= 2) {
            toast.error('Jurnal umum minimal harus memiliki 2 baris transaksi');
            return;
        }
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof JournalLineItem, value: any) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };

        // Auto-clear opposite side
        if (field === 'debit' && value > 0) {
            newLines[index].credit = 0;
        }
        if (field === 'credit' && value > 0) {
            newLines[index].debit = 0;
        }

        setLines(newLines);
    };

    // Calculate Totals & Balance
    const totalDebit = useMemo(() => lines.reduce((acc, l) => acc + (l.debit || 0), 0), [lines]);
    const totalCredit = useMemo(() => lines.reduce((acc, l) => acc + (l.credit || 0), 0), [lines]);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = totalDebit > 0 && totalCredit > 0 && totalDebit === totalCredit;

    // Quick auto-balance helper
    const handleAutoBalance = () => {
        if (lines.length < 2) return;
        const lastIdx = lines.length - 1;
        const otherDebit = lines.slice(0, lastIdx).reduce((acc, l) => acc + (l.debit || 0), 0);
        const otherCredit = lines.slice(0, lastIdx).reduce((acc, l) => acc + (l.credit || 0), 0);

        const newLines = [...lines];
        if (otherDebit > otherCredit) {
            newLines[lastIdx].credit = otherDebit - otherCredit;
            newLines[lastIdx].debit = 0;
        } else if (otherCredit > otherDebit) {
            newLines[lastIdx].debit = otherCredit - otherDebit;
            newLines[lastIdx].credit = 0;
        }
        setLines(newLines);
        toast.success('Nilai debit/kredit otomatis diselaraskan (Balanced)');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isBalanced) {
            toast.error(`Jurnal belum seimbang (Out of Balance). Selisih: Rp ${difference.toLocaleString('id-ID')}`);
            return;
        }

        if (totalDebit <= 0) {
            toast.error('Nilai nominal jurnal tidak boleh nol');
            return;
        }

        if (lines.some(l => !l.account_id)) {
            toast.error('Setiap baris wajib memilih akun perkiraan COA');
            return;
        }

        try {
            setSubmitting(true);
            const payload: CreateJournalEntryRequest = {
                date,
                description,
                reference,
                lines: lines.map(l => ({
                    account_id: l.account_id,
                    description: l.description,
                    debit: l.debit.toString(),
                    credit: l.credit.toString(),
                }))
            };

            await journalApi.create(payload);
            toast.success('Jurnal umum berhasil dibukukan');
            navigate('/finance/journals');
        } catch (error: unknown) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Gagal menyimpan jurnal umum');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto bg-background min-h-screen animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/finance/journals')}
                        className="rounded-xl p-2"
                    >
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                            <BookOpen size={24} className="text-primary" />
                            Buat Jurnal Umum Baru (Journal Entry)
                        </h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Pencatatan transaksi akuntansi berpasangan (Double-Entry Bookkeeping)
                        </p>
                    </div>
                </div>

                {/* Real-time Balance Status Indicator */}
                <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-3 shadow-sm transition-all ${
                    isBalanced
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                }`}>
                    <Scale size={20} />
                    <div>
                        <div className="text-xs font-bold uppercase tracking-wider">
                            {isBalanced ? 'Jurnal Seimbang (Balanced)' : 'Belum Seimbang (Out of Balance)'}
                        </div>
                        <div className="text-[11px] opacity-80 font-mono">
                            {isBalanced
                                ? `Total: Rp ${totalDebit.toLocaleString('id-ID')}`
                                : `Selisih: Rp ${difference.toLocaleString('id-ID')}`}
                        </div>
                    </div>
                    {!isBalanced && (
                        <button
                            type="button"
                            onClick={handleAutoBalance}
                            className="ml-2 px-2.5 py-1 text-[11px] font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Auto Seimbangkan"
                        >
                            <Sparkles size={12} /> Auto-Balance
                        </button>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Info Card */}
                <div className="bg-card border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                        Informasi Umum Transaksi
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                                Tanggal Transaksi *
                            </label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                                Nomor Referensi / Bukti
                            </label>
                            <input
                                type="text"
                                placeholder="cth. BKK/2026/09/001"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors font-mono font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                                Keterangan / Deskripsi Umum *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="cth. Pembayaran Beban Servis Unit Excavator"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors font-medium"
                            />
                        </div>
                    </div>
                </div>

                {/* Sub-table Journal Lines */}
                <div className="bg-card border border-border/60 rounded-2xl p-4 md:p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                                Pos Akun Transaksi (Journal Lines)
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Masukkan minimal 2 baris akun debit dan kredit
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addLine}
                            className="rounded-xl text-xs flex items-center gap-1.5"
                        >
                            <Plus size={14} />
                            Tambah Baris Akun
                        </Button>
                    </div>

                    <div className="border border-border/60 rounded-2xl overflow-hidden">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/60 border-b border-border/40">
                                <tr>
                                    <th className="p-3 font-bold w-1/3">Akun Perkiraan (COA) *</th>
                                    <th className="p-3 font-bold">Keterangan Baris</th>
                                    <th className="p-3 font-bold w-48">Debit (Rp)</th>
                                    <th className="p-3 font-bold w-48">Kredit (Rp)</th>
                                    <th className="p-3 font-bold text-center w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {lines.map((line, index) => (
                                    <tr key={index} className="hover:bg-muted/20">
                                        <td className="p-2.5">
                                            <select
                                                required
                                                value={line.account_id}
                                                onChange={(e) => updateLine(index, 'account_id', e.target.value)}
                                                className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                                            >
                                                <option value="">Pilih Akun Perkiraan...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.code} - {acc.name} ({acc.account_type})
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2.5">
                                            <input
                                                type="text"
                                                placeholder="Keterangan spesifik..."
                                                value={line.description}
                                                onChange={(e) => updateLine(index, 'description', e.target.value)}
                                                className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                                            />
                                        </td>
                                        <td className="p-2.5">
                                            <CurrencyInput
                                                value={line.debit}
                                                onChange={(val) => updateLine(index, 'debit', val)}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="p-2.5">
                                            <CurrencyInput
                                                value={line.credit}
                                                onChange={(val) => updateLine(index, 'credit', val)}
                                                size="sm"
                                            />
                                        </td>
                                        <td className="p-2.5 text-center">
                                            <button
                                                type="button"
                                                onClick={() => removeLine(index)}
                                                disabled={lines.length <= 2}
                                                className={`p-1.5 rounded-lg transition-colors ${
                                                    lines.length <= 2
                                                        ? 'text-muted-foreground/40 cursor-not-allowed'
                                                        : 'text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10'
                                                }`}
                                                title="Hapus Baris"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-muted/40 font-bold border-t border-border/60">
                                <tr>
                                    <td colSpan={2} className="p-3 text-right uppercase tracking-wider text-xs text-foreground">
                                        Total Nominal Jurnal:
                                    </td>
                                    <td className="p-3 font-mono text-sm text-foreground">
                                        Rp {totalDebit.toLocaleString('id-ID')}
                                    </td>
                                    <td className="p-3 font-mono text-sm text-foreground">
                                        Rp {totalCredit.toLocaleString('id-ID')}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-between pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate('/finance/journals')}
                        className="rounded-xl"
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        variant="filled"
                        disabled={!isBalanced || totalDebit <= 0}
                        loading={submitting}
                        className={`rounded-xl px-6 py-2.5 font-semibold text-sm shadow-lg flex items-center gap-2 ${
                            isBalanced && totalDebit > 0
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'
                                : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed'
                        }`}
                    >
                        <Save size={16} />
                        Posting & Simpan Jurnal
                    </Button>
                </div>
            </form>
        </div>
    );
}
