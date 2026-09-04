import React, { useState, useEffect } from 'react';
import { Modal, Button, useToast } from '../ui';
import { MessageSquare, Send, ExternalLink, Phone, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import http from '../../api/http';

export interface SendWhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientPhone?: string;
    documentType: string;
    documentNumber: string;
    defaultMessage: string;
}

export const SendWhatsAppModal: React.FC<SendWhatsAppModalProps> = ({
    isOpen,
    onClose,
    recipientName,
    recipientPhone = '',
    documentType,
    documentNumber,
    defaultMessage,
}) => {
    const [phone, setPhone] = useState(recipientPhone);
    const [message, setMessage] = useState(defaultMessage);
    const [isSending, setIsSending] = useState(false);
    const { success, error: toastError, warning } = useToast();

    useEffect(() => {
        setPhone(recipientPhone);
        setMessage(defaultMessage);
    }, [recipientPhone, defaultMessage, isOpen]);

    if (!isOpen) return null;

    const normalizePhone = (raw: string): string => {
        let cleaned = raw.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.slice(1);
        } else if (cleaned.startsWith('8')) {
            cleaned = '628' + cleaned.slice(1);
        }
        return cleaned;
    };

    const cleanPhone = normalizePhone(phone);

    const handleSendViaGateway = async () => {
        if (!cleanPhone) {
            warning('Nomor WhatsApp tujuan tidak boleh kosong.', 'Validasi Gagal');
            return;
        }

        setIsSending(true);
        try {
            const res = await http.post('/notifications/whatsapp/send', {
                recipient_phone: cleanPhone,
                message_body: message,
                message_type: documentType,
            });

            if (res.data?.success || res.status === 200) {
                success(`Pesan WhatsApp berhasil dikirim ke ${cleanPhone}.`, 'Terkirim');
                onClose();
            } else {
                toastError('Gagal mengirim via gateway server.', 'Pengiriman Gagal');
            }
        } catch (err: any) {
            console.warn('Gateway send error:', err);
            warning(
                'Gateway server belum terhubung atau token API kosong. Anda tetap dapat mengirim langsung melalui tombol WhatsApp Web.',
                'Gunakan WhatsApp Web'
            );
        } finally {
            setIsSending(false);
        }
    };

    const handleOpenWhatsAppWeb = () => {
        if (!cleanPhone) {
            warning('Nomor WhatsApp tujuan tidak boleh kosong.', 'Validasi Gagal');
            return;
        }
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
        success('Membuka WhatsApp Web / Desktop...', 'Berhasil');
    };

    return (
        <Modal
            isOpen={isOpen}
            opened={isOpen}
            onClose={onClose}
            title={`Kirim Notifikasi WhatsApp - ${documentType}`}
            size="lg"
        >
            <div className="space-y-4 p-1 text-slate-900 dark:text-slate-100 text-xs">
                {/* Info Card */}
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="p-2 bg-emerald-500 text-white rounded-lg">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-bold text-sm text-emerald-800 dark:text-emerald-400">
                            {documentType}: {documentNumber}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                            Kepada: <strong className="text-slate-800 dark:text-slate-200">{recipientName}</strong>
                        </div>
                    </div>
                </div>

                {/* Recipient Phone Input */}
                <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" /> Nomor WhatsApp Penerima:
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Contoh: 08123456789 atau 628123456789"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                        {cleanPhone && (
                            <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-mono">
                                Format: +{cleanPhone}
                            </span>
                        )}
                    </div>
                </div>

                {/* Message Body Textarea */}
                <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Isi Pesan WhatsApp:
                    </label>
                    <textarea
                        rows={8}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-sans focus:outline-hidden focus:ring-2 focus:ring-emerald-500 leading-relaxed custom-scrollbar"
                    />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <Button variant="ghost" onClick={onClose} size="sm">
                        Batal
                    </Button>

                    <div className="flex items-center gap-2">
                        {/* Direct Click-to-Chat Button */}
                        <Button
                            variant="outline"
                            onClick={handleOpenWhatsAppWeb}
                            size="sm"
                            className="flex items-center gap-1.5 text-emerald-700 border-emerald-500/40 hover:bg-emerald-500/10"
                        >
                            <ExternalLink className="w-3.5 h-3.5" /> Buka di WhatsApp Web / App
                        </Button>

                        {/* Gateway API Dispatch Button */}
                        <Button
                            variant="filled"
                            onClick={handleSendViaGateway}
                            disabled={isSending}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Mengirim...
                                </>
                            ) : (
                                <>
                                    <Send className="w-3.5 h-3.5" /> Kirim via Gateway Server
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
