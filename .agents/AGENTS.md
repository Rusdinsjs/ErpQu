# Agent Rules

## Browser Usage Constraint
- **Do NOT run or open the browser**: Never launch or control the browser using `browser_subagent` or automated browser tools. The user will manually test and operate the browser UI.

## Pembuatan Fitur Baru & Pendaftaran Navigasi
- **Pendaftaran Navigasi Otomatis**: Setiap kali Anda membuat, mengaktifkan, atau memperbarui fitur/menu baru di backend/frontend, Anda **WAJIB** langsung mendaftarkan navigasi dan menu sidebar-nya di `ALL_NAV_ITEMS` (serta grup sidebar terkait di `AdminDashboard.tsx`) secara otomatis tanpa harus menunggu instruksi atau konfirmasi terpisah dari pengguna.

