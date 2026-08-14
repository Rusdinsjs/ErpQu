import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, Flag, Sparkles } from 'lucide-react';
import { hrLeavesApi, type HrHoliday } from '../../../api/hr-leaves';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, useToast, LoadingOverlay,
} from '../../../components/ui';

export default function HolidayListView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ holiday_date: '', description: '' });

    const { data: lists = [], isLoading } = useQuery({
        queryKey: ['hr-holiday-lists'],
        queryFn: hrLeavesApi.listHolidayLists,
    });

    const activeList = lists[0];

    const { data: holidays = [], isLoading: loadingHolidays } = useQuery({
        queryKey: ['hr-holidays', activeList?.id],
        queryFn: () => activeList ? hrLeavesApi.listHolidays(activeList.id) : Promise.resolve([]),
        enabled: Boolean(activeList?.id),
    });

    const addMutation = useMutation({
        mutationFn: (data: any) => hrLeavesApi.addHoliday(activeList.id, data),
        onSuccess: () => {
            success('Hari libur berhasil ditambahkan');
            qc.invalidateQueries({ queryKey: ['hr-holidays'] });
            setModalOpen(false);
            setForm({ holiday_date: '', description: '' });
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menambahkan hari libur'),
    });

    const handleAdd = () => {
        if (!form.holiday_date || !form.description) {
            showError('Tanggal dan keterangan hari libur wajib diisi');
            return;
        }
        addMutation.mutate(form);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Flag className="h-6 w-6 text-red-400" />
                        Kalender Hari Libur Nasional & Cuti Bersama
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Daftar hari libur resmi yang secara otomatis mengecualikan pemotongan saldo cuti tahunan</p>
                </div>
                <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="red">
                    Tambah Hari Libur
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white font-semibold">
                        <Calendar className="h-5 w-5 text-red-400" />
                        {activeList?.name || 'Kalender Hari Libur'}
                    </div>
                    <Badge color="blue">{holidays.length} Hari Libur Terdaftar</Badge>
                </div>

                <div className="relative">
                    {(isLoading || loadingHolidays) && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Tanggal Libur</TableTh>
                                <TableTh>Nama Hari Libur / Cuti Bersama</TableTh>
                                <TableTh>Tipe</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {holidays.length === 0 ? (
                                <TableEmpty colSpan={3} message="Belum ada data hari libur" />
                            ) : holidays.map(h => (
                                <TableRow key={h.id}>
                                    <TableTd className="font-semibold text-red-400 font-mono">{h.holiday_date}</TableTd>
                                    <TableTd className="font-medium text-white">{h.description}</TableTd>
                                    <TableTd><Badge color="red">Libur Nasional Resmi</Badge></TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Modal isOpen={modalOpen} opened={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Hari Libur / Cuti Bersama" size="md">
                <div className="space-y-4">
                    <Input
                        type="date"
                        label="Tanggal Libur *"
                        value={form.holiday_date}
                        onChange={e => setForm(p => ({ ...p, holiday_date: e.target.value }))}
                    />
                    <Input
                        label="Keterangan / Nama Libur *"
                        value={form.description}
                        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="cth. Hari Raya Idul Adha 1447 H"
                    />
                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="red" onClick={handleAdd} loading={addMutation.isPending} className="flex-1">
                            Simpan Hari Libur
                        </Button>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
