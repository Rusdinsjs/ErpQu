import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Home, Plus, Trash2, Layers, 
    Info, Search, MapPin, Box, Loader2, ChevronRight, X
} from 'lucide-react';
import { inventoryApi } from'../api/inventory';
import { fetchCompanies } from'../../company/api/companyApi';
import { useToast } from'../../../components/ui/Toast';
import { Input } from'../../../components/ui/Input';
import { Button } from'../../../components/ui/Button';

export default function Warehouses() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState<any | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'bins'>('info');
    
    // Warehouse creation state
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [whCode, setWhCode] = useState('');
    const [whName, setWhName] = useState('');
    const [whType, setWhType] = useState('DEFAULT');
    const [whCompanyId, setWhCompanyId] = useState('');
    const [whIsGroup, setWhIsGroup] = useState(false);

    // Bin creation state
    const [binModalOpen, setBinModalOpen] = useState(false);
    const [binCode, setBinCode] = useState('');
    const [binDescription, setBinDescription] = useState('');
    
    // Selected bin balance state
    const [selectedBin, setSelectedBin] = useState<any | null>(null);

    const queryClient = useQueryClient();
    const { success, error: showError } = useToast();

    // Fetch active companies
    const { data: companiesRes } = useQuery({
        queryKey: ['companies-list-active'],
        queryFn: () => fetchCompanies({ status: 'ACTIVE' }),
    });
    const companies = companiesRes?.data || [];

    // Create Warehouse Mutation
    const createWarehouseMutation = useMutation({
        mutationFn: inventoryApi.createWarehouse,
        onSuccess: () => {
            success('Warehouse created successfully');
            setWhCode('');
            setWhName('');
            setWhType('DEFAULT');
            setWhCompanyId('');
            setWhIsGroup(false);
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to create warehouse');
        }
    });

    // Delete Warehouse Mutation
    const deleteWarehouseMutation = useMutation({
        mutationFn: inventoryApi.deleteWarehouse,
        onSuccess: () => {
            success('Warehouse deleted successfully');
            setSelectedWarehouse(null);
            setSelectedBin(null);
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to delete warehouse');
        }
    });

    // Fetch Warehouses
    const { data: warehouses = [], isLoading: whsLoading } = useQuery({
        queryKey: ['warehouses'],
        queryFn: inventoryApi.listWarehouses
    });

    // Fetch Bins for selected warehouse
    const bins = warehouses.filter((wh: any) => wh.parent_id === selectedWarehouse?.id && !wh.is_group);
    const binsLoading = whsLoading;

    // Fetch Balances for selected bin
    const { data: balances = [], isLoading: balancesLoading } = useQuery({
        queryKey: ['bin-balances', selectedBin?.id],
        queryFn: () => inventoryApi.listBinBalances(selectedBin.id),
        enabled: !!selectedBin?.id
    });

    // Create Bin Mutation
    const createBinMutation = useMutation({
        mutationFn: inventoryApi.createWarehouse,
        onSuccess: () => {
            success('Bin location created successfully');
            setBinCode('');
            setBinDescription('');
            setBinModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to create bin location');
        }
    });

    // Delete Bin Mutation
    const deleteBinMutation = useMutation({
        mutationFn: inventoryApi.deleteWarehouse,
        onSuccess: () => {
            success('Bin location deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
        },
        onError: (err: any) => {
            showError(err.response?.data?.message || 'Failed to delete bin location');
        }
    });

    const handleCreateWarehouse = (e: React.FormEvent) => {
        e.preventDefault();
        if (!whCode.trim() || !whName.trim() || !whCompanyId) return;
        createWarehouseMutation.mutate({
            company_id: whCompanyId,
            code: whCode,
            name: whName,
            warehouse_type: whType,
            is_group: whIsGroup,
            parent_id: null
        });
    };

    const handleCreateBin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!binCode.trim()) return;
        createBinMutation.mutate({
            company_id: selectedWarehouse.company_id,
            parent_id: selectedWarehouse.id,
            code: binCode,
            name: binDescription || binCode,
            is_group: false,
            warehouse_type: 'BIN',
            is_active: true
        });
    };

    const handleDeleteBin = (binId: string) => {
        if (window.confirm('Are you sure you want to delete this bin location?')) {
            deleteBinMutation.mutate(binId);
        }
    };

    const filteredWhs = warehouses.filter((wh: any) => 
        wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wh.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-full min-h-[calc(100vh-4rem)] bg-background text-foreground">
            {/* Left Panel: Warehouses List */}
            <div className={`flex-1 flex flex-col p-6 transition-all duration-300 ${selectedWarehouse ? 'max-w-[45%]' : 'w-full'}`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Warehouses</h1>
                        <p className="text-muted-foreground text-sm">Manage physical store locations and layout</p>
                    </div>
                    <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add Warehouse
                    </Button>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search warehouses..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>

                {whsLoading ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground mt-2">Loading warehouses...</span>
                    </div>
                ) : filteredWhs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 border border-dashed rounded-lg py-20">
                        <Home className="h-10 w-10 text-muted-foreground mb-4" />
                        <span className="text-sm font-semibold">No warehouses found</span>
                        <span className="text-xs text-muted-foreground">Try altering your search term</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[calc(100vh-16rem)] pr-2">
                        {filteredWhs.map((wh: any) => (
                            <div
                                key={wh.id}
                                onClick={() => {
                                    setSelectedWarehouse(wh);
                                    setActiveDetailTab('info');
                                    setSelectedBin(null);
                                }}
                                className={`p-4 border rounded-xl cursor-pointer transition-all hover:bg-accent/40 ${
                                    selectedWarehouse?.id === wh.id 
                                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' 
                                        : 'border-border bg-card'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <Home className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm">{wh.name}</h3>
                                            <span className="text-xs text-muted-foreground uppercase">{wh.code}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Panel: Selected Warehouse Detail */}
            {selectedWarehouse && (
                <div className="w-[55%] border-l border-border bg-card flex flex-col h-[calc(100vh-4rem)] animate-in slide-in-from-right duration-300">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-accent/20">
                        <div className="flex items-center space-x-3">
                            <Home className="h-5 w-5 text-primary" />
                            <div>
                                <h2 className="text-lg font-bold">{selectedWarehouse.name}</h2>
                                <p className="text-xs text-muted-foreground uppercase">{selectedWarehouse.code}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete warehouse "${selectedWarehouse.name}"?`)) {
                                        deleteWarehouseMutation.mutate(selectedWarehouse.id);
                                    }
                                }}
                                className="p-1.5 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-muted-foreground transition-all"
                                title="Delete Warehouse"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={() => {
                                    setSelectedWarehouse(null);
                                    setSelectedBin(null);
                                }}
                                className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground transition-all"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex border-b border-border text-sm">
                        <button
                            onClick={() => setActiveDetailTab('info')}
                            className={`flex-1 py-3 font-medium border-b-2 text-center transition-all ${
                                activeDetailTab === 'info' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <Info className="h-4 w-4" />
                                <span>Information</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveDetailTab('bins')}
                            className={`flex-1 py-3 font-medium border-b-2 text-center transition-all ${
                                activeDetailTab === 'bins' 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <Layers className="h-4 w-4" />
                                <span>Bins & Racks</span>
                            </div>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeDetailTab === 'info' ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-accent/20 rounded-xl">
                                        <span className="text-xs text-muted-foreground block uppercase font-bold">Type</span>
                                        <span className="font-semibold mt-1 block text-sm">{selectedWarehouse.warehouse_type}</span>
                                    </div>
                                    <div className="p-4 bg-accent/20 rounded-xl">
                                        <span className="text-xs text-muted-foreground block uppercase font-bold">Group Warehouse</span>
                                        <span className="font-semibold mt-1 block text-sm">
                                            {selectedWarehouse.is_group ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-accent/20 rounded-xl">
                                        <span className="text-xs text-muted-foreground block uppercase font-bold">Status</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                            selectedWarehouse.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                        }`}>
                                            {selectedWarehouse.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="p-4 bg-accent/20 rounded-xl">
                                        <span className="text-xs text-muted-foreground block uppercase font-bold">Frozen Stock</span>
                                        <span className="font-semibold mt-1 block text-sm">
                                            {selectedWarehouse.is_frozen ? 'Yes (Frozen)' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm text-muted-foreground">Rack Layout Locations</h3>
                                    <Button size="sm" onClick={() => setBinModalOpen(true)}>
                                        <Plus className="h-4 w-4 mr-1.5" />
                                        Add Bin
                                    </Button>
                                </div>

                                {binsLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : bins.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center border border-dashed rounded-xl py-12">
                                        <MapPin className="h-8 w-8 text-muted-foreground mb-2" />
                                        <span className="text-sm font-semibold">No bins defined yet</span>
                                        <span className="text-xs text-muted-foreground mt-1">Specify row/rack locations for picking layout</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {bins.map((bin: any) => (
                                            <div
                                                key={bin.id}
                                                onClick={() => setSelectedBin(bin)}
                                                className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                                                    selectedBin?.id === bin.id 
                                                        ? 'border-primary bg-primary/5' 
                                                        : 'border-border bg-accent/10 hover:bg-accent/20'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Box className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <span className="font-semibold text-sm block">{bin.code}</span>
                                                        {bin.name && bin.name !== bin.code && <span className="text-[10px] text-muted-foreground block truncate max-w-[120px]">{bin.name}</span>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteBin(bin.id);
                                                    }}
                                                    className="p-1 hover:bg-red-500/10 hover:text-red-400 rounded text-muted-foreground"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Drawer Bottom: Bin stock list when selected */}
                    {selectedBin && (
                        <div className="border-t border-border bg-accent/20 p-6 animate-in slide-in-from-bottom duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <Box className="h-5 w-5 text-primary" />
                                    <div>
                                        <h4 className="font-semibold text-sm">Bin Stock: {selectedBin.code}</h4>
                                        <p className="text-xs text-muted-foreground">Current items located at this rack space</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedBin(null)}
                                    className="p-1 hover:bg-accent rounded text-muted-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            {balancesLoading ? (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                            ) : balances.length === 0 ? (
                                <p className="text-center text-xs text-muted-foreground py-6">Bin is currently empty (0 items)</p>
                            ) : (
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {balances.map((bal: any) => (
                                        <div key={bal.id} className="flex justify-between items-center bg-card border border-border p-2.5 rounded-lg text-xs">
                                            <span className="font-medium text-foreground">Item ID: {bal.item_id}</span>
                                            <span className="font-semibold text-primary">{parseFloat(bal.actual_qty).toLocaleString()} units</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Modal: Create Bin Location */}
            {binModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md border border-border bg-card p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add Bin Location</h3>
                            <button onClick={() => setBinModalOpen(false)} className="p-1 hover:bg-accent rounded-lg">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateBin} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Bin Code Location</label>
                                <Input
                                    placeholder="e.g. AISLE1-RACK3-S2"
                                    value={binCode}
                                    onChange={e => setBinCode(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Description / Coordinate Notes</label>
                                <Input
                                    placeholder="e.g. Shelf level 2, center rack"
                                    value={binDescription}
                                    onChange={e => setBinDescription(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setBinModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createBinMutation.isPending}>
                                    {createBinMutation.isPending ? 'Creating...' : 'Create Bin'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal: Create Warehouse */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md border border-border bg-card p-6 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add Warehouse</h3>
                            <button onClick={() => setCreateModalOpen(false)} className="p-1 hover:bg-accent rounded-lg">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateWarehouse} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Subsidiary Company</label>
                                <select
                                    value={whCompanyId}
                                    onChange={e => setWhCompanyId(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    <option value="">Select Company...</option>
                                    {companies.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Warehouse Code</label>
                                <Input
                                    placeholder="e.g. WH-RENT-BALIKPAPAN"
                                    value={whCode}
                                    onChange={e => setWhCode(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Warehouse Name</label>
                                <Input
                                    placeholder="e.g. Balikpapan Fleet Yard"
                                    value={whName}
                                    onChange={e => setWhName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Warehouse Type</label>
                                <select
                                    value={whType}
                                    onChange={e => setWhType(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    <option value="DEFAULT">Default Store</option>
                                    <option value="PICKING">Picking Area</option>
                                    <option value="TRANSIT">Transit / Shipping</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-2 py-1">
                                <input
                                    type="checkbox"
                                    id="whIsGroup"
                                    checked={whIsGroup}
                                    onChange={e => setWhIsGroup(e.target.checked)}
                                    className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                />
                                <label htmlFor="whIsGroup" className="text-xs font-semibold text-muted-foreground uppercase cursor-pointer select-none">
                                    Is Group Warehouse (Can contain children)
                                </label>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createWarehouseMutation.isPending}>
                                    {createWarehouseMutation.isPending ? 'Creating...' : 'Create Warehouse'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
