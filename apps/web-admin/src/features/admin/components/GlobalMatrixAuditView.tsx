import React, { useState, useEffect } from 'react';
import { Shield, FileSpreadsheet, Printer, Search, Filter, Check, X } from 'lucide-react';
import { rbacApi } from '../api/rbac';
import type { Role } from '../../../types';
import { Button, Card, Badge, useToast, LoadingOverlay } from '../../../components/ui';

interface DocTypeItem {
    id: string;
    name: string;
    module: string;
    is_submittable: boolean;
}

interface CustomDocPerm {
    id?: string;
    doctype_id: string;
    role_id: string;
    permlevel: number;
    read_perm: boolean;
    write_perm: boolean;
    create_perm: boolean;
    delete_perm: boolean;
    submit_perm: boolean;
    cancel_perm: boolean;
    amend_perm: boolean;
    print_perm: boolean;
    export_perm: boolean;
    if_owner: boolean;
}

export function GlobalMatrixAuditView() {
    const [docTypes, setDocTypes] = useState<DocTypeItem[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPerms, setAllPerms] = useState<CustomDocPerm[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedModule, setSelectedModule] = useState<string>('all');
    const [searchDoc, setSearchDoc] = useState('');

    const { error: showError } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [dtList, roleList, permList] = await Promise.all([
                rbacApi.listDocTypes(),
                rbacApi.listRoles(),
                rbacApi.getDocPerms()
            ]);
            setDocTypes(dtList);
            setRoles(roleList);
            setAllPerms(permList || []);
        } catch (err: any) {
            showError('Gagal memuat matriks audit global', 'Error');
        } finally {
            setLoading(false);
        }
    };

    const modules = ['all', ...Array.from(new Set(docTypes.map(d => d.module || 'General')))];

    const filteredDocTypes = docTypes.filter(dt => {
        const matchesModule = selectedModule === 'all' || (dt.module || 'General') === selectedModule;
        const matchesSearch = dt.name.toLowerCase().includes(searchDoc.toLowerCase()) ||
            (dt.module && dt.module.toLowerCase().includes(searchDoc.toLowerCase()));
        return matchesModule && matchesSearch;
    });

    const getPermissionSummary = (doctypeId: string, roleId: string) => {
        const perm = allPerms.find(p => p.doctype_id === doctypeId && p.role_id === roleId);
        if (!perm) return null;

        const actions: string[] = [];
        if (perm.read_perm) actions.push('R');
        if (perm.write_perm) actions.push('W');
        if (perm.create_perm) actions.push('C');
        if (perm.delete_perm) actions.push('D');
        if (perm.submit_perm) actions.push('S');
        if (perm.cancel_perm) actions.push('X');
        if (perm.amend_perm) actions.push('A');
        if (perm.print_perm) actions.push('P');
        if (perm.export_perm) actions.push('E');

        return {
            perm,
            summary: actions.join('·'),
            isFullControl: perm.read_perm && perm.write_perm && perm.create_perm && perm.delete_perm,
            isReadOnly: perm.read_perm && !perm.write_perm && !perm.create_perm && !perm.delete_perm
        };
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        const headers = ['DocType', 'Modul', ...roles.map(r => r.name)];
        const rows = filteredDocTypes.map(dt => {
            const roleVals = roles.map(r => {
                const info = getPermissionSummary(dt.id, r.id);
                return info ? info.summary : '-';
            });
            return [dt.name, dt.module || 'General', ...roleVals];
        });

        const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `RBAC_Audit_Matrix_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header & Export Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 p-4 rounded-2xl border border-border">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cari DocType atau modul..."
                            value={searchDoc}
                            onChange={(e) => setSearchDoc(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-background/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-background/50 p-1 rounded-xl border border-border text-xs overflow-x-auto max-w-xs sm:max-w-md">
                        {modules.map(mod => (
                            <button
                                key={mod}
                                onClick={() => setSelectedModule(mod)}
                                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${selectedModule === mod ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {mod === 'all' ? 'Semua Modul' : mod}
                            </button>
                        ))}
                    </div>

                    <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2 text-xs">
                        <FileSpreadsheet size={15} />
                        <span>Ekspor CSV</span>
                    </Button>

                    <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2 text-xs">
                        <Printer size={15} />
                        <span>Cetak / PDF</span>
                    </Button>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/60 border-b border-border">
                                <th className="p-3.5 font-bold text-foreground sticky left-0 bg-muted z-20 min-w-[200px]">
                                    Dokumen / Entitas (DocType)
                                </th>
                                <th className="p-3.5 font-bold text-foreground min-w-[120px]">
                                    Modul
                                </th>
                                {roles.map(role => (
                                    <th key={role.id} className="p-3.5 font-bold text-center text-foreground min-w-[140px] border-l border-border/50">
                                        <div className="truncate max-w-[130px]" title={role.name}>
                                            {role.name}
                                        </div>
                                        <span className="text-[10px] font-normal text-muted-foreground block mt-0.5">
                                            Level {role.role_level || 5}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={roles.length + 2} className="text-center py-12 text-muted-foreground">
                                        Memuat matriks audit global...
                                    </td>
                                </tr>
                            ) : filteredDocTypes.length === 0 ? (
                                <tr>
                                    <td colSpan={roles.length + 2} className="text-center py-12 text-muted-foreground">
                                        Tidak ada dokumen yang sesuai dengan filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredDocTypes.map(dt => (
                                    <tr key={dt.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-semibold text-foreground sticky left-0 bg-card z-10 border-r border-border/40">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-primary/70" />
                                                <span>{dt.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-medium border border-border/40">
                                                {dt.module || 'General'}
                                            </span>
                                        </td>
                                        {roles.map(role => {
                                            const info = getPermissionSummary(dt.id, role.id);
                                            if (!info) {
                                                return (
                                                    <td key={role.id} className="p-3 text-center border-l border-border/40 text-muted-foreground/30">
                                                        -
                                                    </td>
                                                );
                                            }

                                            return (
                                                <td key={role.id} className="p-2 text-center border-l border-border/40">
                                                    <span
                                                        className={`inline-block px-2 py-1 rounded-md text-[11px] font-mono font-semibold border ${info.isFullControl
                                                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                            : info.isReadOnly
                                                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                                            }`}
                                                        title={`Izin: ${info.summary}`}
                                                    >
                                                        {info.summary}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend & Help Box */}
            <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-bold text-foreground">Keterangan Kode Izin:</span>
                    <span className="flex items-center gap-1 font-mono"><strong className="text-primary">R</strong>: Read</span>
                    <span className="flex items-center gap-1 font-mono"><strong className="text-primary">W</strong>: Write</span>
                    <span className="flex items-center gap-1 font-mono"><strong className="text-primary">C</strong>: Create</span>
                    <span className="flex items-center gap-1 font-mono"><strong className="text-primary">D</strong>: Delete</span>
                    <span className="flex items-center gap-1 font-mono"><strong className="text-emerald-500">S</strong>: Submit</span>
                    <span className="flex items-center gap-1 font-mono"><strong className="text-rose-500">X</strong>: Cancel</span>
                    <span className="flex items-center gap-1 font-mono"><strong className="text-amber-500">A</strong>: Amend</span>
                    <span className="flex items-center gap-1 font-mono"><strong className="text-primary">P</strong>: Print</span>
                    <span className="flex items-center gap-1 font-mono"><strong className="text-primary">E</strong>: Export</span>
                </div>
            </div>
        </div>
    );
}
