import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyingMasterDataApi, type SupplierGroup, type SupplierContact, type SupplierAddress } from '../../api/buying-master-data';
import { vendorApi } from '../../api/vendors';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal } from '../../components/ui';
import { Users, FolderTree, Phone, MapPin, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SupplierMasterExtended() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<'groups' | 'contacts' | 'addresses'>('groups');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [groupName, setGroupName] = useState('');
    const [vendorId, setVendorId] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [addressTitle, setAddressTitle] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [city, setCity] = useState('');

    const { data: groups, isLoading: groupsLoading } = useQuery({
        queryKey: ['buying', 'supplier-groups'],
        queryFn: buyingMasterDataApi.getSupplierGroups,
        enabled: tab === 'groups',
    });

    const { data: contacts, isLoading: contactsLoading } = useQuery({
        queryKey: ['buying', 'supplier-contacts'],
        queryFn: buyingMasterDataApi.getSupplierContacts,
        enabled: tab === 'contacts',
    });

    const { data: addresses, isLoading: addressesLoading } = useQuery({
        queryKey: ['buying', 'supplier-addresses'],
        queryFn: buyingMasterDataApi.getSupplierAddresses,
        enabled: tab === 'addresses',
    });

    const { data: vendorsData } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => vendorApi.listVendors(1, 100),
    });

    const vendorsList = vendorsData?.data || [];

    const createGroupMutation = useMutation({
        mutationFn: buyingMasterDataApi.createSupplierGroup,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buying', 'supplier-groups'] });
            setIsModalOpen(false);
            setGroupName('');
            toast.success('Grup Supplier berhasil ditambahkan.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const createContactMutation = useMutation({
        mutationFn: buyingMasterDataApi.createSupplierContact,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buying', 'supplier-contacts'] });
            setIsModalOpen(false);
            setFirstName('');
            setLastName('');
            setEmail('');
            setPhone('');
            toast.success('Kontak PIC berhasil ditambahkan.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const createAddressMutation = useMutation({
        mutationFn: buyingMasterDataApi.createSupplierAddress,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['buying', 'supplier-addresses'] });
            setIsModalOpen(false);
            setAddressTitle('');
            setAddressLine1('');
            setCity('');
            toast.success('Alamat Pabrik/Vendor berhasil disimpan.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (tab === 'groups') {
            createGroupMutation.mutate({
                company_id: '00000000-0000-0000-0000-000000000001',
                group_name: groupName,
            });
        } else if (tab === 'contacts') {
            createContactMutation.mutate({
                vendor_id: vendorId,
                first_name: firstName,
                last_name: lastName || undefined,
                email: email || undefined,
                phone: phone || undefined,
                is_primary: true,
            });
        } else {
            createAddressMutation.mutate({
                vendor_id: vendorId,
                address_title: addressTitle,
                address_line1: addressLine1,
                city: city || undefined,
                country: 'Indonesia',
                is_primary: true,
            });
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Users className="text-indigo-500" size={32} />
                        Grup, Kontak & Alamat Supplier
                    </h1>
                    <p className="text-muted-foreground mt-1">Master segmentasi kategori vendor, kontak personil resmi, dan lokasi pabrik/gudang</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                    <Plus size={18} />
                    {tab === 'groups' ? 'Tambah Grup Supplier' : tab === 'contacts' ? 'Tambah Kontak PIC' : 'Tambah Alamat Pabrik'}
                </Button>
            </div>

            <div className="flex bg-muted p-1 rounded-xl w-fit border border-border">
                <button
                    onClick={() => setTab('groups')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'groups' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <FolderTree size={16} className="text-indigo-500" />
                    Supplier Groups
                </button>
                <button
                    onClick={() => setTab('contacts')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'contacts' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Phone size={16} className="text-emerald-500" />
                    Contacts (PIC Vendor)
                </button>
                <button
                    onClick={() => setTab('addresses')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'addresses' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <MapPin size={16} className="text-amber-500" />
                    Addresses (Alamat Resmi)
                </button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {tab === 'groups' && (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nama Kelompok / Grup Supplier</TableTh>
                                <TableTh>Tanggal Dibuat</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(groups || []).map((g: SupplierGroup) => (
                                <TableRow key={g.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{g.group_name}</TableTd>
                                    <TableTd className="text-muted-foreground">{g.created_at ? new Date(g.created_at).toLocaleDateString('id-ID') : '-'}</TableTd>
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

                {tab === 'contacts' && (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nama Lengkap PIC</TableTh>
                                <TableTh>No. Telepon / HP</TableTh>
                                <TableTh>Email Resmi</TableTh>
                                <TableTh align="center">Primary Contact</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(contacts || []).map((c: SupplierContact) => (
                                <TableRow key={c.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{c.first_name} {c.last_name || ''}</TableTd>
                                    <TableTd className="text-muted-foreground">{c.phone || '-'}</TableTd>
                                    <TableTd className="text-muted-foreground">{c.email || '-'}</TableTd>
                                    <TableTd align="center">
                                        {c.is_primary ? (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600">Primary</span>
                                        ) : '-'}
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                {tab === 'addresses' && (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Judul Alamat / Lokasi</TableTh>
                                <TableTh>Alamat Lengkap</TableTh>
                                <TableTh>Kota / Wilayah</TableTh>
                                <TableTh>Negara</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {(addresses || []).map((a: SupplierAddress) => (
                                <TableRow key={a.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{a.address_title}</TableTd>
                                    <TableTd className="text-muted-foreground">{a.address_line1}</TableTd>
                                    <TableTd className="text-foreground">{a.city || '-'}</TableTd>
                                    <TableTd className="text-muted-foreground">{a.country || 'Indonesia'}</TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Tambah ${tab === 'groups' ? 'Grup Supplier' : tab === 'contacts' ? 'Kontak PIC' : 'Alamat Pabrik'}`}>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    {tab === 'groups' ? (
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Grup Supplier</label>
                            <Input placeholder="Contoh: Distributor Bahan Kimia" value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
                        </div>
                    ) : tab === 'contacts' ? (
                        <>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Pilih Vendor</label>
                                <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} required className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none">
                                    <option value="">-- Pilih Supplier --</option>
                                    {vendorsList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Depan</label>
                                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Belakang</label>
                                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Email</label>
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">No. HP</label>
                                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Pilih Vendor</label>
                                <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} required className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none">
                                    <option value="">-- Pilih Supplier --</option>
                                    {vendorsList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Judul Alamat / Lokasi</label>
                                <Input placeholder="Contoh: Kantor Pusat & Pabrik 1" value={addressTitle} onChange={(e) => setAddressTitle(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Alamat Lengkap</label>
                                <Input placeholder="Jl. Raya Narogong Km 12, Bekasi" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Kota</label>
                                <Input placeholder="Bekasi" value={city} onChange={(e) => setCity(e.target.value)} />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Simpan Data</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
