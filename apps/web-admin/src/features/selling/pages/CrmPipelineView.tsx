import React, { useState, useEffect } from 'react';
import { api } from '../../../api/http';
import { PageHeader, Card, Badge, LoadingSpinner, Modal } from '../../../components/ui';
import { TrendingUp, Plus, RefreshCw, DollarSign, Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface Opportunity {
    id: string;
    lead_id?: string | null;
    title: string;
    estimated_value: string | number;
    stage: string;
    expected_closing_date?: string | null;
    created_at: string;
}

interface PipelineSummary {
    stage: string;
    count: number;
    total_value: string | number;
}

const STAGES = [
    { id: 'PROSPECTING', label: 'Prospek Awal', color: 'border-blue-500/40 bg-blue-500/5' },
    { id: 'QUALIFICATION', label: 'Kualifikasi', color: 'border-purple-500/40 bg-purple-500/5' },
    { id: 'PROPOSAL', label: 'Pengajuan Proposal', color: 'border-amber-500/40 bg-amber-500/5' },
    { id: 'WON', label: 'Berhasil (Won)', color: 'border-emerald-500/40 bg-emerald-500/5' },
    { id: 'LOST', label: 'Gagal (Lost)', color: 'border-rose-500/40 bg-rose-500/5' },
];

export default function CrmPipelineView() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [summary, setSummary] = useState<PipelineSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // New Opportunity Form State
    const [newTitle, setNewTitle] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newStage, setNewStage] = useState('PROSPECTING');
    const [newDate, setNewDate] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [oppRes, sumRes] = await Promise.all([
                api.get('/crm/opportunities'),
                api.get('/crm/pipeline/summary')
            ]);

            if (oppRes.data?.success && oppRes.data?.data) {
                setOpportunities(oppRes.data.data);
            }
            if (sumRes.data?.success && sumRes.data?.data) {
                setSummary(sumRes.data.data);
            }
        } catch (error) {
            console.error('Failed to load CRM pipeline:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatRupiah = (val: string | number) => {
        const num = Number(val) || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(num);
    };

    const handleCreateOpportunity = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/crm/opportunities', {
                title: newTitle,
                estimated_value: parseFloat(newValue) || 0,
                stage: newStage,
                expected_closing_date: newDate || null,
            });
            setIsCreateModalOpen(false);
            setNewTitle('');
            setNewValue('');
            fetchData();
        } catch (error) {
            console.error('Failed to create opportunity:', error);
        }
    };

    const handleUpdateStage = async (id: string, stage: string) => {
        try {
            await api.put(`/crm/opportunities/${id}`, {
                stage: stage
            });
            fetchData();
        } catch (error) {
            console.error('Failed to update stage:', error);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="CRM Sales Pipeline & Peluang Bisnis"
                subtitle="Manajemen alur penjualan terintegrasi untuk melacak peluang transaksi dari tahap prospek hingga berhasil"
            >
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl hover:bg-muted border border-border transition-colors cursor-pointer"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 shadow-md transition-colors cursor-pointer"
                    >
                        <Plus size={16} />
                        Tambah Peluang
                    </button>
                </div>
            </PageHeader>

            {loading && opportunities.length === 0 ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <>
                    {/* Stage Overview Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {STAGES.map((st) => {
                            const sumItem = summary.find((s) => s.stage.toUpperCase() === st.id);
                            return (
                                <Card key={st.id} className={`p-4 border ${st.color} shadow-xs`}>
                                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{st.label}</div>
                                    <div className="text-xl font-extrabold text-foreground mt-1">
                                        {formatRupiah(sumItem?.total_value || 0)}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                        {sumItem?.count || 0} Peluang Aktif
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Kanban Board Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
                        {STAGES.map((st) => {
                            const stageOpps = opportunities.filter((o) => o.stage.toUpperCase() === st.id);
                            return (
                                <div key={st.id} className="bg-card/50 border border-border/80 rounded-2xl p-3 flex flex-col gap-3 min-h-[480px]">
                                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                        <span className="font-bold text-sm text-foreground">{st.label}</span>
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {stageOpps.length}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[600px] pr-1">
                                        {stageOpps.length === 0 ? (
                                            <div className="text-xs text-center text-muted-foreground py-8 border border-dashed border-border rounded-xl">
                                                Tidak ada peluang
                                            </div>
                                        ) : (
                                            stageOpps.map((opp) => (
                                                <div
                                                    key={opp.id}
                                                    className="bg-card border border-border p-3.5 rounded-xl shadow-xs hover:shadow-md transition-shadow group flex flex-col gap-2"
                                                >
                                                    <div className="font-semibold text-sm text-foreground line-clamp-2">
                                                        {opp.title}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm font-bold text-primary">
                                                        <DollarSign size={14} />
                                                        <span>{formatRupiah(opp.estimated_value)}</span>
                                                    </div>

                                                    {opp.expected_closing_date && (
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Calendar size={12} />
                                                            <span>Target: {new Date(opp.expected_closing_date).toLocaleDateString('id-ID')}</span>
                                                        </div>
                                                    )}

                                                    {/* Stage Shift Controls */}
                                                    <div className="flex items-center gap-1 pt-2 border-t border-border/60 justify-end">
                                                        {st.id !== 'WON' && (
                                                            <button
                                                                onClick={() => handleUpdateStage(opp.id, 'WON')}
                                                                title="Menangkan Kesepakatan"
                                                                className="p-1 rounded-md text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
                                                            >
                                                                <CheckCircle2 size={15} />
                                                            </button>
                                                        )}
                                                        {st.id !== 'LOST' && (
                                                            <button
                                                                onClick={() => handleUpdateStage(opp.id, 'LOST')}
                                                                title="Tandai Gagal"
                                                                className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                                            >
                                                                <XCircle size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Create Opportunity Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Tambah Peluang Penjualan Baru"
            >
                <form onSubmit={handleCreateOpportunity} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                            Judul Kesepakatan / Peluang
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Pengadaan Sewa Alat Berat PT Adhi"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                            Estimasi Nilai Transaksi (IDR)
                        </label>
                        <input
                            type="number"
                            required
                            placeholder="e.g. 150000000"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            className="w-full px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                                Tahapan Awal
                            </label>
                            <select
                                value={newStage}
                                onChange={(e) => setNewStage(e.target.value)}
                                className="w-full px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {STAGES.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                                Target Penutupan
                            </label>
                            <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                className="w-full px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 shadow-md transition-colors cursor-pointer"
                        >
                            Simpan Peluang
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
