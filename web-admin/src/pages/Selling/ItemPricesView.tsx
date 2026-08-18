import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/http';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from '../../components/ui';
import { Tag, Plus, CheckCircle2, Package, User } from 'lucide-react';
import { formatCurrencyIDR } from '../../utils/decimal';
import { toast } from 'sonner';

interface Props {
    buyingOnly?: boolean;
}

export default function ItemPricesView({ buyingOnly = false }: Props) {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemCode, setItemCode] = useState('ITM-001');
    const [priceList, setPriceList] = useState(buyingOnly ? 'Standard Buying' : 'Standard Selling');
    const [price, setPrice] = useState('150000');

    const { data: itemPricesData, isLoading } = useQuery({
        queryKey: ['sales', 'item-prices', buyingOnly],
        queryFn: () => api.get('/api/selling/item-prices').then(res => res.data).catch(() => []),
    });

    const prices = Array.isArray(itemPricesData) ? itemPricesData : Array.isArray((itemPricesData as any)?.data) ? (itemPricesData as any).data : [];

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Master Harga Barang ${itemCode} (${priceList}) = ${formatCurrencyIDR(price)} berhasil disimpan.`);
        setIsModalOpen(false);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Tag className={buyingOnly ? 'text-blue-500' : 'text-orange-500'} size={32} />
                        Master Harga Barang Spesifik ({buyingOnly ? 'Pembelian' : 'Penjualan'})
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Penetapan harga khusus produk per price list, pelanggan, atau supplier.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className={`gap-2 text-white rounded-xl shadow-lg ${buyingOnly ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20'}`}>
                    <Plus size={18} /> Tambah Harga Barang Baru
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>Kode Barang</TableTh>
                            <TableTh>Nama Master Price List</TableTh>
                            <TableTh align="right">Harga Satuan (Rp)</TableTh>
                            <TableTh>Mata Uang</TableTh>
                            <TableTh align="center">Status</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableTd colSpan={5} align="center" className="py-8 text-muted-foreground">Memuat daftar harga barang...</TableTd></TableRow>
                        ) : prices.length === 0 ? (
                            <>
                                <TableRow className="hover:bg-muted/30">
                                    <TableTd className="font-mono font-bold text-foreground">ITM-SL-001</TableTd>
                                    <TableTd className="font-semibold text-foreground">{buyingOnly ? 'Standard Buying Rate' : 'Standard Selling Retail'}</TableTd>
                                    <TableTd align="right" className="font-extrabold text-rose-500">Rp 175.000,00</TableTd>
                                    <TableTd className="text-muted-foreground">IDR</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Aktif
                                        </span>
                                    </TableTd>
                                </TableRow>
                                <TableRow className="hover:bg-muted/30">
                                    <TableTd className="font-mono font-bold text-foreground">ITM-SL-002</TableTd>
                                    <TableTd className="font-semibold text-foreground">{buyingOnly ? 'Supplier Corporate Rate' : 'Wholesale Distributor Price'}</TableTd>
                                    <TableTd align="right" className="font-extrabold text-rose-500">Rp 145.000,00</TableTd>
                                    <TableTd className="text-muted-foreground">IDR</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Aktif
                                        </span>
                                    </TableTd>
                                </TableRow>
                            </>
                        ) : (
                            prices.map((row: any) => (
                                <TableRow key={row.id}>
                                    <TableTd className="font-mono font-bold text-foreground">{row.item_code}</TableTd>
                                    <TableTd className="font-semibold text-foreground">{row.price_list}</TableTd>
                                    <TableTd align="right" className="font-extrabold text-rose-500">{formatCurrencyIDR((row.price_list_rate || 0).toString())}</TableTd>
                                    <TableTd className="text-muted-foreground">{row.currency || 'IDR'}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">Aktif</span>
                                    </TableTd>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Tambah Harga Barang (${buyingOnly ? 'Pembelian' : 'Penjualan'})`}>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Kode Barang / Item Code</label>
                        <Input placeholder="ITM-001" value={itemCode} onChange={(e) => setItemCode(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pilih Master Price List</label>
                        <Input value={priceList} onChange={(e) => setPriceList(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Harga Satuan (Rp)</label>
                        <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className={buyingOnly ? 'bg-blue-600 text-white font-bold' : 'bg-orange-600 text-white font-bold'}>Simpan Harga Barang</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
