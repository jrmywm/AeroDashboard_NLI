# Dokumen Riset Pengguna: Wawancara Evaluasi UI/UX AeroDashboard

**Mata Kuliah:** Human-Computer Interaction (HCI)  
**Metode Riset:** *In-depth Interview* & *Usability Testing*  
**Profil Partisipan (User):** "Bagas" (Bukan nama sebenarnya), 28 Tahun, Operator Drone Komersial Pemula.  
**Tanggal Wawancara:** 18 Mei 2026  
**Durasi:** 25 Menit

---

## 📋 Bagian 1: Ringkasan Eksekutif (Thematic Summary)

Berdasarkan wawancara dengan partisipan, kami menyimpulkan beberapa poin kunci terkait *pain points* (titik masalah) pada sistem *Ground Control Station* (GCS) tradisional dan bagaimana prototipe **AeroDashboard NLI** memberikan solusi:

1. **Beban Kognitif (Cognitive Overload):**
   * **Masalah Lama:** Partisipan merasa sangat terintimidasi oleh Mission Planner konvensional. Terlalu banyak angka, grafik, dan parameter yang tidak relevan bagi pilot pemula, menyebabkan kebingungan saat terjadi kondisi darurat.
   * **Solusi AeroDashboard:** Desain *dark mode* yang minimalis dan pengelompokan *Quick Actions* (Loiter, RTL, Land) sangat membantu partisipan membuat keputusan cepat tanpa *overload* informasi.

2. **Kurangnya Feedback Visual yang Jelas:**
   * **Masalah Lama:** Partisipan sering tidak sadar baterai habis atau sinyal lemah karena peringatan berbaur dengan teks lain.
   * **Solusi AeroDashboard:** Sistem *AI Alerts* di sebelah kanan dan indikator status *Human-in-the-Loop (HITL)* yang besar dan berwarna jelas sangat disukai partisipan.

3. **Natural Language Interface (NLI) sebagai "Game Changer":**
   * **Solusi AeroDashboard:** Partisipan merasa fitur *Chat NLI* membuat pengoperasian drone terasa seperti "memerintah asisten" dibandingkan memprogram robot. Mengetik *"kembali ke pangkalan"* jauh lebih intuitif daripada mencari tombol *Return-to-Launch* di sub-menu tersembunyi.

4. **Aksesibilitas (Accessibility):**
   * **Solusi AeroDashboard:** Penambahan pintasan *keyboard* (*shortcuts*) dan *Colorblind Mode* dinilai sebagai sentuhan desain tingkat industri (*enterprise-grade*) yang jarang dipikirkan oleh desainer GCS lokal.

---

## 🎙️ Bagian 2: Transkrip Wawancara (Mock Transcript)

**Pewawancara (Interviewer - INT):** Selamat siang, Mas Bagas. Terima kasih sudah meluangkan waktu. Boleh diceritakan sedikit pengalaman Mas dalam mengoperasikan drone sejauh ini?

**Partisipan (User - USR):** Siang. Ya, saya baru sekitar 8 bulan pegang drone survei. Biasanya pakai *software* bawaan seperti Mission Planner atau QGroundControl.

**INT:** Menarik. Bagaimana perasaan Anda ketika pertama kali menggunakan *software* tersebut? Apakah ada kesulitan khusus?

**USR:** Jujur, pusing banget Mas. Tampilannya itu... *cluttered*. Penuh dengan ratusan parameter, tombol kecil-kecil, dan teks yang bertumpuk. Kalau lagi terbang di lapangan terus tiba-tiba ada peringatan angin kencang, saya sering panik karena bingung harus nge-klik tombol yang mana buat *pause* (jeda) misinya. Terlalu banyak *cognitive load* (beban pikiran).

**INT:** Oke, tadi Anda sudah mencoba purwarupa **AeroDashboard** yang baru saja kami kembangkan. Impresi pertamanya bagaimana?

**USR:** Jauh lebih *clean* dan elegan! *Dark mode*-nya nyaman di mata, tidak bikin silau kalau dipakai di lapangan. Lalu tata letaknya masuk akal. Di kiri ada NLI *chat*, di tengah peta besar, dan di kanan ada panel baterai serta *Quick Actions*. Sangat rapi.

**INT:** Bagaimana pengalaman Anda menggunakan fitur Natural Language Interface (NLI) di sebelah kiri?

**USR:** Ini fitur favorit saya. Waktu saya ketik, *"buat rute melingkar di Monas"*, dia langsung menggambar *waypoint* otomatis. Biasanya, saya harus klik manual satu per satu di peta dan hitung jaraknya. Dan yang bikin saya merasa aman, dia nggak langsung ngeksekusi. Ada *modal* **Konfirmasi HITL** (Human-in-the-Loop) yang muncul dulu untuk minta persetujuan saya. Itu penting banget buat *safety*!

**INT:** Saat Anda menguji skenario baterai sisa 5% dan memaksa terbang, bagaimana respon sistem?

**USR:** Sistem langsung menolak dan mengeluarkan tulisan merah besar "SAFETY VALIDATION FAILED", lengkap dengan peringatan audio. Itu sangat krusial. Di aplikasi lama, kadang kita cuma dapat notifikasi teks kecil di pojok yang gampang terlewat.

**INT:** Terakhir, Anda sempat mencoba fitur *Loiter* dan fitur aksesibilitas seperti *Colorblind Mode* dan *Keyboard Navigation*?

**USR:** Iya, saya coba tekan tombol `3` di *keyboard* dan drone langsung memicu perintah RTL (pulang ke pangkalan) darurat. Ikon pesawatnya di peta kelihatan bergerak meluncur mulus balik ke titik *home*. Buat saya yang di lapangan kadang tangannya pakai sarung tangan, navigasi pakai angka *keyboard* itu ngebantu banget ketimbang harus pakai *mouse/touchpad*. Selain itu, waktu pencet *pause* (jeda misi), tombolnya berubah jadi *resume* buat melanjutkan, rasanya benar-benar dikendalikan *state machine* yang solid. Untuk fitur *colorblind*, saya kebetulan normal, tapi saya pikir itu ide brilian untuk bikin GCS yang inklusif. 

**INT:** Baik, terima kasih banyak atas *feedback*-nya yang sangat mendalam, Mas Bagas. Ini akan sangat membantu pengembangan sistem GCS kami.

**USR:** Sama-sama, Mas. Semoga *dashboard*-nya cepat rilis. Saya mau pakai buat kerjaan! *(Tertawa)*
