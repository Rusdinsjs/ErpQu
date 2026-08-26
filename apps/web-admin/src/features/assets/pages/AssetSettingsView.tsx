import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Save, RotateCcw, ShieldCheck, QrCode, DollarSign, FileText,
    Sliders, Hash, Layers, Building2, Truck, HardHat, Monitor, Armchair,
    Factory, Key, Plus, Trash2, Edit2, X, Check, MessageSquare, Mail, Bell,
    ChevronDown, AlertTriangle, Users, User
} from 'lucide-react';
import { Button, Input, Select, Checkbox, Card, CardHeader, CardTitle, CardContent, useToast } from'../../../components/ui';
import { settingsApi } from'../../settings/api/settings';
import { categoryApi } from'../api/category';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface CategoryUsefulLifeRule {
    category_name: string;
    code_prefix: string;
    code_generation_mode?: 'auto' | 'hybrid' | 'manual';
    useful_life_months: number;
    depreciation_method: string;
    residual_percent: number;
}

export interface ApprovalPolicy {
    id: string;
    action_type: string;
    label: string;
    description: string;
    is_active: boolean;
    approval_levels: 1 | 2;
    approver_mode: 'role' | 'user' | 'hybrid';
    approver_role_level: number;
    approver_user_ids: string[];
    notify_email: boolean;
    notify_whatsapp: boolean;
}

export interface WhatsAppGatewayConfig {
    gateway_url: string;
    api_key: string;
    mode: 'mock' | 'production';
}

export interface AssetSettingsState {
    code_prefix: string;
    code_generation_mode: 'auto' | 'hybrid' | 'manual';
    auto_generate_qr: boolean;
    require_photo: boolean;
    default_depreciation_method: string;
    default_useful_life_months: number;
    default_residual_percent: number;
    min_capitalization_value: number;
    category_rules: CategoryUsefulLifeRule[];
    // Legacy fields (kept for backward compatibility)
    require_approval_disposal: boolean;
    require_approval_conversion: boolean;
    require_approval_loans: boolean;
}

// ─── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_APPROVAL_POLICIES: ApprovalPolicy[] = [
    {
        id: 'disposal',
        action_type: 'DISPOSAL',
        label: 'Pelepasan Aset (Disposal / Scrap)',
        description: 'Proses hapus buku atau penjualan aset memerlukan persetujuan berjenjang.',
        is_active: true,
        approval_levels: 2,
        approver_mode: 'role',
        approver_role_level: 2,
        approver_user_ids: [],
        notify_email: true,
        notify_whatsapp: true,
    },
    {
        id: 'conversion',
        action_type: 'CONVERSION',
        label: 'Konversi & Perubahan Kategori Aset',
        description: 'Perubahan dari barang persediaan ke aset tetap operasional memerlukan verifikasi tim finansial.',
        is_active: true,
        approval_levels: 1,
        approver_mode: 'role',
        approver_role_level: 2,
        approver_user_ids: [],
        notify_email: true,
        notify_whatsapp: false,
    },
    {
        id: 'loan',
        action_type: 'LOAN',
        label: 'Peminjaman Aset Internal',
        description: 'Peminjaman alat antar departemen mencatat serah terima fisik secara digital.',
        is_active: true,
        approval_levels: 1,
        approver_mode: 'role',
        approver_role_level: 3,
        approver_user_ids: [],
        notify_email: true,
        notify_whatsapp: false,
    },
];

const DEFAULT_WA_GATEWAY: WhatsAppGatewayConfig = {
    gateway_url: '',
    api_key: '',
    mode: 'mock',
};

const DEFAULT_CATEGORY_RULES: CategoryUsefulLifeRule[] = [
    { category_name: 'Bangunan & Infrastruktur', code_prefix: 'AST-BGN-{YYYY}-{5DIGIT}', code_generation_mode: 'hybrid', useful_life_months: 240, depreciation_method: 'Garis Lurus (Straight Line)', residual_percent: 10 },
    { category_name: 'Mesin & Peralatan Pabrik', code_prefix: 'AST-MSN-{YYYY}-{5DIGIT}', code_generation_mode: 'hybrid', useful_life_months: 120, depreciation_method: 'Garis Lurus (Straight Line)', residual_percent: 5 },
    { category_name: 'Kendaraan Operasional', code_prefix: 'AST-KND-{YYYY}-{5DIGIT}', code_generation_mode: 'hybrid', useful_life_months: 60, depreciation_method: 'Saldo Menurun (Declining Balance)', residual_percent: 5 },
    { category_name: 'Alat Berat & Excavator', code_prefix: 'AST-ALT-{YYYY}-{5DIGIT}', code_generation_mode: 'hybrid', useful_life_months: 96, depreciation_method: 'Saldo Menurun (Declining Balance)', residual_percent: 5 },
    { category_name: 'Perangkat Komputer & IT', code_prefix: 'AST-IT-{YYYY}-{5DIGIT}', code_generation_mode: 'hybrid', useful_life_months: 36, depreciation_method: 'Jumlah Angka Tahun (Sum of Years Digits)', residual_percent: 0 },
    { category_name: 'Furniture & Peralatan Kantor', code_prefix: 'AST-FUR-{YYYY}-{5DIGIT}', code_generation_mode: 'hybrid', useful_life_months: 48, depreciation_method: 'Garis Lurus (Straight Line)', residual_percent: 5 },
    { category_name: 'Aset Tanah (Land)', code_prefix: 'AST-TNH-{YYYY}-{5DIGIT}', code_generation_mode: 'hybrid', useful_life_months: 0, depreciation_method: 'Manual / Non-Depresiasi', residual_percent: 100 },
];

const DEFAULT_SETTINGS: AssetSettingsState = {
    code_prefix: 'AST-{YYYY}-{5DIGIT}',
    code_generation_mode: 'hybrid',
    auto_generate_qr: true,
    require_photo: true,
    default_depreciation_method: 'Garis Lurus (Straight Line)',
    default_useful_life_months: 60,
    default_residual_percent: 5,
    min_capitalization_value: 1000000,
    category_rules: DEFAULT_CATEGORY_RULES,
    require_approval_disposal: true,
    require_approval_conversion: true,
    require_approval_loans: true,
};

const ROLE_LEVEL_LABELS: Record<number, string> = {
    1: 'Super Admin',
    2: 'Manajer',
    3: 'Supervisor',
    4: 'Operator',
    5: 'Viewer',
};

const ACTION_TYPE_OPTIONS = [
    'DISPOSAL', 'CONVERSION', 'LOAN', 'SOLD', 'RETIRED', 'LOST_STOLEN',
    'TRANSFER', 'REACTIVATION', 'REVALUATION', 'WRITE_OFF',
];

// ─── Modal: Tambah / Edit Kebijakan ────────────────────────────────────────────

interface PolicyModalProps {
    policy: ApprovalPolicy | null;
    onSave: (p: ApprovalPolicy) => void;
    onClose: () => void;
}

function PolicyModal({ policy, onSave, onClose }: PolicyModalProps) {
    const [form, setForm] = useState<ApprovalPolicy>(
        policy ?? {
            id: `policy_${Date.now()}`,
            action_type: 'DISPOSAL',
            label: '',
            description: '',
            is_active: true,
            approval_levels: 1,
            approver_mode: 'role',
            approver_role_level: 2,
            approver_user_ids: [],
            notify_email: true,
            notify_whatsapp: false,
        }
    );

    const set = (field: keyof ApprovalPolicy, val: any) =>
        setForm(prev => ({ ...prev, [field]: val }));

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck size={18} className="text-purple-500" />
                        {policy ? 'Edit Kebijakan Persetujuan' : 'Tambah Kebijakan Persetujuan'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Label */}
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Nama / Label Kebijakan <span className="text-destructive">*</span>
                        </label>
                        <Input
                            value={form.label}
                            onChange={e => set('label', e.target.value)}
                            placeholder="Contoh: Wajib Persetujuan untuk Penghapusan Aset IT"
                        />
                    </div>

                    {/* Action Type */}
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Jenis Aksi Lifecycle yang Dikendalikan <span className="text-destructive">*</span>
                        </label>
                        <Select
                            value={form.action_type}
                            onChange={val => set('action_type', val)}
                        >
                            {ACTION_TYPE_OPTIONS.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </Select>
                        <p className="text-[11px] text-muted-foreground mt-1">Saat staf memicu aksi ini di halaman Lifecycle Aset, sistem akan memblokir dan meminta persetujuan.</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Deskripsi Kebijakan
                        </label>
                        <Input
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Jelaskan mengapa kebijakan ini diperlukan..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Approval Levels */}
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                Jumlah Level Approval
                            </label>
                            <Select
                                value={String(form.approval_levels)}
                                onChange={val => set('approval_levels', Number(val) as 1 | 2)}
                            >
                                <option value="1">1 Level (Manajer)</option>
                                <option value="2">2 Level (Manajer → Direktur)</option>
                            </Select>
                        </div>

                        {/* Approver Mode */}
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                Mode Approver
                            </label>
                            <Select
                                value={form.approver_mode}
                                onChange={val => set('approver_mode', val as 'role' | 'user' | 'hybrid')}
                            >
                                <option value="role">Berdasarkan Role</option>
                                <option value="user">User Spesifik</option>
                                <option value="hybrid">Hybrid (Role + User)</option>
                            </Select>
                        </div>
                    </div>

                    {/* Role Level (if role or hybrid) */}
                    {(form.approver_mode === 'role' || form.approver_mode === 'hybrid') && (
                        <div>
                            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                Level Role Minimum Approver
                            </label>
                            <Select
                                value={String(form.approver_role_level)}
                                onChange={val => set('approver_role_level', Number(val))}
                            >
                                <option value="1">Super Admin (Level 1)</option>
                                <option value="2">Manajer ke Atas (Level ≤ 2)</option>
                                <option value="3">Supervisor ke Atas (Level ≤ 3)</option>
                            </Select>
                            <p className="text-[11px] text-muted-foreground mt-1">Semua user dengan role di level ini atau lebih tinggi dapat menyetujui.</p>
                        </div>
                    )}

                    {/* Notifications */}
                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Notifikasi Approver
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={form.notify_email}
                                    onChange={e => set('notify_email', e.target.checked)}
                                />
                                <span className="text-sm flex items-center gap-1.5">
                                    <Mail size={14} className="text-blue-500" /> Email
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={form.notify_whatsapp}
                                    onChange={e => set('notify_whatsapp', e.target.checked)}
                                />
                                <span className="text-sm flex items-center gap-1.5">
                                    <MessageSquare size={14} className="text-emerald-500" /> WhatsApp
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-3 pt-1">
                        <Checkbox
                            checked={form.is_active}
                            onChange={e => set('is_active', e.target.checked)}
                        />
                        <span className="text-sm font-semibold text-foreground">Kebijakan Aktif</span>
                        <span className="text-xs text-muted-foreground">(nonaktifkan untuk melewati approval sementara)</span>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border/60">
                    <Button variant="outline" onClick={onClose} className="rounded-xl">Batal</Button>
                    <Button
                        variant="default"
                        onClick={() => {
                            if (!form.label || !form.action_type) return;
                            onSave(form);
                        }}
                        className="rounded-xl"
                    >
                        <Check size={15} className="mr-1.5" />
                        {policy ? 'Simpan Perubahan' : 'Tambah Kebijakan'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AssetSettingsView() {
    const navigate = useNavigate();
    const { success, error: showError } = useToast();
    const [settings, setSettings] = useState<AssetSettingsState>(DEFAULT_SETTINGS);
    const [approvalPolicies, setApprovalPolicies] = useState<ApprovalPolicy[]>(DEFAULT_APPROVAL_POLICIES);
    const [waGateway, setWaGateway] = useState<WhatsAppGatewayConfig>(DEFAULT_WA_GATEWAY);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'depreciation' | 'approval'>('depreciation');

    // Policy modal state
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<ApprovalPolicy | null>(null);

    // ── Sync depreciation methods ──
    const syncDepreciationMethodsWithSettings = useCallback((rules: CategoryUsefulLifeRule[]) => {
        try {
            const rawMethods = localStorage.getItem('erp_depreciation_methods');
            let methods = rawMethods ? JSON.parse(rawMethods) : [];
            if (!methods || methods.length === 0) return;
            methods = methods.map((m: any) => ({ ...m, linked_categories: [] }));
            rules.forEach(rule => {
                const mName = (rule.depreciation_method || '').toLowerCase();
                let matchedCode = 'SLM';
                if (mName.includes('saldo') || mName.includes('declining')) matchedCode = 'DBM';
                else if (mName.includes('jumlah') || mName.includes('syd')) matchedCode = 'SYD';
                else if (mName.includes('manual') || mName.includes('non')) matchedCode = 'MANUAL';
                const methodObj = methods.find((m: any) => m.code === matchedCode);
                if (methodObj && !methodObj.linked_categories.includes(rule.category_name)) {
                    methodObj.linked_categories.push(rule.category_name);
                }
            });
            localStorage.setItem('erp_depreciation_methods', JSON.stringify(methods));
            window.dispatchEvent(new Event('erp_settings_updated'));
        } catch (e) { console.error(e); }
    }, []);

    // ── Load settings from DB (priority) → fallback localStorage ──
    useEffect(() => {
        const load = async () => {
            let savedRules: CategoryUsefulLifeRule[] = DEFAULT_CATEGORY_RULES;

            // 1. Try loading from DB via API
            try {
                const dbSettings = await settingsApi.getAll();

                const assetSetting = dbSettings.find(s => s.key === 'asset_settings');
                if (assetSetting?.value) {
                    const parsed = assetSetting.value;
                    setSettings(parsed);
                    if (parsed.category_rules) savedRules = parsed.category_rules;
                    localStorage.setItem('erp_asset_settings', JSON.stringify(parsed));
                } else {
                    // Fallback to localStorage
                    const local = localStorage.getItem('erp_asset_settings');
                    if (local) {
                        const parsed = JSON.parse(local);
                        setSettings(parsed);
                        if (parsed.category_rules) savedRules = parsed.category_rules;
                    }
                }

                const policySetting = dbSettings.find(s => s.key === 'asset_approval_policies');
                if (policySetting?.value?.policies) {
                    setApprovalPolicies(policySetting.value.policies);
                    localStorage.setItem('erp_asset_approval_policies', JSON.stringify(policySetting.value));
                } else {
                    const localPolicies = localStorage.getItem('erp_asset_approval_policies');
                    if (localPolicies) {
                        const parsed = JSON.parse(localPolicies);
                        if (parsed?.policies) setApprovalPolicies(parsed.policies);
                    }
                }

                const waSetting = dbSettings.find(s => s.key === 'whatsapp_gateway');
                if (waSetting?.value) {
                    setWaGateway(waSetting.value);
                }
            } catch (err) {
                // Complete fallback to localStorage
                const local = localStorage.getItem('erp_asset_settings');
                if (local) {
                    try {
                        const parsed = JSON.parse(local);
                        setSettings(parsed);
                        if (parsed.category_rules) savedRules = parsed.category_rules;
                    } catch { /* */ }
                }
                const localPolicies = localStorage.getItem('erp_asset_approval_policies');
                if (localPolicies) {
                    try {
                        const parsed = JSON.parse(localPolicies);
                        if (parsed?.policies) setApprovalPolicies(parsed.policies);
                    } catch { /* */ }
                }
            }

            // 2. Fetch dynamic categories from DB
            try {
                const dbCategories = await categoryApi.list();
                if (Array.isArray(dbCategories) && dbCategories.length > 0) {
                    const dynamicRules: CategoryUsefulLifeRule[] = dbCategories.map(cat => {
                        const existing = savedRules.find(r =>
                            r.category_name.toLowerCase() === cat.name.toLowerCase()
                        );
                        if (existing) return { ...existing, category_name: cat.name, code_generation_mode: existing.code_generation_mode || 'hybrid' };
                        const prefix = `AST-${(cat.code || cat.name.slice(0, 3)).toUpperCase()}-{YYYY}-{5DIGIT}`;
                        return { category_name: cat.name, code_prefix: prefix, code_generation_mode: 'hybrid' as const, useful_life_months: 60, depreciation_method: 'Garis Lurus (Straight Line)', residual_percent: 5 };
                    });
                    setSettings(prev => ({ ...prev, category_rules: dynamicRules }));
                    syncDepreciationMethodsWithSettings(dynamicRules);
                } else {
                    syncDepreciationMethodsWithSettings(savedRules);
                }
            } catch { syncDepreciationMethodsWithSettings(savedRules); }
        };
        load();
    }, [syncDepreciationMethodsWithSettings]);

    // ── Save all settings to DB ──
    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save asset settings
            await settingsApi.update('asset_settings', settings, 'Asset Management module settings');
            localStorage.setItem('erp_asset_settings', JSON.stringify(settings));

            // Save approval policies to DB
            const policiesPayload = { policies: approvalPolicies };
            await settingsApi.update('asset_approval_policies', policiesPayload, 'Asset approval policies');
            localStorage.setItem('erp_asset_approval_policies', JSON.stringify(policiesPayload));

            // Save WA gateway config
            await settingsApi.update('whatsapp_gateway', waGateway, 'WhatsApp gateway configuration');

            syncDepreciationMethodsWithSettings(settings.category_rules);
            window.dispatchEvent(new Event('erp_settings_updated'));
            success('Pengaturan Tersimpan ke Database', 'Semua kebijakan approval & prefix kode telah disimpan.');
        } catch {
            // Fallback to localStorage only
            localStorage.setItem('erp_asset_settings', JSON.stringify(settings));
            localStorage.setItem('erp_asset_approval_policies', JSON.stringify({ policies: approvalPolicies }));
            syncDepreciationMethodsWithSettings(settings.category_rules);
            window.dispatchEvent(new Event('erp_settings_updated'));
            success('Tersimpan Lokal', 'Pengaturan disimpan di browser (DB tidak tersedia).');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        setApprovalPolicies(DEFAULT_APPROVAL_POLICIES);
        setWaGateway(DEFAULT_WA_GATEWAY);
        localStorage.removeItem('erp_asset_settings');
        localStorage.removeItem('erp_asset_approval_policies');
        syncDepreciationMethodsWithSettings(DEFAULT_CATEGORY_RULES);
        window.dispatchEvent(new Event('erp_settings_updated'));
        success('Pengaturan Direset', 'Semua aturan dikembalikan ke standar default.');
    };

    const handleRuleChange = (index: number, field: keyof CategoryUsefulLifeRule, value: any) => {
        const updatedRules = [...settings.category_rules];
        updatedRules[index] = { ...updatedRules[index], [field]: value };
        setSettings(s => ({ ...s, category_rules: updatedRules }));
    };

    // Policy CRUD
    const handleSavePolicy = (policy: ApprovalPolicy) => {
        setApprovalPolicies(prev => {
            const idx = prev.findIndex(p => p.id === policy.id);
            if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = policy;
                return updated;
            }
            return [...prev, policy];
        });
        setPolicyModalOpen(false);
        setEditingPolicy(null);
    };

    const handleDeletePolicy = (id: string) => {
        setApprovalPolicies(prev => prev.filter(p => p.id !== id));
    };

    const handleTogglePolicy = (id: string) => {
        setApprovalPolicies(prev =>
            prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p)
        );
    };

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            {/* Policy Modal */}
            {policyModalOpen && (
                <PolicyModal
                    policy={editingPolicy}
                    onSave={handleSavePolicy}
                    onClose={() => { setPolicyModalOpen(false); setEditingPolicy(null); }}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/assets-workspace')}
                        className="p-2 rounded-xl bg-card border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Sliders className="text-primary" size={24} /> Asset Settings & Configuration
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Pengaturan penomoran kode, umur ekonomis, kebijakan persetujuan, dan notifikasi — tersimpan di database
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleReset} className="rounded-xl">
                        <RotateCcw size={16} className="mr-2" /> Reset Default
                    </Button>
                    <Button variant="default" onClick={handleSave} disabled={isSaving} className="rounded-xl font-semibold">
                        <Save size={16} className="mr-2" /> {isSaving ? 'Menyimpan ke DB...' : 'Simpan ke Database'}
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/60 gap-4">
                {[
                    { key: 'depreciation', icon: <DollarSign size={16} />, label: 'Umur Ekonomis & Depresiasi Per Kategori' },
                    { key: 'general', icon: <Hash size={16} />, label: 'Identifikasi & Penomoran Kode Per Kategori' },
                    { key: 'approval', icon: <ShieldCheck size={16} />, label: 'Kebijakan Persetujuan & Keamanan' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${activeTab === tab.key
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Contents */}
            <div className="space-y-6 max-w-6xl">

                {/* ─── TAB: Depreciation ─── */}
                {activeTab === 'depreciation' && (
                    <div className="space-y-6">
                        <Card className="rounded-2xl border-border/60 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Layers className="text-amber-500" size={20} /> Aturan Umur Ekonomis & Depresiasi Spesifik Per Kategori Aset
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4 overflow-x-auto">
                                <table className="w-full text-xs sm:text-sm text-left">
                                    <thead className="text-[11px] font-bold text-muted-foreground uppercase bg-muted/40 border-b border-border/60 tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3.5">Kategori / Jenis Aset (Dinamis DB)</th>
                                            <th className="px-4 py-3.5 w-44">Format Prefix Kode</th>
                                            <th className="px-4 py-3.5 w-32">Umur Ekonomis</th>
                                            <th className="px-4 py-3.5 w-28">Konversi</th>
                                            <th className="px-4 py-3.5 w-64">Metode Depresiasi</th>
                                            <th className="px-4 py-3.5 w-28">Nilai Sisa (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {settings.category_rules.map((rule, idx) => (
                                            <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                                                    {rule.category_name.includes('Bangunan') && <Building2 size={16} className="text-blue-500" />}
                                                    {rule.category_name.includes('Mesin') && <Factory size={16} className="text-amber-500" />}
                                                    {rule.category_name.includes('Kendaraan') && <Truck size={16} className="text-emerald-500" />}
                                                    {rule.category_name.includes('Berat') && <HardHat size={16} className="text-purple-500" />}
                                                    {rule.category_name.includes('Komputer') && <Monitor size={16} className="text-sky-500" />}
                                                    {rule.category_name.includes('Furniture') && <Armchair size={16} className="text-rose-500" />}
                                                    {!['Bangunan', 'Mesin', 'Kendaraan', 'Berat', 'Komputer', 'Furniture'].some(k => rule.category_name.includes(k)) && <Layers size={16} className="text-primary" />}
                                                    {rule.category_name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input value={rule.code_prefix} disabled className="py-1.5 px-3 text-xs font-mono text-muted-foreground bg-muted/60 cursor-not-allowed max-w-[180px]" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input type="number" value={rule.useful_life_months} onChange={e => handleRuleChange(idx, 'useful_life_months', Number(e.target.value))} className="py-1.5 px-3 text-xs font-bold max-w-[100px]" />
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground font-medium">
                                                    {rule.useful_life_months > 0 ? `${(rule.useful_life_months / 12).toFixed(1)} Thn` : '0 Thn'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Select value={rule.depreciation_method} onChange={val => handleRuleChange(idx, 'depreciation_method', val)} className="py-1.5 px-3 text-xs font-semibold min-w-[200px]">
                                                        <option value="Garis Lurus (Straight Line)">Garis Lurus (Straight Line)</option>
                                                        <option value="Saldo Menurun (Declining Balance)">Saldo Menurun (Declining Balance)</option>
                                                        <option value="Jumlah Angka Tahun (Sum of Years Digits)">Jumlah Angka Tahun (SYD)</option>
                                                        <option value="Manual / Non-Depresiasi">Manual / Non-Depresiasi</option>
                                                    </Select>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Input type="number" value={rule.residual_percent} onChange={e => handleRuleChange(idx, 'residual_percent', Number(e.target.value))} className="py-1.5 px-3 text-xs font-semibold max-w-[80px]" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <DollarSign className="text-emerald-500" size={20} /> Parameter Umum & Batas Kapitalisasi
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Batas Minimal Kapitalisasi Aset (Rp)</label>
                                        <Input type="number" value={settings.min_capitalization_value} onChange={e => setSettings(s => ({ ...s, min_capitalization_value: Number(e.target.value) }))} />
                                        <p className="text-xs text-muted-foreground mt-1">Pembelian di bawah batas ini dikelompokkan sebagai Beban Operasional (Opex).</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Umur Ekonomis Safety Fallback (Bulan)</label>
                                        <Input type="number" value={settings.default_useful_life_months} onChange={e => setSettings(s => ({ ...s, default_useful_life_months: Number(e.target.value) }))} />
                                        <p className="text-xs text-muted-foreground mt-1">Digunakan jika kategori aset baru belum memiliki aturan spesifik.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ─── TAB: General (Code Numbering) ─── */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <Card className="rounded-2xl border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Hash className="text-blue-500" size={20} /> Pengeditan Format Prefix & Mode Penomoran Kode Per Kategori
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">Atur format prefix dan mode penomoran secara independen per kategori:</p>
                                <div className="overflow-x-auto rounded-xl border border-border/60">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-muted/40 font-bold text-muted-foreground border-b border-border/60 uppercase">
                                            <tr>
                                                <th className="px-4 py-3">Kategori Aset (DB)</th>
                                                <th className="px-4 py-3 w-52">Format Prefix Kode</th>
                                                <th className="px-4 py-3 w-40">Contoh Kode</th>
                                                <th className="px-4 py-3 w-64 text-amber-500">Mode Penomoran Kode</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40 bg-card">
                                            {settings.category_rules.map((rule, idx) => {
                                                const year = new Date().getFullYear();
                                                const sampleCode = rule.code_prefix
                                                    .replace('{YYYY}', String(year)).replace('{YY}', String(year).slice(-2))
                                                    .replace('{5DIGIT}', '00001').replace('{4DIGIT}', '0001');
                                                return (
                                                    <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                                        <td className="px-4 py-2.5 font-semibold text-foreground">{rule.category_name}</td>
                                                        <td className="px-4 py-2.5">
                                                            <Input value={rule.code_prefix} onChange={e => handleRuleChange(idx, 'code_prefix', e.target.value)} className="py-1 px-3 text-xs font-mono font-bold text-primary max-w-[200px]" />
                                                        </td>
                                                        <td className="px-4 py-2.5 font-mono font-bold text-emerald-500">{sampleCode}</td>
                                                        <td className="px-4 py-2.5">
                                                            <Select value={rule.code_generation_mode || 'hybrid'} onChange={val => handleRuleChange(idx, 'code_generation_mode', val)} className="py-1 px-3 text-xs font-semibold">
                                                                <option value="hybrid">Otomatis + Override Manual (Hybrid)</option>
                                                                <option value="auto">Otomatis Penuh (Strict Auto)</option>
                                                                <option value="manual">Manual Penuh</option>
                                                            </Select>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-2xl border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <QrCode className="text-blue-500" size={20} /> Kebijakan QR Code & Dokumentasi Foto
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <Checkbox checked={settings.auto_generate_qr} onChange={e => setSettings(s => ({ ...s, auto_generate_qr: e.target.checked }))} />
                                    <div>
                                        <span className="text-sm font-semibold text-foreground">Otomatis Hasilkan QR Code saat Registrasi Aset</span>
                                        <p className="text-xs text-muted-foreground">Sistem akan langsung membuat QR Code URL unik untuk pemindaian label fisik aset.</p>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <Checkbox checked={settings.require_photo} onChange={e => setSettings(s => ({ ...s, require_photo: e.target.checked }))} />
                                    <div>
                                        <span className="text-sm font-semibold text-foreground">Wajib Lampirkan Foto Fisik Aset Baru</span>
                                        <p className="text-xs text-muted-foreground">Mencegah pendaftaran aset baru tanpa dokumen foto kondisi fisik.</p>
                                    </div>
                                </label>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ─── TAB: Approval Policies ─── */}
                {activeTab === 'approval' && (
                    <div className="space-y-6">
                        {/* Approval Policies Table */}
                        <Card className="rounded-2xl border-border/60 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
                                <div>
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <ShieldCheck className="text-purple-500" size={20} /> Daftar Kebijakan Persetujuan Aset
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Setiap aksi lifecycle yang terdaftar di sini akan diblokir dan memerlukan persetujuan sebelum dieksekusi.
                                        Tersimpan di database — berlaku untuk semua user di semua device.
                                    </p>
                                </div>
                                <Button
                                    variant="default"
                                    className="rounded-xl shrink-0"
                                    onClick={() => { setEditingPolicy(null); setPolicyModalOpen(true); }}
                                >
                                    <Plus size={15} className="mr-1.5" /> Tambah Kebijakan
                                </Button>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {approvalPolicies.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <ShieldCheck size={40} className="mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">Belum ada kebijakan persetujuan.</p>
                                        <p className="text-xs mt-1">Semua aksi lifecycle akan dieksekusi langsung tanpa approval.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto rounded-xl border border-border/60">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-muted/40 font-bold text-muted-foreground border-b border-border/60 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">Nama Kebijakan</th>
                                                    <th className="px-4 py-3 w-28">Aksi Lifecycle</th>
                                                    <th className="px-4 py-3 w-24 text-center">Aktif</th>
                                                    <th className="px-4 py-3 w-24 text-center">Level</th>
                                                    <th className="px-4 py-3 w-40">Approver</th>
                                                    <th className="px-4 py-3 w-24 text-center">Notifikasi</th>
                                                    <th className="px-4 py-3 w-24 text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/40 bg-card">
                                                {approvalPolicies.map(policy => (
                                                    <tr key={policy.id} className={`hover:bg-muted/20 transition-colors ${!policy.is_active ? 'opacity-50' : ''}`}>
                                                        <td className="px-4 py-3">
                                                            <div className="font-semibold text-foreground">{policy.label}</div>
                                                            <div className="text-[11px] text-muted-foreground mt-0.5 max-w-[250px] truncate">{policy.description}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                                                {policy.action_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <button
                                                                onClick={() => handleTogglePolicy(policy.id)}
                                                                className={`w-10 h-5 rounded-full transition-all cursor-pointer relative ${policy.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}
                                                            >
                                                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${policy.is_active ? 'left-5' : 'left-0.5'}`} />
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="font-bold text-foreground">{policy.approval_levels}</span>
                                                            <span className="text-muted-foreground ml-1">Level</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5">
                                                                {(policy.approver_mode === 'role' || policy.approver_mode === 'hybrid') && (
                                                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                                        <Users size={12} /> {ROLE_LEVEL_LABELS[policy.approver_role_level] ?? `Level ${policy.approver_role_level}`}
                                                                    </span>
                                                                )}
                                                                {policy.approver_mode === 'user' && (
                                                                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                                        <User size={12} /> {policy.approver_user_ids.length} user
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex justify-center gap-2">
                                                                {policy.notify_email && <Mail size={14} className="text-blue-500" title="Email" />}
                                                                {policy.notify_whatsapp && <MessageSquare size={14} className="text-emerald-500" title="WhatsApp" />}
                                                                {!policy.notify_email && !policy.notify_whatsapp && <Bell size={14} className="text-muted-foreground" title="UI Only" />}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex justify-center gap-1">
                                                                <button
                                                                    onClick={() => { setEditingPolicy(policy); setPolicyModalOpen(true); }}
                                                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                                    title="Edit"
                                                                >
                                                                    <Edit2 size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeletePolicy(policy.id)}
                                                                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                                                    title="Hapus"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* WhatsApp Gateway Config */}
                        <Card className="rounded-2xl border-border/60 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <MessageSquare className="text-emerald-500" size={20} /> Konfigurasi WhatsApp Gateway
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Mode selector */}
                                <div className="flex gap-3">
                                    <div
                                        onClick={() => setWaGateway(g => ({ ...g, mode: 'mock' }))}
                                        className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${waGateway.mode === 'mock' ? 'border-amber-500 bg-amber-500/5' : 'border-border/60 hover:border-border bg-card'}`}
                                    >
                                        <div className="font-bold text-sm text-foreground mb-1">🧪 Mock (Log Only)</div>
                                        <p className="text-[11px] text-muted-foreground">Pesan WA hanya dicatat di server log. Tidak dikirim ke nomor nyata. Cocok untuk development & testing.</p>
                                    </div>
                                    <div
                                        onClick={() => setWaGateway(g => ({ ...g, mode: 'production' }))}
                                        className={`flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all ${waGateway.mode === 'production' ? 'border-emerald-500 bg-emerald-500/5' : 'border-border/60 hover:border-border bg-card'}`}
                                    >
                                        <div className="font-bold text-sm text-foreground mb-1">🚀 Production (Real Gateway)</div>
                                        <p className="text-[11px] text-muted-foreground">Pesan WA dikirim ke gateway nyata. Isi URL & API Key di bawah sebelum mengaktifkan.</p>
                                    </div>
                                </div>

                                {/* Gateway URL & API Key */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                            URL Gateway
                                        </label>
                                        <Input
                                            value={waGateway.gateway_url}
                                            onChange={e => setWaGateway(g => ({ ...g, gateway_url: e.target.value }))}
                                            placeholder="https://api.yourgateway.com/send"
                                            disabled={waGateway.mode === 'mock'}
                                            className={waGateway.mode === 'mock' ? 'opacity-50 cursor-not-allowed' : ''}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                            API Key / Token
                                        </label>
                                        <Input
                                            type="password"
                                            value={waGateway.api_key}
                                            onChange={e => setWaGateway(g => ({ ...g, api_key: e.target.value }))}
                                            placeholder="•••••••••••••••••••••••••"
                                            disabled={waGateway.mode === 'mock'}
                                            className={waGateway.mode === 'mock' ? 'opacity-50 cursor-not-allowed' : ''}
                                        />
                                    </div>
                                </div>

                                {waGateway.mode === 'mock' && (
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                                        <p className="text-xs text-amber-700 dark:text-amber-400">
                                            Mode Mock aktif. Notifikasi WhatsApp akan dicatat di server log backend (<code>[WA MOCK]</code>) namun tidak dikirim ke nomor HP. Ganti ke Production dan isi URL gateway nyata untuk kirim WA sungguhan.
                                        </p>
                                    </div>
                                )}

                                {waGateway.mode === 'production' && !waGateway.gateway_url && (
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                                        <AlertTriangle size={15} className="text-destructive mt-0.5 shrink-0" />
                                        <p className="text-xs text-destructive">
                                            Mode Production dipilih tetapi URL Gateway belum diisi. WA tidak akan terkirim sampai URL diisi dan disimpan.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
