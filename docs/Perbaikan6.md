R. Data preparation dan master data
 Tentukan legal entity, company, branch, site dan warehouse.
 Finalisasi Chart of Accounts.
 Finalisasi fiscal year dan accounting period.
 Finalisasi tax template.
 Finalisasi UOM dan conversion.
 Finalisasi item, serial dan batch policy.
 Finalisasi vendor dan customer.
 Finalisasi asset category dan depreciation rule.
 Finalisasi salary structure dan BPJS rule.
 Validasi opening balance.
 Rekonsiliasi opening AR, AP, inventory, asset dan GL.
 Buat data import validation report.
 Buat data cleansing dan duplicate detection.
 Dapatkan persetujuan owner data.

Kriteria lulus: Opening Balance = subledger = GL dan seluruh master data disetujui pemilik proses.

S. Dokumentasi dan governance

 Koreksi STATUS.md.

 Ganti semua PASS yang tidak terbukti.

 Hapus status “READY FOR PRODUCTION PILOT” sementara.

 Kaitkan setiap evidence dengan commit SHA dan CI run.

 Dokumentasikan arsitektur aktual.

 Dokumentasikan data classification.

 Dokumentasikan permission matrix aktual.

 Dokumentasikan SoD matrix aktual.

 Buat SOP operasi, backup, restore, incident dan deployment.

 Buat release notes.

 Buat known issues.

 Buat risk register.

 Tentukan owner setiap risiko.

 Dapatkan sign-off dari:

Engineering
Security
Finance/accounting
HR/payroll
Operations
Infrastructure
Product owner


T. Production pilot
Pilot hanya boleh dimulai setelah seluruh BLOCKER selesai.
 Jangan langsung memproses seluruh transaksi perusahaan.
 Jalankan parallel run dengan sistem lama.
 Rekonsiliasi harian:

Trial Balance
AR
AP
Inventory
Bank
Asset
Payroll

 Tentukan rollback criteria.

 Tentukan incident escalation.

 Monitoring aktif selama pilot.

 Tidak ada Severity 1 dan Severity 2 yang terbuka.

 Seluruh selisih keuangan bernilai nol.

 Business owner menandatangani UAT.

 Lakukan production readiness review terakhir.

 Dari point R, S dan T di atas :

1. Riset dan Teliti apakah aplikasi Erpqu saat ini sudah memenuhi item2 di point R, S dan T di atas? 
2. List yang sudah dan belum memenuhi kriteria.
3. Jika belum Memenuhi, buatkan Implementation Plan-nya  
4. Jangan mengarang, mengada-ada atau berhalusinasi. Riset dan teliti dengan Jujur dan Tepat, laporkan sesuai kondisi yang sebenarnya.
5. Buatkan juga Tasks