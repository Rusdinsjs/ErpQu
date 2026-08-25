import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigationStore } from '../store/useNavigationStore';
import { useTheme } from '../contexts/ThemeContext';
import {
    BarChart3,
    Box,
    Building2,
    Package,
    TrendingUp,
    ShoppingBag,
    Wallet,
    Users,
    ClipboardCheck,
    Settings,
    Wrench,
    ChevronRight,
    LogOut,
    Sun,
    Moon,
    Activity,
    Truck,
    GripVertical,
    RotateCcw,
} from 'lucide-react';
import { getImageUrl } from '../utils/image';
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../api/settings';
import { fetchCompanies } from '../api/companyApi';
import { Logo } from '../components/ui';
import { AIChatWidget } from '../components/AI/AIChatWidget';
import type { LaunchpadModuleConfig, LaunchpadConfig, MenuId } from '../config/launchpadConfig';
import { DEFAULT_LAUNCHPAD_CONFIG, MENU_LABELS, MENU_TO_RESOURCE } from '../config/launchpadConfig';

// ─── Icon Registry ───────────────────────────────────────────────────────────
// Maps icon string names (stored in config) to actual Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
    BarChart3,
    Box,
    Building2,
    Package,
    TrendingUp,
    ShoppingBag,
    Wallet,
    Users,
    ClipboardCheck,
    Settings,
    Wrench,
    Moon,
    Sun,
    Activity,
    Truck,
};

function resolveIcon(iconName: string): React.ElementType {
    return ICON_MAP[iconName] || Package;
}

export default function Launchpad() {
    const navigate = useNavigate();
    const { user, logout, hasPermission } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const { setActiveModule, setLaunchpadConfig, launchpadConfig } = useNavigationStore();

    // Drag and Drop States
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [hasCustomOrder, setHasCustomOrder] = useState(false);

    // Check if user has permission for a specific menu resource
    const canAccessMenu = (menuId: string) => {
        const resource = MENU_TO_RESOURCE[menuId as MenuId] || menuId.replace(/-/g, '_');

        // Special case: 'users' menu in System Admin requires user management capabilities or read/view
        if (menuId === 'users') {
            return hasPermission('user.create') || hasPermission('user.update') || hasPermission('user.delete') || hasPermission('user.*') || hasPermission('user.read') || hasPermission('user.view');
        }

        let hasAccess = hasPermission(`${resource}.read`) || hasPermission(`${resource}.view`) || hasPermission(`${resource}.*`);

        // Fallback checks for resources with alternative names in RBAC
        if (!hasAccess && resource === 'work_order') {
            hasAccess = hasPermission('maintenance.read') || hasPermission('maintenance.view') || hasPermission('maintenance.*');
        }
        if (!hasAccess && resource === 'approval_center') {
            hasAccess = hasPermission('approval_center.read') || hasPermission('approval_center.view') || hasPermission('approval_center.*') || hasPermission('maintenance.approve') || hasPermission('work_order.approve_cost');
        }

        return hasAccess;
    };

    // Fetch public settings (includes launchpad_config if stored in backend)
    const { data: publicSettings } = useQuery({
        queryKey: ['public-settings'],
        queryFn: settingsApi.getPublic
    });

    // Fetch active companies / organizations
    const { data: companiesRes } = useQuery({
        queryKey: ['companies-list'],
        queryFn: () => fetchCompanies({ status: 'ACTIVE' }),
        staleTime: 5 * 60 * 1000,
    });

    const activeOrganization =
        companiesRes?.data?.[0]?.name ||
        publicSettings?.company_name ||
        'SJS GROUP (Headquarters)';

    const appName = publicSettings?.app_name || 'Management System';

    // Load launchpad config from backend settings and user local custom drag order
    useEffect(() => {
        let baseConfig = DEFAULT_LAUNCHPAD_CONFIG;
        if (publicSettings?.launchpad_config) {
            try {
                const backendConfigStr = typeof publicSettings.launchpad_config === 'string'
                    ? publicSettings.launchpad_config
                    : JSON.stringify(publicSettings.launchpad_config);
                const backendConfig = JSON.parse(backendConfigStr);
                if (backendConfig && Array.isArray(backendConfig.modules)) {
                    // Merge backend config with default config to ensure static UI fields (like defaultRoute) are always up to date
                    const mergedModules = backendConfig.modules
                        .filter((backendMod: any) => DEFAULT_LAUNCHPAD_CONFIG.modules.some(m => m.id === backendMod.id))
                        .map((backendMod: any) => {
                            const defaultMod = DEFAULT_LAUNCHPAD_CONFIG.modules.find(m => m.id === backendMod.id)!;
                            return {
                                ...backendMod,
                                // Force static UI fields from the latest code to prevent stale DB configs
                                title: defaultMod.title,
                                subtitle: defaultMod.subtitle,
                                icon: defaultMod.icon,
                                gradient: defaultMod.gradient,
                                iconBg: defaultMod.iconBg,
                                defaultRoute: defaultMod.defaultRoute,
                                features: defaultMod.features,
                                menuIds: defaultMod.menuIds
                            };
                        });
                    baseConfig = { ...backendConfig, modules: mergedModules };
                }
            } catch {
                console.warn('Invalid launchpad_config in settings, using defaults');
            }
        }

        // Apply custom drag order from localStorage if saved by user
        const storageKey = `launchpad_user_order_${user?.id || 'default'}`;
        const savedOrderStr = localStorage.getItem(storageKey);
        if (savedOrderStr) {
            try {
                const savedOrderMap: Record<string, number> = JSON.parse(savedOrderStr);
                const reorderedModules = baseConfig.modules.map(mod => {
                    if (typeof savedOrderMap[mod.id] === 'number') {
                        return { ...mod, order: savedOrderMap[mod.id] };
                    }
                    return mod;
                });
                baseConfig = { ...baseConfig, modules: reorderedModules };
                setHasCustomOrder(true);
            } catch {
                console.warn('Failed to parse user launchpad order');
            }
        } else {
            setHasCustomOrder(false);
        }

        // Validate shape & sanitize menuIds
        if (!baseConfig.modules.some((m: any) => m.id === 'organization')) {
            baseConfig.modules.unshift(DEFAULT_LAUNCHPAD_CONFIG.modules[0]);
        }

        const sanitizedModules = baseConfig.modules.map((m: any) => {
            if (m.id === 'asset-management') {
                const ids = (m.menuIds || []).filter((id: string) => id !== 'maintenance-templates');
                if (!ids.includes('conversions')) ids.push('conversions');
                if (!ids.includes('categories')) ids.push('categories');
                if (!ids.includes('locations')) ids.push('locations');
                return { ...m, menuIds: ids };
            }
            if (m.id === 'commercial') {
                const ids = (m.menuIds || []).filter((id: string) => id !== 'purchase-bills' && id !== 'contracts');
                return { ...m, menuIds: ids };
            }
            if (m.id === 'procurement') {
                const ids = m.menuIds || [];
                if (!ids.includes('purchase-bills')) ids.push('purchase-bills');
                return { ...m, menuIds: ids };
            }
            if (m.id === 'rental') {
                const ids = m.menuIds || [];
                if (!ids.includes('contracts')) ids.push('contracts');
                if (!ids.includes('contract-templates')) ids.push('contract-templates');
                return { ...m, menuIds: ids };
            }
            if (m.id === 'supply-chain') {
                const ids = (m.menuIds || []).filter((id: string) => id !== 'conversions' && id !== 'purchase-bills');
                if (!ids.includes('inventory-categories')) ids.push('inventory-categories');
                if (!ids.includes('warehouses')) ids.push('warehouses');
                if (!ids.includes('stock-entry')) ids.push('stock-entry');
                if (!ids.includes('material-request')) ids.push('material-request');
                return { ...m, menuIds: ids };
            }
            if (m.id === 'hr') {
                const ids = m.menuIds || [];
                return { ...m, menuIds: ids.filter((id: string) => id !== 'departments') };
            }
            if (m.id === 'admin') {
                const ids = m.menuIds || [];
                if (!ids.includes('system-reset')) ids.push('system-reset');
                return { ...m, menuIds: ids.filter((id: string) => 
                    id !== 'locations' &&
                    id !== 'approval-workflow-settings' &&
                    id !== 'users' &&
                    id !== 'roles' &&
                    id !== 'inventory-categories' &&
                    id !== 'categories' &&
                    id !== 'maintenance-templates'
                ) };
            }
            if (m.id === 'organization') {
                const ids = m.menuIds || [];
                if (!ids.includes('departments')) ids.push('departments');
                if (!ids.includes('approval-workflow-settings')) ids.push('approval-workflow-settings');
                if (!ids.includes('users')) ids.push('users');
                if (!ids.includes('roles')) ids.push('roles');
                return { ...m, menuIds: ids };
            }
            return m;
        });

        setLaunchpadConfig({ ...baseConfig, modules: sanitizedModules } as LaunchpadConfig);
    }, [publicSettings, user?.id, setLaunchpadConfig]);

    // Get visible cards based on user Permission Matrix permissions
    const visibleCards = launchpadConfig.modules
        .filter(card => {
            if (!card.enabled) return false;
            // Super Admin or Level <= 2 sees all cards
            if (user?.role === 'super_admin' || user?.role === 'admin' || (user?.role_level && user.role_level <= 2)) return true;
            // For other users, only show cards where they have at least one menu permission
            const hasAnyMenuPermission = (card.menuIds || []).some(menuId => canAccessMenu(menuId));
            return hasAnyMenuPermission;
        })
        .sort((a, b) => a.order - b.order);

    // Drag and Drop Event Handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = (index: number) => {
        if (dragOverIndex === index) {
            setDragOverIndex(null);
        }
    };

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            setIsDragging(false);
            return;
        }

        const newCards = [...visibleCards];
        const [movedCard] = newCards.splice(draggedIndex, 1);
        newCards.splice(targetIndex, 0, movedCard);

        // Calculate new order values
        const orderMap: Record<string, number> = {};
        newCards.forEach((card, idx) => {
            orderMap[card.id] = idx + 1;
        });

        // Update all modules order
        const updatedModules = launchpadConfig.modules.map(mod => {
            if (typeof orderMap[mod.id] === 'number') {
                return { ...mod, order: orderMap[mod.id] };
            }
            return mod;
        });

        const newConfig = { ...launchpadConfig, modules: updatedModules };
        setLaunchpadConfig(newConfig);

        // Save order to localStorage for current user
        const storageKey = `launchpad_user_order_${user?.id || 'default'}`;
        const allOrders: Record<string, number> = {};
        updatedModules.forEach(m => {
            allOrders[m.id] = m.order;
        });
        localStorage.setItem(storageKey, JSON.stringify(allOrders));
        setHasCustomOrder(true);

        setDraggedIndex(null);
        setDragOverIndex(null);
        setTimeout(() => setIsDragging(false), 150);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
        setTimeout(() => setIsDragging(false), 150);
    };

    const handleResetOrder = () => {
        const storageKey = `launchpad_user_order_${user?.id || 'default'}`;
        localStorage.removeItem(storageKey);
        setLaunchpadConfig(DEFAULT_LAUNCHPAD_CONFIG);
        setHasCustomOrder(false);
    };

    const handleCardClick = (card: LaunchpadModuleConfig) => {
        if (isDragging) return;

        // Set the active module context in the navigation store
        setActiveModule(card.id);
        
        const defaultRoute = (card as any).route || card.defaultRoute;
        const defaultMenuId = defaultRoute.replace(/^\//, '') as MenuId;

        // If user has access to default route or is admin, navigate directly
        if ((user?.role_level ?? 5) <= 2 || canAccessMenu(defaultMenuId)) {
            navigate(defaultRoute);
            return;
        }

        // Smart Default Route: Navigate to first accessible menu in this module card
        const accessibleMenu = (card.menuIds || []).find(id => canAccessMenu(id));
        if (accessibleMenu) {
            navigate(`/${accessibleMenu}`);
        } else {
            navigate(defaultRoute);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-background">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/100/10 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-emerald-500/100/10 rounded-full blur-3xl animate-pulse delay-500" />

                {/* Grid Pattern Overlay */}
                <div
                    className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: `
                            linear-gradient(currentColor 1px, transparent 1px),
                            linear-gradient(90deg, currentColor 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo collapsed={false} />
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/60 border border-border/80 text-xs font-medium text-muted-foreground shadow-sm">
                            <Building2 className="w-3.5 h-3.5 text-primary" />
                            <span className="font-semibold text-foreground">{activeOrganization}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl bg-card/40 border border-border/60 hover:bg-card hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all duration-300 backdrop-blur-md shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/50 hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-all text-sm cursor-pointer"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline">Keluar</span>
                        </button>
                    </div>
                </header>

                {/* Hero Section */}
                <div className="px-6 py-6 md:py-10 text-center">
                    <div className="flex justify-center mb-4">
                        {user?.avatar_url ? (
                            <img
                                src={getImageUrl(user.avatar_url)}
                                alt="Avatar"
                                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-primary/20 shadow-xl"
                                onError={(e) => {
                                    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
                                    (e.target as HTMLImageElement).src = isAdmin ? '/avatar-admin.png' : '/avatar-user.png';
                                }}
                            />
                        ) : (
                            <img
                                src={user?.role === 'admin' || user?.role === 'super_admin' ? '/avatar-admin.png' : '/avatar-user.png'}
                                alt="Avatar"
                                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-primary/20 shadow-xl"
                            />
                        )}
                    </div>

                    {/* Organization Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-3 backdrop-blur-md shadow-sm">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        <span>{activeOrganization}</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                        {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
                    </h2>
                    <p className="text-muted-foreground text-base md:text-lg mb-3">
                        Pilih modul untuk memulai
                    </p>

                    {/* Drag & Drop Hint & Reset Order Control */}
                    <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/40 border border-border/50 shadow-sm">
                            <GripVertical size={13} className="text-primary animate-pulse" />
                            Tarik & geser card untuk mengubah posisi (Shortcut)
                        </span>
                        {hasCustomOrder && (
                            <button
                                onClick={handleResetOrder}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 transition-all cursor-pointer font-medium shadow-sm active:scale-95"
                                title="Kembalikan urutan card ke susunan standar"
                            >
                                <RotateCcw size={13} />
                                <span>Reset Tata Letak</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Cards Grid — Driven by Config with Drag & Drop support */}
                <div className="flex-1 px-6 pb-12 flex items-start justify-center">
                    <div className={clsx(
                        "grid gap-4 md:gap-6 w-full transition-all duration-300",
                        visibleCards.length === 1 ? "max-w-md grid-cols-1" :
                        visibleCards.length === 2 ? "max-w-3xl grid-cols-1 sm:grid-cols-2" :
                        visibleCards.length === 3 ? "max-w-5xl grid-cols-1 sm:grid-cols-2 md:grid-cols-3" :
                        "max-w-6xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    )}>
                        {visibleCards.map((card, index) => {
                            const IconComponent = resolveIcon(card.icon);
                            const isBeingDragged = draggedIndex === index;
                            const isBeingOver = dragOverIndex === index && draggedIndex !== index;

                            return (
                                <div
                                    key={card.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={() => handleDragLeave(index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handleCardClick(card)}
                                    className={clsx(
                                        "group relative p-6 rounded-2xl text-left transition-all duration-300 cursor-pointer select-none",
                                        "bg-card/50 hover:bg-card",
                                        "border border-border hover:border-primary/30",
                                        "backdrop-blur-xl",
                                        "hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/5",
                                        "focus:outline-none focus:ring-2 focus:ring-primary/50",
                                        isBeingDragged && "opacity-30 scale-95 border-dashed border-primary ring-2 ring-primary/40 shadow-inner",
                                        isBeingOver && "scale-[1.05] border-primary ring-4 ring-primary/50 bg-primary/10 shadow-2xl z-20 animate-pulse"
                                    )}
                                    style={{
                                        animationDelay: `${index * 50}ms`
                                    }}
                                >
                                    {/* Drag Handle Shortcut Indicator */}
                                    <div
                                        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-40 group-hover:opacity-100 transition-all text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing bg-card/80 border border-border/40 shadow-sm z-20"
                                        title="Tarik & geser untuk memindahkan posisi card"
                                    >
                                        <GripVertical size={16} />
                                    </div>

                                    {/* Gradient Overlay on Hover */}
                                    <div className={clsx(
                                        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 bg-gradient-to-br pointer-events-none",
                                        card.gradient
                                    )} />

                                    {/* Content */}
                                    <div className="relative z-10 pointer-events-none">
                                        {/* Icon */}
                                        <div className={clsx(
                                            "w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110",
                                            card.iconBg
                                        )}>
                                            <IconComponent className="w-6 h-6 text-white" />
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-lg font-semibold text-foreground mb-1 transition-colors">
                                            {card.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {card.subtitle}
                                        </p>

                                        {/* Dynamic Menu Features */}
                                        <div className="space-y-1.5 mb-4 min-h-[60px]">
                                            {(() => {
                                                const permittedMenuIds = card.menuIds.filter(menuId => canAccessMenu(menuId));
                                                const displayMenuIds = permittedMenuIds.length > 0 ? permittedMenuIds : card.menuIds;
                                                return (
                                                    <>
                                                        {displayMenuIds.slice(0, 3).map((menuId, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground/70">
                                                                <div className="w-1 h-1 rounded-full bg-border shrink-0" />
                                                                <span className="truncate">{MENU_LABELS[menuId as MenuId] || menuId}</span>
                                                            </div>
                                                        ))}
                                                        {displayMenuIds.length > 3 && (
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground/50 italic">
                                                                <div className="w-1 h-1 rounded-full bg-transparent shrink-0" />
                                                                <span>+{displayMenuIds.length - 3} menu lainnya...</span>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {/* Arrow */}
                                        <div className="flex items-center gap-1 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-1">
                                            <span>Buka Modul</span>
                                            <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <footer className="px-6 py-4 border-t border-border/50">
                    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
                        <p>© {new Date().getFullYear()} {appName}. All rights reserved.</p>
                        <p className="flex items-center gap-1">
                            Logged in as <span className="text-foreground font-medium">{user?.email}</span>
                            <span className="ml-2 px-2 py-0.5 rounded bg-accent text-accent-foreground">{user?.role}</span>
                        </p>
                    </div>
                </footer>
            </div>
            <AIChatWidget />
        </div>
    );
}
