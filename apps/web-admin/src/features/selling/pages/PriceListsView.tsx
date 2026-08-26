import React, { useState } from 'react';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from'../../../components/ui';
import { Tag, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    buyingOnly?: boolean;
}

export default function PriceListsView({ buyingOnly = false }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState(buyingOnly ? 'Master Harga Beli Supplier A' : 'Master Harga Penjualan Ritel');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Master Price List "${name}" berhasil ditambahkan.`);
        setIsModalOpen(false);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Tag className={buyingOnly ? 'text-blue-500' : 'text-orange-500'} size={32} />
                        Master Price List ({buyingOnly ? 'Pembelian / Supplier' : 'Penjualan / Customer'})
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Daftar master kelompok harga produk (Standard Selling, Distributor, Corporate, Buying Rate).
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className={`gap-2 text-white rounded-xl shadow-lg ${buyingOnly ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20'}`}>
                    <Plus size={18} /> Buat Price List Baru
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>Nama Master Price List</TableTh>
                            <TableTh>Tipe Transaksi</TableTh>
                            <TableTh>Mata Uang Default</TableTh>
                            <TableTh align="center">Status</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-semibold text-foreground">{buyingOnly ? 'Standard Buying Rate' : 'Standard Selling Retail'}</TableTd>
                            <TableTd className="text-muted-foreground">{buyingOnly ? 'Buying (Pembelian)' : 'Selling (Penjualan)'}</TableTd>
                            <TableTd className="font-mono text-muted-foreground">IDR (Rupiah)</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Aktif
                                </span>
                            </TableTd>
                        </TableRow>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-semibold text-foreground">{buyingOnly ? 'Supplier Imports USD Rate' : 'Distributor Wholesale Price'}</TableTd>
                            <TableTd className="text-muted-foreground">{buyingOnly ? 'Buying (Pembelian)' : 'Selling (Penjualan)'}</TableTd>
                            <TableTd className="font-mono text-muted-foreground">{buyingOnly ? 'USD' : 'IDR'}</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Aktif
                                </span>
                            </TableTd>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Buat Master Price List (${buyingOnly ? 'Pembelian' : 'Penjualan'})`}>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Nama Master Price List</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className={buyingOnly ? 'bg-blue-600 text-white font-bold' : 'bg-orange-600 text-white font-bold'}>Simpan Price List</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
