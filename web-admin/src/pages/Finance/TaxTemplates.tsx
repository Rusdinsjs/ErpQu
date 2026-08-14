import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../api/finance';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableSkeleton, Button } from '../../components/ui';
import { Percent, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function TaxTemplates() {
    const { data: categories, isLoading } = useQuery({
        queryKey: ['finance', 'tax-categories'],
        queryFn: financeApi.listTaxCategories,
    });

    const taxTemplates = [
        { id: '1', title: 'PPN Penjualan 11%', category: 'Pajak Pertambahan Nilai', rate: '11.00%', type: 'Sales', is_default: true },
        { id: '2', title: 'PPN Masukan (Beli) 11%', category: 'Pajak Pertambahan Nilai', rate: '11.00%', type: 'Purchase', is_default: true },
        { id: '3', title: 'PPh Pasal 23 Jasa (2%)', category: 'Withholding Tax', rate: '2.00%', type: 'Purchase', is_default: false },
        { id: '4', title: 'Bebas Pajak (Non-PPN)', category: 'Zero Rated', rate: '0.00%', type: 'Both', is_default: false },
    ];

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <Percent className="text-teal-500" size={32} />
                        Template Pajak (Tax Templates & Rules)
                    </h1>
                    <p className="text-muted-foreground mt-1">Konfigurasi tarif PPN, PPh pasal 23/21, dan aturan perhitungan pajak faktur</p>
                </div>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>Judul Template Pajak</TableTh>
                            <TableTh>Kategori Pajak</TableTh>
                            <TableTh>Jenis Transaksi</TableTh>
                            <TableTh align="right">Tarif (%)</TableTh>
                            <TableTh align="center">Template Default</TableTh>
                            <TableTh align="center">Status</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {taxTemplates.map(row => (
                            <TableRow key={row.id} className="hover:bg-muted/30">
                                <TableTd className="font-semibold text-foreground">{row.title}</TableTd>
                                <TableTd className="text-muted-foreground">{row.category}</TableTd>
                                <TableTd>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                                        {row.type === 'Sales' ? 'Penjualan' : row.type === 'Purchase' ? 'Pembelian' : 'Keduanya'}
                                    </span>
                                </TableTd>
                                <TableTd align="right" className="font-bold text-teal-600">{row.rate}</TableTd>
                                <TableTd align="center">
                                    {row.is_default ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 inline-flex items-center gap-1">
                                            <CheckCircle2 size={12} /> Default
                                        </span>
                                    ) : '-'}
                                </TableTd>
                                <TableTd align="center">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                        <ShieldCheck size={12} /> Aktif
                                    </span>
                                </TableTd>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
