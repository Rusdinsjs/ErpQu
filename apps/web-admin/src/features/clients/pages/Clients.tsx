// Clients Page - Pure Tailwind
import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Eye, Building2, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from'../api/client-management';
import type { Client } from'../api/client-management';
import {
    Button,
    Card,
    Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge,
    ActionIcon,
    Modal,
    Input,
    Select,
    LoadingOverlay,
    useToast,
    SearchInput,
} from'../../../components/ui';

export default function Clients() {
    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortField, setSortField] = useState<'client_code' | 'name' | 'email' | 'is_active'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const [modalOpen, setModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [viewClient, setViewClient] = useState<Client | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        client_code: '',
        company_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        contact_person: '',
        tax_id: '',
        is_active: true,
        notes: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const { data: clientsResponse, isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.list().then((res: any) => res.data),
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Client>) => clientApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            success('Client created successfully', 'Success');
            setModalOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            showError(err.message || 'Failed to create client', 'Error');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: Partial<Client>) => clientApi.update(selectedClient!.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            success('Client status/data updated successfully', 'Success');
            setModalOpen(false);
            setSelectedClient(null);
            resetForm();
        },
        onError: (err: any) => {
            showError(err.message || 'Failed to update client', 'Error');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => clientApi.delete(id),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            const msg = res?.data?.message || 'Client deleted successfully';
            success(msg, 'Success');
        },
        onError: (err: any) => {
            showError(err.message || 'Failed to delete client', 'Error');
        }
    });

    const handleDelete = (client: Client) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus permanen client "${client.name}"?`)) {
            deleteMutation.mutate(client.id);
        }
    };

    const handleView = (client: Client) => {
        setViewClient(client);
        setViewModalOpen(true);
    };

    const handleToggleStatus = (client: Client) => {
        const nextState = !client.is_active;
        if (window.confirm(`Ubah status client "${client.name}" menjadi ${nextState ? 'ACTIVE' : 'INACTIVE'}?`)) {
            setSelectedClient(client);
            updateMutation.mutate({
                ...client,
                is_active: nextState,
            });
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            client_code: '',
            company_name: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            contact_person: '',
            tax_id: '',
            is_active: true,
            notes: '',
        });
        setErrors({});
    };

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setFormData({
            name: client.name,
            client_code: client.client_code,
            company_name: client.company_name || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            city: client.city || '',
            contact_person: client.contact_person || '',
            tax_id: client.tax_id || '',
            is_active: client.is_active ?? true,
            notes: client.notes || '',
        });
        setModalOpen(true);
    };

    const openCreateModal = () => {
        setSelectedClient(null);
        resetForm();
        setModalOpen(true);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (formData.name.length < 2) newErrors.name = 'Name must have at least 2 characters';
        if (formData.client_code.length < 2) newErrors.client_code = 'Code must have at least 2 characters';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        if (selectedClient) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleSort = (field: 'client_code' | 'name' | 'email' | 'is_active') => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const clientList: Client[] = Array.isArray(clientsResponse)
        ? clientsResponse
        : Array.isArray(clientsResponse?.data)
        ? clientsResponse.data
        : Array.isArray(clientsResponse?.data?.data)
        ? clientsResponse.data.data
        : Array.isArray(clientsResponse?.items)
        ? clientsResponse.items
        : [];

    const filteredClients = useMemo(() => {
        return clientList.filter((c: any) => {
            if (search.trim()) {
                const query = search.toLowerCase().trim();
                const matches = (c.name || '').toLowerCase().includes(query) ||
                    (c.client_code || '').toLowerCase().includes(query) ||
                    (c.company_name || '').toLowerCase().includes(query) ||
                    (c.email || '').toLowerCase().includes(query);
                if (!matches) return false;
            }

            if (statusFilter === 'active' && !c.is_active) return false;
            if (statusFilter === 'inactive' && c.is_active) return false;

            return true;
        }).sort((a: any, b: any) => {
            let valA = a[sortField] ?? '';
            let valB = b[sortField] ?? '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [clientList, search, statusFilter, sortField, sortDirection]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Client Management</h1>
                    <p className="text-xs text-muted-foreground">Kelola daftar pelanggan & mitra bisnis</p>
                </div>
                <Button leftIcon={<Plus size={16} />} onClick={openCreateModal}>
                    Add Client
                </Button>
            </div>

            <Card padding="lg">
                {/* Search and Filters */}
                <div className="mb-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                    <div className="relative max-w-md flex-1">
                        <SearchInput
                            value={search}
                            onChange={setSearch}
                            placeholder="Search by name, code or company..."
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-primary" />
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'active', label: 'Active Only' },
                                { value: 'inactive', label: 'Inactive Only' },
                            ]}
                            className="w-40 text-xs"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="relative">
                    <LoadingOverlay visible={isLoading} />
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh onClick={() => handleSort('client_code')} className="cursor-pointer hover:text-white transition-colors">
                                    <div className="flex items-center gap-1.5">
                                        <span>Code</span>
                                        {sortField === 'client_code' ? (
                                            sortDirection === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />
                                        ) : (
                                            <ArrowUpDown size={12} className="opacity-40" />
                                        )}
                                    </div>
                                </TableTh>
                                <TableTh onClick={() => handleSort('name')} className="cursor-pointer hover:text-white transition-colors">
                                    <div className="flex items-center gap-1.5">
                                        <span>Name / Company</span>
                                        {sortField === 'name' ? (
                                            sortDirection === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />
                                        ) : (
                                            <ArrowUpDown size={12} className="opacity-40" />
                                        )}
                                    </div>
                                </TableTh>
                                <TableTh onClick={() => handleSort('email')} className="cursor-pointer hover:text-white transition-colors">
                                    <div className="flex items-center gap-1.5">
                                        <span>Contact</span>
                                        {sortField === 'email' ? (
                                            sortDirection === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />
                                        ) : (
                                            <ArrowUpDown size={12} className="opacity-40" />
                                        )}
                                    </div>
                                </TableTh>
                                <TableTh onClick={() => handleSort('is_active')} className="cursor-pointer hover:text-white transition-colors">
                                    <div className="flex items-center gap-1.5">
                                        <span>Status</span>
                                        {sortField === 'is_active' ? (
                                            sortDirection === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />
                                        ) : (
                                            <ArrowUpDown size={12} className="opacity-40" />
                                        )}
                                    </div>
                                </TableTh>
                                <TableTh align="center">Actions</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredClients.length > 0 ? filteredClients.map((client: any) => (
                                <TableRow key={client.id}>
                                    <TableTd>
                                        <Badge variant="default" className="font-mono">{client.client_code}</Badge>
                                    </TableTd>
                                    <TableTd>
                                        <div>
                                            <p className="font-medium text-white">{client.name}</p>
                                            <p className="text-xs text-muted-foreground">{client.company_name}</p>
                                        </div>
                                    </TableTd>
                                    <TableTd>
                                        <div>
                                            <p className="text-sm text-slate-300">{client.email || '-'}</p>
                                            <p className="text-xs text-muted-foreground">{client.phone || '-'}</p>
                                        </div>
                                    </TableTd>
                                    <TableTd>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(client)}
                                            title="Klik untuk mengubah status Active / Inactive"
                                            className="cursor-pointer transition-transform hover:scale-105"
                                        >
                                            <Badge variant={client.is_active ? 'success' : 'default'} className={client.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-muted-foreground border-slate-700'}>
                                                {client.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </button>
                                    </TableTd>
                                    <TableTd align="center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <ActionIcon onClick={() => handleView(client)} title="View Detail">
                                                <Eye size={16} className="text-cyan-400" />
                                            </ActionIcon>
                                            <ActionIcon onClick={() => handleEdit(client)} title="Edit">
                                                <Edit size={16} className="text-amber-400" />
                                            </ActionIcon>
                                            <ActionIcon variant="danger" title="Delete" onClick={() => handleDelete(client)}>
                                                <Trash2 size={16} className="text-rose-400" />
                                            </ActionIcon>
                                        </div>
                                    </TableTd>
                                </TableRow>
                            )) : (
                                <TableEmpty colSpan={5} message="No clients found" />
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* View Client Modal */}
            <Modal
                isOpen={viewModalOpen}
                onClose={() => setViewModalOpen(false)}
                title="Client Details"
                size="lg"
            >
                {viewClient && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                            <div className="p-3 bg-cyan-500/10 rounded-xl">
                                <Building2 size={24} className="text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{viewClient.name}</h3>
                                <p className="text-xs font-mono text-cyan-400">{viewClient.client_code}</p>
                            </div>
                            <div className="ml-auto">
                                <Badge variant={viewClient.is_active ? 'success' : 'default'}>
                                    {viewClient.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Company Name</p>
                                <p className="text-white font-medium mt-1">{viewClient.company_name || '-'}</p>
                            </div>
                            <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Contact Person</p>
                                <p className="text-white font-medium mt-1">{viewClient.contact_person || '-'}</p>
                            </div>
                            <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Email</p>
                                <p className="text-cyan-300 font-mono text-xs mt-1">{viewClient.email || '-'}</p>
                            </div>
                            <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Phone</p>
                                <p className="text-slate-300 font-mono text-xs mt-1">{viewClient.phone || '-'}</p>
                            </div>
                            <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Tax ID / NPWP</p>
                                <p className="text-slate-300 font-mono text-xs mt-1">{viewClient.tax_id || '-'}</p>
                            </div>
                            <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">City</p>
                                <p className="text-white font-medium mt-1">{viewClient.city || '-'}</p>
                            </div>
                        </div>

                        {viewClient.address && (
                            <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Address</p>
                                <p className="text-slate-300 text-sm mt-1">{viewClient.address}</p>
                            </div>
                        )}

                        {viewClient.notes && (
                            <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80">
                                <p className="text-xs text-muted-foreground uppercase font-semibold">Notes</p>
                                <p className="text-slate-300 text-sm mt-1">{viewClient.notes}</p>
                            </div>
                        )}

                        <div className="flex justify-end pt-2">
                            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={selectedClient ? 'Edit Client' : 'Add New Client'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Client Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={errors.name}
                            required
                        />
                        <Input
                            label="Client Code"
                            value={formData.client_code}
                            onChange={(e) => setFormData({ ...formData, client_code: e.target.value })}
                            error={errors.client_code}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Company Name"
                            value={formData.company_name}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        />
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Status Client</label>
                            <select
                                value={formData.is_active ? 'active' : 'inactive'}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                                className="w-full px-3 py-2.5 bg-slate-950/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 outline-none transition-all text-sm"
                            >
                                <option value="active">Active (Aktif)</option>
                                <option value="inactive">Inactive (Non-Aktif)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <Input
                            label="Phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                    <Input
                        label="Contact Person"
                        value={formData.contact_person}
                        onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    />
                    <Input
                        label="Tax ID (NPWP)"
                        value={formData.tax_id}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    />
                    <Input
                        label="Address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <Input
                        label="City"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                    <Input
                        label="Notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        loading={createMutation.isPending || updateMutation.isPending}
                    >
                        {selectedClient ? 'Update Client' : 'Create Client'}
                    </Button>
                </form>
            </Modal>
        </div>
    );
};
