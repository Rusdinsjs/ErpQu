import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi, type Vendor, type CreateVendorRequest } from '../../api/vendors';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal } from '../../components/ui';
import { Plus, Search, Truck, CheckCircle2, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function SuppliersView() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    const { data: vendorsData, isLoading } = useQuery({
        queryKey: ['vendors'],
        queryFn: () => vendorApi.listVendors(1, 100),
    });

    const createMutation = useMutation({
        mutationFn: vendorApi.createVendor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendors'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Pemasok / Vendor baru berhasil didaftarkan.');
        },
        onError: (err: any) => {
            toast.error('Gagal menambahkan Vendor: ' + (err?.message || 'Terjadi kesalahan'));
        }
    });

    const resetForm = () => {
        setName('');
        setCode('');
        setContactPerson('');
        setPhone('');
        setEmail('');
        setAddress('');
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Nama vendor wajib diisi.');
            return;
        }

        createMutation.mutate({
            name,
            code: code || undefined,
            contact_person: contactPerson || undefined,
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            is_active: true,
        });
    };

    const vendors: Vendor[] = Array.isArray(vendorsData?.data)
        ? vendorsData.data
        : Array.isArray(vendorsData)
        ? vendorsData
        : [];

    const filtered = vendors.filter(v => {
        const vName = v.name || '';
        const vCode = v.code || '';
        const vPic = v.contact_person || '';
        const search = searchTerm.toLowerCase();
        return vName.toLowerCase().includes(search) ||
            vCode.toLowerCase().includes(search) ||
            vPic.toLowerCase().includes(search);
    });

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Truck className="text-amber-500" size={32} />
                        Direktori Pemasok & Vendor (Suppliers)
                    </h1>
                    <p className="text-muted-foreground mt-1">Master data mitra pengadaan, kontak perwakilan, alamat pabrik & syarat pembayaran</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg shadow-amber-500/20">
                    <Plus size={18} />
                    Daftarkan Vendor Baru
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-center shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nama vendor, kode, atau PIC..."
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                </div>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <TableSkeleton rows={5} cols={6} />
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <Truck className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada Vendor Terdaftar</h3>
                        <p className="text-sm text-muted-foreground mt-1">Klik tombol &apos;Daftarkan Vendor Baru&apos; untuk menambahkan master data pemasok.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Kode Vendor</TableTh>
                                <TableTh>Nama Perusahaan / Pemasok</TableTh>
                                <TableTh>Kontak Person (PIC)</TableTh>
                                <TableTh>No. Telepon</TableTh>
                                <TableTh>Alamat Kantor / Pabrik</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map(row => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-mono text-muted-foreground">{row.code || '-'}</TableTd>
                                    <TableTd className="font-semibold text-foreground">{row.name}</TableTd>
                                    <TableTd className="text-foreground">{row.contact_person || '-'}</TableTd>
                                    <TableTd className="text-muted-foreground">
                                        {row.phone ? <span className="inline-flex items-center gap-1"><Phone size={12} /> {row.phone}</span> : '-'}
                                    </TableTd>
                                    <TableTd className="text-muted-foreground max-w-xs truncate">{row.address || '-'}</TableTd>
                                    <TableTd align="center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${row.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                                            <CheckCircle2 size={12} /> {row.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Daftarkan Pemasok (Vendor) Baru">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Vendor / Perusahaan</label>
                            <Input placeholder="Contoh: PT Teknik Sejahtera Utama" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Kode Vendor (Opsional)</label>
                            <Input placeholder="Contoh: VND-001" value={code} onChange={(e) => setCode(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Person In Charge (PIC)</label>
                            <Input placeholder="Contoh: Bpk. Bambang Sutrisno" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">No. Telepon / WhatsApp</label>
                            <Input placeholder="0812-3456-7890" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Email Resmi</label>
                        <Input type="email" placeholder="sales@tekniksejahtera.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Alamat Lengkap</label>
                        <textarea
                            placeholder="Jl. Industri Raya No. 88, Cikarang, Bekasi"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500/30 outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
                            {createMutation.isPending ? 'Menyimpan...' : 'Simpan Vendor'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
