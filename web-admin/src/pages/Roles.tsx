
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Settings, Plus, Edit, Trash2, Save, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, Modal, Input, Button, useToast, Skeleton, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty, SearchInput, Badge, ActionIcon, PageHeader } from '../components/ui';
import { rbacApi } from '../api/rbac';

import type { Role } from '../types';

import { FrappeRolePermissionManager } from '../components/Admin/FrappeRolePermissionManager';

type TabType = 'overview' | 'frappe_matrix';


function RolesList() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewingRole, setViewingRole] = useState<Role | null>(null);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<'name' | 'code' | 'role_level'>('role_level');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const [formData, setFormData] = useState({
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
            success('Role created successfully');
            resetForm();
        },
        onError: (err: any) => showError(err.message || 'Failed to create role')
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => rbacApi.updateRole(editingRole!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            setIsModalOpen(false);
            success('Role updated successfully');
            resetForm();
        },
        onError: (err: any) => showError(err.message || 'Failed to update role')
    });

    const deleteMutation = useMutation({
        mutationFn: rbacApi.deleteRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            success('Role deleted successfully');
        },
        onError: (err: any) => showError(err.message || 'Failed to delete role')
    });

    const resetForm = () => {
        setEditingRole(null);
        setFormData({ code: '', name: '', description: '', role_level: 5 });
    };

    const handleSort = (field: 'name' | 'code' | 'role_level') => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({
            code: role.code,
            name: role.name,
            description: role.description || '',
            role_level: role.role_level
        });
        setIsModalOpen(true);
    };

    const handleView = (role: Role) => {
        setViewingRole(role);
        setViewModalOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRole) {
            updateMutation.mutate({
                name: formData.name,
                description: formData.description,
                role_level: formData.role_level
            });
        } else {
            createMutation.mutate(formData);
        }
    };

    const filteredRoles = useMemo(() => {
        return (roles as Role[]).filter((r: Role) => {
            if (!search.trim()) return true;
            const query = search.toLowerCase().trim();
            return (r.name || '').toLowerCase().includes(query) ||
                (r.code || '').toLowerCase().includes(query) ||
                (r.description || '').toLowerCase().includes(query);
        }).sort((a: Role, b: Role) => {
            let valA: any = a[sortField] ?? '';
            let valB: any = b[sortField] ?? '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [roles, search, sortField, sortDirection]);

    if (isLoading) return (
        <Card padding="lg">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-24" />
            </div>
            <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        </Card>
    );

    return (
        <Card padding="lg">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-white">Roles Overview</h3>
                    <p className="text-sm text-muted-foreground">Manage system roles and access levels</p>
                </div>
                <Button
                    leftIcon={<Plus size={18} />}
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                >
                    Add Role
                </Button>
            </div>

            {/* Search */}
            <div className="mb-4 max-w-md">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder="Search role by name, code or description..."
                />
            </div>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableTh onClick={() => handleSort('name')} className="cursor-pointer hover:text-white transition-colors">
                            <div className="flex items-center gap-1.5">
                                <span>Role Name</span>
                                {sortField === 'name' ? (
                                    sortDirection === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />
                                ) : (
                                    <ArrowUpDown size={12} className="opacity-40" />
                                )}
                            </div>
                        </TableTh>
                        <TableTh onClick={() => handleSort('code')} className="cursor-pointer hover:text-white transition-colors">
                            <div className="flex items-center gap-1.5">
                                <span>Code</span>
                                {sortField === 'code' ? (
                                    sortDirection === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />
                                ) : (
                                    <ArrowUpDown size={12} className="opacity-40" />
                                )}
                            </div>
                        </TableTh>
                        <TableTh onClick={() => handleSort('role_level')} className="cursor-pointer hover:text-white transition-colors">
                            <div className="flex items-center gap-1.5">
                                <span>Role Level</span>
                                {sortField === 'role_level' ? (
                                    sortDirection === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />
                                ) : (
                                    <ArrowUpDown size={12} className="opacity-40" />
                                )}
                            </div>
                        </TableTh>
                        <TableTh>Description</TableTh>
                        <TableTh align="center">Actions</TableTh>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredRoles.length > 0 ? filteredRoles.map((role: Role) => (
                        <TableRow key={role.id}>
                            <TableTd>
                                <span className="font-semibold text-white">{role.name}</span>
                            </TableTd>
                            <TableTd>
                                <Badge variant="default" className="font-mono">{role.code}</Badge>
                            </TableTd>
                            <TableTd>
                                <Badge variant={role.role_level === 1 ? 'danger' : role.role_level <= 3 ? 'warning' : 'info'}>
                                    Level {role.role_level}
                                </Badge>
                            </TableTd>
                            <TableTd>
                                <span className="text-sm text-muted-foreground">{role.description || 'No description'}</span>
                            </TableTd>
                            <TableTd align="center">
                                <div className="flex items-center justify-center gap-1.5">
                                    <ActionIcon onClick={() => handleView(role)} title="View Details">
                                        <Eye size={16} className="text-cyan-400" />
                                    </ActionIcon>
                                    <ActionIcon onClick={() => handleEdit(role)} title="Edit Role">
                                        <Edit size={16} className="text-amber-400" />
                                    </ActionIcon>
                                    <ActionIcon
                                        variant="danger"
                                        title="Delete Role"
                                        onClick={() => {
                                            if (confirm(`Delete role ${role.name}? This cannot be undone.`)) {
                                                deleteMutation.mutate(role.id);
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} className="text-rose-400" />
                                    </ActionIcon>
                                </div>
                            </TableTd>
                        </TableRow>
                    )) : (
                        <TableEmpty colSpan={5} message="No roles found" />
                    )}
                </TableBody>
            </Table>

            {/* View Modal */}
            <Modal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                title="Role Details"
            >
                {viewingRole && (
                    <div className="p-6 space-y-4 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Role Name</p>
                            <p className="text-lg font-bold text-white mt-1">{viewingRole.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Code</p>
                                <Badge variant="default" className="font-mono mt-1">{viewingRole.code}</Badge>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase font-bold">Level</p>
                                <Badge variant="info" className="mt-1">Level {viewingRole.role_level}</Badge>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold">Description</p>
                            <p className="text-slate-300 mt-1">{viewingRole.description || 'No description provided.'}</p>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRole ? 'Edit Role' : 'Create New Role'}
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Role Name"
                            placeholder="e.g. Field Coordinator"
                            value={formData.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Role Code"
                            placeholder="e.g. FIELD_COORD"
                            value={formData.code}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                            disabled={!!editingRole}
                            required
                        />
                    </div>

                    <div>
                        <Input
                            label="Role Level (1-5)"
                            type="number"
                            min={1}
                            max={5}
                            value={formData.role_level}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, role_level: parseInt(e.target.value) })}
                            required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Level 1: Super Admin (Full Access) <br />
                            Level 5: Basic User (Limited Access)
                        </p>
                    </div>

                    <Input
                        label="Description"
                        placeholder="Brief description of this role's responsibilities"
                        value={formData.description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700 mt-4">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={createMutation.isPending || updateMutation.isPending}
                        >
                            <Save size={18} className="mr-2" />
                            {editingRole ? 'Update Role' : 'Create Role'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </Card>
    );
}


export default function Roles() {
    const [activeTab, setActiveTab] = useState<TabType>('frappe_matrix');

    return (
        <div className="space-y-4">
            <PageHeader
                title="Role Management"
                description="Kelola Peran (Roles) & Matriks Hak Akses Dokumen ERPQu"
            />

            {/* Tabs */}
            <Card padding="none">
                <div className="border-b border-slate-700">
                    <nav className="flex gap-4 px-6">
                        <button
                            onClick={() => setActiveTab('frappe_matrix')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'frappe_matrix'
                                ? 'border-cyan-500 text-cyan-400'
                                : 'border-transparent text-muted-foreground hover:text-slate-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Shield size={16} className="text-cyan-400" />
                                <span>Role Permission Manager (DocPerm)</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
                                ? 'border-cyan-500 text-cyan-400'
                                : 'border-transparent text-muted-foreground hover:text-slate-300'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Settings size={16} />
                                <span>Daftar Role (Roles Overview)</span>
                            </div>
                        </button>
                    </nav>
                </div>
            </Card>

            {/* Tab Content */}
            {activeTab === 'frappe_matrix' && <FrappeRolePermissionManager />}

            {activeTab === 'overview' && <RolesList />}
        </div>
    );
}


