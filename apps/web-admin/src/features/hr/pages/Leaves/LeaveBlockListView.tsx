import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ban, ShieldAlert } from 'lucide-react';
import { hrLeavesApi } from'../../api/hr-leaves';
import { Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty, Badge, LoadingOverlay } from'../../../../components/ui';

export default function LeaveBlockListView() {
    const { data: blockLists = [], isLoading } = useQuery({
        queryKey: ['hr-leave-block-lists'],
        queryFn: hrLeavesApi.listBlockLists,
    });

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Ban className="h-6 w-6 text-amber-400" />
                        Periode Larangan Cuti (Blackout Dates)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Daftar tanggal pembatasan cuti saat periode audit, stock opname tahunan, atau high season operasional</p>
                </div>
            </div>

            <Card>
                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Nama Aturan</TableTh>
                                <TableTh>Keterangan</TableTh>
                                <TableTh>Cakupan Departemen</TableTh>
                                <TableTh>Status</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {blockLists.length === 0 ? (
                                <TableEmpty colSpan={4} message="Tidak ada pembatasan cuti yang aktif saat ini" />
                            ) : blockLists.map(b => (
                                <TableRow key={b.id}>
                                    <TableTd className="font-medium text-white">{b.name}</TableTd>
                                    <TableTd className="text-gray-300">{b.description || '-'}</TableTd>
                                    <TableTd>{b.applies_to_all_departments ? <Badge color="purple">Seluruh Departemen</Badge> : <Badge color="blue">Departemen Tertentu</Badge>}</TableTd>
                                    <TableTd><Badge color={b.is_active ? 'green' : 'gray'}>{b.is_active ? 'Aktif' : 'Nonaktif'}</Badge></TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}
