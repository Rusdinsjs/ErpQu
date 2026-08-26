import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Search, Briefcase, Building2 } from 'lucide-react';
import { hrDesignationApi, type HrDesignation } from'../api/hr-lifecycle';
import { api } from'../../../api/http';
import {
    Button, Card, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge, ActionIcon, Modal, Input, Select, useToast, LoadingOverlay,
} from'../../../components/ui';

interface Department {
    id: string;
    name: string;
    code: string;
}

export default function DesignationsView() {
    const qc = useQueryClient();
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState('');
    const [selectedDept, setSelectedDept] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<HrDesignation | null>(null);
    const [form, setForm] = useState({
        name: '',
        code: '',
        description: '',
        grade: '',
        department_id: '',
        is_manager: false,
    });

    const { data: designations = [], isLoading } = useQuery({
        queryKey: ['hr-designations'],
        queryFn: hrDesignationApi.list,
    });

    const { data: departments = [] } = useQuery({
        queryKey: ['departments'],
        queryFn: async () => {
            const res = await api.get('/departments');
            return Array.isArray(res.data) ? res.data : (res.data?.data || []);
        },
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => hrDesignationApi.create({
            ...data,
            department_id: data.department_id || undefined,
        }),
        onSuccess: () => {
            success('Jabatan berhasil dibuat');
            qc.invalidateQueries({ queryKey: ['hr-designations'] });
            setModalOpen(false);
            resetForm();
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal membuat jabatan'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => hrDesignationApi.update(id, {
            ...data,
            department_id: data.department_id || null,
        }),
        onSuccess: () => {
            success('Jabatan berhasil diperbarui');
            qc.invalidateQueries({ queryKey: ['hr-designations'] });
            setModalOpen(false);
            resetForm();
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal memperbarui jabatan'),
    });

    const deleteMutation = useMutation({
        mutationFn: hrDesignationApi.delete,
        onSuccess: () => {
            success('Jabatan berhasil dihapus');
            qc.invalidateQueries({ queryKey: ['hr-designations'] });
        },
        onError: (e: any) => showError(e.response?.data?.message || 'Gagal menghapus jabatan'),
    });

    const resetForm = () => {
        setForm({ name: '', code: '', description: '', grade: '', department_id: '', is_manager: false });
        setEditing(null);
    };

    const openCreate = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEdit = (d: HrDesignation) => {
        setEditing(d);
        setForm({
            name: d.name,
            code: d.code || '',
            description: d.description || '',
            grade: d.grade || '',
            department_id: d.department_id || '',
            is_manager: d.is_manager,
        });
        setModalOpen(true);
    };

    const handleSubmit = () => {
        if (!form.name) { showError('Nama jabatan wajib diisi'); return; }
        if (editing) {
            updateMutation.mutate({ id: editing.id, data: form });
        } else {
            createMutation.mutate(form);
        }
    };

    const filtered = designations.filter(d => {
        const matchesSearch =
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            (d.code || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.department_name || '').toLowerCase().includes(search.toLowerCase());
        const matchesDept = !selectedDept || d.department_id === selectedDept;
        return matchesSearch && matchesDept;
    });

    const gradeOptions = [
        { value: '', label: 'Semua Grade' },
        { value: 'G1', label: 'G1 - Staff Junior' },
        { value: 'G2', label: 'G2 - Staff Senior' },
        { value: 'G3', label: 'G3 - Officer' },
        { value: 'G4', label: 'G4 - Supervisor' },
        { value: 'G5', label: 'G5 - Manager' },
        { value: 'G6', label: 'G6 - General Manager' },
        { value: 'G7', label: 'G7 - Director' },
    ];

    const departmentOptions = [
        { value: '', label: 'Pilih Departemen (Semua / Umum)' },
        ...(Array.isArray(departments) ? departments : []).map((dept: Department) => ({
            value: dept.id,
            label: dept.name,
        })),
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-purple-400" />
                        Master Jabatan
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Kelola jabatan, grade, dan keterkaitannya dengan Departemen Organisasi</p>
                </div>
                <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />} variant="filled" color="purple">
                    Tambah Jabatan
                </Button>
            </div>

            <Card>
                <div className="p-4 border-b border-white/10 flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="Cari jabatan atau departemen..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        leftIcon={<Search className="h-4 w-4" />}
                        className="max-w-xs"
                    />
                    <div className="w-64">
                        <Select
                            value={selectedDept}
                            onChange={v => setSelectedDept(v)}
                            options={departmentOptions}
                        />
                    </div>
                </div>

                <div className="relative">
                    {isLoading && <LoadingOverlay />}
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Nama Jabatan</TableTh>
                                <TableTh>Kode</TableTh>
                                <TableTh>Departemen (Organization)</TableTh>
                                <TableTh>Grade</TableTh>
                                <TableTh>Tipe</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh className="text-right">Aksi</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableEmpty colSpan={7} message="Belum ada data jabatan" />
                            ) : filtered.map(d => (
                                <TableRow key={d.id}>
                                    <TableTd className="font-medium text-white">{d.name}</TableTd>
                                    <TableTd><span className="font-mono text-xs bg-white/10 px-2 py-1 rounded">{d.code || '-'}</span></TableTd>
                                    <TableTd>
                                        {d.department_name ? (
                                            <span className="flex items-center gap-1.5 text-sm text-purple-300 font-medium">
                                                <Building2 className="h-3.5 w-3.5 text-purple-400" />
                                                {d.department_name}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-500">Umum / Semua Divisi</span>
                                        )}
                                    </TableTd>
                                    <TableTd><Badge color="yellow">{d.grade || '-'}</Badge></TableTd>
                                    <TableTd>
                                        <Badge color={d.is_manager ? 'blue' : 'gray'}>
                                            {d.is_manager ? 'Manajerial' : 'Non-Manajerial'}
                                        </Badge>
                                    </TableTd>
                                    <TableTd>
                                        <Badge color={d.is_active ? 'green' : 'red'}>
                                            {d.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </TableTd>
                                    <TableTd className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <ActionIcon onClick={() => openEdit(d)} title="Edit"><Edit className="h-4 w-4" /></ActionIcon>
                                            <ActionIcon onClick={() => { if (confirm('Hapus jabatan ini?')) deleteMutation.mutate(d.id); }} title="Hapus" color="red"><Trash2 className="h-4 w-4" /></ActionIcon>
                                        </div>
                                    </TableTd>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            <Modal isOpen={modalOpen} opened={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title={editing ? 'Edit Jabatan' : 'Tambah Jabatan'} size="md">
                <div className="space-y-4">
                    <Input label="Nama Jabatan *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="cth. Operator Alat Berat" />
                    <Input label="Kode Jabatan" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="cth. OAB-01" />
                    
                    <Select
                        label="Departemen (Modul Organization)"
                        value={form.department_id}
                        onChange={v => setForm(p => ({ ...p, department_id: v }))}
                        options={departmentOptions}
                    />

                    <Select
                        label="Grade Jabatan"
                        value={form.grade}
                        onChange={v => setForm(p => ({ ...p, grade: v }))}
                        options={gradeOptions}
                    />
                    <Input label="Deskripsi" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Deskripsi tugas jabatan..." />
                    
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="is_manager"
                            checked={form.is_manager}
                            onChange={e => setForm(p => ({ ...p, is_manager: e.target.checked }))}
                            className="w-4 h-4 accent-purple-500"
                        />
                        <label htmlFor="is_manager" className="text-sm text-gray-300">Jabatan Manajerial (memiliki bawahan)</label>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                        <Button variant="filled" color="purple" onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending} className="flex-1">
                            {editing ? 'Simpan Perubahan' : 'Tambah Jabatan'}
                        </Button>
                        <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Batal</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
