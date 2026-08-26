import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi, type Client } from'../../clients/api/client-management';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal } from'../../../components/ui';
import { Plus, Search, Users, CheckCircle2, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomersView() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [clientCode, setClientCode] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [taxId, setTaxId] = useState('');

    const { data: clientsResponse, isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.list({ limit: 100, offset: 0 }),
    });

    const createMutation = useMutation({
        mutationFn: clientApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Pelanggan (Customer) baru berhasil didaftarkan.');
        },
        onError: (err: any) => {
            toast.error('Gagal mendaftarkan pelanggan: ' + (err.message || 'Terjadi kesalahan'));
        }
    });

    const resetForm = () => {
        setName('');
        setCompanyName('');
        setClientCode('');
        setContactPerson('');
        setPhone('');
        setEmail('');
        setAddress('');
        setTaxId('');
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Nama pelanggan wajib diisi.');
            return;
        }

        createMutation.mutate({
            name,
            company_name: companyName || name,
            client_code: clientCode || `CUST-${Date.now().toString().slice(-5)}`,
            contact_person: contactPerson || undefined,
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            tax_id: taxId || undefined,
            is_active: true,
        });
    };

    const clients = clientsResponse?.data?.data || (Array.isArray(clientsResponse?.data) ? clientsResponse.data : []);
    const filtered = (clients || []).filter((c: Client) =>
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.client_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Users className="text-blue-500" size={32} />
                        Direktori Pelanggan & Klien (Customers 360°)
                    </h1>
                    <p className="text-muted-foreground mt-1">Master data pelanggan, kontak representatif, NPWP, alamat pengiriman & riwayat transaksi</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20">
                    <Plus size={18} />
                    Daftarkan Pelanggan Baru
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-center shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nama pelanggan, kode, atau email..."
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                </div>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <TableSkeleton rows={5} cols={6} />
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada Data Pelanggan</h3>
                        <p className="text-sm text-muted-foreground mt-1">Klik tombol &apos;Daftarkan Pelanggan Baru&apos; untuk membuat database customer.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Kode Customer</TableTh>
                                <TableTh>Nama Pelanggan / Perusahaan</TableTh>
                                <TableTh>Kontak PIC</TableTh>
                                <TableTh>No. Telepon</TableTh>
                                <TableTh>Email Resmi</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((row: Client) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-mono text-muted-foreground">{row.client_code}</TableTd>
                                    <TableTd>
                                        <div className="font-semibold text-foreground">{row.name}</div>
                                        {row.company_name && row.company_name !== row.name && (
                                            <span className="text-xs text-muted-foreground">{row.company_name}</span>
                                        )}
                                    </TableTd>
                                    <TableTd className="text-foreground">{row.contact_person || '-'}</TableTd>
                                    <TableTd className="text-muted-foreground">
                                        {row.phone ? <span className="inline-flex items-center gap-1"><Phone size={12} /> {row.phone}</span> : '-'}
                                    </TableTd>
                                    <TableTd className="text-muted-foreground">
                                        {row.email ? <span className="inline-flex items-center gap-1"><Mail size={12} /> {row.email}</span> : '-'}
                                    </TableTd>
                                    <TableTd align="center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${row.is_active !== false ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                                            <CheckCircle2 size={12} /> {row.is_active !== false ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Daftarkan Pelanggan (Customer) Baru">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Customer / Bisnis</label>
                            <Input placeholder="Contoh: PT Mitra Sukses Mandiri" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Kode Pelanggan (Opsional)</label>
                            <Input placeholder="Contoh: CUST-001" value={clientCode} onChange={(e) => setClientCode(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Person In Charge (PIC)</label>
                            <Input placeholder="Contoh: Ibu Rina Melati" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">No. Telepon / WhatsApp</label>
                            <Input placeholder="0812-9988-7766" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Email</label>
                            <Input type="email" placeholder="finance@mitrasukses.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">NPWP / Tax ID</label>
                            <Input placeholder="01.234.567.8-901.000" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Alamat Penagihan & Pengiriman</label>
                        <textarea
                            placeholder="Gedung Cyber 2 Lantai 15, Jl. HR Rasuna Said, Jakarta Selatan"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/30 outline-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {createMutation.isPending ? 'Menyimpan...' : 'Simpan Pelanggan'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
