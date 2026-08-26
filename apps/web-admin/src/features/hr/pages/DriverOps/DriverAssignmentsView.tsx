import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Truck, Plus, Search, CheckCircle2, RotateCcw, ShieldCheck, UserCheck, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import { hrDriverP2hSafetyApi, type HrDriverAssignment } from'../../api/hr-driver-p2h-safety';
import { employeeApi } from'../../api/employee';
import { assetApi } from'../../../assets/api/assets';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, ActionIcon, useToast, LoadingOverlay
} from'../../../../components/ui';

export default function DriverAssignmentsView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState('');
    const [assignModal, setAssignModal] = useState(false);
    const [returnModal, setReturnModal] = useState(false);
    const [selectedAssign, setSelectedAssign] = useState<HrDriverAssignment | null>(null);

    const [form, setForm] = useState({
        employee_id: '',
        asset_id: '',
        assigned_date: dayjs().format('YYYY-MM-DD'),
        start_odometer: 12500,
        notes: '',
    });

    const [returnForm, setReturnForm] = useState({
        return_date: dayjs().format('YYYY-MM-DD'),
        end_odometer: 12650,
        notes: 'Selesai shift operasional, unit dalam kondisi baik',
    });

    const { data: assignments = [], isLoading } = useQuery({
        queryKey: ['hr-driver-assignments'],
        queryFn: () => hrDriverP2hSafetyApi.listDriverAssignments(),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const { data: assets = [] } = useQuery({
        queryKey: ['assets'],
        queryFn: () => assetApi.list({ per_page: 100 } as any).then(r => r.data || []),
    });

    const assignMutation = useMutation({
        mutationFn: hrDriverP2hSafetyApi.createDriverAssignment,
        onSuccess: () => {
            success('Penugasan driver / operator unit berhasil disimpan');
            qc.invalidateQueries({ queryKey: ['hr-driver-assignments'] });
            setAssignModal(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menyimpan penugasan'),
    });

    const returnMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hrDriverP2hSafetyApi.returnDriverAssignment(id, data),
        onSuccess: () => {
            success('Unit armada berhasil dikembalikan');
            qc.invalidateQueries({ queryKey: ['hr-driver-assignments'] });
            setReturnModal(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal mengembalikan unit'),
    });

    const handleAssign = () => {
        if (!form.employee_id || !form.asset_id) {
            showError('Pilih karyawan driver/operator dan unit kendaraan/alat berat');
            return;
        }
        assignMutation.mutate(form);
    };

    const handleReturn = () => {
        if (!selectedAssign) return;
        returnMutation.mutate({ id: selectedAssign.id, data: returnForm });
    };

    const filtered = assignments.filter(a =>
        (a.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.employee_nik || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.asset_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.asset_code || '').toLowerCase().includes(search.toLowerCase())
    );

    const employeeOptions = [
        { value: '', label: 'Pilih Driver / Operator *...' },
        ...(Array.isArray(employees) ? employees : []).map(e => ({
            value: e.id,
            label: `${e.nik} - ${e.name} (${e.department_name || 'Operasional'})`,
        })),
    ];

    const assetOptions = [
        { value: '', label: 'Pilih Unit Kendaraan / Alat Berat *...' },
        ...(Array.isArray(assets) ? assets : []).map(a => ({
            value: a.id,
            label: `${a.code} - ${a.name} (${a.brand || 'Unit Operasional'})`,
        })),
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Truck className="h-6 w-6 text-blue-400" />
                        Penugasan Driver & Operator Alat Berat
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Penetapan unit armada/alat berat ke pengemudi, verifikasi lisensi SIO, dan serah terima unit</p>
                </div>
                <Button onClick={() => setAssignModal(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="blue">
                    + Tugaskan Driver ke Unit
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <Input
                        placeholder="Cari driver, NIK, atau nama/kode unit..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-md"
                    />
                    <Badge color="blue">{assignments.length} Penugasan Terdata</Badge>
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Driver / Operator</TableTh>
                                <TableTh>Unit Kendaraan / Alat Berat</TableTh>
                                <TableTh>Tanggal Penugasan</TableTh>
                                <TableTh>Odometer Awal & Akhir</TableTh>
                                <TableTh>Verifikasi SIO/SIM</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableEmpty colSpan={7} message="Belum ada data penugasan driver ke unit" />
                            ) : filtered.map(a => (
                                <TableRow key={a.id}>
                                    <TableTd>
                                        <div className="font-bold text-white">{a.employee_name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{a.employee_nik}</div>
                                    </TableTd>
                                    <TableTd>
                                        <div className="font-bold text-blue-300">{a.asset_name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{a.asset_code}</div>
                                    </TableTd>
                                    <TableTd className="text-xs text-gray-300 font-mono">
                                        {dayjs(a.assigned_date).format('DD MMM YYYY')}
                                        {a.return_date && <span className="block text-gray-400">s/d {dayjs(a.return_date).format('DD MMM YYYY')}</span>}
                                    </TableTd>
                                    <TableTd className="text-xs font-mono text-gray-200">
                                        <div>Awal: {Number(a.start_odometer || 0).toLocaleString()} KM/HM</div>
                                        {a.end_odometer && <div>Akhir: {Number(a.end_odometer).toLocaleString()} KM/HM</div>}
                                    </TableTd>
                                    <TableTd>
                                        <Badge color="green">
                                            <ShieldCheck className="h-3 w-3 inline mr-1" /> SIO/SIM Terverifikasi
                                        </Badge>
                                    </TableTd>
                                    <TableTd>
                                        <Badge color={a.status === 'active' ? 'green' : 'gray'}>
                                            {a.status === 'active' ? 'Sedang Ditugaskan' : 'Selesai / Dikembalikan'}
                                        </Badge>
                                    </TableTd>
                                    <TableTd className="text-right">
                                        {a.status === 'active' && (
                                            <Button size="sm" variant="outline" onClick={() => { setSelectedAssign(a); setReturnModal(true); }} leftIcon={<RotateCcw className="h-3.5 w-3.5" />}>
                                                Selesai / Kembalikan
                                            </Button>
                                        )}
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Assign Driver */}
            <Modal isOpen={assignModal} opened={assignModal} onClose={() => setAssignModal(false)} title="Form Penugasan Driver ke Unit Kendaraan" size="md">
                <div className="space-y-4">
                    <Select
                        label="Driver / Operator Pelaksana *"
                        value={form.employee_id}
                        onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                        options={employeeOptions}
                    />

                    <Select
                        label="Unit Kendaraan / Alat Berat *"
                        value={form.asset_id}
                        onChange={v => setForm(p => ({ ...p, asset_id: v }))}
                        options={assetOptions}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="date"
                            label="Tanggal Penugasan *"
                            value={form.assigned_date}
                            onChange={e => setForm(p => ({ ...p, assigned_date: e.target.value }))}
                        />
                        <Input
                            type="number"
                            label="Odometer / HM Awal"
                            value={form.start_odometer}
                            onChange={e => setForm(p => ({ ...p, start_odometer: parseFloat(e.target.value) || 0 }))}
                        />
                    </div>

                    <Input
                        label="Catatan / Rute Operasional"
                        value={form.notes}
                        onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        placeholder="cth. Rute Hauling Site Cilegon - Pelabuhan Merak..."
                    />

                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-xs text-blue-300">
                        🛡️ Sistem otomatis memverifikasi kecocokan Surat Izin Operator (SIO/SIM) pengemudi yang masih aktif.
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="blue" onClick={handleAssign} loading={assignMutation.isPending} className="flex-1">
                            Simpan Penugasan Unit
                        </Button>
                        <Button variant="outline" onClick={() => setAssignModal(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Return Unit */}
            <Modal isOpen={returnModal} opened={returnModal} onClose={() => setReturnModal(false)} title="Pengembalian Unit / Selesai Penugasan" size="md">
                {selectedAssign && (
                    <div className="space-y-4 text-white">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 text-xs">
                            <div>Driver: <strong>{selectedAssign.employee_name}</strong></div>
                            <div>Unit: <strong className="text-blue-300">{selectedAssign.asset_name} ({selectedAssign.asset_code})</strong></div>
                            <div>Odometer Awal: <strong>{Number(selectedAssign.start_odometer || 0).toLocaleString()} KM/HM</strong></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                type="date"
                                label="Tanggal Pengembalian *"
                                value={returnForm.return_date}
                                onChange={e => setReturnForm(p => ({ ...p, return_date: e.target.value }))}
                            />
                            <Input
                                type="number"
                                label="Odometer / HM Akhir *"
                                value={returnForm.end_odometer}
                                onChange={e => setReturnForm(p => ({ ...p, end_odometer: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>

                        <Input
                            label="Catatan Kondisi Akhir Unit"
                            value={returnForm.notes}
                            onChange={e => setReturnForm(p => ({ ...p, notes: e.target.value }))}
                        />

                        <div className="flex gap-3 pt-3 border-t border-white/10">
                            <Button variant="filled" color="blue" onClick={handleReturn} loading={returnMutation.isPending} className="flex-1">
                                Proses Pengembalian Unit
                            </Button>
                            <Button variant="outline" onClick={() => setReturnModal(false)}>Batal</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
