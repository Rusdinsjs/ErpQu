import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, Plus, Trash2, Shield, Search, Info, Building2, MapPin, Layers, FolderTree } from 'lucide-react';
import { rbacApi } from '../api/rbac';
import { usersApi, type UserSummary } from '../api/users';
import { fetchCompanies, type Company } from '../../company/api/companyApi';
import { departmentApi, type Department } from '../../company/api/departments';
import { inventoryApi } from '../../inventory/api/inventory';
import { categoryApi, type Category } from '../../assets/api/category';
import { Button, Card, Select, Badge, useToast, Modal, LoadingOverlay } from '../../../components/ui';

interface UserPermRule {
    id: string;
    user_id: string;
    allow_doctype: string;
    for_value: string;
    is_default: boolean;
    created_at?: string;
}

const DOCTYPE_PRESETS = [
    { value: 'Department', label: 'Departemen (Department)', icon: FolderTree },
    { value: 'Branch', label: 'Cabang (Branch)', icon: MapPin },
    { value: 'Warehouse', label: 'Gudang (Warehouse)', icon: Layers },
    { value: 'Company', label: 'Perusahaan (Company)', icon: Building2 },
    { value: 'Category', label: 'Kategori Aset (Category)', icon: Shield },
];

export function UserPermissionsTab() {
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [userPerms, setUserPerms] = useState<UserPermRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [permsLoading, setPermsLoading] = useState(false);
    const [searchUser, setSearchUser] = useState('');

    // Master Data for Select Options
    const [companies, setCompanies] = useState<Company[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // Create Rule Modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newDocType, setNewDocType] = useState('Department');
    const [newValue, setNewValue] = useState('');
    const [newIsDefault, setNewIsDefault] = useState(false);
    const [isManualInput, setIsManualInput] = useState(false);
    const [saving, setSaving] = useState(false);

    const { success, error: showError } = useToast();

    useEffect(() => {
        loadUsers();
        loadMasterData();
    }, []);

    useEffect(() => {
        if (selectedUserId) {
            loadUserPerms(selectedUserId);
        } else {
            setUserPerms([]);
        }
    }, [selectedUserId]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await usersApi.list(1, 100);
            const userList: UserSummary[] = Array.isArray(data) ? data : (data?.data || []);
            setUsers(userList);
            if (userList.length > 0) {
                setSelectedUserId(prev => prev && userList.some(u => u.id === prev) ? prev : userList[0].id);
            }
        } catch (err: any) {
            showError('Gagal memuat daftar pengguna', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const loadMasterData = async () => {
        try {
            const [compRes, deptRes, whRes, catRes] = await Promise.allSettled([
                fetchCompanies({ status: 'ACTIVE' }),
                departmentApi.list(),
                inventoryApi.listWarehouses(),
                categoryApi.list(),
            ]);

            if (compRes.status === 'fulfilled') {
                const raw = compRes.value;
                const list = Array.isArray(raw) ? raw : (raw?.data || []);
                setCompanies(list);
            }

            if (deptRes.status === 'fulfilled') {
                const raw = deptRes.value;
                const list = Array.isArray(raw) ? raw : ((raw as any)?.data || []);
                setDepartments(list);
            }

            if (whRes.status === 'fulfilled') {
                const raw = whRes.value;
                const list = Array.isArray(raw) ? raw : ((raw as any)?.data || []);
                setWarehouses(list);
            }

            if (catRes.status === 'fulfilled') {
                const raw = catRes.value;
                const list = Array.isArray(raw) ? raw : ((raw as any)?.data || []);
                setCategories(list);
            }
        } catch (e) {
            console.error('Failed to load master data for RLS', e);
        }
    };

    const loadUserPerms = async (userId: string) => {
        setPermsLoading(true);
        try {
            const data = await rbacApi.getUserPermissionsRowLevel(userId);
            setUserPerms(data || []);
        } catch (err: any) {
            setUserPerms([]);
        } finally {
            setPermsLoading(false);
        }
    };

    // Master Data options based on selected DocType
    const forValueOptions = useMemo(() => {
        switch (newDocType) {
            case 'Department':
                return departments.map(d => ({
                    value: d.name,
                    label: d.name
                }));
            case 'Branch':
                return companies
                    .filter(c => !c.is_group)
                    .map(c => ({
                        value: c.name,
                        label: `${c.name} (${c.code})`
                    }));
            case 'Warehouse':
                return warehouses.map(w => ({
                    value: w.name,
                    label: `${w.name} (${w.code})`
                }));
            case 'Company':
                return companies.map(c => ({
                    value: c.id,
                    label: `${c.name} (${c.code})`
                }));
            case 'Category':
                return categories.map(cat => ({
                    value: cat.name,
                    label: `${cat.name} (${cat.code})`
                }));
            default:
                return [];
        }
    }, [newDocType, companies, warehouses, departments, categories]);

    const handleDocTypeChange = (doctype: string) => {
        setNewDocType(doctype);
        setIsManualInput(false);
        switch (doctype) {
            case 'Department':
                setNewValue(departments[0]?.name || '');
                break;
            case 'Branch': {
                const branches = companies.filter(c => !c.is_group);
                setNewValue(branches[0]?.name || '');
                break;
            }
            case 'Warehouse':
                setNewValue(warehouses[0]?.name || '');
                break;
            case 'Company':
                setNewValue(companies[0]?.id || companies[0]?.name || '');
                break;
            case 'Category':
                setNewValue(categories[0]?.name || '');
                break;
            default:
                setNewValue('');
        }
    };

    const openAddModal = () => {
        setIsAddModalOpen(true);
        setNewDocType('Department');
        setIsManualInput(false);
        setNewValue(departments[0]?.name || '');
        setNewIsDefault(false);
    };

    const handleCreateRule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !newValue.trim()) return;

        setSaving(true);
        try {
            await rbacApi.createUserPermissionRowLevel({
                user_id: selectedUserId,
                allow_doctype: newDocType,
                for_value: newValue.trim(),
                is_default: newIsDefault
            });
            success('Aturan pembatasan data berhasil ditambahkan');
            setIsAddModalOpen(false);
            setNewValue('');
            setNewIsDefault(false);
            loadUserPerms(selectedUserId);
        } catch (err: any) {
            showError(err?.response?.data?.message || err?.message || 'Gagal menambahkan aturan pembatasan');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        try {
            await rbacApi.deleteUserPermissionRowLevel(ruleId);
            success('Aturan pembatasan berhasil dihapus');
            loadUserPerms(selectedUserId);
        } catch (err: any) {
            showError(err?.response?.data?.message || err?.message || 'Gagal menghapus aturan');
        }
    };

    const getDisplayValue = (doctype: string, val: string) => {
        if (doctype === 'Company') {
            const found = companies.find(c => c.id === val || c.name === val);
            return found ? `${found.name} (${found.code})` : val;
        }
        if (doctype === 'Branch') {
            const found = companies.find(c => !c.is_group && (c.id === val || c.name === val));
            return found ? `${found.name} (${found.code})` : val;
        }
        if (doctype === 'Warehouse') {
            const found = warehouses.find(w => w.id === val || w.name === val);
            return found ? `${found.name} (${found.code})` : val;
        }
        if (doctype === 'Department') {
            const found = departments.find(d => d.id === val || d.name === val);
            return found ? found.name : val;
        }
        if (doctype === 'Category') {
            const found = categories.find(cat => cat.id === val || cat.name === val || cat.code === val);
            return found ? `${found.name} (${found.code})` : val;
        }
        return val;
    };

    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(searchUser.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchUser.toLowerCase()) ||
        (u.role_code || '').toLowerCase().includes(searchUser.toLowerCase()) ||
        ((u as any).role || '').toLowerCase().includes(searchUser.toLowerCase()) ||
        (u.department || '').toLowerCase().includes(searchUser.toLowerCase()) ||
        (u.employee_name || '').toLowerCase().includes(searchUser.toLowerCase())
    );

    const selectedUser = users.find(u => u.id === selectedUserId);

    return (
        <div className="space-y-6">
            {/* Guide Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-foreground">
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                        Tentang Pembatasan Akses Baris Data (Row-Level Security / RLS)
                    </p>
                    <p className="text-muted-foreground text-xs mt-1">
                        Fitur ini membatasi staf agar hanya dapat melihat dan mengelola data milik Cabang, Gudang, atau Departemen tertentu.
                        Jika pengguna tidak memiliki aturan pembatasan di bawah ini, mereka dapat melihat seluruh data sesuai izin role-nya.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: User Selector List */}
                <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-4 space-y-4">
                    <div className="space-y-2">
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <UserCheck size={18} className="text-primary" />
                            <span>Pilih Pengguna</span>
                        </h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                            <input
                                type="text"
                                placeholder="Cari nama atau email..."
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-background/50 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                            />
                        </div>
                    </div>

                    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                        {loading ? (
                            <div className="text-center py-8 text-xs text-muted-foreground">Memuat pengguna...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-xs text-muted-foreground">Pengguna tidak ditemukan.</div>
                        ) : (
                            filteredUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => setSelectedUserId(u.id)}
                                    className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 border ${selectedUserId === u.id
                                        ? 'bg-primary/10 border-primary/40 shadow-sm'
                                        : 'bg-background/40 hover:bg-muted border-transparent hover:border-border'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-xs text-foreground truncate">{u.name}</span>
                                        {(u.role_code || (u as any).role) && (
                                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-muted rounded text-muted-foreground shrink-0">
                                                {u.role_code || (u as any).role}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[11px] text-muted-foreground truncate">{u.email}</span>
                                    {u.department && (
                                        <span className="text-[10px] text-blue-500/80 font-medium truncate">Dept: {u.department}</span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right: Active Row-Level Rules for Selected User */}
                <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                        <div>
                            <h3 className="font-bold text-base text-foreground">
                                Aturan Akses: {selectedUser?.name || 'Pilih Pengguna'}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {selectedUser?.email} · Role: <span className="font-semibold uppercase">{selectedUser?.role_code || (selectedUser as any)?.role || '-'}</span>
                                {selectedUser?.department && (
                                    <span className="ml-2">· Dept: <span className="font-semibold">{selectedUser.department}</span></span>
                                )}
                            </p>
                        </div>

                        <Button
                            onClick={openAddModal}
                            disabled={!selectedUserId}
                            className="flex items-center gap-2"
                        >
                            <Plus size={16} />
                            <span>Tambah Batasan Data</span>
                        </Button>
                    </div>

                    {/* Rules List */}
                    {permsLoading ? (
                        <div className="text-center py-12 text-xs text-muted-foreground">Memuat aturan data...</div>
                    ) : userPerms.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-border rounded-2xl space-y-2">
                            <Shield className="w-8 h-8 text-muted-foreground/50 mx-auto" />
                            <p className="text-sm font-semibold text-foreground">Tidak Ada Batasan Baris Data (Akses Penuh)</p>
                            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                Pengguna ini dapat melihat seluruh data transaksi dari semua Cabang, Gudang, dan Departemen sesuai izin role-nya.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {userPerms.map((rule) => {
                                const preset = DOCTYPE_PRESETS.find(p => p.value === rule.allow_doctype);
                                const Icon = preset?.icon || Shield;
                                const displayValue = getDisplayValue(rule.allow_doctype, rule.for_value);

                                return (
                                    <div
                                        key={rule.id}
                                        className="bg-background/50 border border-border hover:border-primary/40 rounded-xl p-4 flex items-start justify-between gap-3 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                                                <Icon size={18} />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-foreground">
                                                        {rule.allow_doctype}
                                                    </span>
                                                    {rule.is_default && (
                                                        <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-semibold">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-semibold text-primary">
                                                    "{displayValue}"
                                                </p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    Hanya boleh mengakses data dengan {rule.allow_doctype} = {displayValue}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteRule(rule.id)}
                                            title="Hapus Batasan Ini"
                                            className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tambah Batasan Data */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Tambah Batasan Baris Data (Row-Level Security)"
            >
                <form onSubmit={handleCreateRule} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Jenis Entitas Data (DocType)
                        </label>
                        <select
                            value={newDocType}
                            onChange={(e) => handleDocTypeChange(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                        >
                            {DOCTYPE_PRESETS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Nilai yang Diizinkan (*For Value*)
                            </label>
                            {forValueOptions.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIsManualInput(!isManualInput)}
                                    className="text-[11px] text-primary hover:underline font-normal"
                                >
                                    {isManualInput ? '← Pilih dari Daftar Master Data' : 'Ketik Manual...'}
                                </button>
                            )}
                        </div>

                        {!isManualInput && forValueOptions.length > 0 ? (
                            <select
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                required
                            >
                                <option value="">— Pilih {DOCTYPE_PRESETS.find(p => p.value === newDocType)?.label.split(' ')[0]} —</option>
                                {forValueOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                placeholder={
                                    newDocType === 'Company' ? 'Contoh: PT Sanjaya Solusindo Group...' :
                                    newDocType === 'Branch' ? 'Contoh: Cabang Surabaya, Balikpapan...' :
                                    newDocType === 'Warehouse' ? 'Contoh: Gudang Utama, Transit...' :
                                    newDocType === 'Department' ? 'Contoh: Operasional, IT, HR...' :
                                    'Ketik nilai yang diizinkan...'
                                }
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                required
                            />
                        )}

                        <p className="text-[11px] text-muted-foreground">
                            {!isManualInput && forValueOptions.length > 0
                                ? `Pilih ${newDocType} dari master data sistem yang secara spesifik boleh diakses oleh staf ini.`
                                : `Ketik nama ${newDocType.toLowerCase()} yang secara spesifik boleh diakses oleh staf ini.`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="is_default"
                            checked={newIsDefault}
                            onChange={(e) => setNewIsDefault(e.target.checked)}
                            className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                        />
                        <label htmlFor="is_default" className="text-xs text-foreground font-medium cursor-pointer">
                            Gunakan sebagai nilai default otomatis pada dokumen baru
                        </label>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsAddModalOpen(false)}
                            disabled={saving}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={saving || !newValue.trim()}>
                            {saving ? 'Menyimpan...' : 'Simpan Batasan Data'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
