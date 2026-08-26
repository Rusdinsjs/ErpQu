import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    User, Briefcase, FileText, GraduationCap, History, Plus, Upload, Trash2,
    Phone, Mail, MapPin, Calendar, AlertTriangle, CheckCircle, ArrowLeft,
} from 'lucide-react';
import dayjs from 'dayjs';
import { hr360Api, hrDocumentApi, hrEducationApi, LIFECYCLE_EVENT_LABELS, LIFECYCLE_EVENT_COLORS, DOCUMENT_TYPE_LABELS, type HrEmployeeDocument, type HrEmployeeEducation } from'../api/hr-lifecycle';
import { uploadApi } from'../../../api/upload';
import { getImageUrl } from'../../../utils/image';
import {
    Button, Card, CardHeader, CardTitle, CardContent, Badge, Modal, Input, Select, useToast,
    LoadingOverlay, Tabs, TabsList, TabsTrigger, TabsContent, DateInput,
} from'../../../components/ui';

const DOC_TYPE_OPTIONS = [
    { value: 'ktp', label: 'KTP' },
    { value: 'kk', label: 'Kartu Keluarga' },
    { value: 'npwp', label: 'NPWP' },
    { value: 'bpjs_kes', label: 'BPJS Kesehatan' },
    { value: 'bpjs_tk', label: 'BPJS Ketenagakerjaan' },
    { value: 'ijazah', label: 'Ijazah' },
    { value: 'kontrak_kerja', label: 'Kontrak Kerja' },
    { value: 'sk_pengangkatan', label: 'SK Pengangkatan' },
    { value: 'sertifikasi', label: 'Sertifikasi' },
    { value: 'other', label: 'Lainnya' },
];

const EDU_LEVEL_OPTIONS = [
    { value: 'SMP', label: 'SMP' },
    { value: 'SMA/SMK', label: 'SMA/SMK' },
    { value: 'D3', label: 'D3' },
    { value: 'S1', label: 'S1' },
    { value: 'S2', label: 'S2' },
    { value: 'S3', label: 'S3' },
];

interface Employee360ViewProps {
    employeeId?: string;
}

export default function Employee360View({ employeeId }: Employee360ViewProps) {
    const { id: urlId } = useParams<{ id: string }>();
    const id = employeeId || urlId;
    const navigate = useNavigate();
    const qc = useQueryClient();
    const { success, error: showError } = useToast();

    const [docModalOpen, setDocModalOpen] = useState(false);
    const [eduModalOpen, setEduModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [docForm, setDocForm] = useState({ document_type: 'ktp', document_name: '', document_number: '', document_url: '', expiry_date: '', notes: '' });
    const [eduForm, setEduForm] = useState({ level: 'S1', institution_name: '', major: '', graduation_year: '', gpa: '', is_highest: false });

    const { data: profile, isLoading } = useQuery({
        queryKey: ['employee-360', id],
        queryFn: () => hr360Api.get(id!),
        enabled: !!id,
    });

    const deleteDocMutation = useMutation({
        mutationFn: hrDocumentApi.delete,
        onSuccess: () => { success('Dokumen dihapus'); qc.invalidateQueries({ queryKey: ['employee-360', id] }); },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menghapus dokumen'),
    });

    const createDocMutation = useMutation({
        mutationFn: (data: Partial<HrEmployeeDocument>) => hrDocumentApi.create({ ...data, employee_id: id! }),
        onSuccess: () => { success('Dokumen berhasil diunggah'); qc.invalidateQueries({ queryKey: ['employee-360', id] }); setDocModalOpen(false); setDocForm({ document_type: 'ktp', document_name: '', document_number: '', document_url: '', expiry_date: '', notes: '' }); },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menambah dokumen'),
    });

    const createEduMutation = useMutation({
        mutationFn: (data: Partial<HrEmployeeEducation>) => hrEducationApi.create({ ...data, employee_id: id! }),
        onSuccess: () => { success('Riwayat pendidikan ditambahkan'); qc.invalidateQueries({ queryKey: ['employee-360', id] }); setEduModalOpen(false); },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menambah pendidikan'),
    });

    const deleteEduMutation = useMutation({
        mutationFn: hrEducationApi.delete,
        onSuccess: () => { success('Riwayat pendidikan dihapus'); qc.invalidateQueries({ queryKey: ['employee-360', id] }); },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menghapus'),
    });

    const handleDocFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true);
        try {
            const res = await uploadApi.upload(file);
            setDocForm(p => ({ ...p, document_url: res.url, document_name: p.document_name || file.name }));
            success('File berhasil diunggah');
        } catch { showError('Gagal mengunggah file'); }
        finally { setUploading(false); }
    };

    const handleSubmitDoc = () => {
        if (!docForm.document_url) { showError('Upload file terlebih dahulu'); return; }
        createDocMutation.mutate(docForm);
    };

    const handleSubmitEdu = () => {
        if (!eduForm.institution_name) { showError('Nama institusi wajib diisi'); return; }
        createEduMutation.mutate({ ...eduForm, graduation_year: eduForm.graduation_year ? parseInt(eduForm.graduation_year) : undefined, gpa: eduForm.gpa ? parseFloat(eduForm.gpa) : undefined });
    };

    if (isLoading) return <div className="p-8 flex justify-center"><LoadingOverlay /></div>;
    if (!profile) return <div className="p-8 text-center text-gray-400">Data karyawan tidak ditemukan</div>;

    const emp = profile.employee as any;
    const latestLifecycle = profile.lifecycle_history[0];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="subtle" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="h-4 w-4" />}>Kembali</Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">Profil Karyawan 360°</h1>
                    <p className="text-gray-400 text-sm">Informasi lengkap, riwayat karir, dan dokumen karyawan</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardContent className="p-6 text-center">
                        <div className="relative inline-block mb-4">
                            {emp.photo_url ? (
                                <img src={getImageUrl(emp.photo_url)} alt={emp.name} className="w-24 h-24 rounded-full object-cover border-2 border-purple-500" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold">
                                    {emp.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-gray-800 ${emp.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                        </div>
                        <h2 className="text-xl font-bold text-white">{emp.name}</h2>
                        <p className="text-gray-400 text-sm">{emp.nik}</p>
                        <div className="mt-2 flex flex-wrap gap-2 justify-center">
                            {profile.designation && <Badge color="purple">{profile.designation.name}</Badge>}
                            {profile.employment_type && <Badge color="blue">{profile.employment_type.name}</Badge>}
                        </div>
                        <div className="mt-4 space-y-2 text-left">
                            {emp.email && <div className="flex items-center gap-2 text-sm text-gray-400"><Mail className="h-4 w-4" />{emp.email}</div>}
                            {emp.phone && <div className="flex items-center gap-2 text-sm text-gray-400"><Phone className="h-4 w-4" />{emp.phone}</div>}
                            {emp.start_date && <div className="flex items-center gap-2 text-sm text-gray-400"><Calendar className="h-4 w-4" />Bergabung: {dayjs(emp.start_date).format('DD MMM YYYY')}</div>}
                            {emp.address && <div className="flex items-center gap-2 text-sm text-gray-400"><MapPin className="h-4 w-4" />{emp.address}</div>}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="biodata">
                        <TabsList className="grid grid-cols-5 mb-4">
                            <TabsTrigger value="biodata"><User className="h-3.5 w-3.5 mr-1" />Biodata</TabsTrigger>
                            <TabsTrigger value="lifecycle"><History className="h-3.5 w-3.5 mr-1" />Karir</TabsTrigger>
                            <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1" />Dokumen</TabsTrigger>
                            <TabsTrigger value="education"><GraduationCap className="h-3.5 w-3.5 mr-1" />Pendidikan</TabsTrigger>
                            <TabsTrigger value="payroll"><Briefcase className="h-3.5 w-3.5 mr-1" />Payroll</TabsTrigger>
                        </TabsList>

                        {/* Biodata */}
                        <TabsContent value="biodata">
                            <Card>
                                <CardHeader><CardTitle>Data Pribadi</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                    {[
                                        { label: 'NIK KTP', value: emp.ktp_number },
                                        { label: 'Tempat Lahir', value: emp.place_of_birth },
                                        { label: 'Tanggal Lahir', value: emp.date_of_birth ? dayjs(emp.date_of_birth).format('DD MMM YYYY') : '-' },
                                        { label: 'Jenis Kelamin', value: emp.gender === 'L' ? 'Laki-laki' : emp.gender === 'P' ? 'Perempuan' : '-' },
                                        { label: 'Status Pernikahan', value: emp.marital_status || '-' },
                                        { label: 'Agama', value: emp.religion || '-' },
                                        { label: 'Golongan Darah', value: emp.blood_type || '-' },
                                        { label: 'Pendidikan', value: emp.education || '-' },
                                    ].map(item => (
                                        <div key={item.label}>
                                            <p className="text-gray-400 mb-1">{item.label}</p>
                                            <p className="text-white font-medium">{item.value || '-'}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                            {emp.emergency_contact_name && (
                                <Card className="mt-4">
                                    <CardHeader><CardTitle className="text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Kontak Darurat</CardTitle></CardHeader>
                                    <CardContent className="grid grid-cols-3 gap-4 text-sm">
                                        <div><p className="text-gray-400">Nama</p><p className="text-white font-medium">{emp.emergency_contact_name}</p></div>
                                        <div><p className="text-gray-400">Telepon</p><p className="text-white font-medium">{emp.emergency_contact_phone || '-'}</p></div>
                                        <div><p className="text-gray-400">Hubungan</p><p className="text-white font-medium">{emp.emergency_contact_relation || '-'}</p></div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Riwayat Karir */}
                        <TabsContent value="lifecycle">
                            <Card>
                                <CardHeader><CardTitle className="flex items-center justify-between">Riwayat Karir</CardTitle></CardHeader>
                                <CardContent>
                                    {profile.lifecycle_history.length === 0 ? (
                                        <p className="text-center text-gray-400 py-8">Belum ada riwayat karir</p>
                                    ) : (
                                        <div className="relative space-y-0">
                                            {profile.lifecycle_history.map((ev, idx) => (
                                                <div key={ev.id} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-3 h-3 rounded-full mt-1 bg-${LIFECYCLE_EVENT_COLORS[ev.event_type] || 'gray'}-400 shrink-0`} />
                                                        {idx < profile.lifecycle_history.length - 1 && <div className="w-0.5 bg-white/10 flex-1 mt-1" />}
                                                    </div>
                                                    <div className="pb-4">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge color={LIFECYCLE_EVENT_COLORS[ev.event_type] as any || 'gray'} size="sm">
                                                                {LIFECYCLE_EVENT_LABELS[ev.event_type] || ev.event_type}
                                                            </Badge>
                                                            <span className="text-xs text-gray-400">{dayjs(ev.effective_date).format('DD MMM YYYY')}</span>
                                                            {ev.document_number && <span className="text-xs text-gray-500 font-mono">{ev.document_number}</span>}
                                                        </div>
                                                        {(ev.from_designation_name || ev.to_designation_name) && (
                                                            <p className="text-sm text-gray-300 mt-1">
                                                                {ev.from_designation_name} → {ev.to_designation_name}
                                                            </p>
                                                        )}
                                                        {ev.notes && <p className="text-xs text-gray-400 mt-1">{ev.notes}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Dokumen */}
                        <TabsContent value="documents">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Dokumen Digital</span>
                                        <Button size="sm" variant="outline" onClick={() => setDocModalOpen(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>Upload Dokumen</Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {profile.documents.length === 0 ? (
                                        <p className="text-center text-gray-400 py-8">Belum ada dokumen</p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {profile.documents.map(doc => (
                                                <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-8 w-8 text-blue-400 shrink-0" />
                                                        <div>
                                                            <p className="font-medium text-white text-sm">{doc.document_name || DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}</p>
                                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                                <Badge color="blue" size="sm">{DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}</Badge>
                                                                {doc.document_number && <span>#{doc.document_number}</span>}
                                                                {doc.expiry_date && (
                                                                    <span className={dayjs(doc.expiry_date).isBefore(dayjs()) ? 'text-red-400' : 'text-green-400'}>
                                                                        Exp: {dayjs(doc.expiry_date).format('DD MMM YYYY')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a href={doc.document_url} target="_blank" rel="noopener noreferrer">
                                                            <Button size="sm" variant="outline">Lihat</Button>
                                                        </a>
                                                        <Button size="sm" variant="outline" color="red" onClick={() => { if (confirm('Hapus dokumen?')) deleteDocMutation.mutate(doc.id); }}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Pendidikan */}
                        <TabsContent value="education">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span>Riwayat Pendidikan</span>
                                        <Button size="sm" variant="outline" onClick={() => setEduModalOpen(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>Tambah</Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {profile.education.length === 0 ? (
                                        <p className="text-center text-gray-400 py-8">Belum ada riwayat pendidikan</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {profile.education.map(edu => (
                                                <div key={edu.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                                                    <div className="flex items-center gap-3">
                                                        <GraduationCap className="h-8 w-8 text-purple-400 shrink-0" />
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium text-white text-sm">{edu.institution_name}</p>
                                                                {edu.is_highest && <Badge color="gold" size="sm">Tertinggi</Badge>}
                                                            </div>
                                                            <p className="text-xs text-gray-400">{edu.level}{edu.major ? ` - ${edu.major}` : ''}</p>
                                                            <p className="text-xs text-gray-500">Lulus: {edu.graduation_year || '-'}{edu.gpa ? ` | IPK: ${edu.gpa}` : ''}</p>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" variant="outline" color="red" onClick={() => { if (confirm('Hapus?')) deleteEduMutation.mutate(edu.id); }}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            {profile.work_experiences.length > 0 && (
                                <Card className="mt-4">
                                    <CardHeader><CardTitle>Pengalaman Kerja Sebelumnya</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {profile.work_experiences.map(we => (
                                                <div key={we.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                                                    <div className="flex justify-between">
                                                        <p className="font-medium text-white text-sm">{we.company_name}</p>
                                                        <span className="text-xs text-gray-400">
                                                            {we.start_date ? dayjs(we.start_date).format('MMM YYYY') : '?'} - {we.end_date ? dayjs(we.end_date).format('MMM YYYY') : 'Sekarang'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400">{we.position || '-'}</p>
                                                    {we.description && <p className="text-xs text-gray-500 mt-1">{we.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        {/* Payroll Info */}
                        <TabsContent value="payroll">
                            <Card>
                                <CardHeader><CardTitle>Informasi Penggajian & BPJS</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                    {[
                                        { label: 'Bank', value: emp.bank_name },
                                        { label: 'No. Rekening', value: emp.bank_account },
                                        { label: 'NPWP', value: emp.npwp },
                                        { label: 'BPJS Kesehatan', value: emp.bpjs_kesehatan },
                                        { label: 'BPJS Ketenagakerjaan', value: emp.bpjs_tenaga_kerja },
                                        { label: 'Gaji Pokok', value: emp.basic_salary ? `Rp ${Number(emp.basic_salary).toLocaleString('id-ID')}` : '-' },
                                        { label: 'Saldo Cuti', value: `${emp.leave_balance || 0} hari` },
                                        { label: 'Cuti Terpakai', value: `${emp.leave_used || 0} hari` },
                                    ].map(item => (
                                        <div key={item.label}>
                                            <p className="text-gray-400 mb-1">{item.label}</p>
                                            <p className="text-white font-medium">{item.value || '-'}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Upload Document Modal */}
            <Modal opened={docModalOpen} onClose={() => setDocModalOpen(false)} title="Upload Dokumen Karyawan" size="md">
                <div className="space-y-4">
                    <Select label="Jenis Dokumen *" value={docForm.document_type} onChange={v => setDocForm(p => ({ ...p, document_type: v }))} options={DOC_TYPE_OPTIONS} />
                    <Input label="Nama Dokumen" value={docForm.document_name} onChange={e => setDocForm(p => ({ ...p, document_name: e.target.value }))} placeholder="cth. KTP - Atas Nama Budi" />
                    <Input label="Nomor Dokumen" value={docForm.document_number} onChange={e => setDocForm(p => ({ ...p, document_number: e.target.value }))} placeholder="cth. 3201234567890001" />
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Upload File *</label>
                        <label className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${docForm.document_url ? 'border-green-500/50 bg-green-500/10' : 'border-white/20 hover:border-white/40'}`}>
                            {docForm.document_url ? <><CheckCircle className="h-5 w-5 text-green-400" /><span className="text-green-400 text-sm">File berhasil diunggah</span></> : <><Upload className="h-5 w-5 text-gray-400" /><span className="text-gray-400 text-sm">{uploading ? 'Mengunggah...' : 'Klik untuk upload file'}</span></>}
                            <input type="file" className="hidden" onChange={handleDocFileUpload} disabled={uploading} />
                        </label>
                    </div>
                    <DateInput label="Tanggal Kedaluarsa (jika ada)" value={docForm.expiry_date} onChange={v => setDocForm(p => ({ ...p, expiry_date: v }))} />
                    <Input label="Catatan" value={docForm.notes} onChange={e => setDocForm(p => ({ ...p, notes: e.target.value }))} />
                    <div className="flex gap-3">
                        <Button variant="filled" color="blue" onClick={handleSubmitDoc} loading={createDocMutation.isPending} className="flex-1">Simpan Dokumen</Button>
                        <Button variant="outline" onClick={() => setDocModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>

            {/* Education Modal */}
            <Modal opened={eduModalOpen} onClose={() => setEduModalOpen(false)} title="Tambah Riwayat Pendidikan" size="md">
                <div className="space-y-4">
                    <Select label="Jenjang Pendidikan *" value={eduForm.level} onChange={v => setEduForm(p => ({ ...p, level: v }))} options={EDU_LEVEL_OPTIONS} />
                    <Input label="Nama Institusi *" value={eduForm.institution_name} onChange={e => setEduForm(p => ({ ...p, institution_name: e.target.value }))} placeholder="cth. Universitas Indonesia" />
                    <Input label="Jurusan / Program Studi" value={eduForm.major} onChange={e => setEduForm(p => ({ ...p, major: e.target.value }))} placeholder="cth. Teknik Mesin" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Tahun Lulus" value={eduForm.graduation_year} onChange={e => setEduForm(p => ({ ...p, graduation_year: e.target.value }))} type="number" placeholder="2020" />
                        <Input label="IPK" value={eduForm.gpa} onChange={e => setEduForm(p => ({ ...p, gpa: e.target.value }))} type="number" step="0.01" placeholder="3.50" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="is_highest" checked={eduForm.is_highest} onChange={e => setEduForm(p => ({ ...p, is_highest: e.target.checked }))} className="w-4 h-4 accent-purple-500" />
                        <label htmlFor="is_highest" className="text-sm text-gray-300">Pendidikan tertinggi</label>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="filled" color="purple" onClick={handleSubmitEdu} loading={createEduMutation.isPending} className="flex-1">Simpan Pendidikan</Button>
                        <Button variant="outline" onClick={() => setEduModalOpen(false)}>Batal</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
