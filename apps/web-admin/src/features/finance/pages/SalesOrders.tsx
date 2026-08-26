import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from'../api/finance';
import { clientApi } from'../../clients/api/client-management';
import { Card, Button, Badge } from'../../../components/ui';
import {
    Plus, Search, Filter, Download, MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import { DocTypeFormModal } from'../../../components/Forms/DocTypeFormModal';

export default function SalesOrders() {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: orders, isLoading } = useQuery({
        queryKey: ['finance', 'sales-orders'],
        queryFn: financeApi.listSalesOrders
    });

    const { data: clientsResponse } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientApi.list({ limit: 100 })
    });
    const clients = Array.isArray(clientsResponse?.data) ? clientsResponse.data : (clientsResponse as any)?.data?.data || [];

    const createMutation = useMutation({
        mutationFn: financeApi.createSalesOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance', 'sales-orders'] });
            setIsModalOpen(false);
            toast.success('Sales Order berhasil dibuat');
        },
        onError: (error: any) => {
            toast.error('Gagal membuat pesanan: ' + error.message);
        }
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            order_number: formData.get('order_number'),
            client_id: formData.get('client_id'),
            date: formData.get('date'),
            delivery_date: formData.get('delivery_date'),
            subject: formData.get('subject'),
            items: [
                {
                    description: formData.get('item_description'),
                    quantity: parseFloat(formData.get('quantity') as string),
                    unit_price: parseFloat(formData.get('unit_price') as string)
                }
            ]
        };
        createMutation.mutate(data);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Pesanan Penjualan (SO)</h1>
                    <p className="text-muted-foreground">Kelola pesanan masuk dari pelanggan</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 border-border text-muted-foreground">
                        <Download size={18} />
                        Export
                    </Button>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        <Plus size={18} />
                        Buat Pesanan
                    </Button>
                </div>
            </div>

            <Card className="bg-card border-border overflow-hidden">
                <div className="p-4 border-b border-border flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2 items-center flex-1 min-w-[300px]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                placeholder="Cari pesanan..."
                                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" className="gap-2 border-border text-muted-foreground">
                            <Filter size={16} />
                            Filter
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted-foreground">
                        <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-4">Nomor SO</th>
                                <th className="px-6 py-4">Pelanggan</th>
                                <th className="px-6 py-4">Tanggal Order</th>
                                <th className="px-6 py-4">Kirim Via</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border text-foreground">
                            {isLoading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center animate-pulse">Memuat data...</td></tr>
                            ) : orders && orders.length > 0 ? (
                                orders.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-primary">{order.order_number}</td>
                                        <td className="px-6 py-4 text-foreground">
                                            {clients.find((c: any) => c.id === order.client_id)?.name || order.client_id}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{new Date(order.date).toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4">{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('id-ID') : '-'}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-foreground">
                                            {formatCurrency(order.total_amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="default" className="text-[10px] uppercase">
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground italic">
                                        Belum ada pesanan penjualan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* DocType Form Modal (100% ERPNext Aligned) */}
            <DocTypeFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Sales Order"
                moduleName="Selling"
                onSave={(data) => {
                    createMutation.mutate({
                        order_number: data.naming_series || `SO-${Date.now()}`,
                        client_id: data.customer_name,
                        date: data.transaction_date,
                        delivery_date: data.delivery_date,
                        subject: data.terms || '',
                        items: data.items || []
                    });
                }}
            />
        </div>
    );
}
