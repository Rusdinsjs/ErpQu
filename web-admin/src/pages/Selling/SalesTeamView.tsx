import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesMasterDataApi, type SalesPartner, type SalesPerson } from '../../api/sales-master-data';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from '../../components/ui';
import { UserCheck, Handshake, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesTeamView() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<'partners' | 'persons'>('partners');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [partnerName, setPartnerName] = useState('');
    const [partnerType, setPartnerType] = useState('Reseller');
    const [personName, setPersonName] = useState('');
    const [commissionRate, setCommissionRate] = useState('5.0');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const { data: partnersData } = useQuery({
        queryKey: ['sales', 'sales-partners'],
        queryFn: salesMasterDataApi.listSalesPartners,
        enabled: tab === 'partners',
    });

    const { data: personsData } = useQuery({
        queryKey: ['sales', 'sales-persons'],
        queryFn: salesMasterDataApi.listSalesPersons,
        enabled: tab === 'persons',
    });

    const partners: SalesPartner[] = Array.isArray(partnersData?.data) ? partnersData.data : Array.isArray(partnersData) ? partnersData : [];
    const persons: SalesPerson[] = Array.isArray(personsData?.data) ? personsData.data : Array.isArray(personsData) ? personsData : [];

    const createPartnerMutation = useMutation({
        mutationFn: salesMasterDataApi.createSalesPartner,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'sales-partners'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Mitra Penjualan (Sales Partner) berhasil ditambahkan.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const createPersonMutation = useMutation({
        mutationFn: salesMasterDataApi.createSalesPerson,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'sales-persons'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Wiraniaga (Sales Person) berhasil didaftarkan.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const resetForm = () => {
        setPartnerName('');
        setPersonName('');
        setContactPerson('');
        setPhone('');
        setEmail('');
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const comm = parseFloat(commissionRate) || 0;
        if (tab === 'partners') {
            if (!partnerName.trim()) return toast.error('Nama mitra wajib diisi.');
            createPartnerMutation.mutate({
                company_id: '00000000-0000-0000-0000-000000000001',
                partner_name: partnerName,
                partner_type: partnerType,
                commission_rate: comm,
                contact_person: contactPerson || undefined,
                phone: phone || undefined,
                email: email || undefined,
                status: 'Active',
            });
        } else {
            if (!personName.trim()) return toast.error('Nama sales person wajib diisi.');
            createPersonMutation.mutate({
                company_id: '00000000-0000-0000-0000-000000000001',
                sales_person_name: personName,
                commission_rate: comm,
                status: 'Active',
            });
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Handshake className="text-teal-500" size={32} />
                        Tim & Mitra Penjualan (Sales Team & Partners)
                    </h1>
                    <p className="text-muted-foreground mt-1">Kelola tenaga wiraniaga internal, agen, reseller & skema pembagian komisi</p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-500/20">
                    <Plus size={18} />
                    {tab === 'partners' ? 'Tambah Mitra Sales' : 'Tambah Sales Person'}
                </Button>
            </div>

            <div className="flex bg-muted p-1 rounded-xl w-fit border border-border">
                <button
                    onClick={() => setTab('partners')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'partners' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Handshake size={16} className="text-teal-500" />
                    Sales Partners (Mitra / Reseller)
                </button>
                <button
                    onClick={() => setTab('persons')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === 'persons' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <UserCheck size={16} className="text-blue-500" />
                    Sales Persons (Wiraniaga Internal)
                </button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {tab === 'partners' ? (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nama Mitra Penjualan</TableTh>
                                <TableTh>Tipe Kemitraan</TableTh>
                                <TableTh>Kontak PIC</TableTh>
                                <TableTh>Telepon / Email</TableTh>
                                <TableTh align="center">Komisi (%)</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {partners.map((row: SalesPartner) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.partner_name}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.partner_type || 'Reseller'}</TableTd>
                                    <TableTd className="text-foreground">{row.contact_person || '-'}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.phone || row.email || '-'}</TableTd>
                                    <TableTd align="center" className="font-bold text-teal-600">{row.commission_rate || 0}%</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> {row.status || 'Active'}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>Nama Sales Person</TableTh>
                                <TableTh align="center">Tarif Komisi (%)</TableTh>
                                <TableTh align="center">Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {persons.map((row: SalesPerson) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.sales_person_name}</TableTd>
                                    <TableTd align="center" className="font-bold text-blue-600">{row.commission_rate || 0}%</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> {row.status || 'Active'}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={tab === 'partners' ? 'Tambah Mitra Penjualan (Sales Partner)' : 'Tambah Sales Person'}>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    {tab === 'partners' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Mitra / PT</label>
                                    <Input placeholder="Contoh: PT Surya Mitra Niaga" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tipe Kemitraan</label>
                                    <select value={partnerType} onChange={(e) => setPartnerType(e.target.value)} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500/30 outline-none">
                                        <option value="Reseller">Reseller Resmi</option>
                                        <option value="Distributor">Distributor Utama</option>
                                        <option value="Agent">Agen Komisi</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">PIC / Perwakilan</label>
                                    <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Komisi (%)</label>
                                    <Input type="number" step="0.1" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">No. Telepon</label>
                                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Email</label>
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Nama Sales Person</label>
                                <Input placeholder="Contoh: Dedi Kurniawan" value={personName} onChange={(e) => setPersonName(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Tarif Komisi (%)</label>
                                <Input type="number" step="0.1" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} required />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">Simpan Data</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
