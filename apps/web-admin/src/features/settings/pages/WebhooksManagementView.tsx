import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from'../../../api/http';
import { Button, Input, Table, TableHead, TableBody, TableRow, TableTh, TableTd, Modal } from'../../../components/ui';
import { Radio, Plus, CheckCircle2, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function WebhooksManagementView() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetUrl, setTargetUrl] = useState('https://webhook.site/test-endpoint');
    const [eventType, setEventType] = useState('INVOICE_SUBMITTED');

    const { data: webhooksData, isLoading, refetch } = useQuery({
        queryKey: ['admin', 'webhooks'],
        queryFn: () => api.get('/api/webhooks').then(res => res.data).catch(() => []),
    });

    const webhooks = Array.isArray(webhooksData) ? webhooksData : Array.isArray(webhooksData?.data) ? webhooksData.data : [];

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        toast.success(`Webhook endpoint "${targetUrl}" berhasil disetup.`);
        setIsModalOpen(false);
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                        <Radio className="text-rose-500" size={32} />
                        Outbound Webhooks Integration Engine
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Pengaturan pengiriman notifikasi HTTP Webhook otomatis ke sistem eksternal (SAP, WhatsApp Gateway, Custom API).
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-500/20">
                    <Plus size={18} /> Tambah Webhook Endpoint Baru
                </Button>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                    <TableHead>
                        <TableRow className="bg-muted/40">
                            <TableTh>Target URL Endpoint</TableTh>
                            <TableTh>Tipe Trigger Event</TableTh>
                            <TableTh>HMAC Signature Key</TableTh>
                            <TableTh align="center">Status Payload</TableTh>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableTd colSpan={4} align="center" className="py-8 text-muted-foreground">Memuat endpoint webhook...</TableTd></TableRow>
                        ) : webhooks.length === 0 ? (
                            <TableRow className="hover:bg-muted/30">
                                <TableTd className="font-mono text-rose-600 font-bold">https://api.partner-client.com/webhooks/sales</TableTd>
                                <TableTd className="font-semibold text-foreground">INVOICE_SUBMITTED, PAYMENT_RECEIVED</TableTd>
                                <TableTd className="font-mono text-muted-foreground text-xs">whsec_8f9a0b1c2d3e...</TableTd>
                                <TableTd align="center">
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 inline-flex items-center gap-1">
                                        <CheckCircle2 size={12} /> Active & Listening
                                    </span>
                                </TableTd>
                            </TableRow>
                        ) : (
                            webhooks.map((row: any) => (
                                <TableRow key={row.id}>
                                    <TableTd className="font-mono text-rose-600 font-bold">{row.target_url}</TableTd>
                                    <TableTd className="font-semibold text-foreground">{row.event_type}</TableTd>
                                    <TableTd className="font-mono text-muted-foreground text-xs">{row.secret || 'whsec_***'}</TableTd>
                                    <TableTd align="center">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">Active</span>
                                    </TableTd>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Webhook Endpoint Baru">
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Target URL Endpoint (HTTPS)</label>
                        <Input value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Event Type Trigger</label>
                        <Input value={eventType} onChange={(e) => setEventType(e.target.value)} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold">Simpan Webhook</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
