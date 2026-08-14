import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Plus, Search, Star, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
import dayjs from 'dayjs';
import { hrLoansClaimsKpiApi, type HrEmployeeAppraisal } from '../../../api/hr-loans-claims-kpi';
import { employeeApi } from '../../../api/employee';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, ActionIcon, useToast, LoadingOverlay
} from '../../../components/ui';

export default function AppraisalView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedAppraisal, setSelectedAppraisal] = useState<HrEmployeeAppraisal | null>(null);

    const [form, setForm] = useState({
        employee_id: '',
        template_id: '20000000-0000-0000-0000-000000000001',
        cycle_title: `Evaluasi Kinerja Semester II - ${dayjs().format('YYYY')}`,
        start_date: dayjs().startOf('year').format('YYYY-MM-DD'),
        end_date: dayjs().format('YYYY-MM-DD'),
        self_score: 90,
        manager_score: 92,
        feedback: '',
        recommendation: '',
    });

    const { data: appraisals = [], isLoading } = useQuery({
        queryKey: ['hr-employee-appraisals'],
        queryFn: () => hrLoansClaimsKpiApi.listEmployeeAppraisals(),
    });

    const { data: templates = [] } = useQuery({
        queryKey: ['hr-appraisal-templates'],
        queryFn: hrLoansClaimsKpiApi.listAppraisalTemplates,
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list(),
    });

    const submitMutation = useMutation({
        mutationFn: hrLoansClaimsKpiApi.submitAppraisal,
        onSuccess: () => {
            success('Penilaian kinerja KPI berhasil disimpan');
            qc.invalidateQueries({ queryKey: ['hr-employee-appraisals'] });
            setModalOpen(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menyimpan penilaian KPI'),
    });

    const handleSubmit = () => {
        if (!form.employee_id || !form.template_id || !form.cycle_title) {
            showError('Lengkapi data penilaian KPI');
            return;
        }
        submitMutation.mutate(form);
    };

    const filtered = appraisals.filter(a =>
        (a.employee_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.employee_nik || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.cycle_title || '').toLowerCase().includes(search.toLowerCase())
    );

    const employeeOptions = [
        { value: '', label: 'Pilih Karyawan yang Dinilai...' },
        ...(Array.isArray(employees) ? employees : []).map(e => ({
            value: e.id,
            label: `${e.nik} - ${e.name} (${e.department_name || 'Umum'})`,
        })),
    ];

    const templateOptions = [
        ...templates.map(t => ({
            value: t.id,
            label: t.title,
        })),
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Award className="h-6 w-6 text-yellow-400" />
                        Evaluasi Kinerja & KPI (Performance Appraisal)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Standarisasi penilaian KPI, rating pencapaian kinerja, dan rekomendasi karir</p>
                </div>
                <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="yellow">
                    Buat Penilaian KPI
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <Input
                        placeholder="Cari karyawan, NIK, atau siklus evaluasi..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-md"
                    />
                    <Badge color="yellow">{appraisals.length} Evaluasi Kinerja</Badge>
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Karyawan</TableTh>
                                <TableTh>Siklus Evaluasi</TableTh>
                                <TableTh>Skor Mandiri</TableTh>
                                <TableTh>Skor Atasan</TableTh>
                                <TableTh>Skor Akhir</TableTh>
                                <TableTh>Rating Grade</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableEmpty colSpan={7} message="Belum ada data evaluasi kinerja" />
                            ) : filtered.map(a => (
                                <TableRow key={a.id}>
                                    <TableTd>
                                        <div className="font-bold text-white">{a.employee_name}</div>
                                        <div className="text-xs text-gray-400 font-mono">{a.employee_nik}</div>
                                    </TableTd>
                                    <TableTd className="text-sm text-yellow-300 font-medium">{a.cycle_title}</TableTd>
                                    <TableTd className="font-mono text-gray-300">{a.self_score || '-'}</TableTd>
                                    <TableTd className="font-mono text-white font-semibold">{a.manager_score || '-'}</TableTd>
                                    <TableTd className="font-bold text-emerald-400 text-base">{a.final_score || '-'}</TableTd>
                                    <TableTd>
                                        <Badge color={
                                            a.final_rating === 'A' ? 'green' :
                                            a.final_rating === 'B' ? 'blue' :
                                            a.final_rating === 'C' ? 'amber' : 'red'
                                        }>
                                            Rating {a.final_rating || 'N/A'}
                                        </Badge>
                                    </TableTd>
                                    <TableTd className="text-right">
                                        <Button size="sm" variant="outline" onClick={() => { setSelectedAppraisal(a); setDetailModalOpen(true); }} leftIcon={<FileText className="h-3.5 w-3.5" />}>
                                            Lihat Rapor KPI
                                        </Button>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Modal Input Penilaian */}
            <Modal isOpen={modalOpen} opened={modalOpen} onClose={() => setModalOpen(false)} title="Formulir Penilaian Kinerja Karyawan (KPI)" size="lg">
                <div className="space-y-4">
                    <Select
                        label="Karyawan yang Dinilai *"
                        value={form.employee_id}
                        onChange={v => setForm(p => ({ ...p, employee_id: v }))}
                        options={employeeOptions}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Template KPI *"
                            value={form.template_id}
                            onChange={v => setForm(p => ({ ...p, template_id: v }))}
                            options={templateOptions}
                        />
                        <Input
                            label="Judul Siklus Penilaian *"
                            value={form.cycle_title}
                            onChange={e => setForm(p => ({ ...p, cycle_title: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="number"
                            label="Skor Evaluasi Mandiri (0-100)"
                            value={form.self_score}
                            onChange={e => setForm(p => ({ ...p, self_score: parseFloat(e.target.value) || 0 }))}
                        />
                        <Input
                            type="number"
                            label="Skor Penilaian Atasan / Manager (0-100) *"
                            value={form.manager_score}
                            onChange={e => setForm(p => ({ ...p, manager_score: parseFloat(e.target.value) || 0 }))}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Feedback & Evaluasi Kinerja Atasan</label>
                        <textarea
                            value={form.feedback}
                            onChange={e => setForm(p => ({ ...p, feedback: e.target.value }))}
                            rows={3}
                            placeholder="Catatan kelebihan dan area perbaikan kinerja..."
                            className="w-full bg-slate-900/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Rekomendasi Pengembangan / Karir</label>
                        <textarea
                            value={form.recommendation}
                            onChange={e => setForm(p => ({ ...p, recommendation: e.target.value }))}
                            rows={2}
                            placeholder="Rekomendasi promosi, pelatihan teknis, atau bonus..."
                            className="w-full bg-slate-900/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="yellow" onClick={handleSubmit} loading={submitMutation.isPending} className="flex-1">
                            Simpan Hasil Penilaian KPI
                        </Button>
                        <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Detail Rapor KPI */}
            <Modal isOpen={detailModalOpen} opened={detailModalOpen} onClose={() => setDetailModalOpen(false)} title="Rapor Hasil Penilaian Kinerja (KPI)" size="md">
                {selectedAppraisal && (
                    <div className="space-y-4 text-white">
                        <div className="p-4 bg-gradient-to-r from-yellow-950/60 to-slate-900 border border-yellow-500/30 rounded-xl flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-white text-base">{selectedAppraisal.employee_name}</h3>
                                <div className="text-xs text-gray-300">{selectedAppraisal.cycle_title}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-yellow-400">Rating {selectedAppraisal.final_rating}</div>
                                <div className="text-xs text-gray-400">Skor: {selectedAppraisal.final_score} / 100</div>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                                <span className="text-gray-400 block font-semibold mb-1">Feedback Atasan:</span>
                                <p className="text-gray-200">{selectedAppraisal.feedback || 'Tidak ada catatan khusus.'}</p>
                            </div>
                            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                                <span className="text-gray-400 block font-semibold mb-1">Rekomendasi Karir:</span>
                                <p className="text-emerald-300 font-medium">{selectedAppraisal.recommendation || 'Pertahankan performa kerja saat ini.'}</p>
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
