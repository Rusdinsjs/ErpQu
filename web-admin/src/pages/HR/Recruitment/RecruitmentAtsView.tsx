import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Briefcase, Plus, Search, UserCheck, Star, ExternalLink, ArrowRight, Building2, MapPin, DollarSign, Users } from 'lucide-react';
import dayjs from 'dayjs';
import { hrRecruitmentTrainingDisciplineApi, type HrJobOpening, type HrJobApplicant } from '../../../api/hr-recruitment-training-discipline';
import { departmentApi } from '../../../api/departments';
import { hrLifecycleApi } from '../../../api/hr-lifecycle';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, Modal, Input, Select, ActionIcon, useToast, LoadingOverlay
} from '../../../components/ui';

export default function RecruitmentAtsView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [activeTab, setActiveTab] = useState<'openings' | 'applicants'>('openings');
    const [search, setSearch] = useState('');

    // Modals
    const [createJobModal, setCreateJobModal] = useState(false);
    const [createApplicantModal, setCreateApplicantModal] = useState(false);
    const [stageModal, setStageModal] = useState(false);
    const [convertModal, setConvertModal] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState<HrJobApplicant | null>(null);

    // Forms
    const [jobForm, setJobForm] = useState({
        title: '',
        department_id: '',
        designation_id: '',
        employment_type: 'Permanent',
        openings_count: 1,
        min_experience_years: 2,
        salary_min: 7000000,
        salary_max: 12000000,
        location: 'Site / Head Office',
        description: '',
        requirements: '',
        closing_date: dayjs().add(30, 'day').format('YYYY-MM-DD'),
    });

    const [applicantForm, setApplicantForm] = useState({
        job_opening_id: '',
        full_name: '',
        email: '',
        phone: '',
        resume_url: '',
        portfolio_url: '',
        notes: '',
    });

    const [stageForm, setStageForm] = useState({
        stage: 'applied',
        notes: '',
        rating: 4,
        rejection_reason: '',
    });

    const [convertForm, setConvertForm] = useState({
        nik: `EMP${Math.floor(100 + Math.random() * 900)}`,
        date_of_joining: dayjs().format('YYYY-MM-DD'),
        base_salary: 8500000,
    });

    // Queries
    const { data: jobOpenings = [], isLoading: loadingJobs } = useQuery({
        queryKey: ['hr-job-openings'],
        queryFn: hrRecruitmentTrainingDisciplineApi.listJobOpenings,
    });

    const { data: applicants = [], isLoading: loadingApplicants } = useQuery({
        queryKey: ['hr-job-applicants'],
        queryFn: () => hrRecruitmentTrainingDisciplineApi.listJobApplicants(),
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: departmentApi.list,
    });

    const { data: designations = [] } = useQuery({
        queryKey: ['hr-designations'],
        queryFn: hrLifecycleApi.listDesignations,
    });

    // Mutations
    const createJobMutation = useMutation({
        mutationFn: hrRecruitmentTrainingDisciplineApi.createJobOpening,
        onSuccess: () => {
            success('Lowongan pekerjaan berhasil diterbitkan');
            qc.invalidateQueries({ queryKey: ['hr-job-openings'] });
            setCreateJobModal(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal membuat lowongan'),
    });

    const createApplicantMutation = useMutation({
        mutationFn: hrRecruitmentTrainingDisciplineApi.createJobApplicant,
        onSuccess: () => {
            success('Data pelamar berhasil didaftarkan');
            qc.invalidateQueries({ queryKey: ['hr-job-applicants'] });
            qc.invalidateQueries({ queryKey: ['hr-job-openings'] });
            setCreateApplicantModal(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal mendaftarkan pelamar'),
    });

    const updateStageMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hrRecruitmentTrainingDisciplineApi.updateApplicantStage(id, data),
        onSuccess: () => {
            success('Tahap seleksi pelamar diperbarui');
            qc.invalidateQueries({ queryKey: ['hr-job-applicants'] });
            setStageModal(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal memperbarui status pelamar'),
    });

    const convertMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hrRecruitmentTrainingDisciplineApi.convertToEmployee(id, data),
        onSuccess: () => {
            success('Kandidat berhasil diangkat menjadi Karyawan Baru!');
            qc.invalidateQueries({ queryKey: ['hr-job-applicants'] });
            qc.invalidateQueries({ queryKey: ['employees'] });
            setConvertModal(false);
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal mengangkat karyawan'),
    });

    const handleCreateJob = () => {
        if (!jobForm.title || !jobForm.description) {
            showError('Lengkapi judul posisi dan deskripsi pekerjaan');
            return;
        }
        createJobMutation.mutate(jobForm);
    };

    const handleCreateApplicant = () => {
        if (!applicantForm.job_opening_id || !applicantForm.full_name || !applicantForm.email || !applicantForm.phone) {
            showError('Lengkapi data lowongan, nama, email, dan telepon pelamar');
            return;
        }
        createApplicantMutation.mutate(applicantForm);
    };

    const handleUpdateStage = () => {
        if (!selectedApplicant) return;
        updateStageMutation.mutate({ id: selectedApplicant.id, data: stageForm });
    };

    const handleConvert = () => {
        if (!selectedApplicant) return;
        if (!convertForm.nik || !convertForm.date_of_joining) {
            showError('Lengkapi NIK dan Tanggal Mulai Bekerja');
            return;
        }
        convertMutation.mutate({ id: selectedApplicant.id, data: convertForm });
    };

    const formatRp = (num: number) => `Rp ${Number(num || 0).toLocaleString('id-ID')}`;

    const filteredJobs = jobOpenings.filter(j =>
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        (j.department_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const filteredApplicants = applicants.filter(a =>
        a.full_name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        (a.job_title || '').toLowerCase().includes(search.toLowerCase())
    );

    const departmentOptions = [
        { value: '', label: 'Pilih Departemen...' },
        ...departments.map(d => ({ value: d.id, label: d.name })),
    ];

    const designationOptions = [
        { value: '', label: 'Pilih Jabatan...' },
        ...designations.map(d => ({ value: d.id, label: d.title })),
    ];

    const jobOptions = [
        { value: '', label: 'Pilih Lowongan Pekerjaan...' },
        ...jobOpenings.map(j => ({ value: j.id, label: `${j.title} (${j.openings_count} Posisi)` })),
    ];

    const stageLabels: Record<string, { label: string; color: any }> = {
        applied: { label: 'Lamaran Masuk', color: 'blue' },
        screening: { label: 'Screening CV', color: 'cyan' },
        interview_hr: { label: 'Interview HR', color: 'purple' },
        technical_test: { label: 'Tes Teknis / Praktek', color: 'indigo' },
        interview_user: { label: 'Interview User / Direksi', color: 'amber' },
        offering: { label: 'Offering Letter', color: 'yellow' },
        hired: { label: 'Diterima (Hired)', color: 'green' },
        rejected: { label: 'Tidak Lolos', color: 'red' },
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <UserPlus className="h-6 w-6 text-cyan-400" />
                        Rekrutmen & ATS (Applicant Tracking System)
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Manajemen lowongan posisi, pipeline seleksi kandidat, dan konversi ke data karyawan</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setCreateJobModal(true)} leftIcon={<Briefcase className="h-4 w-4" />} variant="outline">
                        + Buat Lowongan
                    </Button>
                    <Button onClick={() => setCreateApplicantModal(true)} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="cyan">
                        + Tambah Pelamar
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-3">
                <Button
                    variant={activeTab === 'openings' ? 'filled' : 'ghost'}
                    color={activeTab === 'openings' ? 'cyan' : 'gray'}
                    onClick={() => setActiveTab('openings')}
                >
                    📢 Lowongan Pekerjaan ({jobOpenings.length})
                </Button>
                <Button
                    variant={activeTab === 'applicants' ? 'filled' : 'ghost'}
                    color={activeTab === 'applicants' ? 'cyan' : 'gray'}
                    onClick={() => setActiveTab('applicants')}
                >
                    👥 Pipeline Kandidat Pelamar ({applicants.length})
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <Input
                        placeholder="Cari lowongan atau nama kandidat pelamar..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-md"
                    />
                    <Badge color="cyan">
                        {activeTab === 'openings' ? `${filteredJobs.length} Lowongan` : `${filteredApplicants.length} Pelamar`}
                    </Badge>
                </div>

                {activeTab === 'openings' ? (
                    <div className="relative">
                        {loadingJobs && <LoadingOverlay />}
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableTh>Posisi Lowongan</TableTh>
                                    <TableTh>Departemen & Tipe</TableTh>
                                    <TableTh>Kebutuhan / Kuota</TableTh>
                                    <TableTh>Estimasi Gaji</TableTh>
                                    <TableTh>Batas Lamaran</TableTh>
                                    <TableTh>Pelamar Masuk</TableTh>
                                    <TableTh>Status</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredJobs.length === 0 ? (
                                    <TableEmpty colSpan={7} message="Belum ada lowongan pekerjaan dibuka" />
                                ) : filteredJobs.map(j => (
                                    <TableRow key={j.id}>
                                        <TableTd>
                                            <div className="font-bold text-white text-base">{j.title}</div>
                                            <div className="text-xs text-gray-400 font-mono">{j.location}</div>
                                        </TableTd>
                                        <TableTd>
                                            <div className="font-medium text-cyan-300">{j.department_name || 'Umum'}</div>
                                            <div className="text-xs text-gray-400">{j.employment_type}</div>
                                        </TableTd>
                                        <TableTd className="font-bold text-white">{j.openings_count} Orang (Min {j.min_experience_years} Thn Pengalaman)</TableTd>
                                        <TableTd className="font-mono text-emerald-400 text-xs">
                                            {formatRp(j.salary_min || 0)} - {formatRp(j.salary_max || 0)}
                                        </TableTd>
                                        <TableTd className="text-xs text-gray-300">
                                            {j.closing_date ? dayjs(j.closing_date).format('DD MMM YYYY') : 'Tanpa Batas'}
                                        </TableTd>
                                        <TableTd>
                                            <Badge color="purple">{j.applicant_count || 0} Kandidat</Badge>
                                        </TableTd>
                                        <TableTd>
                                            <Badge color={j.status === 'open' ? 'green' : 'gray'}>
                                                {j.status === 'open' ? 'Aktif Terbuka' : 'Ditutup'}
                                            </Badge>
                                        </TableTd>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="relative">
                        {loadingApplicants && <LoadingOverlay />}
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableTh>Kandidat Pelamar</TableTh>
                                    <TableTh>Posisi yang Dilamar</TableTh>
                                    <TableTh>Kontak & CV</TableTh>
                                    <TableTh>Tahap Seleksi (ATS)</TableTh>
                                    <TableTh>Rating</TableTh>
                                    <TableTh className="text-right">Aksi</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredApplicants.length === 0 ? (
                                    <TableEmpty colSpan={6} message="Belum ada kandidat pelamar terdaftar" />
                                ) : filteredApplicants.map(a => (
                                    <TableRow key={a.id}>
                                        <TableTd>
                                            <div className="font-bold text-white">{a.full_name}</div>
                                            <div className="text-xs text-gray-400">Terdaftar: {dayjs(a.created_at).format('DD MMM YYYY')}</div>
                                        </TableTd>
                                        <TableTd className="font-medium text-cyan-300">{a.job_title}</TableTd>
                                        <TableTd className="text-xs text-gray-300">
                                            <div>{a.email}</div>
                                            <div className="font-mono text-gray-400">{a.phone}</div>
                                            {a.resume_url && (
                                                <a href={a.resume_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1 mt-0.5">
                                                    <ExternalLink className="h-3 w-3" /> Buka CV
                                                </a>
                                            )}
                                        </TableTd>
                                        <TableTd>
                                            <Badge color={stageLabels[a.stage]?.color || 'gray'}>
                                                {stageLabels[a.stage]?.label || a.stage}
                                            </Badge>
                                        </TableTd>
                                        <TableTd className="text-amber-400 font-bold">
                                            {'★'.repeat(a.rating || 3)} <span className="text-gray-500 text-xs">({a.rating || 3}/5)</span>
                                        </TableTd>
                                        <TableTd className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {a.stage !== 'hired' && a.stage !== 'rejected' && (
                                                    <Button size="sm" variant="outline" onClick={() => {
                                                        setSelectedApplicant(a);
                                                        setStageForm({ stage: a.stage, notes: a.notes || '', rating: a.rating || 4, rejection_reason: '' });
                                                        setStageModal(true);
                                                    }} leftIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                                                        Update Tahap
                                                    </Button>
                                                )}
                                                {a.stage === 'hired' && !a.converted_employee_id && (
                                                    <Button size="sm" variant="filled" color="green" onClick={() => {
                                                        setSelectedApplicant(a);
                                                        setConvertModal(true);
                                                    }} leftIcon={<UserCheck className="h-3.5 w-3.5" />}>
                                                        Angkat Karyawan
                                                    </Button>
                                                )}
                                                {a.converted_employee_id && (
                                                    <Badge color="green">Karyawan Aktif</Badge>
                                                )}
                                            </div>
                                        </TableTd>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>

            {/* Modal Buat Lowongan */}
            <Modal isOpen={createJobModal} opened={createJobModal} onClose={() => setCreateJobModal(false)} title="Buat Lowongan Pekerjaan Baru" size="lg">
                <div className="space-y-4">
                    <Input
                        label="Judul Posisi Pekerjaan *"
                        value={jobForm.title}
                        onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="cth. Senior Heavy Equipment Mechanic"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Departemen"
                            value={jobForm.department_id}
                            onChange={v => setJobForm(p => ({ ...p, department_id: v }))}
                            options={departmentOptions}
                        />
                        <Select
                            label="Jabatan"
                            value={jobForm.designation_id}
                            onChange={v => setJobForm(p => ({ ...p, designation_id: v }))}
                            options={designationOptions}
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Select
                            label="Tipe Pekerjaan"
                            value={jobForm.employment_type}
                            onChange={v => setJobForm(p => ({ ...p, employment_type: v }))}
                            options={[
                                { value: 'Permanent', label: 'Tetap (PKWTT)' },
                                { value: 'Contract', label: 'Kontrak (PKWT)' },
                                { value: 'Internship', label: 'Magang' },
                            ]}
                        />
                        <Input
                            type="number"
                            label="Jumlah Kuota Posisi *"
                            value={jobForm.openings_count}
                            onChange={e => setJobForm(p => ({ ...p, openings_count: parseInt(e.target.value) || 1 }))}
                        />
                        <Input
                            type="number"
                            label="Min. Pengalaman (Tahun)"
                            value={jobForm.min_experience_years}
                            onChange={e => setJobForm(p => ({ ...p, min_experience_years: parseInt(e.target.value) || 0 }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="number"
                            label="Rentang Gaji Minimum (Rp)"
                            value={jobForm.salary_min}
                            onChange={e => setJobForm(p => ({ ...p, salary_min: parseFloat(e.target.value) || 0 }))}
                        />
                        <Input
                            type="number"
                            label="Rentang Gaji Maksimum (Rp)"
                            value={jobForm.salary_max}
                            onChange={e => setJobForm(p => ({ ...p, salary_max: parseFloat(e.target.value) || 0 }))}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Deskripsi Tugas & Tanggung Jawab *</label>
                        <textarea
                            value={jobForm.description}
                            onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))}
                            rows={3}
                            placeholder="Jelaskan uraian tugas..."
                            className="w-full bg-slate-900/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="cyan" onClick={handleCreateJob} loading={createJobMutation.isPending} className="flex-1">
                            Terbitkan Lowongan
                        </Button>
                        <Button variant="outline" onClick={() => setCreateJobModal(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Tambah Pelamar */}
            <Modal isOpen={createApplicantModal} opened={createApplicantModal} onClose={() => setCreateApplicantModal(false)} title="Pendaftaran Kandidat Pelamar" size="md">
                <div className="space-y-4">
                    <Select
                        label="Lowongan Pekerjaan yang Dilamar *"
                        value={applicantForm.job_opening_id}
                        onChange={v => setApplicantForm(p => ({ ...p, job_opening_id: v }))}
                        options={jobOptions}
                    />

                    <Input
                        label="Nama Lengkap Kandidat *"
                        value={applicantForm.full_name}
                        onChange={e => setApplicantForm(p => ({ ...p, full_name: e.target.value }))}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            type="email"
                            label="Email *"
                            value={applicantForm.email}
                            onChange={e => setApplicantForm(p => ({ ...p, email: e.target.value }))}
                        />
                        <Input
                            label="Nomor WhatsApp / HP *"
                            value={applicantForm.phone}
                            onChange={e => setApplicantForm(p => ({ ...p, phone: e.target.value }))}
                        />
                    </div>

                    <Input
                        label="Tautan Dokumen CV / Resume (URL)"
                        value={applicantForm.resume_url}
                        onChange={e => setApplicantForm(p => ({ ...p, resume_url: e.target.value }))}
                        placeholder="https://..."
                    />

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Catatan Profil Kandidat</label>
                        <textarea
                            value={applicantForm.notes}
                            onChange={e => setApplicantForm(p => ({ ...p, notes: e.target.value }))}
                            rows={2}
                            placeholder="Catatan keahlian, pengalaman..."
                            className="w-full bg-slate-900/60 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-white/10">
                        <Button variant="filled" color="cyan" onClick={handleCreateApplicant} loading={createApplicantMutation.isPending} className="flex-1">
                            Simpan Data Pelamar
                        </Button>
                        <Button variant="outline" onClick={() => setCreateApplicantModal(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Update Tahap ATS */}
            <Modal isOpen={stageModal} opened={stageModal} onClose={() => setStageModal(false)} title="Update Tahap Seleksi Pelamar" size="md">
                {selectedApplicant && (
                    <div className="space-y-4 text-white text-sm">
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 text-xs">
                            <div>Nama: <strong>{selectedApplicant.full_name}</strong></div>
                            <div>Posisi: <strong>{selectedApplicant.job_title}</strong></div>
                        </div>

                        <Select
                            label="Tahap Seleksi Berikutnya *"
                            value={stageForm.stage}
                            onChange={v => setStageForm(p => ({ ...p, stage: v }))}
                            options={[
                                { value: 'screening', label: 'Screening CV' },
                                { value: 'interview_hr', label: 'Interview HR' },
                                { value: 'technical_test', label: 'Tes Teknis / Praktek' },
                                { value: 'interview_user', label: 'Interview User / Direksi' },
                                { value: 'offering', label: 'Offering Letter' },
                                { value: 'hired', label: 'Diterima Bekerja (Hired)' },
                                { value: 'rejected', label: 'Tidak Lolos Seleksi (Reject)' },
                            ]}
                        />

                        <Select
                            label="Rating Evaluasi (1 - 5 Bintang)"
                            value={stageForm.rating?.toString()}
                            onChange={v => setStageForm(p => ({ ...p, rating: parseInt(v) || 3 }))}
                            options={[
                                { value: '5', label: '★★★★★ (Sangat Direkomendasikan)' },
                                { value: '4', label: '★★★★☆ (Baik & Memenuhi Syarat)' },
                                { value: '3', label: '★★★☆☆ (Cukup / Sesuai Standar)' },
                                { value: '2', label: '★★☆☆☆ (Kurang Memenuhi)' },
                                { value: '1', label: '★☆☆☆☆ (Tidak Sesuai)' },
                            ]}
                        />

                        {stageForm.stage === 'rejected' && (
                            <Input
                                label="Alasan Penolakan *"
                                value={stageForm.rejection_reason}
                                onChange={e => setStageForm(p => ({ ...p, rejection_reason: e.target.value }))}
                                placeholder="Jelaskan alasan tidak lolos..."
                            />
                        )}

                        <div className="flex gap-3 pt-3 border-t border-white/10">
                            <Button variant="filled" color="cyan" onClick={handleUpdateStage} loading={updateStageMutation.isPending} className="flex-1">
                                Perbarui Tahap
                            </Button>
                            <Button variant="outline" onClick={() => setStageModal(false)}>Batal</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Convert to Employee */}
            <Modal isOpen={convertModal} opened={convertModal} onClose={() => setConvertModal(false)} title="Konversi Pelamar Menjadi Karyawan Baru" size="md">
                {selectedApplicant && (
                    <div className="space-y-4 text-white">
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-1 text-xs text-emerald-300">
                            <div>Nama: <strong className="text-white">{selectedApplicant.full_name}</strong></div>
                            <div>Posisi: <strong className="text-white">{selectedApplicant.job_title}</strong></div>
                        </div>

                        <Input
                            label="Nomor Induk Karyawan (NIK) *"
                            value={convertForm.nik}
                            onChange={e => setConvertForm(p => ({ ...p, nik: e.target.value }))}
                        />

                        <Input
                            type="date"
                            label="Tanggal Mulai Bekerja (Join Date) *"
                            value={convertForm.date_of_joining}
                            onChange={e => setConvertForm(p => ({ ...p, date_of_joining: e.target.value }))}
                        />

                        <Input
                            type="number"
                            label="Gaji Pokok Disepakati (Rp)"
                            value={convertForm.base_salary}
                            onChange={e => setConvertForm(p => ({ ...p, base_salary: parseFloat(e.target.value) || 0 }))}
                        />

                        <div className="flex gap-3 pt-3 border-t border-white/10">
                            <Button variant="filled" color="green" onClick={handleConvert} loading={convertMutation.isPending} className="flex-1">
                                Angkat Menjadi Karyawan
                            </Button>
                            <Button variant="outline" onClick={() => setConvertModal(false)}>Batal</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
