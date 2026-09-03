# ADR: Tenant and Company Request Context Kernel

## Status
**APPROVED** (Design Gate Fase 5)

## Konteks & Masalah
ERPQu bertransformasi menjadi sistem ERP multi-tenant dan multi-company yang melayani holding perusahaan dengan anak-anak perusahaan operasional independen. Sebelumnya, beberapa query tidak menyertakan filter `company_id`, menerima `company_id` dari body request tanpa validasi keanggotaan user, atau mengandalkan fallback koneksi bersama. Kondisi ini membahayakan integritas isolasi data antar entitas legal.

## Keputusan Arsitektur
1. **Single Source of Truth**: Setiap request HTTP wajib dievaluasi melalui middleware `TenantContextMiddleware`.
2. **Mandatory Authenticated Membership**:
   - `company_id` aktif diperoleh dari token JWT (klaim `company_id`) atau header `X-Company-ID`.
   - Header `X-Company-ID` hanya valid jika user terdaftar secara eksplisit dan aktif pada tabel `user_company_memberships` untuk entitas tersebut.
   - Jika header `X-Company-ID` merujuk pada entitas di mana pengguna bukan anggota aktif, request **wajib ditolak seketika (HTTP 403 Forbidden)**.
3. **No Unauthenticated Global Fallback**:
   - Endpoint transaksional menolak eksekusi jika `company_id` berstatus `None` / `NULL`.
   - Tidak ada koneksi fallback ke database master tanpa konteks tenant.
4. **Context Propagation**:
   - `TenantContext` diteruskan secara eksplisit dari handler ke service dan repository layer.
   - Menginisialisasi session parameter PostgreSQL `SET LOCAL app.current_company_id` pada setiap koneksi transaksi.

## Konsekuensi
- **Positif**: Menjamin isolasi data total antar PT, mencegah kebocoran data (*data leakage*), dan menyederhanakan audit kepatuhan.
- **Tantangan**: Pengguna dengan akses multi-company wajib memilih company aktif saat berpindah konteks kerja pada UI.
