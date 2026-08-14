import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesPosDataApi, type PosProfile, type PosOpeningEntry, type LoyaltyProgram } from '../../api/sales-pos-data';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from '../../components/ui';
import { Store, Clock, Award, Plus, CheckCircle2 } from 'lucide-react';
import { formatCurrencyIDR } from '../../utils/decimal';
import { toast } from 'sonner';

export default function PointOfSaleView() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<'profiles' | 'shifts' | 'loyalty'>('profiles');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [profileName, setProfileName] = useState('');

    const { data: profilesData } = useQuery({
        queryKey: ['sales', 'pos-profiles'],
        queryFn: salesPosDataApi.listPosProfiles,
        enabled: tab === 'profiles',
    });

    const { data: openingsData } = useQuery({
        queryKey: ['sales', 'pos-openings'],
        queryFn: salesPosDataApi.listPosOpeningEntries,
        enabled: tab === 'shifts',
    });

    const { data: loyaltyData } = useQuery({
        queryKey: ['sales', 'loyalty-programs'],
        queryFn: salesPosDataApi.listLoyaltyPrograms,
        enabled: tab === 'loyalty',
    });

    const profiles: PosProfile[] = Array.isArray(profilesData?.data) ? profilesData.data : Array.isArray(profilesData) ? profilesData : [];
    const openings: PosOpeningEntry[] = Array.isArray(openingsData?.data) ? openingsData.data : Array.isArray(openingsData) ? openingsData : [];
    const loyaltyPrograms: LoyaltyProgram[] = Array.isArray(loyaltyData?.data) ? loyaltyData.data : Array.isArray(loyaltyData) ? loyaltyData : [];

    const createProfileMutation = useMutation({
        mutationFn: salesPosDataApi.createPosProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'pos-profiles'] });
            setIsModalOpen(false);
            setProfileName('');
            toast.success('Profil POS Kasir berhasil dibuat.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (tab === 'profiles') {
            if (!profileName.trim()) return toast.error('Nama profil kasir wajib diisi.');
            createProfileMutation.mutate({
                profile_name: profileName,
                warehouse_id: '00000000-0000-0000-0000-000000000001',
                cash_account_id: '00000000-0000-0000-0000-000000000001',
                is_active: true,
            });
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Store className="text-rose-500" size={32} />
                        Point of Sale (POS) & Kasir
                    </h1>
                    <p className="text-muted-foreground mt-1">Pengaturan kasir toko ritel, pembukaan/penutupan shift kasir & skema poin loyalitas</p>
                </div>
                {tab === 'profiles' && (
                    <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/20">
                        <Plus size={18} />
                        Buat Profil Kasir POS
                    </Button>
                )}
            </div>

            <div className="flex bg-muted p-1 rounded-xl w-fit border border-border">
                <button
                    onClick={() => setTab('profiles')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'profiles' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Store size={16} className="text-rose-500" />
                    POS Profiles (Terminal Kasir)
                </button>
                <button
                    onClick={() => setTab('shifts')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'shifts' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Clock size={16} className="text-amber-500" />
                    Shift Kasir (Opening & Closing)
                </button>
                <button
                    onClick={() => setTab('loyalty')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'loyalty' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Award size={16} className="text-purple-500" />
                    Loyalty Programs (Poin Member)
                </button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {tab === 'profiles' && (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nama Profil POS</TableTh>
                                <TableTh>Gudang Default (Warehouse)</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {profiles.map((row: PosProfile) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.profile_name}</TableTd>
                                    <TableTd className="text-muted-foreground">Main Store Warehouse</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Aktif
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {tab === 'shifts' && (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Waktu Pembukaan Shift</TableTh>
                                <TableTh align="right">Modal Awal Kasir (Rp)</TableTh>
                                <TableTh align="center">Status Shift</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {openings.map((row: PosOpeningEntry) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-medium text-foreground">{row.period_start_date ? new Date(row.period_start_date).toLocaleString('id-ID') : '-'}</TableTd>
                                    <TableTd align="right" className="font-bold text-foreground">{formatCurrencyIDR(Number(row.opening_amount || 0).toString())}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">{row.status || 'Open'}</span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {tab === 'loyalty' && (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nama Program Loyalitas</TableTh>
                                <TableTh>Konversi Poin</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loyaltyPrograms.map((row: LoyaltyProgram) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.program_name}</TableTd>
                                    <TableTd className="text-muted-foreground">1 Poin = Rp 1.000 Belanja</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Aktif
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Profil Terminal POS Kasir">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Profil / Posisi Kasir</label>
                        <Input placeholder="Contoh: Kasir Utama Toko Cabang 1" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white">Simpan Profil POS</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
