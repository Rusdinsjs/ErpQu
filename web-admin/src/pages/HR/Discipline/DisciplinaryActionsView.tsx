import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertOctagon, Plus, Search, ShieldAlert, FileText, CheckCircle2, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import { hrRecruitmentTrainingDisciplineApi, type HrDisciplinaryAction } from '../../../api/hr-recruitment-training-discipline';
import { employeeApi } from '../../../api/employee';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, ActionIcon, useToast, LoadingOverlay
} from '../../../components/ui';

export default function DisciplinaryActionsView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedAction, setSelectedAction] = useState<HrDisciplinaryAction | null>(null);

    const [form, setForm] = useState({
        employee_id: '',
        action_type: 'sp1',
        infraction_category: 'Indisipliner Kehadiran',
        incident_date: dayjs().format('YYYY-MM-DD'),
        reason_details: '',
        action_plan: '',
    });

    const { data: actions = [], isLoading } = useQuery({
        queryKey: ['hr-disciplinary-actions'],
        queryFn: () => hrRecruitmentTrainingDisciplineApi.listDisciplinaryActions(),
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const issueMutation = useMutation({
        mutationFn: hrRecruitmentTrainingDisciplineApi.issueDisciplinaryAction,
        onSuccess: () => {
            success('Surat Peringatan berhasil diterbitkan (Masa berlaku 6 bulan)');
            qc.invalidateQueries({ queryKey: ['hr-disciplinary-actions'] });
            setModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menerbitkan surat peringatan'),
    });

    const handleIssue = () => {
        if (!form.employee_id || !form.reason_details) {
            showError('Lengkapi data karyawan dan kronologi pelanggaran');
            return;
        }
        issueMutation.mutate(form);
    };

    const formatActionType = (type: string) => {
        switch (type) {
            case 'sp1': return { label: 'Surat Peringatan I (SP 1)', color: 'amber' };
            case 'sp2': return { label: 'Surat Peringatan II (SP 2)', color: 'orange' };
            case 'sp3': return { label: 'Surat Peringatan III (SP 3 - Terakhir)', color: 'red' };
            default: return { label: 'Surat Teguran Lisan / Tertulis', color: 'blue' };
        }
    };

    const filtered = actions.filter(a =>
        (a.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.employee_nik || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.infraction_category || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.reason_details || '').toLowerCase().includes(search.toLowerCase())
    );

    const employeeOptions = [
        { value: '', label: 'Pilih Karyawan Terkait *...' },
        ...(Array.isArray(employees) ? employees : []).map(e => ({
            value: e.id,
            label: `${e.nik} - ${e.name} (${e.department_name || 'Umum'})`,
        })),
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <AlertOctagon className="h-6 w-6 text-rose-500" />
                        Penegakan Disiplin & Surat Peringatan (SP 1/2/3)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Pencatatan pelanggaran tata tertib, penegakan SOP K3, dan tracking masa berlaku sanksi 6 bulan</p>
                </div>
                <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="red">
                    Terbitkan Surat Peringatan (SP)
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <Input
                        placeholder="Cari karyawan, NIK, atau kategori pelanggaran..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-md"
                    />
                    <Badge color="red">{actions.length} Tindakan Disiplin</Badge>
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Karyawan Terlapor</TableTh>
                                <TableTh>Tingkat Sanksi</TableTh>
                                <TableTh>Kategori Pelanggaran</TableTh>
                                <TableTh>Tanggal Insiden</TableTh>
                                <TableTh>Masa Berlaku Sanksi</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableEmpty colSpan={7} message="Belum ada catatan surat peringatan atau disiplin" />
                            ) : filtered.map(a => {
                                const typeMeta = formatActionType(a.action_type);
                                const isExpired = dayjs(a.valid_until).isBefore(dayjs());
                                return (
                                    <TableRow key={a.id}>
                                        <TableTd>
                                            <div className="font-bold text-white">{a.employee_name}</div>
                                            <div className="text-xs text-gray-400 font-mono">{a.employee_nik}</div>
                                        </TableTd>
                                        <TableTd>
                                            <Badge color={typeMeta.color as any}>{typeMeta.label}</Badge>
                                        </TableTd>
                                        <TableTd className="font-medium text-rose-300">{a.infraction_category}</TableTd>
                                        <TableTd className="text-xs text-gray-300 font-mono">{dayjs(a.incident_date).format('DD MMM YYYY')}</TableTd>
                                        <TableTd className="text-xs text-gray-300 font-mono">
                                            {dayjs(a.issue_date).format('DD/MM/YYYY')} s/d <strong className="text-rose-400">{dayjs(a.valid_until).format('DD/MM/YYYY')}</strong>
                                        </TableTd>
                                        <TableTd>
                                            <Badge color={isExpired ? 'gray' : 'red'}>
                                                {isExpired ? 'Kadaluarsa / Selesai' : 'Aktif Berlaku'}
                                            </Badge>
                                        </TableTd>
                                        <TableTd className="text-right">
                                            <Button size="sm" variant="outline" onClick={() => { setSelectedAction(a); setDetailModalOpen(true); }} leftIcon={<FileText className="h-3.5 w-3.5" />}>
                                                Rincian Surat
                                            </Button>
                                        </TableTd>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Terbitkan SP */}
            <Modal isOpen={modalOpen} opened={modalOpen} onClose={() => setModalOpen(false)} title="Penerbitan Surat Peringatan / Disiplin Karyawan" size="lg">
                <div className="space-y-4">
                    <Select
                        label="Karyawan yang Bersangkutan *"
                        value={form.employee_id}
                        onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                        options={employeeOptions}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Tingkat Sanksi Disiplin *"
                            value={form.action_type}
                            onChange={v => setForm(p => ({ ...p, action_type: v }))}
                            options={[
                                { value: 'teguran', label: 'Surat Teguran Lisan / Tertulis' },
                                { value: 'sp1', label: 'Surat Peringatan I (SP 1)' },
                                { value: 'sp2', label: 'Surat Peringatan II (SP 2)' },
                                { value: 'sp3', label: 'Surat Peringatan III (SP 3 - Terakhir)' },
                            ]}
                        />
                        <Select
                            label="Kategori Pelanggaran *"
                            value={form.infraction_category}
                            onChange={v => setForm(p => ({ ...p, infraction_category: v }))}
                            options={[
                                { value: 'Indisipliner Kehadiran', label: 'Indisipliner Kehadiran (Mangkir/Terlambat)' },
                                { value: 'Pelanggaran SOP K3', label: 'Pelanggaran SOP K3 & Keselamatan Operasional' },
                                { value: 'Kelalaian Operasional', label: 'Kelalaian Operasional & Pemeliharaan Alat' },
                                { value: 'Ketidaksopanan / Etika', label: 'Ketidaksopanan / Pelanggaran Kode Etik' },
                            ]}
                        />
                    </div>

                    <Input
                        type="date"
                        label="Tanggal Kejadian / Insiden *"
                        value={form.incident_date}
                        onChange={e => setForm(p => ({ ...p, incident_date: e.target.value }))}
                    />

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Kronologi & Alasan Penjatuhan Sanksi *</label>
                        <textarea
                            value={form.reason_details}
                            onChange={e => setForm(p => ({ ...p, reason_details: e.target.value }))}
                            rows={3}
                            placeholder="Jelaskan secara rinci kronologi kejadian..."
                            className="w-full bg-slate-900/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Komitmen Perbaikan / Action Plan</label>
                        <textarea
                            value={form.action_plan}
                            onChange={e => setForm(p => ({ ...p, action_plan: e.target.value }))}
                            rows={2}
                            placeholder="Tindakan perbaikan yang disepakati..."
                            className="w-full bg-slate-900/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                        />
                    </div>

                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                        ℹ️ Sesuai Pasal 161 UU Ketenagakerjaan No. 13/2003, Surat Peringatan berlaku selama <strong>6 (enam) bulan</strong> sejak tanggal penerbitan.
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="red" onClick={handleIssue} loading={issueMutation.isPending} className="flex-1">
                            Terbitkan Surat Peringatan
                        </Button>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Detail SP */}
            <Modal isOpen={detailModalOpen} opened={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Salinan Surat Peringatan Karyawan" size="md">
                {selectedAction && (
                    <div className="space-y-4 text-white text-sm">
                        <div className="p-4 bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-500/30 rounded-xl space-y-1">
                            <div className="font-bold text-base text-white">{selectedAction.employee_name} ({selectedAction.employee_nik})</div>
                            <div className="text-xs text-rose-300 font-semibold">{formatActionType(selectedAction.action_type).label}</div>
                            <div className="text-xs text-gray-400">Kategori: {selectedAction.infraction_category}</div>
                        </div>

                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs space-y-2">
                            <div>
                                <span className="text-gray-400 block">Kronologi / Uraian Pelanggaran:</span>
                                <p className="text-gray-200 mt-0.5">{selectedAction.reason_details}</p>
                            </div>
                            {selectedAction.action_plan && (
                                <div>
                                    <span className="text-gray-400 block">Komitmen Perbaikan:</span>
                                    <p className="text-emerald-300 mt-0.5">{selectedAction.action_plan}</p>
                                </div>
                            )}
                            <div className="pt-2 border-t border-white/10 flex justify-between text-gray-400">
                                <span>Diterbitkan: {dayjs(selectedAction.issue_date).format('DD MMM YYYY')}</span>
                                <span>Berlaku Hingga: <strong className="text-rose-400">{dayjs(selectedAction.valid_until).format('DD MMM YYYY')}</strong></span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-3 border-t border-white/10">
                            <Button variant="outline" onClick={() => setDetailModalOpen(false)}>Tutup</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
