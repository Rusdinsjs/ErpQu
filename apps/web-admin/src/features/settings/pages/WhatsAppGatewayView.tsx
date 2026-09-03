import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Phone,
  Key,
  Globe,
  Radio,
} from 'lucide-react';
import http from '../../../api/http';

interface WhatsAppConfig {
  provider: string;
  api_url: string;
  api_token: string;
  sender_phone?: string;
  is_enabled: boolean;
}

interface DeliveryLog {
  id: string;
  recipient_phone: string;
  message_body: string;
  message_type: string;
  status: string;
  response_message?: string;
  created_at: string;
}

export const WhatsAppGatewayView: React.FC = () => {
  const [config, setConfig] = useState<WhatsAppConfig>({
    provider: 'fonnte',
    api_url: 'https://api.fonnte.com/send',
    api_token: '',
    sender_phone: '',
    is_enabled: false,
  });
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Test Message State
  const [testPhone, setTestPhone] = useState('081234567890');
  const [templateType, setTemplateType] = useState('low_stock');
  const [testBody, setTestBody] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [cfgRes, logsRes] = await Promise.all([
        http.get('/notifications/whatsapp/config'),
        http.get('/notifications/whatsapp/logs'),
      ]);
      if (cfgRes.data?.data) {
        setConfig(cfgRes.data.data);
      }
      if (logsRes.data?.data) {
        setLogs(logsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load WhatsApp data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update test template body when template selection changes
  useEffect(() => {
    if (templateType === 'low_stock') {
      setTestBody(
        '⚠️ *[PERINGATAN STOK MENIPIS - ERPQu]*\n\n' +
          'Item: *ITEM-FLTR-OIL - Filter Oli Donaldson*\n' +
          'Sisa Stok: *2 unit*\n' +
          'Batas Minimum: *20 unit*\n' +
          'Defisit: *18 unit*\n\n' +
          'Harap segera buat Material Request / Purchase Order untuk mencegah kekosongan stok operasional.'
      );
    } else if (templateType === 'spk_completed') {
      setTestBody(
        '✅ *[SPK PRODUKSI TUNTAS - ERPQu]*\n\n' +
          'No. SPK: *SPK-2026-002*\n' +
          'Formula/BOM: *Cabin Guard Pelindung Operator ROPS/FOPS*\n' +
          'Kuantitas Selesai: *10 unit*\n\n' +
          'Barang jadi telah selesai dirakit dan siap untuk proses Quality Control (QC) & serah terima ke gudang.'
      );
    } else if (templateType === 'invoice_reminder') {
      setTestBody(
        '📄 *[PENGINGAT TAGIHAN INVOICE - ERPQu]*\n\n' +
          'Kepada Yth. *PT Adhi Karya (Persero) Tbk*,\n' +
          'Tagihan No: *INV/2026/09/001*\n' +
          'Total Pembayaran: *Rp 100.000.000*\n' +
          'Jatuh Tempo: *15/09/2026*\n\n' +
          'Mohon konfirmasi bukti transfer jika sudah melakukan pembayaran. Terima kasih atas kerja sama Anda.'
      );
    }
  }, [templateType]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await http.put('/notifications/whatsapp/config', config);
      alert('Konfigurasi WhatsApp Gateway berhasil disimpan!');
    } catch (err) {
      console.error('Failed to save WhatsApp config', err);
      alert('Gagal menyimpan konfigurasi.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSending(true);
      await http.post('/notifications/whatsapp/send', {
        recipient_phone: testPhone,
        message_body: testBody,
      });
      // Refresh logs
      const logsRes = await http.get('/notifications/whatsapp/logs');
      if (logsRes.data?.data) {
        setLogs(logsRes.data.data);
      }
      alert('Pesan WhatsApp simulasi berhasil dikirim!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Gagal mengirim pesan WhatsApp.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-emerald-600" />
            WhatsApp Notification Gateway
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Integrasi pengiriman notifikasi otomatis alert operasional, peringatan stok, dan pengingat tagihan invoice via WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              config.is_enabled
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            {config.is_enabled ? 'Gateway Aktif' : 'Gateway Nonaktif (Simulasi)'}
          </span>
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gateway Configuration Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-600" />
              Konfigurasi Provider WhatsApp
            </h2>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Provider Gateway
              </label>
              <select
                value={config.provider}
                onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="fonnte">Fonnte (Indonesia)</option>
                <option value="wablas">Wablas Gateway</option>
                <option value="ultramsg">UltraMsg API</option>
                <option value="generic_webhook">Generic Custom Webhook</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                API Endpoint URL
              </label>
              <input
                type="text"
                value={config.api_url}
                onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-gray-400" />
                API Token / Secret Key
              </label>
              <input
                type="password"
                placeholder="Masukkan API Token..."
                value={config.api_token}
                onChange={(e) => setConfig({ ...config, api_token: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                Nomor Pengirim (Sender Number)
              </label>
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={config.sender_phone || ''}
                onChange={(e) => setConfig({ ...config, sender_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_enabled"
                checked={config.is_enabled}
                onChange={(e) => setConfig({ ...config, is_enabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <label htmlFor="is_enabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                Aktifkan Pengiriman Langsung ke WhatsApp Gateway
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Konfigurasi Gateway'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Message Dispatch Tester */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              Simulasi Uji Kirim Pesan
            </h2>
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nomor Tujuan Penerima
              </label>
              <input
                type="text"
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="08xxxxxxxxxx atau 628xxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Format nomor lokal 08xx otomatis dinormalisasi menjadi kode negara 628xx.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Template Pesan Otomatis
              </label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="low_stock">🚨 Peringatan Stok Menipis (Gudang)</option>
                <option value="spk_completed">🏭 SPK Produksi Tuntas (Manufaktur)</option>
                <option value="invoice_reminder">📄 Pengingat Tagihan Invoice (Keuangan)</option>
                <option value="custom">✍️ Pesan Bebas (Kustom)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Isi Pesan WhatsApp
              </label>
              <textarea
                rows={5}
                required
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Mengirim Pesan...' : 'Kirim Uji Pesan WhatsApp'}
            </button>
          </form>
        </div>
      </div>

      {/* Message Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-3">
        <div className="px-6 pt-5 pb-2">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Riwayat Log Pengiriman Pesan
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold">Nomor Tujuan</th>
                <th className="px-6 py-3 font-semibold">Tipe Pesan</th>
                <th className="px-6 py-3 font-semibold">Ringkasan Pesan</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
                <th className="px-6 py-3 font-semibold">Waktu Kirim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada riwayat pengiriman pesan WhatsApp.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-emerald-700">
                      +{log.recipient_phone}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                        {log.message_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 max-w-md truncate font-sans text-xs">
                      {log.message_body.replace(/\n/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          log.status.startsWith('SENT')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
