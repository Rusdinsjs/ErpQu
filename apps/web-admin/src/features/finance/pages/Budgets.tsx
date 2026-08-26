import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi, type BudgetVarianceReport, type CreateBudgetRequest } from'../api/finance';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal } from'../../../components/ui';
import { Plus, PieChart, AlertTriangle, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';
import { formatCurrencyIDR } from'../../../utils/decimal';
import { toast } from 'sonner';

export default function Budgets() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fiscalYear, setFiscalYear] = useState('2026');
    const [selectedCostCenterId, setSelectedCostCenterId] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [budgetAmount, setBudgetAmount] = useState('');

    const { data: varianceReports, isLoading } = useQuery({
        queryKey: ['finance', 'budgets-variance'],
        queryFn: financeApi.getBudgetVariance,
    });

    const { data: costCenters } = useQuery({
        queryKey: ['finance', 'cost-centers'],
        queryFn: financeApi.listCostCenters,
    });

    const { data: accounts } = useQuery({
        queryKey: ['finance', 'accounts'],
        queryFn: financeApi.listAccounts,
    });

    const createMutation = useMutation({
        mutationFn: financeApi.createBudget,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'budgets'] });
            queryClient.invalidateQueries({ queryKey: ['finance', 'budgets-variance'] });
            setIsModalOpen(false);
            setBudgetAmount('');
            toast.success('Plafon anggaran berhasil ditetapkan.');
        },
        onError: (err: any) => {
            toast.error('Gagal membuat anggaran: ' + (err.message || 'Terjadi kesalahan'));
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(budgetAmount);
        if (isNaN(amt) || amt <= 0 || !selectedAccountId) {
            toast.error('Pilih akun beban dan masukkan plafon anggaran yang valid.');
            return;
        }

        const payload: CreateBudgetRequest = {
            cost_center_id: selectedCostCenterId || undefined,
            fiscal_year: fiscalYear,
            action_if_annual_budget_exceeded: 'Warn',
            accounts: [{
                account_id: selectedAccountId,
                budget_amount: amt,
            }]
        };

        createMutation.mutate(payload);
    };

    const totalBudget = (varianceReports || []).reduce((sum, b) => sum + b.budget_amount, 0);
    const totalSpent = (varianceReports || []).reduce((sum, b) => sum + b.actual_spent, 0);

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <PieChart className="text-purple-500" size={32} />
                        Anggaran Keuangan & Analisis Varian (Budgets)
                    </h1>
                    <p className="text-muted-foreground mt-1">Kontrol batas pengeluaran, alokasi plafon biaya tahunan & monitoring realisasi</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg shadow-purple-500/20">
                    <Plus size={18} />
                    Tetapkan Anggaran Baru
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Plafon Anggaran</span>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{formatCurrencyIDR(totalBudget)}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Tahun Fiskal {fiscalYear}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Realisasi Pengeluaran</span>
                        <h3 className="text-2xl font-bold text-emerald-500 mt-1">{formatCurrencyIDR(totalSpent)}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0'}% Terpakai
                        </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sisa Alokasi Anggaran</span>
                        <h3 className="text-2xl font-bold text-blue-500 mt-1">{formatCurrencyIDR(totalBudget - totalSpent)}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Tersedia untuk operasional</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <TableSkeleton rows={5} cols={7} />
                ) : (varianceReports || []).length === 0 ? (
                    <div className="text-center py-16">
                        <PieChart className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada Anggaran Ditetapkan</h3>
                        <p className="text-sm text-muted-foreground mt-1">Klik tombol &apos;Tetapkan Anggaran Baru&apos; untuk membuat batas plafon pengeluaran.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Pusat Biaya (Cost Center)</TableTh>
                                <TableTh>Akun Buku Besar (COA)</TableTh>
                                <TableTh align="right">Plafon Anggaran</TableTh>
                                <TableTh align="right">Realisasi</TableTh>
                                <TableTh align="right">Sisa / Varian</TableTh>
                                <TableTh>Tingkat Pemakaian</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(varianceReports || []).map((row, idx) => (
                                <TableRow key={idx} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.cost_center_name}</TableTd>
                                    <TableTd>
                                        <div className="font-medium text-foreground">{row.account_code} - {row.account_name}</div>
                                    </TableTd>
                                    <TableTd align="right" className="font-bold text-foreground">{formatCurrencyIDR(row.budget_amount)}</TableTd>
                                    <TableTd align="right" className="text-emerald-500 font-semibold">{formatCurrencyIDR(row.actual_spent)}</TableTd>
                                    <TableTd align="right" className="text-muted-foreground font-medium">{formatCurrencyIDR(row.variance)}</TableTd>
                                    <TableTd>
                                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-2.5 rounded-full ${row.utilization_percentage > 100 ? 'bg-rose-500' : row.utilization_percentage > 80 ? 'bg-amber-500' : 'bg-purple-500'}`}
                                                style={{ width: `${Math.min(row.utilization_percentage, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1 block">{row.utilization_percentage.toFixed(1)}%</span>
                                    </TableTd>
                                    <TableTd align="center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${row.status === 'Overbudget' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                            {row.status === 'Overbudget' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                                            {row.status}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tetapkan Plafon Anggaran">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tahun Fiskal</label>
                            <Input value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Pusat Biaya</label>
                            <select
                                value={selectedCostCenterId}
                                onChange={(e) => setSelectedCostCenterId(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/30 outline-none"
                            >
                                <option value="">-- Seluruh Perusahaan --</option>
                                {(costCenters || []).map(c => (
                                    <option key={c.id} value={c.id}>{c.cost_center_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Akun Beban (COA)</label>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            required
                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500/30 outline-none"
                        >
                            <option value="">-- Pilih Akun Biaya / Beban --</option>
                            {(accounts || []).filter(a => a.account_type === 'expense').map(a => (
                                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Plafon Anggaran Tahunan (Rp)</label>
                        <Input
                            type="number"
                            placeholder="Contoh: 100000000"
                            value={budgetAmount}
                            onChange={(e) => setBudgetAmount(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
                            {createMutation.isPending ? 'Menyimpan...' : 'Simpan Anggaran'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
