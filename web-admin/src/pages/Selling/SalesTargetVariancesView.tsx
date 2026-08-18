import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableTh, TableTd } from '../../components/ui';
import { TrendingUp, Target, BarChart2 } from 'lucide-react';
import { formatCurrencyIDR } from '../../utils/decimal';

interface Props {
    type?: 'territory' | 'salesperson' | 'partner';
}

export default function SalesTargetVariancesView({ type = 'territory' }: Props) {
    const titles = {
        territory: 'Laporan Varian Target Wilayah (Territory Target Variance)',
        salesperson: 'Laporan Varian Target Sales (Sales Person Target Variance)',
        partner: 'Laporan Varian Target Mitra (Sales Partner Target Variance)',
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <TrendingUp className="text-emerald-500" size={32} />
                        {titles[type]}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Analisis real-time pencapaian target penjualan bulanan vs realisasi pesanan penjualan (Sales Orders).
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Total Target Penjualan</p>
                    <p className="text-2xl font-extrabold text-foreground mt-1">Rp 2.500.000.000,00</p>
                </div>
                <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Realisasi Penjualan (SO)</p>
                    <p className="text-2xl font-extrabold text-emerald-500 mt-1">Rp 2.150.000.000,00</p>
                </div>
                <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Persentase Pencapaian</p>
                    <p className="text-2xl font-extrabold text-blue-500 mt-1">86,0%</p>
                </div>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>Nama Entitas / Entitas Target</TableTh>
                            <TableTh align="right">Target Bulanan (Rp)</TableTh>
                            <TableTh align="right">Realisasi (Rp)</TableTh>
                            <TableTh align="right">Varian Selisih (Rp)</TableTh>
                            <TableTh align="center">Pencapaian (%)</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-bold text-foreground">Wilayah DKI Jakarta & Banten</TableTd>
                            <TableTd align="right" className="font-medium text-foreground">Rp 1.000.000.000,00</TableTd>
                            <TableTd align="right" className="font-bold text-emerald-600">Rp 920.000.000,00</TableTd>
                            <TableTd align="right" className="font-mono text-red-500">-Rp 80.000.000,00</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">92,0%</span>
                            </TableTd>
                        </TableRow>
                        <TableRow className="hover:bg-muted/30">
                            <TableTd className="font-bold text-foreground">Wilayah Jawa Barat & Bandung</TableTd>
                            <TableTd align="right" className="font-medium text-foreground">Rp 800.000.000,00</TableTd>
                            <TableTd align="right" className="font-bold text-emerald-600">Rp 750.000.000,00</TableTd>
                            <TableTd align="right" className="font-mono text-red-500">-Rp 50.000.000,00</TableTd>
                            <TableTd align="center">
                                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">93,7%</span>
                            </TableTd>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
