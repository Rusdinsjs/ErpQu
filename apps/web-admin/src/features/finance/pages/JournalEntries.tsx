import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, Eye, FileText, ArrowRightLeft, Calendar, FileDigit, 
    Info, Search, Send, CheckCircle2, BookOpen, RotateCcw, 
    XCircle, X, AlertTriangle, Building2, User 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { journalApi } from'../api/journal';
import type { JournalEntry, JournalEntryDetail, JournalStatus } from'../api/journal';
import { 
    Button, Table, TableHead, TableBody, TableRow, TableTh, 
    TableTd, TableSkeleton, ActionIcon, StatusBadge 
} from'../../../components/ui';

export default function JournalEntries() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    
    // Modal states
    const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [reverseModalOpen, setReverseModalOpen] = useState(false);
    const [reversalTarget, setReversalTarget] = useState<JournalEntry | null>(null);
    const [reversalReason, setReversalReason] = useState('');
    const [actionError, setActionError] = useState<string | null>(null);

    const { data: entries, isLoading } = useQuery({
        queryKey: ['journal-entries'],
        queryFn: () => journalApi.list(),
    });

    const { data: journalDetail, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['journal-detail', selectedJournalId],
        queryFn: () => selectedJournalId ? journalApi.getDetails(selectedJournalId) : null,
        enabled: !!selectedJournalId && detailModalOpen,
    });

    // Mutations for lifecycle actions
    const submitMutation = useMutation({
        mutationFn: (id: string) => journalApi.submit(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
            setActionError(null);
        },
        onError: (err: any) => {
            setActionError(err.response?.data?.message || err.message || 'Failed to submit journal');
        }
    });

    const approveMutation = useMutation({
        mutationFn: (id: string) => journalApi.approve(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
            setActionError(null);
        },
        onError: (err: any) => {
            setActionError(err.response?.data?.message || err.message || 'Failed to approve journal (SoD: Maker cannot approve)');
        }
    });

    const postMutation = useMutation({
        mutationFn: (id: string) => journalApi.post(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
            setActionError(null);
        },
        onError: (err: any) => {
            setActionError(err.response?.data?.message || err.message || 'Failed to post journal');
        }
    });

    const reverseMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) => journalApi.reverse(id, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
            setReverseModalOpen(false);
            setReversalReason('');
            setReversalTarget(null);
            setActionError(null);
        },
        onError: (err: any) => {
            setActionError(err.response?.data?.message || err.message || 'Failed to reverse journal');
        }
    });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => journalApi.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
            setActionError(null);
        },
        onError: (err: any) => {
            setActionError(err.response?.data?.message || err.message || 'Failed to cancel journal');
        }
    });

    const filteredEntries = entries?.filter(entry => {
        const matchesSearch = 
            entry.transaction_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (entry.reference && entry.reference.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleOpenDetail = (id: string) => {
        setSelectedJournalId(id);
        setDetailModalOpen(true);
        setActionError(null);
    };

    const handleOpenReverse = (entry: JournalEntry) => {
        setReversalTarget(entry);
        setReversalReason('');
        setReverseModalOpen(true);
        setActionError(null);
    };

    const handleConfirmReverse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reversalTarget || !reversalReason.trim()) return;
        reverseMutation.mutate({ id: reversalTarget.id, reason: reversalReason.trim() });
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <ArrowRightLeft className="text-blue-500" size={32} />
                        Journal Entries
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage, approve, post, and reverse general ledger accounting vouchers</p>
                </div>
                <Button
                    leftIcon={<Plus size={20} />}
                    onClick={() => navigate('/finance/journals/new')}
                    className="rounded-xl shadow-lg shadow-blue-500/20"
                >
                    New Journal
                </Button>
            </div>

            {actionError && (
                <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle size={20} />
                        <span className="text-sm font-medium">{actionError}</span>
                    </div>
                    <button onClick={() => setActionError(null)} className="p-1 hover:bg-destructive/20 rounded-lg">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="bg-card/40 backdrop-blur-xl border border-border rounded-3xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
                
                {/* Search & Filter Bar */}
                <div className="px-6 py-4 border-b border-border bg-muted/20 flex flex-wrap gap-4 items-center justify-between relative z-10">
                    <div className="relative flex-1 min-w-[280px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search transaction number, description..." 
                            className="w-full bg-background/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-background/80 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                        >
                            <option value="all">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="approved">Approved</option>
                            <option value="posted">Posted</option>
                            <option value="reversed">Reversed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto relative z-10">
                    <Table className="border-none rounded-none shadow-none">
                        <TableHead>
                            <TableRow className="bg-card/90 backdrop-blur-md border-b border-border">
                                <TableTh><div className="flex items-center gap-2"><FileDigit size={14} className="text-muted-foreground"/> Transaction Ref</div></TableTh>
                                <TableTh><div className="flex items-center gap-2"><Calendar size={14} className="text-muted-foreground"/> Date</div></TableTh>
                                <TableTh><div className="flex items-center gap-2"><Info size={14} className="text-muted-foreground"/> Description</div></TableTh>
                                <TableTh>Reference</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh align="center">Actions</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableTd colSpan={6} className="p-0">
                                        <div className="p-4"><TableSkeleton rows={5} cols={6} /></div>
                                    </TableTd>
                                </TableRow>
                            ) : filteredEntries && filteredEntries.length > 0 ? (
                                filteredEntries.map((entry) => (
                                    <TableRow key={entry.id} className="hover:bg-muted/40 transition-colors group">
                                        <TableTd>
                                            <span className="font-mono font-bold text-primary">{entry.transaction_number}</span>
                                            {entry.reversal_source_id && (
                                                <div className="text-[11px] text-amber-500 font-medium">Reversal Voucher</div>
                                            )}
                                        </TableTd>
                                        <TableTd>
                                            <span className="font-medium">{entry.date ? new Date(entry.date).toLocaleDateString() : '-'}</span>
                                        </TableTd>
                                        <TableTd className="text-foreground/80 font-medium max-w-xs truncate">
                                            {entry.description}
                                            {entry.reversal_reason && (
                                                <div className="text-xs text-muted-foreground italic mt-0.5">Reason: {entry.reversal_reason}</div>
                                            )}
                                        </TableTd>
                                        <TableTd className="text-muted-foreground">
                                            {entry.reference || <span className="italic opacity-50">None</span>}
                                        </TableTd>
                                        <TableTd>
                                            <StatusBadge status={entry.status} />
                                        </TableTd>
                                        <TableTd align="center">
                                            <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                                                {/* View Detail Button */}
                                                <ActionIcon 
                                                    title="View Details"
                                                    onClick={() => handleOpenDetail(entry.id)}
                                                    className="hover:bg-blue-500/20 text-blue-400 border border-border/50"
                                                >
                                                    <Eye size={15} />
                                                </ActionIcon>

                                                {/* Submit Button (for Draft) */}
                                                {entry.status === 'draft' && (
                                                    <ActionIcon 
                                                        title="Submit for Approval"
                                                        onClick={() => submitMutation.mutate(entry.id)}
                                                        className="hover:bg-amber-500/20 text-amber-400 border border-border/50"
                                                    >
                                                        <Send size={15} />
                                                    </ActionIcon>
                                                )}

                                                {/* Approve Button (for Submitted) */}
                                                {entry.status === 'submitted' && (
                                                    <ActionIcon 
                                                        title="Approve Journal (Maker-Checker)"
                                                        onClick={() => approveMutation.mutate(entry.id)}
                                                        className="hover:bg-emerald-500/20 text-emerald-400 border border-border/50"
                                                    >
                                                        <CheckCircle2 size={15} />
                                                    </ActionIcon>
                                                )}

                                                {/* Post Button (for Approved) */}
                                                {entry.status === 'approved' && (
                                                    <ActionIcon 
                                                        title="Post to General Ledger"
                                                        onClick={() => postMutation.mutate(entry.id)}
                                                        className="hover:bg-primary/20 text-primary border border-border/50"
                                                    >
                                                        <BookOpen size={15} />
                                                    </ActionIcon>
                                                )}

                                                {/* Reverse Button (for Posted) */}
                                                {entry.status === 'posted' && (
                                                    <ActionIcon 
                                                        title="Reverse Voucher (Create Reversal Journal)"
                                                        onClick={() => handleOpenReverse(entry)}
                                                        className="hover:bg-rose-500/20 text-rose-400 border border-border/50"
                                                    >
                                                        <RotateCcw size={15} />
                                                    </ActionIcon>
                                                )}

                                                {/* Cancel Button (for Draft/Submitted/Approved) */}
                                                {['draft', 'submitted', 'approved'].includes(entry.status) && (
                                                    <ActionIcon 
                                                        title="Cancel Journal"
                                                        onClick={() => cancelMutation.mutate(entry.id)}
                                                        className="hover:bg-muted/80 text-muted-foreground border border-border/50"
                                                    >
                                                        <XCircle size={15} />
                                                    </ActionIcon>
                                                )}
                                            </div>
                                        </TableTd>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableTd colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                                <FileText size={24} className="opacity-50" />
                                            </div>
                                            <span className="font-bold uppercase tracking-widest text-xs">No Journals Found</span>
                                            <p className="mt-2 text-sm opacity-70">There are no journal entries matching your criteria.</p>
                                        </div>
                                    </TableTd>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Journal Detail Modal */}
            {detailModalOpen && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <FileDigit className="text-primary" size={20} />
                                    {journalDetail?.header.transaction_number || 'Journal Entry Details'}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Status: <span className="uppercase font-semibold text-primary">{journalDetail?.header.status}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => setDetailModalOpen(false)}
                                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {isLoadingDetail ? (
                                <TableSkeleton rows={4} cols={4} />
                            ) : journalDetail ? (
                                <>
                                    {/* Header Summary */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-muted/20 border border-border/50 text-sm">
                                        <div>
                                            <span className="text-muted-foreground text-xs block">Date</span>
                                            <span className="font-medium">{new Date(journalDetail.header.date).toLocaleDateString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-xs block">Reference</span>
                                            <span className="font-medium">{journalDetail.header.reference || '-'}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground text-xs block">Description</span>
                                            <span className="font-medium">{journalDetail.header.description}</span>
                                        </div>
                                        {journalDetail.header.reversal_reason && (
                                            <div className="col-span-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                                                <span className="font-bold">Reversal Reason:</span> {journalDetail.header.reversal_reason}
                                            </div>
                                        )}
                                    </div>

                                    {/* Lines Table */}
                                    <div>
                                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Accounting Lines</h4>
                                        <div className="border border-border rounded-2xl overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-muted/40 text-muted-foreground border-b border-border text-xs">
                                                    <tr>
                                                        <th className="p-3 text-left">Account ID</th>
                                                        <th className="p-3 text-left">Description</th>
                                                        <th className="p-3 text-right">Debit</th>
                                                        <th className="p-3 text-right">Credit</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {journalDetail.lines.map((line, idx) => (
                                                        <tr key={idx} className="hover:bg-muted/20">
                                                            <td className="p-3 font-mono text-xs text-primary">{line.account_id}</td>
                                                            <td className="p-3 text-muted-foreground">{line.description || '-'}</td>
                                                            <td className="p-3 text-right font-mono font-medium text-foreground">
                                                                {parseFloat(line.debit) > 0 ? parseFloat(line.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                            </td>
                                                            <td className="p-3 text-right font-mono font-medium text-foreground">
                                                                {parseFloat(line.credit) > 0 ? parseFloat(line.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-muted/50 font-bold border-t border-border">
                                                    <tr>
                                                        <td colSpan={2} className="p-3 text-right text-xs uppercase tracking-wider">Total Balance:</td>
                                                        <td className="p-3 text-right font-mono text-primary">
                                                            {journalDetail.lines.reduce((sum, l) => sum + parseFloat(l.debit || '0'), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="p-3 text-right font-mono text-primary">
                                                            {journalDetail.lines.reduce((sum, l) => sum + parseFloat(l.credit || '0'), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
                            <Button variant="secondary" onClick={() => setDetailModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reversal Reason Modal */}
            {reverseModalOpen && reversalTarget && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <form onSubmit={handleConfirmReverse} className="bg-card border border-border rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-destructive/10 text-destructive">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <RotateCcw size={20} />
                                Reverse Journal Voucher
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => setReverseModalOpen(false)}
                                className="p-1 rounded-lg hover:bg-destructive/20"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Are you sure you want to reverse voucher <strong className="text-foreground">{reversalTarget.transaction_number}</strong>? 
                                A new reversal voucher will be posted to the General Ledger swapping all Debit and Credit entries.
                            </p>

                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                                    Reversal Reason <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={reversalReason}
                                    onChange={(e) => setReversalReason(e.target.value)}
                                    placeholder="Enter compliance or correction reason (e.g. Incorrect account classification)..."
                                    className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3">
                            <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={() => setReverseModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                variant="danger"
                                loading={reverseMutation.isPending}
                            >
                                Confirm Reversal
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
