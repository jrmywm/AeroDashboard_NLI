# Dokumen Kebutuhan Pengguna (User Requirements Summary)

**Proyek:** AeroDashboard NLI (Natural Language Interface GCS)  
**Tujuan:** Mengidentifikasi kebutuhan dan keluhan operator drone pemula terhadap GCS tradisional untuk mendesain antarmuka baru yang lebih aman, inklusif, dan intuitif.

---

## 🎯 Daftar Permintaan dan Kebutuhan Pengguna (User Requests)

Berdasarkan hasil wawancara dan observasi lapangan dengan operator drone, berikut adalah rangkuman permintaan utama dari pengguna yang menjadi landasan desain AeroDashboard:

### 1. Kebutuhan Kemudahan Operasional (Cognitive Load Reduction)
* **Permintaan User:** *"Saya butuh cara yang lebih gampang untuk memerintah drone tanpa harus mencari-cari tombol kecil di dalam menu yang rumit. Tampilan GCS saat ini terlalu penuh informasi."*
* **Solusi Sistem:** Mengembangkan **Natural Language Interface (NLI)**. Pengguna cukup mengetik bahasa sehari-hari (misal: *"kembali ke pangkalan"* atau *"buat rute melingkar di Monas"*) dan AI akan menerjemahkannya menjadi parameter *waypoint* secara otomatis.

### 2. Kebutuhan Keselamatan dan Pencegahan Human-Error
* **Permintaan User:** *"Sistem lama sering langsung jalan saat saya salah klik atau tidak sadar baterai sudah habis. Saya ingin sistem bertanya dulu sebelum mengeksekusi misi yang berisiko."*
* **Solusi Sistem:** 
  * Fitur **Human-in-the-Loop (HITL)**: Muncul *modal* konfirmasi besar dengan estimasi konsumsi baterai dan waktu sebelum drone diizinkan lepas landas.
  * **Safety Validation Layer**: Jika baterai di bawah standar aman (misal 5%), sistem AI otomatis memblokir perintah dengan peringatan merah tebal **"SAFETY VALIDATION FAILED"**, meskipun dipaksa terbang oleh pengguna.

### 3. Kebutuhan Umpan Balik Visual yang Jelas pada Peta
* **Permintaan User:** *"Saat saya pencet tombol darurat seperti Return to Home (RTL) atau Jeda (Loiter), saya butuh melihat dengan jelas apa yang sedang dilakukan pesawat di peta."*
* **Solusi Sistem:** Animasi umpan balik yang mulus (*smooth interpolation state*). 
  * Saat **RTL** aktif, ikon drone secara visual terbang meluncur mulus kembali ke titik awal pendaratan sebelum mematikan mesin.
  * Saat **Loiter** aktif, drone akan mengambang (hover), dan tombol darurat berubah secara dinamis menjadi tombol **Resume** untuk melanjutkan misi.

### 4. Kebutuhan Aksesibilitas di Lapangan
* **Permintaan User:** *"Di lapangan sering kali tangan saya kotor atau memakai sarung tangan sehingga susah menggeser mouse. Selain itu, ada teman operator yang buta warna dan kesulitan membedakan indikator error (merah) dan aman (hijau)."*
* **Solusi Sistem:**
  * **Global Keyboard Shortcuts**: Navigasi menggunakan tombol angka (`1`, `2`, `3`) untuk beralih fase penerbangan, dan `Space` untuk konfirmasi instan.
  * **Colorblind Mode**: Aksesibilitas palet warna khusus (*Deuteranopia, Protanopia, Tritanopia*) yang langsung mengubah kontras seluruh elemen antarmuka.
  * **Text-to-Speech (TTS) Voice Alerts**: Pemberitahuan audio verbal di setiap perubahan status, sehingga mata pilot bisa tetap fokus mengawasi drone di langit.

### 5. Kebutuhan Visibilitas Pre-Flight Checklist
* **Permintaan User:** *"Saya ingin prosedur keamanan sebelum terbang (seperti mengecek GPS, kalibrasi sensor, dan status baterai) diperjelas dan wajib dilakukan."*
* **Solusi Sistem:** Mengimplementasikan **Interactive Pre-flight Checklist** pada layar awal. Tombol *Take-off* dikunci (disabled) hingga seluruh verifikasi sistem dicentang hijau.
