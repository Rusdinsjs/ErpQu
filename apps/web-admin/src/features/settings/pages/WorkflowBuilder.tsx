import React, { useState, useEffect } from 'react';
import { GitMerge, Plus, Trash2, Save, FileText, ArrowRight, ShieldCheck, AlertTriangle, Layers, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { workflowApi, type WorkflowWithDocType, type WorkflowState, type WorkflowTransitionDetail } from '../../admin/api/workflow';
import { rbacApi } from '../../admin/api/rbac';
import type { Role } from '../../../types';
import { Button, Card, Select, Input, Badge, useToast, LoadingOverlay, Modal } from '../../../components/ui';

interface DocType {
    id: string;
    name: string;
    module: string;
    description?: string;
    is_submittable: boolean;
}

export function WorkflowBuilder() {
    const [workflows, setWorkflows] = useState<WorkflowWithDocType[]>([]);
    const [docTypes, setDocTypes] = useState<DocType[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
    const [workflowDetail, setWorkflowDetail] = useState<{
        workflow: WorkflowWithDocType;
        states: WorkflowState[];
        transitions: WorkflowTransitionDetail[];
    } | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form states
    const [newWfName, setNewWfName] = useState('');
    const [newWfDocType, setNewWfDocType] = useState('');
    const [newWfStatusField, setNewWfStatusField] = useState('workflow_state');

    // New State form
    const [newStateName, setNewStateName] = useState('');
    const [newStateDocStatus, setNewStateDocStatus] = useState<number>(0);
    const [newStateVariant, setNewStateVariant] = useState('info');
    const [newStateEditRole, setNewStateEditRole] = useState('');

    // New Transition form
    const [newTransStateId, setNewTransStateId] = useState('');
    const [newTransAction, setNewTransAction] = useState('');
    const [newTransNextStateId, setNewTransNextStateId] = useState('');
    const [newTransRole, setNewTransRole] = useState('');

    const { success, error: showError } = useToast();

    useEffect(() => {
        initData();
    }, []);

    useEffect(() => {
        if (selectedWorkflowId) {
            loadWorkflowDetail(selectedWorkflowId);
        } else {
            setWorkflowDetail(null);
        }
    }, [selectedWorkflowId]);

    const initData = async () => {
        setLoading(true);
        try {
            const [wfList, dtList, roleList] = await Promise.all([
                workflowApi.listWorkflows(),
                rbacApi.listDocTypes(),
                rbacApi.listRoles()
            ]);
            setWorkflows(wfList);
            setDocTypes(dtList);
            setRoles(roleList);

            if (wfList.length > 0) {
                setSelectedWorkflowId(wfList[0].id);
            }
        } catch (err: any) {
            showError('Gagal memuat data Workflow', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const loadWorkflowDetail = async (id: string) => {
        setSaving(true);
        try {
            const detail = await workflowApi.getWorkflowDetail(id);
            setWorkflowDetail(detail);
        } catch (err: any) {
            showError('Gagal memuat rincian alur kerja', 'Error');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateWorkflow = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWfName.trim() || !newWfDocType) {
            showError('Mohon isi nama workflow dan pilih DocType target');
            return;
        }

        setSaving(true);
        try {
            const created = await workflowApi.createWorkflow({
                workflow_name: newWfName.trim(),
                doctype_id: newWfDocType,
                document_status_field: newWfStatusField.trim() || 'workflow_state'
            });

            // Seed default basic states for convenience
            await workflowApi.saveWorkflowState(created.id, {
                state_name: 'Draft',
                doc_status: 0,
                style_variant: 'secondary'
            });
            await workflowApi.saveWorkflowState(created.id, {
                state_name: 'Approved',
                doc_status: 1,
                style_variant: 'success'
            });
            await workflowApi.saveWorkflowState(created.id, {
                state_name: 'Rejected',
                doc_status: 2,
                style_variant: 'danger'
            });

            success('Alur kerja berhasil dibuat beserta tahapan standar');
            setIsCreateModalOpen(false);
            setNewWfName('');
            setNewWfDocType('');
            
            const updatedList = await workflowApi.listWorkflows();
            setWorkflows(updatedList);
            setSelectedWorkflowId(created.id);
        } catch (err: any) {
            showError(err.response?.data?.message || 'Gagal membuat alur kerja baru', 'Error');
        } finally {
            setSaving(false);
        }
    };

    const handleAddState = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWorkflowId || !newStateName.trim()) return;

        setSaving(true);
        try {
            await workflowApi.saveWorkflowState(selectedWorkflowId, {
                state_name: newStateName.trim(),
                doc_status: newStateDocStatus,
                allow_edit_role_id: newStateEditRole || undefined,
                style_variant: newStateVariant
            });
            success('Tahapan status berhasil disimpan');
            setNewStateName('');
            setNewStateEditRole('');
            loadWorkflowDetail(selectedWorkflowId);
        } catch (err: any) {
            showError(err.response?.data?.message || 'Gagal menyimpan tahapan status', 'Error');
        } finally {
            setSaving(false);
        }
    };

    const handleAddTransition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWorkflowId || !newTransStateId || !newTransAction.trim() || !newTransNextStateId || !newTransRole) {
            showError('Mohon lengkapi seluruh formulir aturan transisi');
            return;
        }

        setSaving(true);
        try {
            await workflowApi.saveWorkflowTransition(selectedWorkflowId, {
                state_id: newTransStateId,
                action_name: newTransAction.trim(),
                next_state_id: newTransNextStateId,
                allowed_role_id: newTransRole
            });
            success('Aturan transisi berhasil ditambahkan');
            setNewTransAction('');
            loadWorkflowDetail(selectedWorkflowId);
        } catch (err: any) {
            showError(err.response?.data?.message || 'Gagal menambahkan aturan transisi', 'Error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteWorkflow = async () => {
        if (!selectedWorkflowId) return;
        if (!window.confirm('Apakah Anda yakin ingin menghapus alur kerja ini? Seluruh aturan status dan transisi akan dihapus.')) return;

        setSaving(true);
        try {
            await workflowApi.deleteWorkflow(selectedWorkflowId);
            success('Alur kerja berhasil dihapus');
            const updated = await workflowApi.listWorkflows();
            setWorkflows(updated);
            setSelectedWorkflowId(updated.length > 0 ? updated[0].id : '');
        } catch (err: any) {
            showError(err.response?.data?.message || 'Gagal menghapus alur kerja', 'Error');
        } finally {
            setSaving(false);
        }
    };

    // Deadlock & Orphan State Analysis
    const deadlocks = workflowDetail ? workflowDetail.states.filter(s => {
        // A state with doc_status 0 (Draft/In Review) that has no outgoing transitions is an orphan/deadlock
        const hasOutgoing = workflowDetail.transitions.some(t => t.state_id === s.id);
        return s.doc_status === 0 && !hasOutgoing;
    }) : [];

    const hasSubmittedState = workflowDetail ? workflowDetail.states.some(s => s.doc_status === 1) : true;

    return (
        <Card className="p-6 space-y-6 relative border-border">
            <LoadingOverlay visible={loading || saving} />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-2xl border border-primary/20">
                        <GitMerge size={26} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-foreground">ERPQu Workflow Builder Engine</h2>
                            <Badge variant="primary" className="text-xs">ERP Standard</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Perancang alur kerja dinamis, status tahapan (States), dan aturan persetujuan (Transitions) antar Role.
                        </p>
                    </div>
                </div>

                <Button
                    variant="primary"
                    leftIcon={<Plus size={16} />}
                    onClick={() => setIsCreateModalOpen(true)}
                    className="shrink-0"
                >
                    Buat Workflow Baru
                </Button>
            </div>

            {/* Selector Bar */}
            <div className="bg-muted/40 p-4 rounded-2xl border border-border flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="w-full md:w-1/2 space-y-1">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                        Pilih Workflow Aktif
                    </label>
                    <Select
                        value={selectedWorkflowId}
                        onChange={(val: string) => setSelectedWorkflowId(val)}
                        options={workflows.map((w: WorkflowWithDocType) => ({
                            value: w.id,
                            label: `${w.workflow_name} [${w.doctype_name}]`
                        }))}
                    />
                </div>

                {workflowDetail && (
                    <div className="flex items-center gap-4 text-xs">
                        <div>
                            <span className="text-muted-foreground">DocType Target:</span>{' '}
                            <span className="font-bold text-primary">{workflowDetail.workflow.doctype_name} ({workflowDetail.workflow.document_status_field})</span>
                        </div>

                        <Button
                            variant="danger"
                            leftIcon={<Trash2 size={14} />}
                            className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20"
                            onClick={handleDeleteWorkflow}
                        >
                            Hapus Workflow
                        </Button>
                    </div>
                )}
            </div>

            {/* Workflow Detail Canvas */}
            {workflowDetail ? (
                <div className="space-y-8">
                    {/* Validation Warnings */}
                    {deadlocks.length > 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                                <p className="font-bold text-amber-600 dark:text-amber-400">
                                    Peringatan Alur Buntu (Deadlock Detected)
                                </p>
                                <p className="text-muted-foreground">
                                    Status berikut berstatus draf/review namun tidak memiliki transisi aksi keluar:
                                    {' '}<strong>{deadlocks.map(d => d.state_name).join(', ')}</strong>.
                                    Tambahkan aturan transisi agar dokumen tidak terhenti pada tahapan ini.
                                </p>
                            </div>
                        </div>
                    )}

                    {!hasSubmittedState && (
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                                <p className="font-bold text-rose-600 dark:text-rose-400">
                                    Belum Ada Status Resmi (Submitted)
                                </p>
                                <p className="text-muted-foreground">
                                    Workflow ini belum memiliki status dengan DocStatus = 1 (Submitted). Tambahkan status akhir seperti "Approved" agar dokumen dapat disahkan.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* SECTION 0: VISUAL FLOW PREVIEW */}
                    <div className="space-y-3 bg-card/60 border border-border p-4 rounded-2xl">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-primary" />
                            <h3 className="text-sm font-bold text-foreground">Diagram Pratinjau Alur (Visual Flow Preview)</h3>
                        </div>

                        <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
                            {workflowDetail.states.map((st, idx) => {
                                const outgoingTransitions = workflowDetail.transitions.filter(t => t.state_id === st.id);

                                return (
                                    <React.Fragment key={st.id || st.state_name}>
                                        {idx > 0 && (
                                            <div className="flex items-center text-muted-foreground/50 px-1">
                                                <ChevronRight size={18} />
                                            </div>
                                        )}
                                        <div className="bg-background border border-border rounded-xl p-3 min-w-[170px] space-y-1.5 shadow-sm">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="font-bold text-xs text-foreground truncate">{st.state_name}</span>
                                                <Badge variant={st.style_variant as any} className="text-[10px] px-1.5 py-0">
                                                    Doc: {st.doc_status}
                                                </Badge>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
                                                {outgoingTransitions.length > 0 ? (
                                                    <span className="text-primary font-medium">{outgoingTransitions.length} aksi transisi</span>
                                                ) : st.doc_status === 1 ? (
                                                    <span className="text-emerald-500 font-bold">✓ Status Sah Akhir</span>
                                                ) : st.doc_status === 2 ? (
                                                    <span className="text-rose-500 font-bold">✗ Status Batal</span>
                                                ) : (
                                                    <span className="text-amber-500 font-medium">Tanpa Transisi</span>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* SECTION 1: STATES */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                <Layers size={18} className="text-primary" />
                                <span>1. Tahapan Status (Workflow States)</span>
                            </h3>
                        </div>

                        {/* Add State Form */}
                        <form onSubmit={handleAddState} className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-muted/20 p-3.5 rounded-2xl border border-border">
                            <Input
                                placeholder="Nama Status (misal: Pending Supervisor)"
                                value={newStateName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewStateName(e.target.value)}
                                required
                            />

                            <Select
                                value={newStateDocStatus.toString()}
                                onChange={(val: string) => setNewStateDocStatus(parseInt(val, 10))}
                                options={[
                                    { value: '0', label: 'Draft (DocStatus 0)' },
                                    { value: '1', label: 'Submitted (DocStatus 1)' },
                                    { value: '2', label: 'Cancelled (DocStatus 2)' }
                                ]}
                            />

                            <Select
                                value={newStateVariant}
                                onChange={(val: string) => setNewStateVariant(val)}
                                options={[
                                    { value: 'info', label: 'Badge Info (Cyan)' },
                                    { value: 'warning', label: 'Badge Warning (Amber)' },
                                    { value: 'success', label: 'Badge Success (Green)' },
                                    { value: 'danger', label: 'Badge Danger (Red)' },
                                    { value: 'secondary', label: 'Badge Secondary (Gray)' }
                                ]}
                            />

                            <Select
                                value={newStateEditRole}
                                onChange={(val: string) => setNewStateEditRole(val)}
                                options={[
                                    { value: '', label: '-- Siapa Boleh Edit? (Opsional) --' },
                                    ...roles.map((r: Role) => ({ value: r.id, label: r.name }))
                                ]}
                            />

                            <Button type="submit" variant="primary" leftIcon={<Plus size={14} />}>
                                Tambah State
                            </Button>
                        </form>

                        {/* States Table */}
                        <div className="overflow-x-auto border border-border rounded-2xl">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                                    <tr>
                                        <th className="p-3">Nama Status (State Name)</th>
                                        <th className="p-3 text-center">DocStatus</th>
                                        <th className="p-3 text-center">Badge Color</th>
                                        <th className="p-3">Allowed Edit Role (Guard)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {workflowDetail.states.map((st: WorkflowState) => (
                                        <tr key={st.id || st.state_name} className="hover:bg-muted/20">
                                            <td className="p-3 font-semibold text-foreground">{st.state_name}</td>
                                            <td className="p-3 text-center">
                                                <Badge variant={st.doc_status === 1 ? 'success' : st.doc_status === 2 ? 'danger' : 'info'}>
                                                    {st.doc_status === 0 ? '0 (Draft)' : st.doc_status === 1 ? '1 (Submitted)' : '2 (Cancelled)'}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-center">
                                                <Badge variant={st.style_variant as any}>{st.style_variant}</Badge>
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {roles.find((r: Role) => r.id === st.allow_edit_role_id)?.name || 'Semua Pemegang Izin DocPerm'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECTION 2: TRANSITIONS */}
                    <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                <ArrowRight size={18} className="text-primary" />
                                <span>2. Aturan Transisi & Aksi Persetujuan (Workflow Transitions)</span>
                            </h3>
                        </div>

                        {/* Add Transition Form */}
                        <form onSubmit={handleAddTransition} className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-muted/20 p-3.5 rounded-2xl border border-border">
                            <Select
                                value={newTransStateId}
                                onChange={(val: string) => setNewTransStateId(val)}
                                options={[
                                    { value: '', label: '-- Status Awal (From State) --' },
                                    ...workflowDetail.states.map((s: WorkflowState) => ({ value: s.id!, label: s.state_name }))
                                ]}
                            />

                            <Input
                                placeholder="Nama Aksi (misal: Approve WorkOrder)"
                                value={newTransAction}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTransAction(e.target.value)}
                                required
                            />

                            <Select
                                value={newTransNextStateId}
                                onChange={(val: string) => setNewTransNextStateId(val)}
                                options={[
                                    { value: '', label: '-- Status Tujuan (To State) --' },
                                    ...workflowDetail.states.map((s: WorkflowState) => ({ value: s.id!, label: s.state_name }))
                                ]}
                            />

                            <Select
                                value={newTransRole}
                                onChange={(val: string) => setNewTransRole(val)}
                                options={[
                                    { value: '', label: '-- Role Yang Berhak (Allowed Role) --' },
                                    ...roles.map((r: Role) => ({ value: r.id, label: r.name }))
                                ]}
                            />

                            <Button type="submit" variant="primary" leftIcon={<Plus size={14} />}>
                                Tambah Transisi
                            </Button>
                        </form>

                        {/* Transitions Table */}
                        <div className="overflow-x-auto border border-border rounded-2xl">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider border-b border-border">
                                    <tr>
                                        <th className="p-3">Status Awal (From State)</th>
                                        <th className="p-3 text-primary">Nama Aksi (Action Button)</th>
                                        <th className="p-3">Status Tujuan (Next State)</th>
                                        <th className="p-3">Role Yang Berhak Memicu Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {workflowDetail.transitions.map((tr: WorkflowTransitionDetail) => (
                                        <tr key={tr.id} className="hover:bg-muted/20">
                                            <td className="p-3 font-semibold text-foreground">{tr.state_name}</td>
                                            <td className="p-3 font-mono font-bold text-primary">{tr.action_name}</td>
                                            <td className="p-3 font-semibold text-foreground">{tr.next_state_name}</td>
                                            <td className="p-3 font-semibold text-amber-500">
                                                <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                                                    {tr.allowed_role_name}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-12 text-center text-muted-foreground text-xs">
                    Belum ada Workflow yang dipilih atau dibuat. Klik tombol "Buat Workflow Baru" untuk memulai.
                </div>
            )}

            {/* Create Workflow Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Buat Alur Kerja (Workflow) Baru"
            >
                <form onSubmit={handleCreateWorkflow} className="space-y-4">
                    <Input
                        label="Nama Workflow"
                        placeholder="contoh: Leave Application Approval Workflow"
                        value={newWfName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWfName(e.target.value)}
                        required
                    />

                    <Select
                        label="DocType Target"
                        value={newWfDocType}
                        onChange={(val: string) => setNewWfDocType(val)}
                        options={[
                            { value: '', label: '-- Pilih DocType --' },
                            ...docTypes.map((dt: DocType) => ({ value: dt.id, label: `[${dt.module}] ${dt.name}` }))
                        ]}
                    />

                    <Input
                        label="Kolom Status Dokumen"
                        placeholder="workflow_state"
                        value={newWfStatusField}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWfStatusField(e.target.value)}
                    />

                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" variant="primary" leftIcon={<Save size={16} />}>
                            Simpan Workflow
                        </Button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
}
