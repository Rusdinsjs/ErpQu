import React, { useState, useEffect } from 'react';
import { approvalWorkflowApi } from '../api/approvalWorkflow';
import { approvalEntityTypesApi, type ApprovalEntityType } from '../api/approvalEntityTypes';
import { rbacApi } from '../api/rbac';
import type { Role } from '../../../types';
import type { ApprovalWorkflow, ApprovalWorkflowRequest } from '../../contracts/types/contract';
import { Plus, Edit2, Trash2, X, Save, Search, Settings, Sparkles, CheckCircle2, ArrowRight, Layers, ShieldCheck, HelpCircle } from 'lucide-react';
import { Card, Button, PageHeader, SearchInput } from '../../../components/ui';
import { APPROVAL_ENTITY_TYPES as FALLBACK_ENTITY_TYPES } from '../config/approvalEntities';
import * as LucideIcons from 'lucide-react';

const PRESET_WORKFLOW_TEMPLATES = [
    {
        name: 'Persetujuan Purchase Order (PO)',
        entity_type: 'purchase_order',
        levels: 2,
        desc: 'Supervisor Gudang -> Manajer Keuangan',
        l1: 'manager',
        l2: 'admin'
    },
    {
        name: 'Klaim Biaya & Reimbursement',
        entity_type: 'expense_report',
        levels: 2,
        desc: 'Kepala Divisi -> Manajer Keuangan',
        l1: 'manager',
        l2: 'admin'
    },
    {
        name: 'Pengajuan Cuti / Izin HRD',
        entity_type: 'leave_request',
        levels: 2,
        desc: 'Atasan Langsung -> HR Manager',
        l1: 'manager',
        l2: 'admin'
    },
    {
        name: 'Work Order & Pemeliharaan Kritis',
        entity_type: 'work_order',
        levels: 2,
        desc: 'Supervisor Bengkel -> Manajer Operasional',
        l1: 'manager',
        l2: 'admin'
    },
    {
        name: 'Kontrak Sewa Alat Berat (Tier 3)',
        entity_type: 'contract',
        levels: 3,
        desc: 'Sales Lead -> Legal Manager -> Direksi',
        l1: 'manager',
        l2: 'admin',
        l3: 'super_admin'
    }
];

const ApprovalWorkflowSettings: React.FC = () => {
    const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
    const [entityTypes, setEntityTypes] = useState<ApprovalEntityType[]>(FALLBACK_ENTITY_TYPES as ApprovalEntityType[]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null);

    // Entity Management Modals State
    const [showEntityManagerModal, setShowEntityManagerModal] = useState(false);
    const [showAddEditEntityModal, setShowAddEditEntityModal] = useState(false);
    const [editingEntity, setEditingEntity] = useState<ApprovalEntityType | null>(null);
    const [entityFormData, setEntityFormData] = useState({
        value: '',
        label: '',
        icon: 'FileText',
        color: 'text-indigo-400',
        description: '',
        backend_module: '',
    });

    const [formData, setFormData] = useState<ApprovalWorkflowRequest>({
        workflow_name: '',
        entity_type: 'asset',
        approval_levels: 1,
        level_1_role: '',
        level_2_role: '',
        level_3_role: '',
        level_4_role: '',
        level_5_role: '',
        is_active: true,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [workflowData, entityTypeData, roleData] = await Promise.all([
                approvalWorkflowApi.getAll(),
                approvalEntityTypesApi.list().catch(() => FALLBACK_ENTITY_TYPES as ApprovalEntityType[]),
                rbacApi.listRoles(),
            ]);
            setWorkflows(workflowData || []);
            if (entityTypeData && entityTypeData.length > 0) {
                setEntityTypes(entityTypeData);
            }
            setRoles(roleData || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingWorkflow(null);
        setFormData({
            workflow_name: '',
            entity_type: entityTypes[0]?.value || 'purchase_order',
            approval_levels: 2,
            level_1_role: roles.find(r => r.role_level === 3)?.code || roles[0]?.code || '',
            level_2_role: roles.find(r => r.role_level === 2)?.code || roles[0]?.code || '',
            level_3_role: '',
            level_4_role: '',
            level_5_role: '',
            is_active: true,
        });
        setShowModal(true);
    };

    const handleApplyPreset = (preset: typeof PRESET_WORKFLOW_TEMPLATES[0]) => {
        setFormData({
            workflow_name: preset.name,
            entity_type: preset.entity_type,
            approval_levels: preset.levels,
            level_1_role: preset.l1,
            level_2_role: preset.l2,
            level_3_role: preset.l3 || '',
            level_4_role: '',
            level_5_role: '',
            is_active: true,
        });
    };

    const handleEdit = (workflow: ApprovalWorkflow) => {
        setEditingWorkflow(workflow);
        setFormData({
            workflow_name: workflow.workflow_name,
            entity_type: workflow.entity_type,
            approval_levels: workflow.approval_levels,
            level_1_role: workflow.level_1_role || '',
            level_2_role: workflow.level_2_role || '',
            level_3_role: workflow.level_3_role || '',
            level_4_role: workflow.level_4_role || '',
            level_5_role: workflow.level_5_role || '',
            is_active: workflow.is_active,
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (editingWorkflow) {
                await approvalWorkflowApi.update(editingWorkflow.id, formData);
            } else {
                await approvalWorkflowApi.create(formData);
            }
            setShowModal(false);
            loadData();
        } catch (error: any) {
            console.error('Failed to save workflow:', error);
            const msg = error?.response?.data?.error || error?.message || 'Gagal menyimpan alur persetujuan';
            alert(msg);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus alur persetujuan ini?')) return;
        try {
            await approvalWorkflowApi.delete(id);
            loadData();
        } catch (error) {
            console.error('Failed to delete workflow:', error);
        }
    };

    const filteredWorkflows = workflows.filter(w => 
        w.workflow_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        w.entity_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        <span>Manajemen Alur Persetujuan (Approval Workflows)</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Atur tahapan otorisasi berjenjang (multi-stage approvals) untuk dokumen pembelian, klaim biaya, mutasi aset, dan kontrak.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowEntityManagerModal(true)}
                        className="flex items-center gap-2 text-xs"
                    >
                        <Settings size={15} />
                        <span>Kelola Jenis Entitas Dokumen</span>
                    </Button>

                    <Button
                        onClick={handleCreate}
                        className="flex items-center gap-2 text-xs"
                    >
                        <Plus size={15} />
                        <span>Buat Alur Baru</span>
                    </Button>
                </div>
            </div>

            {/* Search & Info Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-2xl border border-border">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Cari nama alur kerja atau jenis dokumen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-background/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                    />
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="font-semibold text-foreground">{workflows.length} Alur Aktif</span>
                    <span>·</span>
                    <span>{entityTypes.length} Tipe Dokumen Terdaftar</span>
                </div>
            </div>

            {/* Workflow Cards Grid */}
            {loading ? (
                <div className="text-center py-16 text-xs text-muted-foreground">
                    Memuat daftar alur persetujuan...
                </div>
            ) : filteredWorkflows.length === 0 ? (
                <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl space-y-3">
                    <Layers className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                    <p className="font-bold text-sm text-foreground">Belum Ada Alur Persetujuan</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Klik tombol "Buat Alur Baru" di atas untuk menambahkan tahapan otorisasi berjenjang.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredWorkflows.map((workflow) => {
                        const entityConfig = entityTypes.find(ent => ent.value === workflow.entity_type);
                        const IconComponent = entityConfig?.icon ? (LucideIcons as any)[entityConfig.icon] : Layers;

                        return (
                            <div
                                key={workflow.id}
                                className="bg-card border border-border/80 hover:border-primary/50 hover:shadow-xl transition-all duration-300 rounded-3xl p-6 flex flex-col justify-between space-y-6"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary mt-0.5">
                                                {IconComponent ? <IconComponent size={20} /> : <Layers size={20} />}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base text-foreground leading-snug">
                                                    {workflow.workflow_name}
                                                </h3>
                                                <span className={`text-[11px] font-semibold uppercase tracking-wider block mt-1 ${entityConfig?.color || 'text-primary'}`}>
                                                    {entityConfig?.label || workflow.entity_type}
                                                </span>
                                            </div>
                                        </div>

                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${workflow.is_active
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                            : 'bg-muted text-muted-foreground border-border'
                                            }`}>
                                            {workflow.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </div>

                                    {/* Visual Stepper Pipeline */}
                                    <div className="space-y-2 pt-2 border-t border-border/60">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                                            <span>Tahapan Otorisasi</span>
                                            <span className="text-primary">{workflow.approval_levels} Tingkat Persetujuan</span>
                                        </div>

                                        <div className="space-y-2 pt-1">
                                            {[1, 2, 3, 4, 5].slice(0, workflow.approval_levels).map((lvl) => {
                                                const rawRole = (workflow as any)[`level_${lvl}_role`];
                                                const roleObj = roles.find(r => r.code === rawRole || r.name === rawRole);
                                                const displayRole = roleObj ? roleObj.name : rawRole;

                                                return (
                                                    <div
                                                        key={lvl}
                                                        className="flex items-center gap-3 bg-background/50 border border-border/60 rounded-xl p-2.5 text-xs"
                                                    >
                                                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                                            {lvl}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <span className="font-semibold text-foreground truncate block">
                                                                {displayRole || <span className="text-muted-foreground italic">Belum ditentukan</span>}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground font-mono">
                                                            Tingkat {lvl}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-2">
                                    <button
                                        onClick={() => handleEdit(workflow)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-muted hover:bg-primary hover:text-primary-foreground rounded-xl transition-all text-xs font-semibold text-foreground"
                                    >
                                        <Edit2 size={14} />
                                        <span>Ubah Alur</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(workflow.id)}
                                        className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                                        title="Hapus Alur Persetujuan"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Tambah / Edit Alur */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/40 shrink-0">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Sparkles size={18} className="text-primary" />
                                <span>{editingWorkflow ? 'Ubah Alur Persetujuan' : 'Buat Alur Persetujuan Baru'}</span>
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                            {/* Preset Templates */}
                            {!editingWorkflow && (
                                <div className="space-y-2 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                                        <Sparkles size={14} />
                                        <span>Gunakan Template Siap Pakai (1-Klik)</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                        {PRESET_WORKFLOW_TEMPLATES.map((tmpl, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleApplyPreset(tmpl)}
                                                className="text-left p-2.5 rounded-xl bg-background/80 hover:bg-card border border-border hover:border-primary/40 transition-all space-y-0.5"
                                            >
                                                <span className="text-xs font-bold text-foreground block truncate">{tmpl.name}</span>
                                                <span className="text-[10px] text-muted-foreground block truncate">{tmpl.desc}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                                        Nama Alur Kerja (*Workflow Name*)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Persetujuan Pengadaan Barang Divisi Tambang"
                                        value={formData.workflow_name}
                                        onChange={(e) => setFormData({ ...formData, workflow_name: e.target.value })}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-semibold"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                                            Jenis Dokumen / Entitas
                                        </label>
                                        <select
                                            value={formData.entity_type}
                                            onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-semibold"
                                        >
                                            {entityTypes.map(ent => (
                                                <option key={ent.value} value={ent.value}>
                                                    {ent.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                                            Jumlah Tahapan Approval
                                        </label>
                                        <select
                                            value={formData.approval_levels}
                                            onChange={(e) => setFormData({ ...formData, approval_levels: Number(e.target.value) })}
                                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-semibold"
                                        >
                                            <option value={1}>1 Tingkat (Persetujuan Langsung)</option>
                                            <option value={2}>2 Tingkat (Supervisor -&gt; Manajer)</option>
                                            <option value={3}>3 Tingkat (Supervisor -&gt; Manajer -&gt; Direksi)</option>
                                            <option value={4}>4 Tingkat Otorisasi</option>
                                            <option value={5}>5 Tingkat Otorisasi Maksimal</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Dynamic Levels Configuration */}
                                <div className="space-y-3 pt-2">
                                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                                        Penentuan Role Penyetuju di Setiap Tingkat
                                    </h4>

                                    {[1, 2, 3, 4, 5].slice(0, formData.approval_levels).map((lvl) => (
                                        <div key={lvl} className="flex items-center gap-3 bg-background/50 border border-border rounded-2xl p-3">
                                            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                                {lvl}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[11px] font-bold text-muted-foreground uppercase">
                                                    Penyetuju Tingkat {lvl}
                                                </label>
                                                <select
                                                    value={(formData as any)[`level_${lvl}_role`] || ''}
                                                    onChange={(e) => setFormData({ ...formData, [`level_${lvl}_role`]: e.target.value })}
                                                    className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-semibold"
                                                    required
                                                >
                                                    <option value="">-- Pilih Role yang Berhak Menyetujui --</option>
                                                    {roles.map(r => (
                                                        <option key={r.id} value={r.code}>
                                                            {r.name} (Level {r.role_level || 5})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="wf_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                    />
                                    <label htmlFor="wf_active" className="text-xs font-bold text-foreground cursor-pointer">
                                        Aktifkan Alur Kerja Ini
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border flex justify-end gap-2 shrink-0">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                                    Batal
                                </Button>
                                <Button type="submit">
                                    {editingWorkflow ? 'Simpan Perubahan' : 'Buat Alur Persetujuan'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovalWorkflowSettings;
