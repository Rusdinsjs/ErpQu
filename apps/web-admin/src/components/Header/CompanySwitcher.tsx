import React, { useEffect, useState, useRef } from 'react';
import { Building2, ChevronDown, Check, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../api/http';

interface CompanyItem {
    id: string;
    code: string;
    name: string;
    legal_name?: string;
    is_group?: boolean;
}

export const CompanySwitcher: React.FC = () => {
    const { activeCompanyId, activeCompanyName, setActiveCompany } = useAuthStore();
    const [companies, setCompanies] = useState<CompanyItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadCompanies = async () => {
        setLoading(true);
        try {
            const res = await api.get('/companies/accessible');
            const data: CompanyItem[] = res.data?.data || res.data || [];
            setCompanies(data);

            // Auto-select first company if nothing active or active company not in list
            if (data.length > 0) {
                const currentMatch = data.find((c) => c.id === activeCompanyId);
                if (!currentMatch) {
                    setActiveCompany(data[0].id, data[0].name);
                } else if (currentMatch.name !== activeCompanyName) {
                    setActiveCompany(currentMatch.id, currentMatch.name);
                }
            }
        } catch (err) {
            console.error('Failed to load accessible companies', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCompanies();
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (companies.length === 0 && !loading) {
        return null;
    }

    // If user only has 1 company, render static clean badge
    if (companies.length === 1) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
                <Building2 size={14} className="text-amber-400 shrink-0" />
                <span className="truncate max-w-[180px] font-semibold">{companies[0].name}</span>
            </div>
        );
    }

    const currentCompany = companies.find((c) => c.id === activeCompanyId) || companies[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-foreground text-xs font-medium transition-all shadow-sm group"
                title="Ganti Perusahaan Aktif"
            >
                <div className="p-1 rounded bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                    <Building2 size={14} />
                </div>
                <div className="text-left">
                    <span className="text-[10px] text-muted-foreground block leading-tight">Operating Company</span>
                    <span className="font-semibold text-amber-300 truncate max-w-[160px] sm:max-w-[200px] block leading-tight">
                        {currentCompany?.name || 'Pilih Perusahaan'}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-72 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-2 border-b border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pilih Entitas Bisnis</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                loadCompanies();
                            }}
                            className="text-muted-foreground hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                            title="Refresh List"
                        >
                            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1 space-y-0.5 global-scrollbar">
                        {companies.map((comp) => {
                            const isSelected = comp.id === activeCompanyId;
                            return (
                                <button
                                    key={comp.id}
                                    type="button"
                                    onClick={() => {
                                        setActiveCompany(comp.id, comp.name);
                                        setIsOpen(false);
                                        window.dispatchEvent(new CustomEvent('company-changed', { detail: { companyId: comp.id } }));
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-left transition-all ${
                                        isSelected
                                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                                    }`}
                                >
                                    <div className="min-w-0 flex-1 pr-2">
                                        <p className="font-semibold truncate">{comp.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono truncate">{comp.code}</p>
                                    </div>
                                    {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
