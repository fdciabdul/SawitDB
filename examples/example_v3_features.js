/**
 * Example: Using AKAD (Transactions) and TEROPONG (Views)
 * Demonstrates the new v3.0 features
 */

const SawitDB = require('../src/WowoEngine');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'example_v3.sawit');
const db = new SawitDB(dbPath, { wal: { enabled: true } });

console.log('=== SawitDB v3.0 Feature Demo ===\n');

// 1. Create table
console.log('1. Creating table "Karyawan"...');
db.query('LAHAN Karyawan');

// 2. AKAD - Transaction Example
console.log('\n2. AKAD (Transaction) Demo:');
console.log('   Starting transaction...');
db.query('MULAI AKAD');

console.log('   Inserting data (buffered)...');
db.query("TANAM KE Karyawan (nama, jabatan, gaji) BIBIT ('Budi', 'Manager', 8000000)");
db.query("TANAM KE Karyawan (nama, jabatan, gaji) BIBIT ('Siti', 'Staff', 5000000)");
db.query("TANAM KE Karyawan (nama, jabatan, gaji) BIBIT ('Andi', 'Supervisor', 6500000)");

console.log('   Checking data before commit...');
let result = db.query('PANEN * DARI Karyawan');
console.log('   Rows visible:', result.length, '(should be 0 - not committed yet)');

console.log('   Committing transaction...');
db.query('SAHKAN');

console.log('   Checking data after commit...');
result = db.query('PANEN * DARI Karyawan');
console.log('   Rows visible:', result.length, '(should be 3)');
console.log('   Data:', result);

// 3. TEROPONG - View Example
console.log('\n3. TEROPONG (View) Demo:');
console.log('   Creating view "KaryawanSenior" (gaji >= 6000000)...');
db.query("PASANG TEROPONG KaryawanSenior SEBAGAI PANEN * DARI Karyawan DIMANA gaji >= 6000000");

console.log('   Querying view...');
result = db.query('PANEN * DARI KaryawanSenior');
console.log('   Senior employees:', result);

console.log('\n   Creating view "KaryawanJunior" (gaji < 6000000)...');
db.query("PASANG TEROPONG KaryawanJunior SEBAGAI PANEN nama, jabatan DARI Karyawan DIMANA gaji < 6000000");

result = db.query('PANEN * DARI KaryawanJunior');
console.log('   Junior employees:', result);

// 4. Combined: Transaction with View
console.log('\n4. Combined Demo - Transaction + View:');
console.log('   Starting transaction...');
db.query('MULAI AKAD');
db.query("TANAM KE Karyawan (nama, jabatan, gaji) BIBIT ('Rudi', 'Director', 12000000)");
db.query('SAHKAN');

console.log('   Querying view after new insert...');
result = db.query('PANEN * DARI KaryawanSenior');
console.log('   Senior employees now:', result.length, 'people');

// 5. Rollback Example
console.log('\n5. Rollback Demo:');
console.log('   Starting transaction...');
db.query('MULAI AKAD');
db.query("GUSUR DARI Karyawan DIMANA nama = 'Budi'");
console.log('   Rolling back...');
db.query('BATALKAN');

result = db.query('PANEN * DARI Karyawan DIMANA nama = "Budi"');
console.log('   Budi still exists:', result.length > 0 ? 'YES ✓' : 'NO ✗');

// Cleanup
console.log('\n6. Cleanup:');
console.log('   Dropping views...');
db.query('BUANG TEROPONG KaryawanSenior');
db.query('BUANG TEROPONG KaryawanJunior');

db.close();
console.log('\n=== Demo Complete! ===');
console.log('Database saved to:', dbPath);
