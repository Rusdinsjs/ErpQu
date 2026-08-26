// Locations Page - ERPNext Geolocation & Interactive OpenStreetMap Pin
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Search, MapPin, Globe, Compass, ExternalLink, Eye, Settings, RotateCcw } from 'lucide-react';
import { locationApi, type Location } from'../api/locations';
import {
    Button,
    Card,
    Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty,
    Badge,
    ActionIcon,
    Modal,
    Input,
    Select,
    NumberInput,
    LoadingOverlay,
    useToast,
} from'../../../components/ui';

interface ExtendedLocationForm {
    code: string;
    name: string;
    location_type: string;
    address: string;
    parent_id: string | null;
    capacity?: number;
    latitude: string;
    longitude: string;
}

interface LocationPreset {
    id: string;
    label: string;
    lat: string;
    lng: string;
}

const initialFormState: ExtendedLocationForm = {
    code: '',
    name: '',
    location_type: 'other',
    address: '',
    parent_id: null,
    capacity: undefined,
    latitude: '-6.2088',
    longitude: '106.8456',
};

// Default ERPNext Indonesian City Coordinates Presets
const DEFAULT_PRESETS: LocationPreset[] = [
    { id: 'p1', label: 'Jakarta Pusat (Head Office)', lat: '-6.1754', lng: '106.8272' },
    { id: 'p2', label: 'Surabaya (Cabang Jawa Timur)', lat: '-7.2575', lng: '112.7521' },
    { id: 'p3', label: 'Bandung (Depot Jawa Barat)', lat: '-6.9175', lng: '107.6191' },
    { id: 'p4', label: 'Medan (Pabrik Sumatera)', lat: '3.5952', lng: '98.6722' },
    { id: 'p5', label: 'Denpasar (Hub Bali & Nusa Tenggara)', lat: '-8.6705', lng: '115.2126' },
];

export default function Locations() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [mapPreviewModal, setMapPreviewModal] = useState<Location | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [formData, setFormData] = useState<ExtendedLocationForm>(initialFormState);

    // Custom Location Presets State (Persisted in localStorage)
    const [presets, setPresets] = useState<LocationPreset[]>(() => {
        try {
            const saved = localStorage.getItem('erpqu_custom_location_presets');
            return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
        } catch {
            return DEFAULT_PRESETS;
        }
    });

    const [isManagingPresets, setIsManagingPresets] = useState(false);
    const [presetForm, setPresetForm] = useState<{ label: string; lat: string; lng: string }>({
        label: '',
        lat: '-6.2088',
        lng: '106.8456',
    });
    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);

    const { success, error: showError } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await locationApi.list();
            setLocations(data);
        } catch (err: any) {
            showError('Failed to load locations', err?.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Helper to persist custom presets
    const savePresetsToStorage = (newPresets: LocationPreset[]) => {
        setPresets(newPresets);
        try {
            localStorage.setItem('erpqu_custom_location_presets', JSON.stringify(newPresets));
        } catch (e) {
            console.error('Failed to save presets to localStorage', e);
        }
    };

    const handleSavePreset = () => {
        if (!presetForm.label || !presetForm.lat || !presetForm.lng) {
            showError('Validasi Gagal', 'Nama preset, latitude, dan longitude wajib diisi');
            return;
        }

        if (editingPresetId) {
            const updated = presets.map(p =>
                p.id === editingPresetId ? { ...p, label: presetForm.label, lat: presetForm.lat, lng: presetForm.lng } : p
            );
            savePresetsToStorage(updated);
            success('Berhasil', 'Preset koordinat berhasil diperbarui');
        } else {
            const newPreset: LocationPreset = {
                id: `p_${Date.now()}`,
                label: presetForm.label,
                lat: presetForm.lat,
                lng: presetForm.lng,
            };
            savePresetsToStorage([...presets, newPreset]);
            success('Berhasil', 'Preset koordinat baru berhasil ditambahkan');
        }

        setEditingPresetId(null);
        setPresetForm({ label: '', lat: formData.latitude || '-6.2088', lng: formData.longitude || '106.8456' });
    };

    const handleDeletePreset = (id: string) => {
        if (presets.length <= 1) {
            showError('Perhatian', 'Minimal harus ada 1 preset tersimpan');
            return;
        }
        const updated = presets.filter(p => p.id !== id);
        savePresetsToStorage(updated);
        success('Berhasil', 'Preset koordinat dihapus');
        if (editingPresetId === id) {
            setEditingPresetId(null);
            setPresetForm({ label: '', lat: '-6.2088', lng: '106.8456' });
        }
    };

    const handleResetDefaultPresets = () => {
        savePresetsToStorage(DEFAULT_PRESETS);
        success('Berhasil', 'Preset dikembalikan ke default');
    };

    const handleCreate = async () => {
        if (!formData.code || !formData.name) {
            showError('Validation Error', 'Code and Name are required');
            return;
        }

        setSubmitting(true);
        try {
            await locationApi.create({
                code: formData.code,
                name: formData.name,
                location_type: formData.location_type,
                address: `${formData.address}${formData.latitude && formData.longitude ? ` [Geo: ${formData.latitude}, ${formData.longitude}]` : ''}`,
                parent_id: formData.parent_id,
                capacity: formData.capacity,
            });
            success('Success', 'Location created successfully');
            setModalOpen(false);
            setIsManagingPresets(false);
            loadData();
        } catch (err: any) {
            showError('Failed to create location', err?.message || 'Error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingLocation) return;

        setSubmitting(true);
        try {
            await locationApi.update(editingLocation.id, {
                code: formData.code,
                name: formData.name,
                location_type: formData.location_type,
                address: `${formData.address}${formData.latitude && formData.longitude ? ` [Geo: ${formData.latitude}, ${formData.longitude}]` : ''}`,
                parent_id: formData.parent_id,
                capacity: formData.capacity,
            });
            success('Success', 'Location updated successfully');
            setModalOpen(false);
            setIsManagingPresets(false);
            loadData();
        } catch (err: any) {
            showError('Failed to update location', err?.message || 'Error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (location: Location) => {
        if (!confirm(`Are you sure you want to delete "${location.name}"?`)) return;

        try {
            await locationApi.delete(location.id);
            success('Success', 'Location deleted');
            loadData();
        } catch (err: any) {
            showError('Failed to delete location', err?.message || 'Error occurred');
        }
    };

    const openCreateModal = () => {
        setEditingLocation(null);
        setIsEditing(false);
        setFormData(initialFormState);
        setIsManagingPresets(false);
        setModalOpen(true);
    };

    const openEditModal = (location: any) => {
        setEditingLocation(location);
        setIsEditing(true);
        setIsManagingPresets(false);

        // Extract coordinates if present
        let lat = '-6.2088';
        let lng = '106.8456';
        if (location.latitude && location.longitude) {
            lat = location.latitude;
            lng = location.longitude;
        } else if (location.address && location.address.includes('[Geo:')) {
            const match = location.address.match(/\[Geo:\s*([-\d.]+),\s*([-\d.]+)\]/);
            if (match) {
                lat = match[1];
                lng = match[2];
            }
        }

        setFormData({
            code: location.code,
            name: location.name,
            location_type: location.location_type || 'other',
            address: location.address ? location.address.replace(/\s*\[Geo:.*\]/, '') : '',
            parent_id: location.parent_id || null,
            capacity: location.capacity || undefined,
            latitude: lat,
            longitude: lng,
        });
        setModalOpen(true);
    };

    const getTypeBadge = (type: string): 'info' | 'success' | 'warning' | 'default' => {
        switch (type.toLowerCase()) {
            case 'building':
            case 'city': return 'info';
            case 'floor':
            case 'room': return 'success';
            case 'rack':
            case 'zone': return 'warning';
            default: return 'default';
        }
    };

    const filteredLocations = locations.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.code.toLowerCase().includes(search.toLowerCase())
    );

    const parentOptions = locations
        .filter(l => !editingLocation || l.id !== editingLocation.id)
        .map(l => ({ value: l.id, label: `${l.name} (${l.code})` }));

    const getParentName = (parentId?: string | null) => {
        if (!parentId) return '-';
        return locations.find(l => l.id === parentId)?.name || 'Unknown';
    };

    const typeOptions = [
        { value: 'building', label: 'Building' },
        { value: 'floor', label: 'Floor' },
        { value: 'room', label: 'Room' },
        { value: 'rack', label: 'Rack' },
        { value: 'zone', label: 'Zone' },
        { value: 'other', label: 'Other' },
    ];

    // Generate Leaflet Map HTML for iframe srcDoc
    const getMapSrcDoc = (lat: string, lng: string) => {
        const latitude = parseFloat(lat) || -6.2088;
        const longitude = parseFloat(lng) || 106.8456;
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                <style>body, html, #map { height: 100%; margin: 0; padding: 0; }</style>
            </head>
            <body>
                <div id="map"></div>
                <script>
                    var map = L.map('map').setView([${latitude}, ${longitude}], 15);
                    
                    // Define base layers
                    var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap'
                    });
                    
                    var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                        attribution: '© Esri'
                    });
                    
                    var darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                        attribution: '© CARTO'
                    });

                    // Add default layer
                    osmLayer.addTo(map);

                    // Add layer control (Peta, Satelit, Dark)
                    var baseMaps = {
                        "Peta": osmLayer,
                        "Satelit": satelliteLayer,
                        "Dark": darkLayer
                    };
                    L.control.layers(baseMaps).addTo(map);

                    // Add marker
                    L.marker([${latitude}, ${longitude}]).addTo(map);
                </script>
            </body>
            </html>
        `;
    };

    return (
        <div className="space-y-6 p-6 bg-background min-h-screen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <MapPin size={24} className="text-cyan-500" /> Locations & Geolocation Map
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Peta lokasi fisik aset, gedung, zona, dan koordinat GPS Geolocation terintegrasi ERPNext
                    </p>
                </div>
                <Button leftIcon={<Plus size={16} />} onClick={openCreateModal} className="rounded-xl font-bold">
                    Add Location
                </Button>
            </div>

            <Card padding="lg" className="rounded-2xl border-border/60 shadow-sm">
                {/* Search */}
                <div className="mb-4">
                    <div className="relative max-w-md">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari lokasi berdasarkan nama atau kode..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border/80 rounded-xl text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                        />
                    </div>
                </div>

                {loading ? (
                    <LoadingOverlay visible />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableTh>Code</TableTh>
                                    <TableTh>Name</TableTh>
                                    <TableTh>Type</TableTh>
                                    <TableTh>Parent</TableTh>
                                    <TableTh>Address & Geo Map</TableTh>
                                    <TableTh className="text-right">Actions</TableTh>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredLocations.length === 0 ? (
                                    <TableEmpty
                                        colSpan={6}
                                        message="No locations found"
                                        description="Add your first location to start managing asset placements and GPS map coordinates"
                                        action={
                                            <Button size="sm" onClick={openCreateModal} className="rounded-xl">
                                                Add Location
                                            </Button>
                                        }
                                    />
                                ) : (
                                    filteredLocations.map((location) => {
                                        let lat = '-6.2088';
                                        let lng = '106.8456';
                                        if ((location as any).latitude && (location as any).longitude) {
                                            lat = (location as any).latitude;
                                            lng = (location as any).longitude;
                                        } else if (location.address && location.address.includes('[Geo:')) {
                                            const match = location.address.match(/\[Geo:\s*([-\d.]+),\s*([-\d.]+)\]/);
                                            if (match) {
                                                lat = match[1];
                                                lng = match[2];
                                            }
                                        }

                                        return (
                                            <TableRow key={location.id}>
                                                <TableTd className="font-mono text-xs font-semibold text-primary">
                                                    {location.code}
                                                </TableTd>
                                                <TableTd className="font-medium text-foreground">
                                                    {location.name}
                                                </TableTd>
                                                <TableTd>
                                                    <Badge variant={getTypeBadge(location.location_type || 'other')}>
                                                        {location.location_type || 'other'}
                                                    </Badge>
                                                </TableTd>
                                                <TableTd className="text-xs text-muted-foreground">
                                                    {getParentName(location.parent_id)}
                                                </TableTd>
                                                <TableTd className="text-xs text-muted-foreground max-w-xs truncate">
                                                    <div className="flex items-center gap-2">
                                                        <span>{location.address ? location.address.replace(/\s*\[Geo:.*\]/, '') : '-'}</span>
                                                        <button
                                                            onClick={() => setMapPreviewModal({ ...location, latitude: lat, longitude: lng } as any)}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 transition-colors"
                                                            title="Buka OpenStreetMap View"
                                                        >
                                                            <MapPin size={11} /> Map Pin ({lat.slice(0, 6)}, {lng.slice(0, 6)})
                                                        </button>
                                                    </div>
                                                </TableTd>
                                                <TableTd className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <ActionIcon
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setMapPreviewModal({ ...location, latitude: lat, longitude: lng } as any)}
                                                            title="Preview Geolocation Map"
                                                        >
                                                            <Eye size={15} className="text-cyan-500" />
                                                        </ActionIcon>
                                                        <ActionIcon
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditModal(location)}
                                                            title="Edit Location"
                                                        >
                                                            <Edit size={15} />
                                                        </ActionIcon>
                                                        <ActionIcon
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(location)}
                                                            title="Delete Location"
                                                            className="text-red-500 hover:text-red-600"
                                                        >
                                                            <Trash2 size={15} />
                                                        </ActionIcon>
                                                    </div>
                                                </TableTd>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>

            {/* Create/Edit Modal with GPS Coordinates and Customizable Presets */}
            <Modal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setIsManagingPresets(false);
                }}
                title={isEditing ? 'Edit Lokasi & Koordinat Map' : 'Tambah Lokasi Baru & Koordinat Geolocation'}
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Input
                            label="Kode Lokasi"
                            placeholder="Misal: BLD-01"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            required
                        />
                        <Input
                            label="Nama Lokasi"
                            placeholder="Misal: Gedung Utama"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Select
                            label="Tipe Lokasi"
                            value={formData.location_type}
                            onChange={(val) => setFormData({ ...formData, location_type: val || 'other' })}
                            options={typeOptions}
                            required
                        />
                        <Select
                            label="Induk Lokasi (Parent)"
                            placeholder="Pilih induk (opsional)"
                            value={formData.parent_id || ''}
                            onChange={(val) => setFormData({ ...formData, parent_id: val || null })}
                            options={parentOptions}
                        />
                    </div>
                    <Input
                        label="Alamat Fisik"
                        placeholder="Alamat lengkap lokasi"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />

                    {/* Geolocation Section */}
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
                        <label className="text-xs font-bold text-foreground flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <Globe size={14} className="text-cyan-500" /> Koordinat Geolocation (ERPNext Reference)
                            </span>
                            <span className="text-[11px] font-normal text-muted-foreground">Latitude / Longitude GPS</span>
                        </label>

                        {/* Preset Buttons with Inline Expandable Editor */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">PRESET KOORDINAT KOTA:</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsManagingPresets(!isManagingPresets);
                                        setEditingPresetId(null);
                                        setPresetForm({
                                            label: '',
                                            lat: formData.latitude || '-6.2088',
                                            lng: formData.longitude || '106.8456',
                                        });
                                    }}
                                    className="text-[11px] font-bold text-cyan-500 hover:text-cyan-600 flex items-center gap-1 hover:underline"
                                >
                                    <Settings size={12} /> {isManagingPresets ? 'Tutup Editor Preset' : '⚙️ Kelola / Custom Preset'}
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {presets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, latitude: preset.lat, longitude: preset.lng })}
                                        className="px-2.5 py-1 rounded-lg text-[11px] bg-background border border-border/80 hover:border-cyan-500 hover:text-cyan-500 transition-colors flex items-center gap-1 font-medium shadow-2xs"
                                        title={`Gunakan koordinat ${preset.label} (Lat: ${preset.lat}, Lng: ${preset.lng})`}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            {/* Inline Expandable Preset Manager Panel */}
                            {isManagingPresets && (
                                <div className="p-4 rounded-xl bg-card border border-cyan-500/40 shadow-md space-y-3 mt-2">
                                    <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                            <Compass size={15} className="text-cyan-500" />
                                            {editingPresetId ? 'Edit Preset Koordinat' : 'Tambah Preset Koordinat Baru'}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => setIsManagingPresets(false)}
                                            className="text-xs text-muted-foreground hover:text-foreground font-semibold"
                                        >
                                            ✕ Tutup
                                        </button>
                                    </div>

                                    {/* Input Form */}
                                    <div className="space-y-2">
                                        <Input
                                            label="Nama / Label Preset"
                                            placeholder="Misal: Surabaya (Cabang Timur) atau Depok Main Workshop"
                                            value={presetForm.label}
                                            onChange={(e) => setPresetForm({ ...presetForm, label: e.target.value })}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input
                                                label="Latitude"
                                                placeholder="-6.2088"
                                                value={presetForm.lat}
                                                onChange={(e) => setPresetForm({ ...presetForm, lat: e.target.value })}
                                            />
                                            <Input
                                                label="Longitude"
                                                placeholder="106.8456"
                                                value={presetForm.lng}
                                                onChange={(e) => setPresetForm({ ...presetForm, lng: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end pt-1">
                                            {editingPresetId && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="rounded-xl text-xs"
                                                    onClick={() => {
                                                        setEditingPresetId(null);
                                                        setPresetForm({ label: '', lat: formData.latitude || '-6.2088', lng: formData.longitude || '106.8456' });
                                                    }}
                                                >
                                                    Batal Edit
                                                </Button>
                                            )}
                                            <Button size="sm" variant="primary" className="rounded-xl font-bold text-xs" onClick={handleSavePreset}>
                                                {editingPresetId ? 'Simpan Perubahan' : '+ Simpan Preset Baru'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Existing Presets List */}
                                    <div className="border-t border-border/50 pt-2 space-y-1.5">
                                        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            <span>Daftar Preset Tersimpan ({presets.length})</span>
                                            <button
                                                type="button"
                                                onClick={handleResetDefaultPresets}
                                                className="text-[10px] text-amber-500 hover:underline font-semibold flex items-center gap-1"
                                                title="Kembalikan preset ke 5 kota awal"
                                            >
                                                <RotateCcw size={11} /> Reset Default
                                            </button>
                                        </div>
                                        <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                            {presets.map((p) => (
                                                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/40 hover:border-cyan-500/30 text-xs">
                                                    <div>
                                                        <span className="font-semibold text-foreground">{p.label}</span>
                                                        <span className="text-[10px] text-muted-foreground ml-2 font-mono">({p.lat}, {p.lng})</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingPresetId(p.id);
                                                                setPresetForm({ label: p.label, lat: p.lat, lng: p.lng });
                                                            }}
                                                            className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                                                            title="Edit Preset"
                                                        >
                                                            <Edit size={13} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeletePreset(p.id)}
                                                            className="p-1 text-muted-foreground hover:text-red-500 rounded hover:bg-red-500/10"
                                                            title="Hapus Preset"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label="Latitude"
                                placeholder="-6.2088"
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                            />
                            <Input
                                label="Longitude"
                                placeholder="106.8456"
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                            />
                        </div>

                        {/* Embedded Leaflet Preview */}
                        <div className="rounded-xl overflow-hidden border border-border/80 h-44 bg-card relative shadow-inner">
                            <iframe
                                title="Geolocation Preview"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                srcDoc={getMapSrcDoc(formData.latitude, formData.longitude)}
                            />
                        </div>
                    </div>

                    <Button fullWidth onClick={isEditing ? handleUpdate : handleCreate} loading={submitting} className="rounded-xl font-bold">
                        {isEditing ? "Perbarui Lokasi" : "Simpan Lokasi Baru"}
                    </Button>
                </div>
            </Modal>

            {/* Map Interactive Full Modal View */}
            {mapPreviewModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                    <div className="bg-card border border-border/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <MapPin size={20} className="text-cyan-500" /> {mapPreviewModal.name}
                                </h3>
                                <p className="text-xs text-muted-foreground font-mono">Kode: {mapPreviewModal.code} | Lat/Lng: {mapPreviewModal.latitude || '-6.2088'}, {mapPreviewModal.longitude || '106.8456'}</p>
                            </div>
                            <button
                                onClick={() => setMapPreviewModal(null)}
                                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-border/80 h-80 bg-background relative shadow-inner">
                            <iframe
                                title="Google Maps Interactive Full View"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                srcDoc={getMapSrcDoc(mapPreviewModal.latitude || '-6.2088', mapPreviewModal.longitude || '106.8456')}
                            />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${mapPreviewModal.latitude || '-6.2088'},${mapPreviewModal.longitude || '106.8456'}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-cyan-500 hover:underline flex items-center gap-1 font-medium"
                            >
                                <ExternalLink size={13} /> Buka di Google Maps Full Tab
                            </a>
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setMapPreviewModal(null)}>
                                Tutup Peta
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
