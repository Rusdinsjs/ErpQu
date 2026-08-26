import React, { useState, useEffect } from 'react';
import { Card, Button, PageHeader } from'../../../components/ui';
import {
    Building2, Plus, Search, Phone, Mail,
    ChevronRight, ChevronDown, Edit, Trash2, Eye, Globe,
    Layers, GitFork, RefreshCw, X, FileText, ScrollText,
    Calendar, CheckCircle2, ShieldCheck, ExternalLink, MapPin
} from 'lucide-react';
import {
    fetchCompanies, fetchCompanyTree, fetchCompanyById, createCompany, updateCompany, deleteCompany
} from'../api/companyApi';
import type {
    Company, CompanyTreeNode, CompanyPayload, CompanyAmendmentDeed
} from'../api/companyApi';
import { showToast } from'../../../components/ui/Toast';
import { settingsApi } from'../../settings/api/settings';
import { getImageUrl } from'../../../utils/image';

export const CompanyManagement: React.FC = () => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [treeData, setTreeData] = useState<CompanyTreeNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid');

    // Modal state for Create / Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'legal' | 'contact' | 'finance'>('general');
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    // Modal state for View / Detail
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
    const [viewModalTab, setViewModalTab] = useState<'profile' | 'deeds' | 'contact'>('profile');
    const [loadingDetail, setLoadingDetail] = useState(false);

    // Form state
    const [formData, setFormData] = useState<CompanyPayload>({
        code: '',
        name: '',
        legal_name: '',
        tax_id: '',
        base_currency: 'IDR',
        country: 'Indonesia',
        address: '',
        phone: '',
        email: '',
        website: '',
        domain: '',
        registration_no: '',
        logo_url: '',
        parent_company_id: '',
        establishment_deed_no: '',
        establishment_deed_date: '',
        establishment_notary_name: '',
        establishment_approval_no: '',
        amendment_deeds: [],
        fiscal_year_start_month: 1,
        is_group: false,
        status: 'ACTIVE',
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [companiesRes, treeRes] = await Promise.all([
                fetchCompanies({ search: search || undefined, status: statusFilter === 'ALL' ? undefined : statusFilter }),
                fetchCompanyTree()
            ]);
            const compList = Array.isArray(companiesRes) ? companiesRes : (companiesRes?.data || []);
            const treeList = Array.isArray(treeRes) ? treeRes : (treeRes?.data || []);
            setCompanies(compList);
            setTreeData(treeList);
        } catch (err: any) {
            console.error('Error fetching companies:', err);
            showToast(err?.response?.data?.message || 'Gagal memuat data perusahaan', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [search, statusFilter]);

    const handleOpenCreateModal = () => {
        setEditingCompany(null);
        setFormData({
            code: '',
            name: '',
            legal_name: '',
            tax_id: '',
            base_currency: 'IDR',
            country: 'Indonesia',
            address: '',
            phone: '',
            email: '',
            website: '',
            domain: '',
            registration_no: '',
            logo_url: '',
            parent_company_id: '',
            establishment_deed_no: '',
            establishment_deed_date: '',
            establishment_notary_name: '',
            establishment_approval_no: '',
            amendment_deeds: [],
            fiscal_year_start_month: 1,
            is_group: false,
            status: 'ACTIVE',
        });
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleOpenEditModal = async (comp: Company) => {
        setEditingCompany(comp);
        let detailedComp = comp;
        try {
            const res = await fetchCompanyById(comp.id);
            if (res?.data) {
                detailedComp = res.data;
            }
        } catch (e) {
            console.error('Failed to fetch detailed company', e);
        }

        setFormData({
            code: detailedComp.code,
            name: detailedComp.name,
            legal_name: detailedComp.legal_name || '',
            tax_id: detailedComp.tax_id || '',
            base_currency: detailedComp.base_currency || 'IDR',
            country: detailedComp.country || 'Indonesia',
            address: detailedComp.address || '',
            phone: detailedComp.phone || '',
            email: detailedComp.email || '',
            website: detailedComp.website || '',
            domain: detailedComp.domain || '',
            registration_no: detailedComp.registration_no || '',
            logo_url: detailedComp.logo_url || '',
            parent_company_id: detailedComp.parent_company_id || '',
            establishment_deed_no: detailedComp.establishment_deed_no || '',
            establishment_deed_date: detailedComp.establishment_deed_date || '',
            establishment_notary_name: detailedComp.establishment_notary_name || '',
            establishment_approval_no: detailedComp.establishment_approval_no || '',
            amendment_deeds: detailedComp.amendment_deeds || [],
            fiscal_year_start_month: detailedComp.fiscal_year_start_month || 1,
            is_group: detailedComp.is_group,
            status: detailedComp.status,
        });
        setActiveTab('general');
        setIsModalOpen(true);
    };

    const handleOpenViewModal = async (comp: Company) => {
        setViewingCompany(comp);
        setViewModalTab('profile');
        setIsViewModalOpen(true);
        setLoadingDetail(true);
        try {
            const res = await fetchCompanyById(comp.id);
            if (res?.data) {
                setViewingCompany(res.data);
            }
        } catch (e) {
            console.error('Failed to fetch detailed company', e);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleAddAmendmentDeed = () => {
        setFormData(prev => ({
            ...prev,
            amendment_deeds: [
                ...(prev.amendment_deeds || []),
                {
                    deed_no: '',
                    deed_date: '',
                    notary_name: '',
                    approval_no: '',
                    description: '',
                }
            ]
        }));
    };

    const handleRemoveAmendmentDeed = (index: number) => {
        setFormData(prev => ({
            ...prev,
            amendment_deeds: (prev.amendment_deeds || []).filter((_, i) => i !== index)
        }));
    };

    const handleAmendmentDeedChange = (index: number, field: keyof CompanyAmendmentDeed, value: string) => {
        setFormData(prev => {
            const updated = [...(prev.amendment_deeds || [])];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, amendment_deeds: updated };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Sanitize payload: convert empty strings to undefined to avoid 422 errors on UUID/Date fields
            const sanitizedData = Object.fromEntries(
                Object.entries(formData).map(([key, value]) => [
                    key, 
                    value === '' ? undefined : value
                ])
            );

            if (editingCompany) {
                await updateCompany(editingCompany.id, sanitizedData);
                showToast('Perusahaan & Akta Legalitas berhasil diperbarui', 'success');
            } else {
                await createCompany(sanitizedData);
                showToast('Perusahaan baru berhasil ditambahkan', 'success');
            }
            setIsModalOpen(false);
            loadData();
        } catch (err: any) {
            console.error('Save error:', err);
            showToast(err?.response?.data?.message || err?.message || 'Gagal menyimpan perusahaan', 'error');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus perusahaan "${name}"?`)) return;
        try {
            await deleteCompany(id);
            showToast('Perusahaan berhasil dihapus', 'success');
            loadData();
        } catch (err: any) {
            showToast(err?.response?.data?.message || 'Gagal menghapus perusahaan', 'error');
        }
    };

    const totalCompanies = companies.length;
    const groupCompanies = companies.filter(c => c.is_group).length;
    const operatingCompanies = totalCompanies - groupCompanies;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Top Header */}
            <PageHeader
                title="Company Management"
                description="Multi-Company Setup, Akta Legalitas & Hierarki Organisasi"
                actions={
                    <Button
                        variant="outline"
                        size="md"
                        onClick={() => loadData()}
                        loading={loading}
                        leftIcon={<RefreshCw className={`w-4 h-4 text-indigo-500 ${loading ? 'animate-spin' : ''}`} />}
                        className="bg-card text-foreground hover:bg-muted border border-border shadow-sm font-medium"
                    >
                        Segarkan Data
                    </Button>
                }
                action={
                    <Button
                        variant="primary"
                        size="md"
                        onClick={handleOpenCreateModal}
                        leftIcon={<Plus className="w-4 h-4" />}
                    >
                        Tambah Perusahaan
                    </Button>
                }
            />

            {/* Stats Dashboard Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="flex items-center justify-between shadow-sm" padding="md">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Entitas</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{totalCompanies}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Perusahaan Terdaftar</p>
                    </div>
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <Building2 className="w-6 h-6" />
                    </div>
                </Card>

                <Card className="flex items-center justify-between shadow-sm" padding="md">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Holding Company</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{groupCompanies}</h3>
                        <p className="text-xs text-purple-400 font-medium mt-0.5">Grup Induk (Parent)</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                        <GitFork className="w-6 h-6" />
                    </div>
                </Card>

                <Card className="flex items-center justify-between shadow-sm" padding="md">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Anak Perusahaan</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">{operatingCompanies}</h3>
                        <p className="text-xs text-emerald-400 font-medium mt-0.5">Entitas Operasional</p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                        <Layers className="w-6 h-6" />
                    </div>
                </Card>

                <Card className="flex items-center justify-between shadow-sm" padding="md">
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Legalitas Perusahaan</p>
                        <h3 className="text-2xl font-bold text-foreground mt-1">Akta Resmi</h3>
                        <p className="text-xs text-amber-400 font-medium mt-0.5">Pendirian & Perubahan</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
                        <ScrollText className="w-6 h-6" />
                    </div>
                </Card>
            </div>

            {/* Filter & View Switcher Bar */}
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari nama, kode, atau NPWP..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option value="ALL">Semua Status</option>
                        <option value="ACTIVE">Aktif</option>
                        <option value="INACTIVE">Nonaktif</option>
                    </select>
                </div>

                <div className="flex items-center bg-muted p-1 rounded-xl w-full sm:w-auto">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'grid'
                            ? 'bg-card text-indigo-400 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        Grid / Daftar
                    </button>
                    <button
                        onClick={() => setViewMode('tree')}
                        className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'tree'
                            ? 'bg-card text-indigo-400 shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <GitFork className="w-3.5 h-3.5" />
                        Tree Hierarchy
                    </button>
                </div>
            </div>

            {/* Content Views */}
            {loading ? (
                <div className="bg-card p-12 rounded-2xl border border-border text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400 mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">Memuat data perusahaan & akta legalitas...</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {companies.map((comp) => (
                        <div
                            key={comp.id}
                            className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between relative overflow-hidden group"
                        >
                            {/* Decorative Accent Header Bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1.5 ${comp.is_group ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-gradient-to-r from-indigo-500 to-cyan-500'}`} />

                            <div>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        {comp.logo_url ? (
                                            <img
                                                src={getImageUrl(comp.logo_url)}
                                                alt={comp.name}
                                                className="w-11 h-11 rounded-xl object-contain bg-muted/30 border border-border p-1 shrink-0"
                                            />
                                        ) : (
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider shrink-0 ${comp.is_group
                                                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                                                : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                                                }`}>
                                                {comp.code}
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="font-bold text-foreground line-clamp-1">{comp.name}</h4>
                                            <p className="text-xs text-muted-foreground">{comp.legal_name || comp.code}</p>
                                        </div>
                                    </div>

                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${comp.status === 'ACTIVE'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-muted text-muted-foreground border border-border'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${comp.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {comp.status}
                                    </span>
                                </div>

                                {comp.is_group && (
                                    <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-semibold border border-purple-500/20">
                                        <GitFork className="w-3.5 h-3.5" />
                                        Grup Induk (Holding)
                                    </div>
                                )}

                                {!comp.is_group && comp.parent_company_name && (
                                    <div className="mb-3 text-xs text-muted-foreground">
                                        <span className="font-semibold text-foreground">Induk: </span>
                                        {comp.parent_company_name}
                                    </div>
                                )}

                                <div className="space-y-2 text-xs text-muted-foreground my-3 pt-2 border-t border-border/60">
                                    {comp.establishment_deed_no && (
                                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                                            <div className="flex items-center gap-1.5 font-bold text-amber-400">
                                                <ScrollText className="w-3.5 h-3.5 text-amber-400" />
                                                <span>Akta Pendirian: No. {comp.establishment_deed_no}</span>
                                            </div>
                                            {comp.establishment_notary_name && (
                                                <p className="text-[11px] text-amber-300">
                                                    Notaris: {comp.establishment_notary_name}
                                                </p>
                                            )}
                                            {comp.establishment_approval_no && (
                                                <p className="text-[10px] text-amber-500 truncate">
                                                    SK Kemenkumham: {comp.establishment_approval_no}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {comp.tax_id && (
                                        <div className="flex items-center justify-between pt-1">
                                            <span className="text-muted-foreground">NPWP / Tax ID:</span>
                                            <span className="font-medium text-foreground">{comp.tax_id}</span>
                                        </div>
                                    )}
                                    {comp.domain && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Sektor / Industri:</span>
                                            <span className="font-medium text-foreground">{comp.domain}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Mata Uang:</span>
                                        <span className="font-semibold text-indigo-400">{comp.base_currency}</span>
                                    </div>
                                    {comp.email && (
                                        <div className="flex items-center gap-2 text-muted-foreground pt-1">
                                            <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="truncate">{comp.email}</span>
                                        </div>
                                    )}
                                    {comp.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span>{comp.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions with View (Detail), Edit, Delete */}
                            <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-border/60">
                                <button
                                    onClick={() => handleOpenViewModal(comp)}
                                    className="p-2 text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-colors"
                                    title="Lihat Detail Data Perusahaan"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleOpenEditModal(comp)}
                                    className="p-2 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                                    title="Edit Perusahaan & Akta"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(comp.id, comp.name)}
                                    className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors"
                                    title="Hapus Perusahaan"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Frappe Hierarchy Tree View */
                <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
                    <div>
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                            <GitFork className="w-5 h-5 text-indigo-400" />
                            Struktur Pohon Perusahaan (Tree Structure)
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Visualisasi hierarki entitas dari Holding Company hingga ke Anak Perusahaan Operasional.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {treeData.map((node) => (
                            <TreeNodeCard
                                key={node.id}
                                node={node}
                                onEdit={handleOpenEditModal}
                                onView={(compNode) => {
                                    const fullComp = companies.find(c => c.id === compNode.id) || compNode as unknown as Company;
                                    handleOpenViewModal(fullComp);
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Modal Dialog View (Detail Data Perusahaan) */}
            {isViewModalOpen && viewingCompany && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card w-full max-w-4xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-5 bg-card border-b border-border text-foreground flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                {viewingCompany.logo_url ? (
                                    <img
                                        src={getImageUrl(viewingCompany.logo_url)}
                                        alt={viewingCompany.name}
                                        className="w-14 h-14 rounded-2xl object-contain bg-muted/40 border border-border p-1.5 shrink-0 shadow-sm"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold text-lg shrink-0">
                                        {viewingCompany.code}
                                    </div>
                                )}
                                <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="font-bold text-lg text-foreground">
                                            {viewingCompany.name}
                                        </h3>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${viewingCompany.status === 'ACTIVE'
                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                            : 'bg-muted text-muted-foreground border border-border'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${viewingCompany.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                            {viewingCompany.status}
                                        </span>
                                        {viewingCompany.is_group && (
                                            <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-500 rounded-full text-xs font-semibold border border-purple-500/20">
                                                Holding Company
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {viewingCompany.legal_name || 'Entitas Terdaftar'} &bull; Kode: <span className="font-semibold text-foreground">{viewingCompany.code}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* View Modal Tabs */}
                        <div className="flex border-b border-border bg-muted/30 px-6 pt-3 gap-2 overflow-x-auto">
                            <button
                                onClick={() => setViewModalTab('profile')}
                                className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${viewModalTab === 'profile'
                                    ? 'border-indigo-600 text-indigo-500'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                🏢 Profil & Finansial
                            </button>
                            <button
                                onClick={() => setViewModalTab('deeds')}
                                className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${viewModalTab === 'deeds'
                                    ? 'border-indigo-600 text-indigo-500'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                📜 Akta Pendirian & Perubahan ({viewingCompany.amendment_deeds?.length || 0})
                            </button>
                            <button
                                onClick={() => setViewModalTab('contact')}
                                className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${viewModalTab === 'contact'
                                    ? 'border-indigo-600 text-indigo-500'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                📍 Kontak & Domisili
                            </button>
                        </div>

                        {/* View Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm">
                            {loadingDetail ? (
                                <div className="py-12 text-center">
                                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                                    <p className="text-xs text-muted-foreground">Mengambil rincian data perusahaan...</p>
                                </div>
                            ) : viewModalTab === 'profile' ? (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-3">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                <Building2 className="w-4 h-4 text-indigo-500" />
                                                Informasi Entitas
                                            </h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between py-1 border-b border-border/50">
                                                    <span className="text-muted-foreground">Nama Resmi:</span>
                                                    <span className="font-semibold text-foreground text-right">{viewingCompany.name}</span>
                                                </div>
                                                <div className="flex justify-between py-1 border-b border-border/50">
                                                    <span className="text-muted-foreground">Nama Legal (Entity):</span>
                                                    <span className="font-medium text-foreground text-right">{viewingCompany.legal_name || '-'}</span>
                                                </div>
                                                <div className="flex justify-between py-1 border-b border-border/50">
                                                    <span className="text-muted-foreground">Kode Singkatan:</span>
                                                    <span className="font-mono font-bold text-indigo-500 text-right">{viewingCompany.code}</span>
                                                </div>
                                                <div className="flex justify-between py-1 border-b border-border/50">
                                                    <span className="text-muted-foreground">Perusahaan Induk:</span>
                                                    <span className="font-medium text-foreground text-right">{viewingCompany.parent_company_name || '-'}</span>
                                                </div>
                                                <div className="flex justify-between py-1">
                                                    <span className="text-muted-foreground">Sektor / Industri:</span>
                                                    <span className="font-medium text-foreground text-right">{viewingCompany.domain || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-3">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                Pengaturan Finansial & Pajak
                                            </h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between py-1 border-b border-border/50">
                                                    <span className="text-muted-foreground">NPWP / Tax ID:</span>
                                                    <span className="font-mono font-semibold text-foreground text-right">{viewingCompany.tax_id || '-'}</span>
                                                </div>
                                                <div className="flex justify-between py-1 border-b border-border/50">
                                                    <span className="text-muted-foreground">Mata Uang Utama:</span>
                                                    <span className="font-bold text-indigo-500 text-right">{viewingCompany.base_currency}</span>
                                                </div>
                                                <div className="flex justify-between py-1 border-b border-border/50">
                                                    <span className="text-muted-foreground">Bulan Awal Tahun Buku:</span>
                                                    <span className="font-medium text-foreground text-right">
                                                        {viewingCompany.fiscal_year_start_month === 1 ? 'Januari' :
                                                            viewingCompany.fiscal_year_start_month === 4 ? 'April' :
                                                                viewingCompany.fiscal_year_start_month === 7 ? 'Juli' :
                                                                    viewingCompany.fiscal_year_start_month === 10 ? 'Oktober' : `Bulan ${viewingCompany.fiscal_year_start_month || 1}`}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between py-1 border-b border-border/50">
                                                    <span className="text-muted-foreground">Negara Domisili:</span>
                                                    <span className="font-medium text-foreground text-right">{viewingCompany.country}</span>
                                                </div>
                                                <div className="flex justify-between py-1">
                                                    <span className="text-muted-foreground">No. Registrasi / NIB:</span>
                                                    <span className="font-mono text-foreground text-right">{viewingCompany.registration_no || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : viewModalTab === 'deeds' ? (
                                <div className="space-y-5">
                                    {/* Akta Pendirian */}
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                                                <ScrollText className="w-4 h-4 text-amber-500" />
                                                Akta Pendirian Perusahaan (Utama)
                                            </h4>
                                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded text-[10px] font-bold">
                                                Akta Dasar
                                            </span>
                                        </div>

                                        {viewingCompany.establishment_deed_no ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                                                <div>
                                                    <span className="text-muted-foreground block text-[11px]">Nomor Akta:</span>
                                                    <span className="font-bold text-foreground">{viewingCompany.establishment_deed_no}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[11px]">Tanggal Akta:</span>
                                                    <span className="font-medium text-foreground">{viewingCompany.establishment_deed_date || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[11px]">Nama Notaris:</span>
                                                    <span className="font-medium text-foreground">{viewingCompany.establishment_notary_name || '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground block text-[11px]">SK Pengesahan Kemenkumham:</span>
                                                    <span className="font-medium text-foreground">{viewingCompany.establishment_approval_no || '-'}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground italic">Belum ada data akta pendirian yang tercatat.</p>
                                        )}
                                    </div>

                                    {/* Akta Perubahan */}
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <FileText className="w-4 h-4 text-indigo-500" />
                                            Daftar Akta Perubahan / Penyesuaian Anggaran Dasar
                                        </h4>

                                        {viewingCompany.amendment_deeds && viewingCompany.amendment_deeds.length > 0 ? (
                                            <div className="space-y-3">
                                                {viewingCompany.amendment_deeds.map((deed, idx) => (
                                                    <div key={idx} className="p-4 bg-card border border-border rounded-xl space-y-2 shadow-sm">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xs font-bold">
                                                                    #{idx + 1}
                                                                </span>
                                                                <span className="font-bold text-sm text-foreground">Akta No. {deed.deed_no}</span>
                                                            </div>
                                                            {deed.deed_date && (
                                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                                    {deed.deed_date}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-border/50">
                                                            <div>
                                                                <span className="text-muted-foreground">Notaris: </span>
                                                                <span className="font-medium text-foreground">{deed.notary_name || '-'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">SK Kemenkumham: </span>
                                                                <span className="font-medium text-foreground">{deed.approval_no || '-'}</span>
                                                            </div>
                                                        </div>
                                                        {deed.description && (
                                                            <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg mt-1">
                                                                {deed.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-6 text-center border border-dashed border-border rounded-xl text-muted-foreground text-xs">
                                                Tidak ada akta perubahan yang tercatat untuk entitas ini.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-muted/20 p-4 rounded-xl border border-border space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-rose-500" />
                                            Alamat & Domisili Kantor
                                        </h4>
                                        <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                                            {viewingCompany.address || 'Alamat domisili perusahaan belum diisi.'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 bg-muted/20 rounded-xl border border-border space-y-1">
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                                                Email Resmi
                                            </span>
                                            <p className="text-xs font-semibold text-foreground truncate">
                                                {viewingCompany.email || '-'}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-muted/20 rounded-xl border border-border space-y-1">
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                                Telepon Kantor
                                            </span>
                                            <p className="text-xs font-semibold text-foreground truncate">
                                                {viewingCompany.phone || '-'}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-muted/20 rounded-xl border border-border space-y-1">
                                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                <Globe className="w-3.5 h-3.5 text-cyan-500" />
                                                Website
                                            </span>
                                            {viewingCompany.website ? (
                                                <a
                                                    href={viewingCompany.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-semibold text-indigo-500 hover:underline flex items-center gap-1 truncate"
                                                >
                                                    {viewingCompany.website}
                                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                                </a>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">-</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* View Modal Footer */}
                        <div className="px-6 py-4 border-t border-border bg-card flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-xl font-medium text-xs transition-colors"
                            >
                                Tutup
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    handleOpenEditModal(viewingCompany);
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                            >
                                <Edit className="w-3.5 h-3.5" />
                                Edit Data Perusahaan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Dialog Form - Frappe Company DocType (Create / Edit) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card w-full max-w-3xl rounded-2xl shadow-2xl border border-border/80 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-card border-b border-border/60 text-foreground flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-primary" />
                                <div>
                                    <h3 className="font-bold text-base text-foreground">
                                        {editingCompany ? 'Edit Perusahaan & Legalitas Akta' : 'Tambah Perusahaan Baru'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">Kelola Profil, Akta Pendirian, & Multiple Akta Perubahan</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b border-border bg-muted/30 px-6 pt-3 gap-2 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('general')}
                                className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === 'general'
                                    ? 'border-indigo-600 text-indigo-400'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                🏢 Profil Utama
                            </button>
                            <button
                                onClick={() => setActiveTab('legal')}
                                className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === 'legal'
                                    ? 'border-indigo-600 text-indigo-400'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                📜 Akta & Legalitas
                            </button>
                            <button
                                onClick={() => setActiveTab('contact')}
                                className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === 'contact'
                                    ? 'border-indigo-600 text-indigo-400'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                📍 Kontak & Alamat
                            </button>
                            <button
                                onClick={() => setActiveTab('finance')}
                                className={`pb-3 px-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${activeTab === 'finance'
                                    ? 'border-indigo-600 text-indigo-400'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                💰 Finansial & Pajak
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
                            {activeTab === 'general' && (
                                <div className="space-y-4">
                                    {/* Logo Perusahaan */}
                                    <div className="bg-muted/30 p-3.5 rounded-2xl border border-border space-y-2">
                                        <label className="block text-xs font-semibold text-foreground">Logo Perusahaan</label>
                                        <div className="flex items-center gap-4">
                                            {formData.logo_url ? (
                                                <div className="relative group shrink-0">
                                                    <img
                                                        src={getImageUrl(formData.logo_url)}
                                                        alt="Logo Preview"
                                                        className="w-16 h-16 rounded-xl object-contain border border-border bg-card p-1 shadow-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, logo_url: '' })}
                                                        className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-1 shadow hover:bg-rose-600 transition-colors"
                                                        title="Hapus Logo"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground bg-card shrink-0">
                                                    <Building2 className="w-6 h-6" />
                                                    <span className="text-[9px] mt-0.5">No Logo</span>
                                                </div>
                                            )}
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            try {
                                                                const uploaded = await settingsApi.uploadFile(file);
                                                                if (uploaded?.url) {
                                                                    setFormData(prev => ({ ...prev, logo_url: uploaded.url }));
                                                                    showToast('Logo berhasil diunggah', 'success');
                                                                } else {
                                                                    throw new Error('Respon upload tidak valid');
                                                                }
                                                            } catch (err: any) {
                                                                console.error('Upload logo failed:', err);
                                                                showToast(err?.message || 'Gagal mengunggah logo', 'error');
                                                            }
                                                        }
                                                    }}
                                                    className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Atau masukkan URL / path logo..."
                                                    value={formData.logo_url}
                                                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                                                    className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-1">
                                                Kode Singkatan (Abbreviation) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Contoh: SJS-HO"
                                                value={formData.code}
                                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                                className="w-full px-3.5 py-2 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-1">
                                                Nama Perusahaan <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="PT Sanjaya Solusindo Group"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3.5 py-2 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-1">Nama Legal (Legal Entity)</label>
                                            <input
                                                type="text"
                                                placeholder="PT Sanjaya Solusindo Utama Tbk"
                                                value={formData.legal_name}
                                                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                                                className="w-full px-3.5 py-2 border border-border rounded-xl"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-1">NPWP / Tax ID</label>
                                            <input
                                                type="text"
                                                placeholder="01.234.567.8-012.000"
                                                value={formData.tax_id}
                                                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                                className="w-full px-3.5 py-2 border border-border rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-1">Perusahaan Induk (Parent Company)</label>
                                            <select
                                                value={formData.parent_company_id || ''}
                                                onChange={(e) => setFormData({ ...formData, parent_company_id: e.target.value || undefined })}
                                                className="w-full px-3.5 py-2 border border-border rounded-xl text-foreground"
                                            >
                                                <option value="">-- Tanpa Induk (Top Level Holding) --</option>
                                                {companies
                                                    .filter(c => c.id !== editingCompany?.id)
                                                    .map(c => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name} ({c.code})
                                                        </option>
                                                    ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-1">Sektor / Industri Domain</label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: Heavy Equipment, Mining, Contractor"
                                                value={formData.domain}
                                                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                                                className="w-full px-3.5 py-2 border border-border rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="is_group"
                                            checked={formData.is_group}
                                            onChange={(e) => setFormData({ ...formData, is_group: e.target.checked })}
                                            className="w-4 h-4 text-purple-600 rounded"
                                        />
                                        <label htmlFor="is_group" className="text-xs font-medium text-foreground cursor-pointer">
                                            Jadikan sebagai Group Holding (Memiliki Anak Perusahaan)
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'legal' && (
                                <div className="space-y-6">
                                    {/* Akta Pendirian */}
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-4">
                                        <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                                            <ScrollText className="w-4 h-4" />
                                            Akta Pendirian Perusahaan (Establishment Deed)
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-foreground mb-1">Nomor Akta Pendirian</label>
                                                <input
                                                    type="text"
                                                    placeholder="Contoh: 12"
                                                    value={formData.establishment_deed_no}
                                                    onChange={(e) => setFormData({ ...formData, establishment_deed_no: e.target.value })}
                                                    className="w-full px-3.5 py-2 border border-border rounded-xl"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-foreground mb-1">Tanggal Akta Pendirian</label>
                                                <input
                                                    type="date"
                                                    value={formData.establishment_deed_date}
                                                    onChange={(e) => setFormData({ ...formData, establishment_deed_date: e.target.value })}
                                                    className="w-full px-3.5 py-2 border border-border rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-foreground mb-1">Nama Notaris Pendirian</label>
                                                <input
                                                    type="text"
                                                    placeholder="Hendra Wijaya, S.H., M.Kn."
                                                    value={formData.establishment_notary_name}
                                                    onChange={(e) => setFormData({ ...formData, establishment_notary_name: e.target.value })}
                                                    className="w-full px-3.5 py-2 border border-border rounded-xl"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-foreground mb-1">Nomor SK Pengesahan Kemenkumham</label>
                                                <input
                                                    type="text"
                                                    placeholder="AHU-0012345.AH.01.01.Tahun 2018"
                                                    value={formData.establishment_approval_no}
                                                    onChange={(e) => setFormData({ ...formData, establishment_approval_no: e.target.value })}
                                                    className="w-full px-3.5 py-2 border border-border rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Akta Perubahan Multiple */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                <FileText className="w-4 h-4 text-indigo-400" />
                                                Riwayat Akta Perubahan Anggaran Dasar
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleAddAmendmentDeed}
                                                className="px-3 py-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Tambah Akta Perubahan
                                            </button>
                                        </div>

                                        {(!formData.amendment_deeds || formData.amendment_deeds.length === 0) ? (
                                            <div className="p-6 text-center border-2 border-dashed border-border rounded-2xl text-muted-foreground text-xs">
                                                Belum ada akta perubahan. Klik tombol "Tambah Akta Perubahan" jika ada riwayat akta penyesuaian.
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {formData.amendment_deeds.map((deed, index) => (
                                                    <div key={index} className="p-4 bg-muted/20 border border-border rounded-2xl space-y-3 relative group">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-indigo-400">
                                                                Akta Perubahan #{index + 1}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveAmendmentDeed(index)}
                                                                className="text-rose-500 hover:text-rose-700 p-1 rounded transition-colors"
                                                                title="Hapus Akta"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Nomor Akta Perubahan</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Contoh: 05"
                                                                    value={deed.deed_no}
                                                                    onChange={(e) => handleAmendmentDeedChange(index, 'deed_no', e.target.value)}
                                                                    className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Tanggal Akta Perubahan</label>
                                                                <input
                                                                    type="date"
                                                                    value={deed.deed_date || ''}
                                                                    onChange={(e) => handleAmendmentDeedChange(index, 'deed_date', e.target.value)}
                                                                    className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Nama Notaris</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nama Notaris Pembuat Akta"
                                                                    value={deed.notary_name || ''}
                                                                    onChange={(e) => handleAmendmentDeedChange(index, 'notary_name', e.target.value)}
                                                                    className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">SK Kemenkumham Perubahan</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="AHU-0098765.AH.01.02.Tahun 2022"
                                                                    value={deed.approval_no || ''}
                                                                    onChange={(e) => handleAmendmentDeedChange(index, 'approval_no', e.target.value)}
                                                                    className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Perihal / Deskripsi Perubahan</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Contoh: Perubahan Susunan Direksi & Penambahan Modal Disetor"
                                                                value={deed.description || ''}
                                                                onChange={(e) => handleAmendmentDeedChange(index, 'description', e.target.value)}
                                                                className="w-full px-3 py-1.5 bg-card border border-border rounded-xl text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'contact' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground mb-1">Alamat Lengkap Kantor / Domisili</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Gedung Cyber 2 Tower Lantai 18, Jl. HR Rasuna Said..."
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-3.5 py-2 border border-border rounded-xl"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-1">Nomor Telepon Kantor</label>
                                            <input
                                                type="tel"
                                                placeholder="+62 21 555 0100"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full px-3.5 py-2 border border-border rounded-xl"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-1">Email Resmi Perusahaan</label>
                                            <input
                                                type="email"
                                                placeholder="info@sanjayagroup.co.id"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-3.5 py-2 border border-border rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-1">Website URL</label>
                                            <input
                                                type="url"
                                                placeholder="https://sanjayagroup.co.id"
                                                value={formData.website}
                                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                                className="w-full px-3.5 py-2 border border-border rounded-xl"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-1">Negara Domisili</label>
                                            <input
                                                type="text"
                                                value={formData.country}
                                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                className="w-full px-3.5 py-2 border border-border rounded-xl bg-muted/30"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'finance' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-1">Mata Uang Utama (Base Currency)</label>
                                            <select
                                                value={formData.base_currency}
                                                onChange={(e) => setFormData({ ...formData, base_currency: e.target.value })}
                                                className="w-full px-3.5 py-2 border border-border rounded-xl text-foreground"
                                            >
                                                <option value="IDR">IDR (Rupiah Indonesia)</option>
                                                <option value="USD">USD (US Dollar)</option>
                                                <option value="SGD">SGD (Singapore Dollar)</option>
                                                <option value="EUR">EUR (Euro)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-foreground mb-1">Bulan Mulai Tahun Buku</label>
                                            <select
                                                value={formData.fiscal_year_start_month}
                                                onChange={(e) => setFormData({ ...formData, fiscal_year_start_month: parseInt(e.target.value) })}
                                                className="w-full px-3.5 py-2 border border-border rounded-xl text-foreground"
                                            >
                                                <option value={1}>Januari (Default)</option>
                                                <option value={4}>April</option>
                                                <option value={7}>Juli</option>
                                                <option value={10}>Oktober</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-foreground mb-1">Status Operasional</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                                            className="w-full px-3.5 py-2 border border-border rounded-xl text-foreground"
                                        >
                                            <option value="ACTIVE">ACTIVE (Aktif Beroperasi)</option>
                                            <option value="INACTIVE">INACTIVE (Nonaktif / Ditutup)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Modal Footer Buttons */}
                            <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-muted-foreground hover:bg-muted rounded-xl font-medium text-xs transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all"
                                >
                                    {editingCompany ? 'Simpan Perubahan' : 'Tambah Perusahaan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Tree Node Recursive Card Component
const TreeNodeCard: React.FC<{
    node: CompanyTreeNode;
    onEdit?: (comp: Company) => void;
    onView?: (comp: CompanyTreeNode) => void;
}> = ({ node, onEdit, onView }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {node.children.length > 0 && (
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-1 hover:bg-muted rounded text-muted-foreground"
                        >
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    )}

                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${node.is_group ? 'bg-purple-500/15 text-purple-400' : 'bg-indigo-500/15 text-indigo-400'
                        }`}>
                        {node.code}
                    </div>

                    <div>
                        <h4 className="text-sm font-bold text-foreground">{node.name}</h4>
                        {node.tax_id && <p className="text-xs text-muted-foreground">NPWP: {node.tax_id}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${node.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'
                        }`}>
                        {node.status}
                    </span>
                    {onView && (
                        <button
                            onClick={() => onView(node)}
                            className="p-1.5 text-muted-foreground hover:text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Lihat Detail"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {isOpen && node.children.length > 0 && (
                <div className="pl-6 border-l-2 border-indigo-500/20 space-y-3 mt-3">
                    {node.children.map((child) => (
                        <TreeNodeCard key={child.id} node={child} onEdit={onEdit} onView={onView} />
                    ))}
                </div>
            )}
        </div>
    );
};
