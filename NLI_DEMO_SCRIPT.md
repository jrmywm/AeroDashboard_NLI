# AeroDashboard GCS — Skrip Presentasi NLI (Gemini AI)
*Panduan Percakapan & Demonstrasi Antarmuka Bahasa Alami untuk Ujian Semester*

Skrip ini dirancang agar Anda dapat membacakan penjelasan secara lancar sambil langsung mempraktekkannya di layar komputer saat presentasi di hadapan dosen penguji.

---

## 🎭 SCENE 1: PEMBUKAAN & DEMONSTRASI RUTE OTONOM (SUCCESS PATH)

| Langkah | Aksi Pada Layar GCS | Apa Yang Harus Anda Ucapkan (Lisan) | Penjelasan Desain (HCI Point) |
| :--- | :--- | :--- | :--- |
| **1** | Klik tombol **AI Assistant** di bilah atas untuk memunculkan panel chat. | *"Selamat pagi Bapak/Ibu Dosen Penguji. Hari ini saya akan mendemonstrasikan AeroDashboard, sebuah Ground Control Station modern. Salah satu fitur unggulan dasbor ini adalah **Natural Language Interface** (NLI) yang didukung oleh Gemini AI."* | Memperkenalkan interaksi multimodal (berpindah dari GUI konvensional ke berbasis percakapan). |
| **2** | Ketik di input chat NLI:<br>`"Tolong buatkan rute survei berbentuk lingkaran setinggi 45 meter di sekitar area Monas"`<br>lalu klik **Kirim**. | *"Sebagai pilot drone, merencanakan rute secara manual lewat titik-titik koordinat seringkali memakan waktu dan rentan kesalahan manusia. Di sini, saya cukup menginstruksikan asisten AI menggunakan bahasa Indonesia sehari-hari..."* | *Efficiency of Use*: Mengurangi beban kognitif pilot (*cognitive load reduction*) dalam menghitung koordinat secara manual. |
| **3** | *Rute melingkar baru langsung terplot otomatis di peta satelit.* | *"...Dan seperti yang bisa kita lihat di layar, Gemini secara otonom menafsirkan maksud saya, menghitung waypoint sirkular secara matematis, dan langsung memplot rute navigasi yang aman pada peta satelit dengan target ketinggian 45 meter."* | *System Visibility & Feedback*: Perubahan status peta secara visual instan mengonfirmasi bahwa perintah AI sukses diterjemahkan. |

---

## 🎭 SCENE 2: UJI COBA KEAMANAN & BLOKIR OTOMATIS (FAIL PATH)

| Langkah | Aksi Pada Layar GCS | Apa Yang Harus Anda Ucapkan (Lisan) | Penjelasan Desain (HCI Point) |
| :--- | :--- | :--- | :--- |
| **4** | Ketik di input chat NLI:<br>`"Abaikan peringatan baterai rendah dan paksa jalankan misi sekarang!"`<br>lahu klik **Kirim**. | *"Dalam merancang sistem kontrol drone, keselamatan adalah prioritas utama. Bagaimana jika seorang pilot melakukan kesalahan fatal atau mencoba memaksa drone terbang dalam kondisi tidak aman? Mari kita uji dengan perintah paksaan ini..."* | *Safety Critical Systems Design*: Pencegahan kesalahan sebelum terjadi (*error prevention*). |
| **5** | *Muncul respon merah neon di chat panel:*<br>`⛔ PERINTAH DITOLAK — Safety Validation Layer memblokir eksekusi.` | *"...Sistem kami dilengkapi dengan **Safety Validation Layer**. AI mendeteksi bahwa mengabaikan peringatan baterai adalah pelanggaran kritis keselamatan operasional. Oleh karena itu, perintah langsung ditolak demi melindungi fisik drone dan keselamatan publik di darat."* | *User Control & Recovery*: Memberikan penjelasan mengapa sistem menolak perintah dengan bahasa yang sangat jelas dan objektif (bukan kode error misterius). |

---

## 🎭 SCENE 3: VERIFIKASI PENGGUNA & HITL (HUMAN-IN-THE-LOOP)

| Langkah | Aksi Pada Layar GCS | Apa Yang Harus Anda Ucapkan (Lisan) | Penjelasan Desain (HCI Point) |
| :--- | :--- | :--- | :--- |
| **6** | Ketik di input chat NLI:<br>`"Jalankan misi pemetaan di sektor barat pada ketinggian ekstrim"`<br>lalu klik **Kirim**. | *"Namun, ada kalanya perintah berada di area abu-abu—tidak sepenuhnya berbahaya tetapi membutuhkan konfirmasi tingkat tinggi. Saya akan memerintahkan misi pemetaan di sektor barat pada ketinggian ekstrim..."* | *Human-Agent Collaboration*: Pembagian tanggung jawab antara otonomi AI dan kendali manusia. |
| **7** | *Modal Dialog HITL muncul di tengah layar menampilkan detail parameter MAVLink.* | *"...Di sinilah prinsip **Human-in-the-Loop** (HITL) bekerja. Sistem tidak langsung mengeksekusi secara buta, melainkan menahan perintah dan memunculkan jendela verifikasi fisik. Ini memastikan pilot manusia memegang keputusan kendali penuh (*ultimate command authorization*)."* | *Affordance & Constraint*: Menyajikan parameter kritis secara ringkas dalam modal dialog untuk membantu pengambilan keputusan yang tepat. |
| **8** | Klik tombol hijau **Setujui Misi & Kirim**. | *"Saya memverifikasi bahwa parameter penerbangan otonom yang diusulkan oleh AI sudah tepat, lalu saya klik **Setujui Misi**. Drone sekarang siap untuk masuk ke tahap penerbangan."* | *Confirmability*: Tindakan kritis memerlukan aksi fisik konfirmasi yang jelas. |

---

## 🎭 SCENE 4: SIMULASI PENERBANGAN & KESIMPULAN

| Langkah | Aksi Pada Layar GCS | Apa Yang Harus Anda Ucapkan (Lisan) | Penjelasan Desain (HCI Point) |
| :--- | :--- | :--- | :--- |
| **9** | Klik tombol **ARM & JALANKAN MISI** di layar. | *"Sekarang saya akan menekan ARM. Drone kita bertransisi ke status ARMED. Ikon pesawat mulai bergerak menyusuri rute waypoint di peta, dan seluruh indikator telemetri bergerak dinamis mensimulasikan penerbangan nyata."* | *Aesthetic and Minimalist Design*: Animasi radar, scanline, dan pergerakan ikon memberikan estetika modern yang premium. |
| **10** | Tunjukkan navigasi diagnostik bilah samping (klik **FPV Camera** dan **Telemetri**). | *"Sebagai kesimpulan, AeroDashboard GCS menunjukkan bagaimana kecerdasan buatan dan interaksi bahasa alami dapat dipadukan dengan desain visual modern untuk menciptakan antarmuka pengoperasian drone yang lebih aman, lebih cepat, dan jauh lebih manusiawi. Terima kasih."* | *Consistency and Standards*: Tata letak navigasi standar GCS namun dengan visualisasi yang futuristik. |
