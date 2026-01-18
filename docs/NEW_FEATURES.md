# Fitur Baru SawitDB v3.0

## 1. AKAD (Transactions) - ACID Support

### Deskripsi
Fitur transaksi memungkinkan pengelompokan beberapa operasi menjadi satu kesatuan atomik. Semua operasi berhasil atau semua dibatalkan.

### Syntax

```sql
-- Memulai transaksi
MULAI AKAD
-- atau
BEGIN TRANSACTION

-- Melakukan operasi (akan di-buffer)
TANAM KE Petani (nama, umur) BIBIT ('Budi', 30)
PUPUK Petani DENGAN gaji = 5000000 DIMANA nama = 'Budi'

-- Menyimpan perubahan
SAHKAN
-- atau
COMMIT

-- Membatalkan perubahan
BATALKAN
-- atau
ROLLBACK
```

### Contoh Penggunaan

```javascript
const SawitDB = require('@wowoengine/sawitdb');
const db = new SawitDB('mydb.sawit', { wal: { enabled: true } });

// Transaksi sukses
db.query('MULAI AKAD');
db.query("TANAM KE Karyawan (nama, gaji) BIBIT ('Andi', 5000000)");
db.query("TANAM KE Karyawan (nama, gaji) BIBIT ('Budi', 6000000)");
db.query('SAHKAN'); // Kedua data tersimpan

// Transaksi dibatalkan
db.query('MULAI AKAD');
db.query("GUSUR DARI Karyawan DIMANA gaji < 5500000");
db.query('BATALKAN'); // Penghapusan dibatalkan
```

### Implementasi
- **In-Memory Buffering**: Operasi disimpan di memori selama transaksi aktif
- **Atomicity**: Semua operasi dieksekusi saat SAHKAN, atau semua diabaikan saat BATALKAN
- **Isolation**: Data yang belum di-commit tidak terlihat oleh query SELECT

---

## 2. TEROPONG (Views) - Virtual Tables

### Deskripsi
View adalah tabel virtual yang merupakan hasil dari query SELECT yang tersimpan. Data tidak diduplikasi, hanya definisi query yang disimpan.

### Syntax

```sql
-- Membuat view
PASANG TEROPONG [nama_view] SEBAGAI [SELECT query]

-- Menghapus view
BUANG TEROPONG [nama_view]

-- Query view (seperti tabel biasa)
PANEN * DARI [nama_view]
```

### Contoh Penggunaan

```javascript
// Membuat view untuk karyawan senior
db.query(`
    PASANG TEROPONG KaryawanSenior SEBAGAI
    PANEN * DARI Karyawan DIMANA pengalaman > 5
`);

// Query view
const seniors = db.query('PANEN * DARI KaryawanSenior');
console.log(seniors);

// View dengan JOIN
db.query(`
    PASANG TEROPONG LaporanGaji SEBAGAI
    PANEN k.nama, k.gaji, d.nama_departemen
    DARI Karyawan k
    GABUNG KIRI Departemen d PADA k.dept_id = d.id
`);

// Hapus view
db.query('BUANG TEROPONG KaryawanSenior');
```

### Keuntungan
- **Abstraksi**: Menyembunyikan kompleksitas query
- **Keamanan**: Membatasi akses ke kolom tertentu
- **Reusability**: Query yang sering digunakan cukup didefinisikan sekali
- **No Duplication**: Tidak ada duplikasi data

---

## Perbandingan Syntax: AQL vs SQL

| Fitur | AQL (Agricultural Query Language) | SQL Standard |
|-------|-----------------------------------|--------------|
| Begin Transaction | `MULAI AKAD` | `BEGIN TRANSACTION` |
| Commit | `SAHKAN` | `COMMIT` |
| Rollback | `BATALKAN` | `ROLLBACK` |
| Create View | `PASANG TEROPONG [nama] SEBAGAI [query]` | `CREATE VIEW [nama] AS [query]` |
| Drop View | `BUANG TEROPONG [nama]` | `DROP VIEW [nama]` |

---

## Testing

Jalankan test suite untuk memverifikasi fitur:

```bash
node tests/test_new_features.js
```

Test mencakup:
- ✓ Transaksi commit
- ✓ Transaksi rollback
- ✓ Isolasi data selama transaksi
- ✓ Pembuatan view
- ✓ Query view
- ✓ Penghapusan view

---

## Roadmap Fitur Selanjutnya

1. **KENTONGAN (Triggers)** - Event hooks otomatis
2. **SOP (Stored Procedures)** - Fungsi tersimpan
3. **BLUSUKAN (Full-Text Search)** - Pencarian teks canggih
4. **CABANG (Replication)** - High availability
5. **POS RONDA (Security)** - User & permission system

---

## Kontribusi

Fitur ini dikembangkan mengikuti prinsip:
- **Keep it Simple**: Kode mudah dibaca dan dipahami
- **No Pasal Karet**: Tidak ada ambiguitas
- **Tested**: Setiap fitur memiliki test case
- **Documented**: Dokumentasi lengkap dan jelas

Untuk berkontribusi, silakan ikuti panduan di `CONTRIBUTING.md`.
