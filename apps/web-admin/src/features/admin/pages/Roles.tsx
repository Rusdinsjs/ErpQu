import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Settings, Plus, Users, Layers, Grid, FileCheck } from 'lucide-react';
import { Modal, Input, Button, useToast, PageHeader } from '../../../components/ui';
import { rbacApi } from '../api/rbac';
import type { Role } from '../../../types';

import { RoleHierarchyCards } from '../components/RoleHierarchyCards';
import { FrappeRolePermissionManager } from '../components/FrappeRolePermissionManager';
import { UserPermissionsTab } from '../components/UserPermissionsTab';
import { GlobalMatrixAuditView } from '../components/GlobalMatrixAuditView';

type TabType = 'overview' | 'frappe_matrix' | 'user_perms' | 'global_audit';

export default function Roles() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    // Create & Edit Role Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        role_level: 5
    });

    // Clone Role Modal
    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    const [cloningSourceRole, setCloningSourceRole] = useState<Role | null>(null);
    const [cloneData, setCloneData] = useState({
        code: '',
        name: '',
        description: '',
        role_level: 5
    });

    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: rbacApi.listRoles
    });

    const createMutation = useMutation({
        mutationFn: rbacApi.createRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            setIsModalOpen(false);
            success('Role baru berhasil dibuat');
            resetForm();
        },
        onError: (err: any) => showError(err.message || 'Gagal membuat role')
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => rbacApi.updateRole(editingRole!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            setIsModalOpen(false);
            success('Role berhasil diperbarui');
            resetForm();
        },
        onError: (err: any) => showError(err.message || 'Gagal memperbarui role')
    });

    const deleteMutation = useMutation({
        mutationFn: rbacApi.deleteRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            success('Role berhasil dihapus');
        },
        onError: (err: any) => showError(err.message || 'Gagal menghapus role')
    });

    const cloneMutation = useMutation({
        mutationFn: async (data: typeof cloneData) => {
            const newRole = await rbacApi.createRole(data);
            return newRole;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            setIsCloneModalOpen(false);
            success('Role berhasil diduplikasi');
            setCloningSourceRole(null);
        },
        onError: (err: any) => showError(err.message || 'Gagal menduplikasi role')
    });

    const resetForm = () => {
        setEditingRole(null);
        setFormData({ code: '', name: '', description: '', role_level: 5 });
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({
            code: role.code,
            name: role.name,
            description: role.description || '',
            role_level: role.role_level || 5
        });
        setIsModalOpen(true);
    };

    const handleClone = (role: Role) => {
        setCloningSourceRole(role);
        setCloneData({
            code: `${role.code}_copy`,
            name: `${role.name} (Copy)`,
            description: role.description ? `Salinan dari ${role.name}: ${role.description}` : `Salinan dari ${role.name}`,
            role_level: role.role_level || 5
        });
        setIsCloneModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRole) {
            updateMutation.mutate({
                name: formData.name,
                description: formData.description,
                role_level: Number(formData.role_level)
            });
        } else {
            createMutation.mutate({
                code: formData.code.toLowerCase().replace(/\s+/g, '_'),
                name: formData.name,
                description: formData.description,
                role_level: Number(formData.role_level)
            });
        }
    };

    const handleCloneSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        cloneMutation.mutate({
            code: cloneData.code.toLowerCase().replace(/\s+/g, '_'),
            name: cloneData.name,
            description: cloneData.description,
            role_level: Number(cloneData.role_level)
        });
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6 animate-in fade-in duration-300">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary" />
                        <span>Hak Akses & Manajemen Role (RBAC)</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        Atur hierarki tingkatan wewenang pengguna, matriks izin dokumen per modul, dan pembatasan data baris (Row-Level Security).
                    </p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-border overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Shield size={16} />
                    <span>1. Daftar & Hierarki Role ({roles.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('frappe_matrix')}
                    className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'frappe_matrix'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Layers size={16} />
                    <span>2. Matriks Izin Dokumen (DocPerm)</span>
                </button>

                <button
                    onClick={() => setActiveTab('user_perms')}
                    className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'user_perms'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Users size={16} />
                    <span>3. Pembatasan Data Staf (RLS)</span>
                </button>

                <button
                    onClick={() => setActiveTab('global_audit')}
                    className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'global_audit'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Grid size={16} />
                    <span>4. Audit Matriks Global</span>
                </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (
                <RoleHierarchyCards
                    roles={roles}
                    isLoading={isLoading}
                    onEdit={handleEdit}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onClone={handleClone}
                    onSelectForPerms={() => setActiveTab('frappe_matrix')}
                    onCreateNew={() => { resetForm(); setIsModalOpen(true); }}
                />
            )}

            {activeTab === 'frappe_matrix' && (
                <FrappeRolePermissionManager />
            )}

            {activeTab === 'user_perms' && (
                <UserPermissionsTab />
            )}

            {activeTab === 'global_audit' && (
                <GlobalMatrixAuditView />
            )}

            {/* Modal Tambah / Edit Role */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRole ? 'Edit Role Wewenang' : 'Tambah Role Baru'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!editingRole && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Kode Role (*Role Code*)
                            </label>
                            <input
                                type="text"
                                placeholder="Contoh: operations_manager, technician_field"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                required
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Nama Tampilan (*Display Name*)
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Manajer Operasional Lapangan"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Tingkatan Hierarki (*Role Level*)
                        </label>
                        <select
                            value={formData.role_level}
                            onChange={(e) => setFormData({ ...formData, role_level: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-semibold"
                        >
                            <option value={1}>Level 1 · Super Administrator (Akses Penuh)</option>
                            <option value={2}>Level 2 · System Administrator (Admin Konfigurasi)</option>
                            <option value={3}>Level 3 · Department / Operational Manager (Penyetuju Dokumen)</option>
                            <option value={4}>Level 4 · Operational Staff & Technician (Eksekutor Harian)</option>
                            <option value={5}>Level 5 · Viewer / Guest (Hanya Melihat / Read-Only)</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Deskripsi Wewenang
                        </label>
                        <textarea
                            rows={3}
                            placeholder="Tuliskan cakupan tugas dan tanggung jawab role ini..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                        />
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit">
                            {editingRole ? 'Simpan Perubahan' : 'Buat Role'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Duplikasi / Clone Role */}
            <Modal
                isOpen={isCloneModalOpen}
                onClose={() => setIsCloneModalOpen(false)}
                title={`Duplikasi Role: ${cloningSourceRole?.name}`}
            >
                <form onSubmit={handleCloneSubmit} className="space-y-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-foreground space-y-1">
                        <p className="font-semibold text-blue-600 dark:text-blue-400">
                            Fitur Duplikasi Role (Clone)
                        </p>
                        <p className="text-muted-foreground">
                            Role baru akan dibuat dengan mewarisi struktur level hierarki yang sama.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Kode Role Baru
                        </label>
                        <input
                            type="text"
                            value={cloneData.code}
                            onChange={(e) => setCloneData({ ...cloneData, code: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Nama Tampilan Role Baru
                        </label>
                        <input
                            type="text"
                            value={cloneData.name}
                            onChange={(e) => setCloneData({ ...cloneData, name: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Tingkatan Hierarki
                        </label>
                        <select
                            value={cloneData.role_level}
                            onChange={(e) => setCloneData({ ...cloneData, role_level: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                        >
                            <option value={1}>Level 1 · Super Administrator</option>
                            <option value={2}>Level 2 · System Administrator</option>
                            <option value={3}>Level 3 · Manager</option>
                            <option value={4}>Level 4 · Operational Staff</option>
                            <option value={5}>Level 5 · Viewer</option>
                        </select>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsCloneModalOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit">
                            Duplikasi Sekarang
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
