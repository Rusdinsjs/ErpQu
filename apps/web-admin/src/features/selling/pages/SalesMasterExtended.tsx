import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesMasterDataApi, type CustomerGroup, type Territory } from'../api/sales-master-data';
import { salesSetupDataApi, type Campaign } from'../api/sales-setup-data';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal } from'../../../components/ui';
import { Layers, MapPin, Megaphone, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesMasterExtended() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<'groups' | 'territories' | 'campaigns'>('groups');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [groupName, setGroupName] = useState('');
    const [territoryName, setTerritoryName] = useState('');
    const [campaignName, setCampaignName] = useState('');

    const { data: groupsData, isLoading: groupsLoading } = useQuery({
        queryKey: ['sales', 'customer-groups'],
        queryFn: salesMasterDataApi.listCustomerGroups,
        enabled: tab === 'groups',
    });

    const { data: territoriesData, isLoading: terrLoading } = useQuery({
        queryKey: ['sales', 'territories'],
        queryFn: salesMasterDataApi.listTerritories,
        enabled: tab === 'territories',
    });

    const { data: campaignsData, isLoading: campLoading } = useQuery({
        queryKey: ['sales', 'campaigns'],
        queryFn: salesSetupDataApi.listCampaigns,
        enabled: tab === 'campaigns',
    });

    const groups: CustomerGroup[] = Array.isArray(groupsData?.data) ? groupsData.data : Array.isArray(groupsData) ? groupsData : [];
    const territories: Territory[] = Array.isArray(territoriesData?.data) ? territoriesData.data : Array.isArray(territoriesData) ? territoriesData : [];
    const campaigns: Campaign[] = Array.isArray(campaignsData?.data) ? campaignsData.data : Array.isArray(campaignsData) ? campaignsData : [];

    const createGroupMutation = useMutation({
        mutationFn: salesMasterDataApi.createCustomerGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'customer-groups'] });
            setIsModalOpen(false);
            setGroupName('');
            toast.success('Kelompok Pelanggan berhasil ditambahkan.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const createTerritoryMutation = useMutation({
        mutationFn: salesMasterDataApi.createTerritory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'territories'] });
            setIsModalOpen(false);
            setTerritoryName('');
            toast.success('Wilayah (Territory) berhasil ditambahkan.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const createCampaignMutation = useMutation({
        mutationFn: salesSetupDataApi.createCampaign,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'campaigns'] });
            setIsModalOpen(false);
            setCampaignName('');
            toast.success('Kampanye berhasil ditambahkan.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (tab === 'groups') {
            if (!groupName.trim()) return toast.error('Nama kelompok wajib diisi.');
            createGroupMutation.mutate({
                company_id: '00000000-0000-0000-0000-000000000001',
                group_name: groupName,
                is_group: false,
            });
        } else if (tab === 'territories') {
            if (!territoryName.trim()) return toast.error('Nama wilayah wajib diisi.');
            createTerritoryMutation.mutate({
                company_id: '00000000-0000-0000-0000-000000000001',
                territory_name: territoryName,
            });
        } else {
            if (!campaignName.trim()) return toast.error('Nama kampanye wajib diisi.');
            createCampaignMutation.mutate({
                campaign_name: campaignName,
            });
        }
    };

    const isLoading = tab === 'groups' ? groupsLoading : tab === 'territories' ? terrLoading : campLoading;

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Layers className="text-violet-500" size={32} />
                        Segmentasi & Kampanye Pemasaran (Sales Setup)
                    </h1>
                    <p className="text-muted-foreground mt-1">Klasifikasi customer group, wilayah distribusi (territory), dan kampanye promo</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-500/20">
                    <Plus size={18} />
                    {tab === 'groups' ? 'Tambah Customer Group' : tab === 'territories' ? 'Tambah Wilayah' : 'Tambah Kampanye'}
                </Button>
            </div>

            <div className="flex bg-muted p-1 rounded-xl w-fit border border-border">
                <button
                    onClick={() => setTab('groups')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'groups' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Layers size={16} className="text-violet-500" />
                    Customer Groups
                </button>
                <button
                    onClick={() => setTab('territories')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'territories' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <MapPin size={16} className="text-emerald-500" />
                    Territories (Wilayah)
                </button>
                <button
                    onClick={() => setTab('campaigns')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'campaigns' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Megaphone size={16} className="text-rose-500" />
                    Marketing Campaigns
                </button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <TableSkeleton rows={4} cols={3} />
                ) : tab === 'groups' ? (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nama Kelompok Pelanggan</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groups.map((row: CustomerGroup) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.group_name}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Aktif
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : tab === 'territories' ? (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nama Wilayah / Teritori</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {territories.map((row: Territory) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.territory_name}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">Aktif</span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nama Kampanye Pemasaran</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {campaigns.map((row: Campaign) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.campaign_name}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600">Aktif</span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Tambah ${tab === 'groups' ? 'Customer Group' : tab === 'territories' ? 'Wilayah / Territory' : 'Kampanye Promo'}`}>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama</label>
                        <Input
                            placeholder={tab === 'groups' ? 'Contoh: Korporat & B2B' : tab === 'territories' ? 'Contoh: Jawa Barat & Banten' : 'Contoh: Promo Diskon Hari Kemerdekaan'}
                            value={tab === 'groups' ? groupName : tab === 'territories' ? territoryName : campaignName}
                            onChange={(e) => tab === 'groups' ? setGroupName(e.target.value) : tab === 'territories' ? setTerritoryName(e.target.value) : setCampaignName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">Simpan</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
