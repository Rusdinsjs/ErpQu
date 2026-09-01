import React, { useState, useEffect } from 'react';
import { GitMerge, Check, X, Send, History, Clock, User, MessageSquare, AlertCircle, ChevronRight, ShieldCheck } from 'lucide-react';
import {
    workflowApi,
    type WorkflowDetailResponse,
    type WorkflowTransitionDetail,
    type WorkflowActionLog,
    type WorkflowState
} from '../../features/admin/api/workflow';
import { Button, Badge, Modal, Textarea, useToast } from '../ui';

interface WorkflowActionBarProps {
    workflowId?: string;
    doctypeName?: string;
    documentId: string;
    currentState: string;
    onStateChanged: (newState: string) => void;
    className?: string;
}

export function WorkflowActionBar({
    workflowId,
    doctypeName,
    documentId,
    currentState,
    onStateChanged,
    className = '',
}: WorkflowActionBarProps) {
    const [detail, setDetail] = useState<WorkflowDetailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Modal state for action comment/reason
    const [selectedTransition, setSelectedTransition] = useState<WorkflowTransitionDetail | null>(null);
    const [comments, setComments] = useState('');
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

    // Modal state for Audit Trail History
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [logs, setLogs] = useState<WorkflowActionLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const { success, error: showError } = useToast();

    useEffect(() => {
        loadWorkflow();
    }, [workflowId, doctypeName]);

    const loadWorkflow = async () => {
        setLoading(true);
        try {
            let data: WorkflowDetailResponse | null = null;
            if (doctypeName) {
                data = await workflowApi.getWorkflowByDocType(doctypeName);
            } else if (workflowId) {
                data = await workflowApi.getWorkflowDetail(workflowId);
            }
            setDetail(data);
        } catch (err: any) {
            // Not every document has a workflow assigned, which is normal
            console.debug('No active workflow found for this document/doctype', err);
            setDetail(null);
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async () => {
        if (!documentId) return;
        setLoadingLogs(true);
        try {
            const history = await workflowApi.getDocumentLogs(documentId);
            setLogs(history || []);
        } catch (err: any) {
            console.error('Failed to load workflow logs', err);
            setLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleOpenHistory = () => {
        setIsHistoryModalOpen(true);
        loadLogs();
    };

    if (loading || !detail) return null;

    // Normalizing state comparison
    const normalizedCurrent = currentState.trim().toLowerCase();

    const validTransitions = detail.transitions.filter(
        t => t.state_name.trim().toLowerCase() === normalizedCurrent
    );

    const currentStateObj = detail.states.find(
        s => s.state_name.trim().toLowerCase() === normalizedCurrent
    );

    const handleActionClick = (transition: WorkflowTransitionDetail) => {
        setSelectedTransition(transition);
        setComments('');
        setIsCommentModalOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedTransition || !detail) return;

        setSubmitting(true);
        try {
            const res = await workflowApi.applyWorkflowAction({
                workflow_id: detail.workflow.id,
                document_id: documentId,
                current_state_name: currentState,
                action_name: selectedTransition.action_name,
                comments: comments.trim() || undefined,
            });

            success(`Status dokumen berhasil diperbarui menjadi: ${res.new_state}`, 'Alur Kerja Diperbarui');
            setIsCommentModalOpen(false);
            onStateChanged(res.new_state);
        } catch (err: any) {
            showError(err.response?.data?.message || 'Gagal mengeksekusi transisi alur kerja', 'Otorisasi Ditolak');
        } finally {
            setSubmitting(false);
        }
    };

    // Helper for badge variant based on doc_status
    const getBadgeVariant = (docStatus: number) => {
        switch (docStatus) {
            case 1:
                return 'success';
            case 2:
                return 'danger';
            default:
                return 'info';
        }
    };

    return (
        <div className={`bg-card/90 backdrop-blur-md border border-border p-5 rounded-2xl shadow-sm space-y-4 ${className}`}>
            {/* Top Stepper: Visual Flow Progress */}
            {detail.states.length > 0 && (
                <div className="pb-4 border-b border-border/60">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} className="text-primary" />
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Tahapan Alur Persetujuan: {detail.workflow.workflow_name}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleOpenHistory}
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                        >
                            <History size={14} />
                            <span>Riwayat Persetujuan</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none">
                        {detail.states.map((st, idx) => {
                            const isCurrent = st.state_name.trim().toLowerCase() === normalizedCurrent;
                            const isSubmitted = st.doc_status === 1;
                            const isCancelled = st.doc_status === 2;

                            return (
                                <React.Fragment key={st.id || st.state_name}>
                                    {idx > 0 && (
                                        <ChevronRight size={14} className="text-muted-foreground/40 shrink-0" />
                                    )}
                                    <div
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all ${isCurrent
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20'
                                            : isSubmitted
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                : isCancelled
                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                                                    : 'bg-muted/50 text-muted-foreground border-border'
                                            }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-white animate-pulse' : isSubmitted ? 'bg-emerald-500' : isCancelled ? 'bg-rose-500' : 'bg-muted-foreground/40'}`} />
                                        <span>{st.state_name}</span>
                                        {st.doc_status === 1 && <span className="text-[10px] opacity-80">(Resmi)</span>}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bottom: Current Status & Available Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/20 shrink-0">
                        <GitMerge size={20} />
                    </div>
                    <div>
                        <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider block">
                            Status Dokumen Saat Ini:
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-bold text-foreground text-base">{currentState}</span>
                            {currentStateObj && (
                                <Badge variant={getBadgeVariant(currentStateObj.doc_status)} className="text-xs font-semibold">
                                    {currentStateObj.doc_status === 1
                                        ? 'Terkunci (Submitted)'
                                        : currentStateObj.doc_status === 2
                                            ? 'Dibatalkan (Cancelled)'
                                            : 'Draf (Editable)'}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {/* Transition Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {validTransitions.length === 0 ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-2 rounded-xl border border-border">
                            <AlertCircle size={14} className="text-muted-foreground/70" />
                            <span>Tidak ada aksi transisi aktif untuk peran Anda pada tahapan ini.</span>
                        </div>
                    ) : (
                        validTransitions.map(tr => {
                            const actionLower = tr.action_name.toLowerCase();
                            const isReject = actionLower.includes('reject') || actionLower.includes('tolak') || actionLower.includes('batal');
                            const isApprove = actionLower.includes('approve') || actionLower.includes('setujui') || actionLower.includes('verifikasi');

                            let icon = <Send size={15} />;
                            let btnVariant: 'primary' | 'outline' | 'danger' = 'primary';
                            let customClass = 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm';

                            if (isApprove) {
                                icon = <Check size={15} />;
                                customClass = 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm';
                            } else if (isReject) {
                                icon = <X size={15} />;
                                btnVariant = 'outline';
                                customClass = 'text-rose-600 border-rose-500/30 hover:bg-rose-500/10 dark:text-rose-400';
                            }

                            return (
                                <Button
                                    key={tr.id}
                                    variant={btnVariant}
                                    className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl transition-all ${customClass}`}
                                    onClick={() => handleActionClick(tr)}
                                >
                                    {icon}
                                    <span>{tr.action_name}</span>
                                </Button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Comment & Confirm Modal */}
            <Modal
                isOpen={isCommentModalOpen}
                onClose={() => setIsCommentModalOpen(false)}
                title={`Konfirmasi: ${selectedTransition?.action_name}`}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleConfirmAction();
                    }}
                    className="space-y-4"
                >
                    <div className="bg-muted/50 p-3 rounded-xl border border-border text-xs space-y-1">
                        <p className="text-muted-foreground">
                            Status dokumen akan berubah dari{' '}
                            <span className="font-bold text-foreground">{currentState}</span> ➔{' '}
                            <span className="font-bold text-primary">{selectedTransition?.next_state_name}</span>.
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                            Aksi ini dijalankan dengan wewenang Role:{' '}
                            <span className="font-semibold text-foreground">{selectedTransition?.allowed_role_name}</span>
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">
                            Catatan / Komentar Persetujuan (Opsional)
                        </label>
                        <Textarea
                            placeholder="Tuliskan catatan, instruksi penanganan, atau alasan persetujuan/penolakan..."
                            value={comments}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCommentModalOpen(false)}
                            disabled={submitting}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="bg-primary text-primary-foreground"
                        >
                            {submitting ? 'Memproses...' : 'Konfirmasi & Simpan'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Audit Trail Log History Modal */}
            <Modal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                title="Riwayat Persetujuan & Log Audit Alur Kerja"
            >
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                    {loadingLogs ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">Memuat riwayat persetujuan...</div>
                    ) : logs.length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-border rounded-xl space-y-1">
                            <Clock className="w-7 h-7 text-muted-foreground/50 mx-auto" />
                            <p className="text-xs font-semibold text-foreground">Belum ada riwayat transisi</p>
                            <p className="text-[11px] text-muted-foreground">Dokumen masih berada pada tahapan awal.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-border">
                            {logs.map((log) => (
                                <div key={log.id} className="relative flex items-start gap-3 pl-8">
                                    <div className="absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background" />
                                    <div className="bg-background/60 border border-border rounded-xl p-3 text-xs w-full space-y-1.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-foreground flex items-center gap-1.5">
                                                <User size={13} className="text-primary" />
                                                {log.action_by_user_name}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(log.created_at).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                                            <span className="px-1.5 py-0.5 rounded bg-muted font-medium">{log.from_state}</span>
                                            <span>➔</span>
                                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">{log.to_state}</span>
                                            <span className="text-muted-foreground italic">({log.action_name})</span>
                                        </div>

                                        {log.comments && (
                                            <div className="bg-muted/50 p-2 rounded-lg border border-border/60 text-[11px] text-foreground flex items-start gap-1.5 mt-1">
                                                <MessageSquare size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                                                <span>"{log.comments}"</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end pt-3 border-t border-border">
                        <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)}>
                            Tutup
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
