import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesSetupDataApi, type BlanketOrder } from '../../api/sales-setup-data';
import { clientApi } from '../../api/client-management';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Modal } from '../../components/ui';
import { Plus, Search, FileText, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function BlanketOrdersView() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [orderNo, setOrderNo] = useState('');
    const [clientId, setClientId] = useState('');
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0]);
    const [terms, setTerms] = useState('Kontrak pasokan payung 1 tahun dengan jadwal pengiriman berkala.');

    const { data: blanketOrdersData, isLoading } = useQuery({
        queryKey: ['sales', 'blanket-orders'],
        queryFn: salesSetupDataApi.listBlanketOrders,
    });

    const { data: clientsResponse } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.list({ limit: 100, offset: 0 }),
    });

    const blanketOrders: BlanketOrder[] = Array.isArray(blanketOrdersData?.data) ? blanketOrdersData.data : Array.isArray(blanketOrdersData) ? blanketOrdersData : [];
    const clientsList = clientsResponse?.data?.data || (Array.isArray(clientsResponse?.data) ? clientsResponse.data : []);

    const createMutation = useMutation({
        mutationFn: salesSetupDataApi.createBlanketOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales', 'blanket-orders'] });
            setIsModalOpen(false);
            setOrderNo('');
            toast.success('Blanket Order berhasil dibuat.');
        },
        onError: (err: any) => toast.error('Gagal: ' + err.message)
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientId) {
            toast.error('Pilih pelanggan untuk kontrak payung.');
            return;
        }

        createMutation.mutate({
            order_number: orderNo || `BO-${Date.now().toString().slice(-6)}`,
            client_id: clientId,
            from_date: fromDate,
            to_date: toDate,
            tc_name: 'Blanket Agreement',
            terms: terms,
            status: 'Active',
        });
    };

    const getClientName = (id: string) => {
        const c = clientsList.find((item: any) => item.id === id);
        return c ? c.name : 'Customer General';
    };

    const filtered = blanketOrders.filter((b: BlanketOrder) =>
        (b.order_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(b.client_id).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <FileText className="text-emerald-500" size={32} />
                        Kontrak Pesanan Payung (Blanket Orders)
                    </h1>
                    <p className="text-muted-foreground mt-1">Perjanjian pasokan jangka panjang dengan harga tetap dan jadwal pengiriman bertahap</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20">
                    <Plus size={18} />
                    Buat Blanket Order
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-4 flex gap-4 items-center shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari nomor kontrak atau nama pelanggan..."
                        className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                </div>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                {isLoading ? (
                    <TableSkeleton rows={4} cols={5} />
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <FileText className="mx-auto text-muted-foreground mb-3" size={48} />
                        <h3 className="text-lg font-semibold text-foreground">Belum Ada Blanket Order</h3>
                        <p className="text-sm text-muted-foreground mt-1">Buat kontrak pesanan payung untuk pelanggan dengan pesanan rutin berkala.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow className="bg-muted/40">
                                <TableTh>No. Blanket Order</TableTh>
                                <TableTh>Pelanggan (Customer)</TableTh>
                                <TableTh>Periode Berlaku</TableTh>
                                <TableTh>Syarat & Ketentuan</TableTh>
                                <TableTh align="center">Status Kontrak</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((row: BlanketOrder) => (
                                <TableRow key={row.id} className="hover:bg-muted/30">
                                    <TableTd className="font-semibold text-foreground">{row.order_number}</TableTd>
                                    <TableTd className="font-medium text-foreground">{getClientName(row.client_id)}</TableTd>
                                    <TableTd className="text-muted-foreground">
                                        {row.from_date} s/d {row.to_date}
                                    </TableTd>
                                    <TableTd className="text-muted-foreground max-w-xs truncate">{row.terms || '-'}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <ShieldCheck size={12} /> {row.status || 'Active'}
                                        </span>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Kontrak Blanket Order Baru">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">No. Kontrak</label>
                            <Input placeholder="Otomatis jika kosong" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Pelanggan</label>
                            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 outline-none">
                                <option value="">-- Pilih Customer --</option>
                                {clientsList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Mulai Tanggal</label>
                            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Berakhir Tanggal</label>
                            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Ketentuan Kontrak</label>
                        <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/30 outline-none" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={createMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">Simpan Kontrak</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
