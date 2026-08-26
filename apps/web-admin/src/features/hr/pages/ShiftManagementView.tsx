import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Plus, Edit, Trash2, Users, Calendar, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';
import { hrShiftApi, type HrShiftType, type HrShiftAssignment } from'../api/hr-shift-overtime';
import { employeeApi } from'../api/employee';
import {
    Button, Card, CardHeader, CardTitle, CardContent, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, ActionIcon, Modal, Input, Select, useToast, LoadingOverlay, Tabs, TabsList, TabsTrigger, TabsContent, DateInput,
} from'../../../components/ui';

export default function ShiftManagementView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();

    const [shiftModalOpen, setShiftModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<HrShiftType | null>(null);

    const [shiftForm, setShiftForm] = useState({
        name: '',
        code: '',
        start_time: '08:00:00',
        end_time: '17:00:00',
        late_tolerance_minutes: 15,
        break_start_time: '12:00:00',
        break_end_time: '13:00:00',
        is_night_shift: false,
        color: '#3B82F6',
        description: '',
    });

    const [assignForm, setAssignForm] = useState({
        employee_ids: [] as string[],
        shift_type_id: '',
        start_date: dayjs().format('YYYY-MM-DD'),
        end_date: '',
        notes: '',
    });

    const { data: shifts = [], isLoading: loadingShifts } = useQuery({
        queryKey: ['hr-shifts'],
        queryFn: hrShiftApi.listShifts,
    });

    const { data: assignments = [], isLoading: loadingAssigns } = useQuery({
        queryKey: ['hr-shift-assignments'],
        queryFn: () => hrShiftApi.listAssignments(),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const createShiftMutation = useMutation({
        mutationFn: hrShiftApi.createShift,
        onSuccess: () => {
            success('Shift berhasil ditambahkan');
            qc.invalidateQueries({ queryKey: ['hr-shifts'] });
            setShiftModalOpen(false);
            resetShiftForm();
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal membuat shift'),
    });

    const updateShiftMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<HrShiftType> }) => hrShiftApi.updateShift(id, data),
        onSuccess: () => {
            success('Shift berhasil diperbarui');
            qc.invalidateQueries({ queryKey: ['hr-shifts'] });
            setShiftModalOpen(false);
            resetShiftForm();
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal memperbarui shift'),
    });

    const deleteShiftMutation = useMutation({
        mutationFn: hrShiftApi.deleteShift,
        onSuccess: () => { success('Shift dihapus'); qc.invalidateQueries({ queryKey: ['hr-shifts'] }); },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menghapus shift'),
    });

    const bulkAssignMutation = useMutation({
        mutationFn: hrShiftApi.bulkAssign,
        onSuccess: () => {
            success('Penugasan shift roster berhasil disimpan');
            qc.invalidateQueries({ queryKey: ['hr-shift-assignments'] });
            setAssignModalOpen(false);
            setAssignForm({ employee_ids: [], shift_type_id: '', start_date: dayjs().format('YYYY-MM-DD'), end_date: '', notes: '' });
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menugaskan shift'),
    });

    const deleteAssignMutation = useMutation({
        mutationFn: hrShiftApi.deleteAssignment,
        onSuccess: () => { success('Penugasan dihapus'); qc.invalidateQueries({ queryKey: ['hr-shift-assignments'] }); },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menghapus penugasan'),
    });

    const resetShiftForm = () => {
        setShiftForm({
            name: '', code: '', start_time: '08:00:00', end_time: '17:00:00',
            late_tolerance_minutes: 15, break_start_time: '12:00:00', break_end_time: '13:00:00',
            is_night_shift: false, color: '#3B82F6', description: '',
        });
        setEditingShift(null);
    };

    const handleOpenEditShift = (s: HrShiftType) => {
        setEditingShift(s);
        setShiftForm({
            name: s.name,
            code: s.code || '',
            start_time: s.start_time,
            end_time: s.end_time,
            late_tolerance_minutes: s.late_tolerance_minutes,
            break_start_time: s.break_start_time || '12:00:00',
            break_end_time: s.break_end_time || '13:00:00',
            is_night_shift: s.is_night_shift,
            color: s.color || '#3B82F6',
            description: s.description || '',
        });
        setShiftModalOpen(true);
    };

    const handleSaveShift = () => {
        if (!shiftForm.name) { showError('Nama shift wajib diisi'); return; }
        if (editingShift) {
            updateShiftMutation.mutate({ id: editingShift.id, data: shiftForm });
        } else {
            createShiftMutation.mutate(shiftForm);
        }
    };

    const handleSaveAssignment = () => {
        if (assignForm.employee_ids.length === 0) { showError('Pilih minimal 1 karyawan'); return; }
        if (!assignForm.shift_type_id) { showError('Pilih jenis shift'); return; }
        bulkAssignMutation.mutate(assignForm);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Clock className="h-6 w-6 text-blue-400" />
                        Manajemen Shift & Roster
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Pengaturan jam kerja dinamis, toleransi telat, dan penugasan roster karyawan</p>
                </div>
            </div>

            <Tabs defaultValue="roster">
                <TabsList className="grid grid-cols-2 max-w-md mb-4">
                    <TabsTrigger value="roster"><Calendar className="h-4 w-4 mr-2" />Penugasan Roster</TabsTrigger>
                    <TabsTrigger value="master"><Clock className="h-4 w-4 mr-2" />Master Shift</TabsTrigger>
                </TabsList>

                {/* Roster Assignment */}
                <TabsContent value="roster">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
                            <CardTitle>Daftar Penugasan Shift Karyawan</CardTitle>
                            <Button onClick={() => setAssignModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="blue">
                                Tugaskan Shift Roster
                            </Button>
                        </CardHeader>
                        <div className="relative">
                            {loadingAssigns && <LoadingOverlay />}
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableTh>Karyawan</TableTh>
                                        <TableTh>Shift</TableTh>
                                        <TableTh>Jam Kerja</TableTh>
                                        <TableTh>Periode Berlaku</TableTh>
                                        <TableTh>Catatan</TableTh>
                                        <TableTh className="text-right">Aksi</TableTh>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {assignments.length === 0 ? (
                                        <TableEmpty colSpan={6} message="Belum ada penugasan shift roster" />
                                    ) : assignments.map(a => (
                                        <TableRow key={a.id}>
                                            <TableTd>
                                                <div className="font-medium text-white">{a.employee_name}</div>
                                                <div className="text-xs text-gray-400">{a.employee_nik}</div>
                                            </TableTd>
                                            <TableTd>
                                                <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: `${a.color || '#3B82F6'}20`, color: a.color || '#3B82F6' }}>
                                                    {a.shift_name} ({a.shift_code || 'SFT'})
                                                </span>
                                            </TableTd>
                                            <TableTd className="font-mono text-xs text-gray-300">
                                                {a.start_time} - {a.end_time}
                                            </TableTd>
                                            <TableTd className="text-xs text-gray-300">
                                                {dayjs(a.start_date).format('DD MMM YYYY')} s/d {a.end_date ? dayjs(a.end_date).format('DD MMM YYYY') : 'Seterusnya'}
                                            </TableTd>
                                            <TableTd className="text-xs text-gray-400">{a.notes || '-'}</TableTd>
                                            <TableTd className="text-right">
                                                <ActionIcon onClick={() => { if (confirm('Hapus penugasan ini?')) deleteAssignMutation.mutate(a.id); }} color="red" title="Hapus">
                                                    <Trash2 className="h-4 w-4" />
                                                </ActionIcon>
                                            </TableTd>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>

                {/* Master Shifts */}
                <TabsContent value="master">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between border-b border-white/10 pb-4">
                            <CardTitle>Master Jenis Shift</CardTitle>
                            <Button onClick={() => { resetShiftForm(); setShiftModalOpen(true); }} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="blue">
                                Tambah Shift
                            </Button>
                        </CardHeader>
                        <div className="relative">
                            {loadingShifts && <LoadingOverlay />}
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableTh>Nama Shift</TableTh>
                                        <TableTh>Kode</TableTh>
                                        <TableTh>Jam Masuk - Pulang</TableTh>
                                        <TableTh>Toleransi Telat</TableTh>
                                        <TableTh>Istirahat</TableTh>
                                        <TableTh>Tipe</TableTh>
                                        <TableTh className="text-right">Aksi</TableTh>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {shifts.length === 0 ? (
                                        <TableEmpty colSpan={7} message="Belum ada data shift" />
                                    ) : shifts.map(s => (
                                        <TableRow key={s.id}>
                                            <TableTd className="font-medium text-white flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color || '#3B82F6' }} />
                                                {s.name}
                                            </TableTd>
                                            <TableTd><span className="font-mono text-xs bg-white/10 px-2 py-1 rounded">{s.code || '-'}</span></TableTd>
                                            <TableTd className="font-mono text-sm">{s.start_time} - {s.end_time}</TableTd>
                                            <TableTd><Badge color="yellow">{s.late_tolerance_minutes} Menit</Badge></TableTd>
                                            <TableTd className="text-xs text-gray-300">{s.break_start_time && s.break_end_time ? `${s.break_start_time} - ${s.break_end_time}` : '-'}</TableTd>
                                            <TableTd>{s.is_night_shift ? <Badge color="purple">Overnight</Badge> : <Badge color="gray">Day</Badge>}</TableTd>
                                            <TableTd className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <ActionIcon onClick={() => handleOpenEditShift(s)} title="Edit"><Edit className="h-4 w-4" /></ActionIcon>
                                                    <ActionIcon onClick={() => { if (confirm('Hapus shift?')) deleteShiftMutation.mutate(s.id); }} color="red" title="Hapus"><Trash2 className="h-4 w-4" /></ActionIcon>
                                                </div>
                                            </TableTd>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal Shift Type */}
            <Modal opened={shiftModalOpen} onClose={() => { setShiftModalOpen(false); resetShiftForm(); }} title={editingShift ? 'Edit Shift' : 'Tambah Jenis Shift'} size="md">
                <div className="space-y-4">
                    <Input label="Nama Shift *" value={shiftForm.name} onChange={e => setShiftForm(p => ({ ...p, name: e.target.value }))} placeholder="cth. Shift Pagi Operasional" />
                    <Input label="Kode Shift" value={shiftForm.code} onChange={e => setShiftForm(p => ({ ...p, code: e.target.value }))} placeholder="cth. SHIFT-1" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Jam Masuk *" type="time" value={shiftForm.start_time} onChange={e => setShiftForm(p => ({ ...p, start_time: e.target.value }))} />
                        <Input label="Jam Pulang *" type="time" value={shiftForm.end_time} onChange={e => setShiftForm(p => ({ ...p, end_time: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Toleransi Telat (menit)" type="number" value={String(shiftForm.late_tolerance_minutes)} onChange={e => setShiftForm(p => ({ ...p, late_tolerance_minutes: parseInt(e.target.value) || 0 }))} />
                        <Input label="Warna Label" type="color" value={shiftForm.color} onChange={e => setShiftForm(p => ({ ...p, color: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Mulai Istirahat" type="time" value={shiftForm.break_start_time} onChange={e => setShiftForm(p => ({ ...p, break_start_time: e.target.value }))} />
                        <Input label="Selesai Istirahat" type="time" value={shiftForm.break_end_time} onChange={e => setShiftForm(p => ({ ...p, break_end_time: e.target.value }))} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="night" checked={shiftForm.is_night_shift} onChange={e => setShiftForm(p => ({ ...p, is_night_shift: e.target.checked }))} className="w-4 h-4 accent-purple-500" />
                        <label htmlFor="night" className="text-sm text-gray-300">Shift Malam / Lintas Hari (Overnight)</label>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="filled" color="blue" onClick={handleSaveShift} loading={createShiftMutation.isPending || updateShiftMutation.isPending} className="flex-1">Simpan Shift</Button>
                        <Button variant="outline" onClick={() => { setShiftModalOpen(false); resetShiftForm(); }}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Assignment */}
            <Modal opened={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Penugasan Shift Roster" size="lg">
                <div className="space-y-4">
                    <Select label="Pilih Shift *" value={assignForm.shift_type_id} onChange={v => setAssignForm(p => ({ ...p, shift_type_id: v }))} options={[{ value: '', label: 'Pilih Jenis Shift' }, ...(Array.isArray(shifts) ? shifts : []).map(s => ({ value: s.id, label: `${s.name} (${s.start_time} - ${s.end_time})` }))]} />
                    <div className="grid grid-cols-2 gap-4">
                        <DateInput label="Tanggal Mulai *" value={assignForm.start_date} onChange={v => setAssignForm(p => ({ ...p, start_date: v }))} />
                        <DateInput label="Tanggal Selesai (Opsional)" value={assignForm.end_date} onChange={v => setAssignForm(p => ({ ...p, end_date: v }))} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Pilih Karyawan ({assignForm.employee_ids.length} dipilih)</label>
                        <div className="max-h-48 overflow-y-auto p-2 bg-white/5 rounded-lg border border-white/10 space-y-1">
                            {(Array.isArray(employees) ? employees : []).map(emp => (
                                <label key={emp.id} className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded cursor-pointer text-sm">
                                    <input
                                        type="checkbox"
                                        checked={assignForm.employee_ids.includes(emp.id)}
                                        onChange={e => {
                                            if (e.target.checked) setAssignForm(p => ({ ...p, employee_ids: [...p.employee_ids, emp.id] }));
                                            else setAssignForm(p => ({ ...p, employee_ids: p.employee_ids.filter(id => id !== emp.id) }));
                                        }}
                                        className="w-4 h-4 accent-blue-500"
                                    />
                                    <span className="text-white">{emp.name}</span>
                                    <span className="text-gray-500 text-xs">({emp.nik})</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <Input label="Catatan" value={assignForm.notes} onChange={e => setAssignForm(p => ({ ...p, notes: e.target.value }))} placeholder="Keterangan penugasan roster..." />
                    <div className="flex gap-3 pt-2">
                        <Button variant="filled" color="blue" onClick={handleSaveAssignment} loading={bulkAssignMutation.isPending} className="flex-1">Tugaskan Karyawan</Button>
                        <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
