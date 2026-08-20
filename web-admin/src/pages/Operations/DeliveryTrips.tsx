import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi, type DeliveryTrip, type DeliveryTripStop } from '../../api/ops-quality-trip';
import { employeeApi } from '../../api/employee';
import { assetApi } from '../../api/assets';
import { financeApi } from '../../api/finance';
import {
    Plus, Truck, Play, CheckCircle2, X, Navigation
} from 'lucide-react';
import { showToast } from '../../components/ui/Toast';
import {
    Card, Button, Table, TableHead, TableBody, TableRow, TableTh, TableTd, TableEmpty, TableSkeleton, PageHeader
} from '../../components/ui';

const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

const DeliveryTripsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<[DeliveryTrip, DeliveryTripStop[]] | null>(null);

    // Form states
    const [driverId, setDriverId] = useState('');
    const [vehicleId, setVehicleId] = useState('');
    const [selectedShipmentIds, setSelectedShipmentIds] = useState<string[]>([]);

    // Queries
    const { data: trips = [], isLoading: tripsLoading } = useQuery({
        queryKey: ['delivery-trips'],
        queryFn: () => opsApi.listDeliveryTrips(DEFAULT_COMPANY_ID)
    });

    const { data: employees = [] } = useQuery({
        queryKey: ['employees'],
        queryFn: () => employeeApi.list()
    });

    const { data: assetsData } = useQuery({
        queryKey: ['assets'],
        queryFn: () => assetApi.list({ page: 1, per_page: 100 })
    });
    const vehicles = assetsData?.data || [];

    const filteredTrips = trips;

    const { data: shipments = [] } = useQuery({
        queryKey: ['sales-shipments'],
        queryFn: () => financeApi.listSalesShipments()
    });

    // Mutations
    const createMut = useMutation({
        mutationFn: opsApi.createDeliveryTrip,
        onSuccess: () => {
            showToast('Delivery Trip dispatched successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['delivery-trips'] });
            setIsCreateOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            showToast(err.response?.data?.error || 'Failed to dispatch Delivery Trip', 'error');
        }
    });

    const updateStatusMut = useMutation({
        mutationFn: ({ id, status, dep, arr }: { id: string; status: string; dep?: string; arr?: string }) =>
            opsApi.updateDeliveryTripStatus(id, status, dep, arr),
        onSuccess: () => {
            showToast('Trip status updated successfully', 'success');
            queryClient.invalidateQueries({ queryKey: ['delivery-trips'] });
            if (selectedTrip) {
                // Refresh detail modal
                opsApi.getDeliveryTrip(selectedTrip[0].id).then(setSelectedTrip);
            }
        },
        onError: (err: any) => {
            showToast(err.response?.data?.error || 'Failed to update trip status', 'error');
        }
    });

    const updateStopStatusMut = useMutation({
        mutationFn: ({ tripId, stopId, status }: { tripId: string; stopId: string; status: string }) =>
            opsApi.updateDeliveryTripStopStatus(tripId, stopId, status),
        onSuccess: () => {
            showToast('Stop status updated successfully', 'success');
            if (selectedTrip) {
                opsApi.getDeliveryTrip(selectedTrip[0].id).then(setSelectedTrip);
            }
        },
        onError: (err: any) => {
            showToast(err.response?.data?.error || 'Failed to update stop status', 'error');
        }
    });

    const resetForm = () => {
        setDriverId('');
        setVehicleId('');
        setSelectedShipmentIds([]);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedShipmentIds.length === 0) {
            showToast('Please select at least one shipment stop', 'error');
            return;
        }
        createMut.mutate({
            company_id: DEFAULT_COMPANY_ID,
            driver_id: driverId || undefined,
            vehicle_id: vehicleId || undefined,
            stops: selectedShipmentIds.map((id, index) => ({
                delivery_note_id: id,
                stop_order: index + 1
            }))
        });
    };

    const toggleShipmentSelection = (id: string) => {
        setSelectedShipmentIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500/100/10 text-emerald-400 border border-emerald-500/20';
            case 'IN_TRANSIT': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'CANCELLED': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
            default: return 'bg-secondary text-secondary-foreground';
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Delivery Trips"
                description="Plan fleet routes, dispatch drivers, and monitor shipment stops."
                action={
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        leftIcon={<Plus className="h-4 w-4" />}
                    >
                        Plan Route & Dispatch
                    </Button>
                }
            />

            <Card className="p-6 bg-card/40 backdrop-blur-md border-border/40">
                {tripsLoading ? (
                    <TableSkeleton cols={7} rows={5} />
                ) : trips.length === 0 ? (
                    <TableEmpty colSpan={7} message="No delivery trips dispatched yet." />
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableTh>Trip Number</TableTh>
                                <TableTh>Driver</TableTh>
                                <TableTh>Vehicle</TableTh>
                                <TableTh>Departure Time</TableTh>
                                <TableTh>Arrival Time</TableTh>
                                <TableTh>Status</TableTh>
                                <TableTh className="text-right">Actions</TableTh>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTrips.map((trip: DeliveryTrip) => {
                                const driver = employees.find((e: any) => e.id === trip.driver_id);
                                const vehicle = vehicles.find((v: any) => v.id === trip.vehicle_id);
                                return (
                                    <TableRow key={trip.id}>
                                        <TableTd className="font-mono text-sm">{trip.trip_number}</TableTd>
                                        <TableTd>{driver?.name || 'Unassigned'}</TableTd>
                                        <TableTd>{vehicle?.name ? `${vehicle.name} (${vehicle.asset_code || ''})` : 'Unassigned'}</TableTd>
                                        <TableTd className="text-sm">{trip.departure_time ? new Date(trip.departure_time).toLocaleString() : '-'}</TableTd>
                                        <TableTd className="text-sm">{trip.arrival_time ? new Date(trip.arrival_time).toLocaleString() : '-'}</TableTd>
                                        <TableTd>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(trip.status)}`}>
                                                {trip.status}
                                            </span>
                                        </TableTd>
                                        <TableTd className="text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={async () => {
                                                    const detail = await opsApi.getDeliveryTrip(trip.id);
                                                    setSelectedTrip(detail);
                                                }}
                                                className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10"
                                            >
                                                Manage Stops
                                            </Button>
                                        </TableTd>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </Card>

            {isCreateOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg p-6 bg-card border border-border/80 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCreateOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Navigation className="h-5 w-5 text-teal-400" /> Plan New Delivery Trip
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Driver</label>
                                <select
                                    value={driverId}
                                    onChange={(e) => setDriverId(e.target.value)}
                                    className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none"
                                >
                                    <option value="">Unassigned...</option>
                                    {employees.map((emp: any) => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Vehicle</label>
                                <select
                                    value={vehicleId}
                                    onChange={(e) => setVehicleId(e.target.value)}
                                    className="w-full bg-background border border-border rounded-md py-2 px-3 text-sm focus:outline-none"
                                >
                                    <option value="">Unassigned...</option>
                                    {vehicles.map((veh: any) => (
                                        <option key={veh.id} value={veh.id}>{veh.name} ({veh.asset_code})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Select Shipments / Stops</label>
                                <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded p-2 bg-background/50">
                                    {shipments.map((ship: any) => (
                                        <label key={ship.id} className="flex items-center gap-2 p-1.5 hover:bg-secondary/40 rounded cursor-pointer text-sm">
                                            <input
                                                type="checkbox"
                                                checked={selectedShipmentIds.includes(ship.id)}
                                                onChange={() => toggleShipmentSelection(ship.id)}
                                                className="rounded bg-background border-border text-teal-600 focus:ring-teal-500"
                                            />
                                            <span className="font-mono text-xs">{ship.shipment_number}</span> - <span>{ship.status}</span>
                                        </label>
                                    ))}
                                    {shipments.length === 0 && (
                                        <div className="text-xs text-muted-foreground p-2">No pending shipments found.</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createMut.isPending} className="bg-teal-600 hover:bg-teal-700">
                                    Dispatch Trip
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {selectedTrip && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-2xl p-6 bg-card border border-border/80 shadow-2xl relative max-h-[85vh] overflow-y-auto">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTrip(null)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2 mb-4">
                            <Truck className="h-5 w-5 text-teal-400" />
                            <h2 className="text-lg font-bold">Manage Trip: {selectedTrip[0].trip_number}</h2>
                        </div>

                        <div className="flex flex-wrap gap-4 mb-6 p-4 rounded bg-secondary/30">
                            <div>
                                <span className="block text-xs text-muted-foreground">Trip Status</span>
                                <span className="font-semibold">{selectedTrip[0].status}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-muted-foreground">Driver</span>
                                <span className="font-semibold">
                                    {employees.find((e: any) => e.id === selectedTrip[0].driver_id)?.name || 'Unassigned'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold mb-2">Delivery Stops</h3>
                            <div className="space-y-2">
                                {selectedTrip[1].map((stop: DeliveryTripStop) => {
                                    const shipment = shipments.find((s: any) => s.id === stop.delivery_note_id);
                                    return (
                                        <div key={stop.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-card/65">
                                            <div className="flex items-center gap-3">
                                                <div className="h-6 w-6 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-xs">
                                                    {stop.stop_order}
                                                </div>
                                                <div>
                                                    <span className="font-mono text-sm block">{shipment?.shipment_number || 'Shipment...'}</span>
                                                    <span className="text-xs text-muted-foreground">Status: {stop.status}</span>
                                                </div>
                                            </div>
                                            {stop.status === 'PENDING' && selectedTrip[0].status === 'IN_TRANSIT' && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateStopStatusMut.mutate({
                                                            tripId: selectedTrip[0].id,
                                                            stopId: stop.id,
                                                            status: 'DELIVERED'
                                                        })}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2.5 py-1"
                                                    >
                                                        Delivered
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateStopStatusMut.mutate({
                                                            tripId: selectedTrip[0].id,
                                                            stopId: stop.id,
                                                            status: 'FAILED'
                                                        })}
                                                        className="bg-rose-600/25 hover:bg-rose-600/35 text-rose-400 text-xs px-2.5 py-1"
                                                    >
                                                        Failed
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end gap-2 pt-6 border-t border-border">
                                {selectedTrip[0].status === 'DRAFT' && (
                                    <Button
                                        onClick={() => updateStatusMut.mutate({
                                            id: selectedTrip[0].id,
                                            status: 'IN_TRANSIT',
                                            dep: new Date().toISOString()
                                        })}
                                        className="bg-teal-600 hover:bg-teal-700 flex items-center gap-2"
                                    >
                                        <Play className="h-4 w-4" /> Start Transit
                                    </Button>
                                )}
                                {selectedTrip[0].status === 'IN_TRANSIT' && (
                                    <Button
                                        onClick={() => updateStatusMut.mutate({
                                            id: selectedTrip[0].id,
                                            status: 'COMPLETED',
                                            arr: new Date().toISOString()
                                        })}
                                        className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="h-4 w-4" /> Complete Trip
                                    </Button>
                                )}
                                <Button variant="ghost" onClick={() => setSelectedTrip(null)}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default DeliveryTripsPage;
