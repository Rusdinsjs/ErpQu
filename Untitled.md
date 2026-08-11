# Rencana Implementasi: Global Rename & Database Architecture

Saya sangat memahami keinginan Anda untuk segera memiliki **Tabel Database Asli** (bukan sekadar mock-up lokal) untuk semua fitur yang ada. Namun, kita dihadapkan pada skala sistem yang sangat besar dan kendala teknis:

1. **Volume Fitur:** Terdapat lebih dari 80+ fitur baru di modul Selling, Buying, Inventory, dan Finance yang saat ini menggunakan `GenericView` (misalnya Quotations, Blanket Orders, Sales Partners, dll).
2. **Kendala Terminal:** Sistem eksekusi terminal saya saat ini sedang tidak berfungsi (`connection reset by peer`), yang berarti saya tidak bisa menggunakan alat otomatisasi atau mengecek *error compiler* saat membuat puluhan API backend Rust secara masif.

Untuk memenuhi permintaan Anda agar semua fitur **bisa langsung disimpan ke database hari ini juga**, saya merancang strategi arsitektur yang sering digunakan oleh sistem ERP besar (seperti ERPNext) yang disebut **Dynamic DocType Storage**.

## Solusi Arsitektur yang Diusulkan

### 1. Global Rename (Client -> Customer)
Saya akan mengganti seluruh penggunaan kata "Client" menjadi "Customer" di seluruh file UI yang relevan pada modul **Finance, Buying, Inventory, dan Selling**, agar konsistensi istilah terjamin di seluruh aplikasi.

### 2. Universal "Dynamic Documents" Database Engine
Daripada membuat 80 tabel SQL terpisah dan 80 file API Rust yang berisiko memunculkan error tanpa bisa diuji, saya akan membuat **satu sistem penyimpanan dinamis** di backend:

*   **Database:** Membuat 1 file migrasi SQL untuk tabel `dynamic_documents` yang menggunakan kolom `JSONB` berkinerja tinggi. Tabel ini dirancang khusus untuk menampung data dari form mana pun secara dinamis.
*   **Backend (Rust):** Membuat 1 rute API universal (`/api/v1/documents/:doctype`) yang memiliki fungsi CRUD (Create, Read, Update, Delete) lengkap.
*   **Frontend (React):** Memodifikasi `SellingGenericView`, `BuyingGenericView`, dll agar mengarahkan seluruh form penyimpanan mereka ke API universal tersebut.

Dengan cara ini, **SELURUH 80+ fitur Anda akan langsung memiliki database sungguhan** yang tersimpan di server secara instan, tanpa harus menunggu pembuatan puluhan tabel manual.

## Keputusan Anda Dibutuhkan

> [!CAUTION]
> **Pilihan A (Rekomendasi): Dynamic Documents Engine**
> Klik **Proceed** jika Anda setuju dengan pendekatan database dinamis ini. Dalam beberapa menit, semua form di semua modul akan bisa berfungsi menyimpan dan menampilkan data asli dari server.
> 
> **Pilihan B: Tabel SQL Individual (Satu per Satu)**
> Jika Anda bersikeras setiap fitur harus memiliki tabel SQL terpisah (misal tabel `quotations` sendiri, tabel `blanket_orders` sendiri), maka mohon berikan balasan dengan menyebutkan **3 fitur prioritas utama** saja untuk saya kerjakan terlebih dahulu, karena membuat puluhan tabel secara manual tanpa koneksi terminal sangat berisiko gagal (*timeout*).
