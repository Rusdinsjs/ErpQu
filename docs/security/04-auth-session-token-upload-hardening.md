# Hardening Autentikasi, Sesi, Token, WebSocket, dan Upload (Fase 4)

## 1. Ringkasan Perubahan Keamanan
Pada Fase 4, seluruh potensi kebocoran token (*token leakage*), celah *fail-open* pada upload/download file, serta ketidakamanan parameter WebSocket telah dieliminasi secara menyeluruh.

---

## 2. Rincian Hardening Komponen

### A. Eliminasi Token Leakage pada Image URL
- **Lokasi**: `web-admin/src/utils/image.ts`
- **Tindakan**: Menghapus penyisipan query parameter `?token=...` pada URL media/gambar.
- **Dampak Keamanan**: Mencegah token JWT tersimpan dalam log akses web server (Nginx/Apache/Cloudflare), history peramban pengguna, atau referer header.

### B. WebSocket Authentication Hardening
- **Lokasi**: `crates/api-server/src/api/handlers/notification_ws.rs`
- **Tindakan**:
  1. Menolak koneksi WebSocket yang mencoba mengirim token via plain URL query parameter.
  2. Mengautentikasi handshake via header `Authorization: Bearer <token>`, `Sec-WebSocket-Protocol`, atau secure cookie.
  3. Mengikat session aktif secara aman ke dalam `WebSocketManager` dengan user context tervalidasi.

### C. Fail-Closed Private File Upload & IDOR Defense
- **Lokasi**: `crates/api-server/src/api/handlers/upload_handler.rs`
- **Tindakan**:
  1. **Strict Extension Allowlist**: Hanya mengizinkan format bisnis yang aman (`jpg`, `jpeg`, `png`, `webp`, `pdf`, `csv`, `xlsx`, `docx`).
  2. **Fail-Closed Metadata Commitment**: File di disk langsung dihapus jika penyimpanan metadata database gagal (`insert_res.is_err()`).
  3. **IDOR & Company Boundary Enforcement**: Pengunduhan file privat wajib memiliki metadata di database dan diverifikasi terhadap kepemilikan user serta batas tenant company.
  4. **Path Traversal Defense**: Mencegah karakter `..` dan `\\`.

---

## 3. Test Suite Keamanan (Fase 4)
- File: `crates/core/tests/auth_session_token_upload_tests.rs`
  - `test_expired_token_is_strictly_rejected`: Memvalidasi token kedaluwarsa ditolak secara *fail-closed*.
  - `test_valid_token_decodes_successfully`: Memvalidasi dekode token sah dengan klaim otorisasi yang presisi.
  - `test_path_traversal_detection`: Memvalidasi pemblokiran seluruh pola serangan traversal direktori.
