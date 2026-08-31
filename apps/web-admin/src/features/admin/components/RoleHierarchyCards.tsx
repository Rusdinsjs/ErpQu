import React, { useState } from 'react';
import { Shield, Users, Copy, Edit2, Trash2, Search, Plus, ArrowUpRight } from 'lucide-react';
import type { Role } from '../../../types';
import { Badge, Button } from '../../../components/ui';

interface RoleHierarchyCardsProps {
    roles: Role[];
    isLoading: boolean;
    onEdit: (role: Role) => void;
    onDelete: (roleId: string) => void;
    onClone: (role: Role) => void;
    onSelectForPerms: (roleId: string) => void;
    onCreateNew: () => void;
}

const ROLE_LEVEL_META: Record<number, { title: string; color: string; bg: string; badge: string; desc: string }> = {
    1: {
        title: 'Level 1 · Super Administrator',
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-500/10 border-rose-500/20',
        badge: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30',
        desc: 'Akses penuh tanpa batas ke seluruh modul, konfigurasi sistem, database, dan audit.'
    },
    2: {
        title: 'Level 2 · System Administrator',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/20',
        badge: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
        desc: 'Pengelolaan operasional harian, manajemen pengguna, dan persetujuan tingkat lanjut.'
    },
    3: {
        title: 'Level 3 · Department / Operational Manager',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-500/10 border-amber-500/20',
        badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
        desc: 'Persetujuan dokumen, pengawasan aset departemen, dan laporan divisi.'
    },
    4: {
        title: 'Level 4 · Operational Staff & Technician',
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        badge: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        desc: 'Pencatatan data transaksi harian, eksekusi work order, dan inspeksi lapangan.'
    },
    5: {
        title: 'Level 5 · Viewer / Guest',
        color: 'text-slate-600 dark:text-slate-400',
        bg: 'bg-slate-500/10 border-slate-500/20',
        badge: 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
        desc: 'Hanya melihat data (Read-only) tanpa hak mengubah atau menghapus transaksi.'
    }
};

export function RoleHierarchyCards({
    roles,
    isLoading,
    onEdit,
    onDelete,
    onClone,
    onSelectForPerms,
    onCreateNew
}: RoleHierarchyCardsProps) {
    const [search, setSearch] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');

    const filteredRoles = roles.filter(role => {
        const matchesSearch = role.name.toLowerCase().includes(search.toLowerCase()) ||
            role.code.toLowerCase().includes(search.toLowerCase()) ||
            (role.description && role.description.toLowerCase().includes(search.toLowerCase()));
        const matchesLevel = selectedLevel === 'all' || role.role_level === selectedLevel;
        return matchesSearch && matchesLevel;
    });

    const rolesByLevel = [1, 2, 3, 4, 5].map(lvl => ({
        level: lvl,
        meta: ROLE_LEVEL_META[lvl] || ROLE_LEVEL_META[5],
        roles: filteredRoles.filter(r => (r.role_level || 5) === lvl)
    }));

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-2xl border border-border">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cari nama role, kode, atau deskripsi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-background/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-background/50 p-1 rounded-xl border border-border text-xs">
                        <button
                            onClick={() => setSelectedLevel('all')}
                            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${selectedLevel === 'all' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            Semua Level ({roles.length})
                        </button>
                        {[1, 2, 3, 4, 5].map(lvl => (
                            <button
                                key={lvl}
                                onClick={() => setSelectedLevel(lvl)}
                                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors ${selectedLevel === lvl ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                Lvl {lvl}
                            </button>
                        ))}
                    </div>

                    <Button onClick={onCreateNew} className="flex items-center gap-2">
                        <Plus size={16} />
                        <span>Tambah Role Baru</span>
                    </Button>
                </div>
            </div>

            {/* Role Levels Stack */}
            <div className="space-y-8">
                {rolesByLevel.map(({ level, meta, roles: lvlRoles }) => {
                    if (selectedLevel !== 'all' && selectedLevel !== level) return null;
                    if (lvlRoles.length === 0 && search) return null;

                    return (
                        <div key={level} className="space-y-3">
                            {/* Level Header Banner */}
                            <div className={`flex items-center justify-between p-3.5 rounded-xl border ${meta.bg}`}>
                                <div className="flex items-center gap-3">
                                    <Shield className={`w-5 h-5 ${meta.color}`} />
                                    <div>
                                        <h3 className={`text-sm font-bold tracking-wide uppercase ${meta.color}`}>
                                            {meta.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {meta.desc}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.badge}`}>
                                    {lvlRoles.length} Role Terdaftar
                                </span>
                            </div>

                            {/* Role Cards Grid */}
                            {lvlRoles.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                                    Belum ada role di tingkatan level {level}.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {lvlRoles.map((role) => (
                                        <div
                                            key={role.id}
                                            className="group relative bg-card border border-border/80 hover:border-primary/50 hover:shadow-lg transition-all duration-200 rounded-2xl p-5 flex flex-col justify-between space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                                                            {role.name}
                                                        </h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <code className="text-[11px] font-mono px-2 py-0.5 bg-muted rounded-md text-muted-foreground border border-border/50">
                                                                {role.code}
                                                            </code>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badge}`}>
                                                                Level {role.role_level || 5}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                                                    {role.description || 'Tidak ada deskripsi tambahan.'}
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                                                <button
                                                    onClick={() => onSelectForPerms(role.id)}
                                                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline cursor-pointer"
                                                >
                                                    <span>Atur Izin Dokumen</span>
                                                    <ArrowUpRight size={14} />
                                                </button>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => onClone(role)}
                                                        title="Duplikasi Role Ini"
                                                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                                                    >
                                                        <Copy size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => onEdit(role)}
                                                        title="Edit Role"
                                                        className="p-1.5 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(role.id)}
                                                        title="Hapus Role"
                                                        className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
