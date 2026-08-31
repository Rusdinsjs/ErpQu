import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Save, FileText, CheckCircle2, HelpCircle, AlertCircle, Check, X } from 'lucide-react';
import { rbacApi } from '../api/rbac';
import type { Role } from '../../../types';
import { Button, Card, Select, Badge, useToast, LoadingOverlay, Modal } from '../../../components/ui';

interface DocType {
    id: string;
    name: string;
    module: string;
    description?: string;
    is_submittable: boolean;
}

interface CustomDocPerm {
    id?: string;
    doctype_id: string;
    role_id: string;
    role_name?: string;
    permlevel: number;
    read_perm: boolean;
    write_perm: boolean;
    create_perm: boolean;
    delete_perm: boolean;
    submit_perm: boolean;
    cancel_perm: boolean;
    amend_perm: boolean;
    print_perm: boolean;
    email_perm: boolean;
    export_perm: boolean;
    import_perm: boolean;
    share_perm: boolean;
    report_perm: boolean;
    if_owner: boolean;
}

const ACTION_DESCRIPTIONS: Record<string, { label: string; desc: string }> = {
    read_perm: { label: 'Read (Melihat)', desc: 'Melihat dan membuka data dokumen' },
    write_perm: { label: 'Write (Mengubah)', desc: 'Mengedit data dokumen yang berstatus Draft' },
    create_perm: { label: 'Create (Membuat)', desc: 'Membuat dokumen baru di sistem' },
    delete_perm: { label: 'Delete (Menghapus)', desc: 'Menghapus data dokumen dari sistem' },
    submit_perm: { label: 'Submit (Finalisasi)', desc: 'Mengajukan dokumen menjadi resmi (Submitted)' },
    cancel_perm: { label: 'Cancel (Batalkan)', desc: 'Membatalkan transaksi yang sudah di-Submit' },
    amend_perm: { label: 'Amend (Revisi)', desc: 'Membuat dokumen revisi baru dari dokumen yang dibatalkan' },
    print_perm: { label: 'Print (Cetak)', desc: 'Mencetak dokumen atau mengekspor ke format PDF' },
    export_perm: { label: 'Export (Unduh)', desc: 'Mengekspor data ke format Excel / CSV' },
    if_owner: { label: 'Only If Owner', desc: 'Hanya berlaku jika dokumen dibuat oleh pengguna tersebut' }
};

export function FrappeRolePermissionManager() {
    const [docTypes, setDocTypes] = useState<DocType[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedDocType, setSelectedDocType] = useState<string>('');
    const [docPerms, setDocPerms] = useState<CustomDocPerm[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Add Role Modal
    const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
    const [selectedNewRoleId, setSelectedNewRoleId] = useState<string>('');
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    const { success, error: showError } = useToast();

    useEffect(() => {
        initData();
    }, []);

    useEffect(() => {
        if (selectedDocType) {
            loadDocPerms(selectedDocType);
        }
    }, [selectedDocType]);

    const initData = async () => {
        setLoading(true);
        try {
            const [dtList, roleList] = await Promise.all([
                rbacApi.listDocTypes(),
                rbacApi.listRoles()
            ]);
            setDocTypes(dtList);
            setRoles(roleList);

            if (dtList.length > 0) {
                setSelectedDocType(dtList[0].id);
            }
        } catch (err: any) {
            showError('Gagal memuat daftar DocType dan Role', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const loadDocPerms = async (dtId: string) => {
        setLoading(true);
        try {
            const perms = await rbacApi.getDocPerms(dtId);
            setDocPerms(perms || []);
            setHasUnsavedChanges(false);
        } catch (err: any) {
            showError('Gagal memuat matriks izin DocType', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePerm = (roleId: string, field: keyof CustomDocPerm) => {
        setDocPerms(prev => prev.map(perm => {
            if (perm.role_id === roleId) {
                return { ...perm, [field]: !perm[field] };
            }
            return perm;
        }));
        setHasUnsavedChanges(true);
    };

    const handleRowSelectAll = (roleId: string, enableAll: boolean) => {
        setDocPerms(prev => prev.map(perm => {
            if (perm.role_id === roleId) {
                return {
                    ...perm,
                    read_perm: enableAll,
                    write_perm: enableAll,
                    create_perm: enableAll,
                    delete_perm: enableAll,
                    submit_perm: enableAll,
                    cancel_perm: enableAll,
                    amend_perm: enableAll,
                    print_perm: enableAll,
                    export_perm: enableAll,
                };
            }
            return perm;
        }));
        setHasUnsavedChanges(true);
    };

    const handleAddRoleRule = () => {
        if (!selectedNewRoleId) return;
        const roleObj = roles.find(r => r.id === selectedNewRoleId);
        if (!roleObj) return;

        // Check if already in docPerms
        if (docPerms.some(p => p.role_id === selectedNewRoleId)) {
            showError('Role ini sudah memiliki aturan di DocType ini');
            return;
        }

        const newRule: CustomDocPerm = {
            doctype_id: selectedDocType,
            role_id: selectedNewRoleId,
            role_name: roleObj.name,
            permlevel: 0,
            read_perm: true,
            write_perm: false,
            create_perm: false,
            delete_perm: false,
            submit_perm: false,
            cancel_perm: false,
            amend_perm: false,
            print_perm: true,
            email_perm: false,
            export_perm: false,
            import_perm: false,
            share_perm: false,
            report_perm: false,
            if_owner: false
        };

        setDocPerms(prev => [...prev, newRule]);
        setHasUnsavedChanges(true);
        setIsAddRoleModalOpen(false);
        setSelectedNewRoleId('');
    };

    const handleRemoveRoleRule = (roleId: string) => {
        setDocPerms(prev => prev.filter(p => p.role_id !== roleId));
        setHasUnsavedChanges(true);
    };

    const handleSaveAll = async () => {
        setSaving(true);
        try {
            for (const perm of docPerms) {
                await rbacApi.saveDocPerm(perm);
            }
            success('Matriks izin berhasil disimpan');
            setHasUnsavedChanges(false);
        } catch (err: any) {
            showError('Gagal menyimpan matriks izin', 'Error');
        } finally {
            setSaving(false);
        }
    };

    const activeDocType = docTypes.find(dt => dt.id === selectedDocType);

    // Available roles to add
    const availableRolesToAdd = roles.filter(r => !docPerms.some(p => p.role_id === r.id));

    return (
        <div className="space-y-6 relative">
            {/* Top Selector Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-2xl border border-border">
                <div className="flex items-center gap-3 flex-1">
                    <div className="space-y-1 w-full max-w-sm">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Pilih Dokumen / Entitas (DocType)
                        </label>
                        <select
                            value={selectedDocType}
                            onChange={(e) => setSelectedDocType(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-semibold"
                        >
                            {docTypes.map(dt => (
                                <option key={dt.id} value={dt.id}>
                                    {dt.name} ({dt.module || 'General'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {activeDocType && (
                        <div className="hidden md:flex items-center gap-2 mt-5">
                            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold">
                                Modul: {activeDocType.module || 'General'}
                            </span>
                            {activeDocType.is_submittable && (
                                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                                    Submittable (Mendukung Approval)
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsHelpModalOpen(true)}
                        className="flex items-center gap-2 text-xs"
                    >
                        <HelpCircle size={15} />
                        <span>Panduan Izin</span>
                    </Button>

                    <Button
                        onClick={() => setIsAddRoleModalOpen(true)}
                        disabled={availableRolesToAdd.length === 0}
                        className="flex items-center gap-2 text-xs"
                    >
                        <Plus size={15} />
                        <span>Tambah Role ke Dokumen Ini</span>
                    </Button>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/60 border-b border-border">
                                <th className="p-3.5 font-bold text-foreground min-w-[180px] sticky left-0 bg-muted z-20">
                                    Role Wewenang
                                </th>
                                <th className="p-3 text-center font-bold text-foreground">Read</th>
                                <th className="p-3 text-center font-bold text-foreground">Write</th>
                                <th className="p-3 text-center font-bold text-foreground">Create</th>
                                <th className="p-3 text-center font-bold text-foreground">Delete</th>
                                <th className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400">Submit</th>
                                <th className="p-3 text-center font-bold text-rose-600 dark:text-rose-400">Cancel</th>
                                <th className="p-3 text-center font-bold text-amber-600 dark:text-amber-400">Amend</th>
                                <th className="p-3 text-center font-bold text-foreground">Print</th>
                                <th className="p-3 text-center font-bold text-foreground">Export</th>
                                <th className="p-3 text-center font-bold text-foreground">If Owner</th>
                                <th className="p-3 text-center font-bold text-foreground min-w-[100px]">Aksi Baris</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={12} className="text-center py-12 text-muted-foreground">
                                        Memuat matriks izin...
                                    </td>
                                </tr>
                            ) : docPerms.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="text-center py-12 text-muted-foreground">
                                        Belum ada aturan role untuk dokumen ini. Klik tombol "+ Tambah Role ke Dokumen Ini".
                                    </td>
                                </tr>
                            ) : (
                                docPerms.map((perm) => {
                                    const roleObj = roles.find(r => r.id === perm.role_id);
                                    const roleName = perm.role_name || roleObj?.name || 'Unknown Role';
                                    const roleLevel = roleObj?.role_level || 5;

                                    return (
                                        <tr key={perm.role_id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3.5 sticky left-0 bg-card z-10 border-r border-border/40">
                                                <div className="space-y-0.5">
                                                    <span className="font-bold text-foreground text-sm block">
                                                        {roleName}
                                                    </span>
                                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold">
                                                        Level {roleLevel}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Perm Toggles */}
                                            {(['read_perm', 'write_perm', 'create_perm', 'delete_perm', 'submit_perm', 'cancel_perm', 'amend_perm', 'print_perm', 'export_perm', 'if_owner'] as (keyof CustomDocPerm)[]).map((field) => (
                                                <td key={field} className="p-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!perm[field]}
                                                        onChange={() => handleTogglePerm(perm.role_id, field)}
                                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                                                    />
                                                </td>
                                            ))}

                                            {/* Row Actions */}
                                            <td className="p-3 text-center border-l border-border/40">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleRowSelectAll(perm.role_id, true)}
                                                        title="Beri Semua Izin"
                                                        className="p-1 rounded text-emerald-600 hover:bg-emerald-500/10 text-[11px] font-bold"
                                                    >
                                                        Semua
                                                    </button>
                                                    <span className="text-border">|</span>
                                                    <button
                                                        onClick={() => handleRowSelectAll(perm.role_id, false)}
                                                        title="Kosongkan Izin"
                                                        className="p-1 rounded text-muted-foreground hover:bg-muted text-[11px] font-medium"
                                                    >
                                                        Reset
                                                    </button>
                                                    <span className="text-border">|</span>
                                                    <button
                                                        onClick={() => handleRemoveRoleRule(perm.role_id)}
                                                        title="Hapus Role dari Dokumen Ini"
                                                        className="p-1 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Floating Unsaved Changes Bar */}
            {hasUnsavedChanges && (
                <div className="fixed bottom-6 right-6 z-50 bg-card border border-primary/40 shadow-2xl rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <span className="text-xs font-semibold text-foreground">
                            Ada perubahan izin yang belum disimpan
                        </span>
                    </div>
                    <Button onClick={handleSaveAll} disabled={saving} className="flex items-center gap-2 text-xs">
                        <Save size={15} />
                        <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </Button>
                </div>
            )}

            {/* Modal Tambah Role ke DocType */}
            <Modal
                isOpen={isAddRoleModalOpen}
                onClose={() => setIsAddRoleModalOpen(false)}
                title={`Tambah Role ke ${activeDocType?.name || 'Dokumen'}`}
            >
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Pilih Role
                        </label>
                        <select
                            value={selectedNewRoleId}
                            onChange={(e) => setSelectedNewRoleId(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                        >
                            <option value="">-- Pilih Role yang Ingin Diberikan Akses --</option>
                            {availableRolesToAdd.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.name} (Level {r.role_level || 5})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddRoleModalOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleAddRoleRule} disabled={!selectedNewRoleId}>
                            Tambahkan Role
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Panduan Istilah Izin */}
            <Modal
                isOpen={isHelpModalOpen}
                onClose={() => setIsHelpModalOpen(false)}
                title="Panduan Istilah Hak Akses Dokumen (DocPerm)"
            >
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 text-xs">
                    {Object.entries(ACTION_DESCRIPTIONS).map(([key, info]) => (
                        <div key={key} className="p-3 rounded-xl bg-background/60 border border-border space-y-1">
                            <h4 className="font-bold text-primary">{info.label}</h4>
                            <p className="text-muted-foreground">{info.desc}</p>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
