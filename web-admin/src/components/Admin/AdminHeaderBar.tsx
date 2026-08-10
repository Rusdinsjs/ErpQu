import React, { useState } from 'react';
import { LayoutDashboard, Menu, Sun, Moon, Bell } from 'lucide-react';
import { Logo } from '../ui';
import { getImageUrl } from '../../utils/image';
import { MENU_LABELS, type MenuId } from '../../config/launchpadConfig';

interface AdminHeaderBarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    setActiveModule: (module: string | null) => void;
    theme: string;
    toggleTheme: () => void;
    user: any;
    navigate: (path: string) => void;
}

export function AdminHeaderBar({
    sidebarOpen,
    setSidebarOpen,
    activeTab,
    setActiveTab,
    setActiveModule,
    theme,
    toggleTheme,
    user,
    navigate
}: AdminHeaderBarProps) {
    const [notifOpen, setNotifOpen] = useState(false);

    return (
        <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 gap-4 relative z-10 shadow-sm">
            {/* Sidebar Toggle Button (Mobile Only) */}
            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 -ml-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors lg:hidden"
            >
                <Menu size={24} />
            </button>

            <Logo className="lg:hidden" collapsed={false} />

            {/* Back to Launchpad Button & Breadcrumb */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => { setActiveModule(null); navigate('/launchpad'); }}
                    className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                    title="Kembali ke Menu Utama / Launchpad"
                >
                    <LayoutDashboard size={18} />
                    <span className="hidden sm:inline">Menu Utama</span>
                </button>

                {activeTab !== 'dashboard' && MENU_LABELS[activeTab as MenuId] && (
                    <>
                        <span className="text-muted-foreground/40 text-xs hidden sm:inline">/</span>
                        <span className="text-xs font-semibold text-foreground/80 bg-muted/50 px-2.5 py-1 rounded-md hidden sm:inline border border-border/50">
                            {MENU_LABELS[activeTab as MenuId]}
                        </span>
                    </>
                )}
            </div>

            <div className="flex-1" /> {/* Spacer */}

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-card/40 border border-border/60 hover:bg-card hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all duration-300 backdrop-blur-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
                <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="p-2 hover:bg-muted rounded-full relative transition-colors text-muted-foreground hover:text-foreground"
                >
                    <Bell size={22} />
                </button>

                {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-2xl border border-border z-50">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold text-card-foreground">Notifikasi</h3>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Tidak ada notifikasi baru
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* User Profile */}
            <button
                onClick={() => { setActiveTab('profile'); navigate('/profile'); }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted rounded-lg transition-colors border border-transparent hover:border-border cursor-pointer group"
                title="Buka Profil Saya"
            >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden border border-border/50">
                    {user?.avatar_url ? (
                        <img
                            src={getImageUrl(user.avatar_url)}
                            alt={user.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
                                (e.target as HTMLImageElement).src = isAdmin ? '/avatar-admin.png' : '/avatar-user.png';
                            }}
                        />
                    ) : (
                        <img
                            src={user?.role === 'admin' || user?.role === 'super_admin' ? '/avatar-admin.png' : '/avatar-user.png'}
                            alt={user?.name}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
                <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground leading-none mb-1">{user?.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">
                        {user?.role}
                    </p>
                </div>
            </button>
        </header>
    );
}
